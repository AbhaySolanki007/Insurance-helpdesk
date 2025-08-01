import os
import sqlite3
import json
import time
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import pprint
import numpy as np

from langsmith.client import Client
import config

# --- DB and Caching Infrastructure ---

DB_PATH = os.path.join(os.path.dirname(__file__), "metrics_cache.sqlite")

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS metrics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL
);
"""


def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    return conn


def init_db():
    conn = get_db_connection()
    with conn:
        conn.execute(CREATE_TABLE_SQL)
    conn.close()


init_db()


def get_cached_metric(cache_key):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT data, created_at FROM metrics_cache WHERE cache_key = ?", (cache_key,)
    )
    row = cur.fetchone()
    conn.close()
    if row:
        data, created_at = row
        return json.loads(data), created_at
    return None, None


def set_cached_metric(cache_key, data):
    conn = get_db_connection()
    with conn:
        conn.execute(
            "INSERT OR REPLACE INTO metrics_cache (cache_key, data, created_at) VALUES (?, ?, ?)",
            (cache_key, json.dumps(data), datetime.now(timezone.utc).isoformat()),
        )
    conn.close()


# --- Time Window Logic ---


def get_last_7_days_dynamic_windows(now):
    windows = []
    latest_window_end = now
    for _ in range(21):
        window_start = latest_window_end - timedelta(hours=8)
        windows.append(window_start)
        latest_window_end = window_start
    return sorted(windows)


def _get_window_start_for_timestamp(ts, now):
    ts_aware = ts.replace(tzinfo=timezone.utc)
    delta = now - ts_aware
    intervals_ago = delta.total_seconds() // (8 * 3600)
    window_end = now - timedelta(hours=8 * intervals_ago)
    window_start = window_end - timedelta(hours=8)
    return window_start


def fill_missing_windows(
    data_list, now, metric_type="count", all_tool_names: set = None
):
    expected_windows = [w.isoformat() for w in get_last_7_days_dynamic_windows(now)]
    window_map = {item["date"]: item for item in data_list}
    filled_data = []
    for ts in expected_windows:
        if ts in window_map:
            filled_data.append(window_map[ts])
        else:
            # Create default entry based on metric type
            if metric_type == "count":
                filled_data.append({"date": ts, "success": 0, "error": 0})
            elif metric_type == "latency" or metric_type == "tokens_per_trace":
                filled_data.append({"date": ts, "p50": 0.0, "p99": 0.0})
            elif metric_type == "rate":
                filled_data.append({"date": ts, "rate": 0.0})
            elif metric_type == "cost":
                filled_data.append({"date": ts, "cost": 0.0})
            elif metric_type == "tokens":
                filled_data.append({"date": ts, "count": 0})
            elif metric_type == "tool_breakdown":
                default_entry = {"date": ts}
                if all_tool_names:
                    for tool_name in all_tool_names:
                        default_entry[tool_name] = 0.0
                filled_data.append(default_entry)
    return filled_data


def _median(data):
    """Calculates the median of a list, returns 0 if empty."""
    if not data:
        return 0
    return float(np.median(data))


def _aggregate_by_hour(data_points: list, now: datetime, agg_func, metric_type: str):
    """
    Aggregates data points into 8-hour windows and fills missing windows.
    """
    if not data_points:
        return []

    # Group data by time window
    by_window = defaultdict(list)
    for point in data_points:
        window_start = _get_window_start_for_timestamp(
            datetime.fromisoformat(point["time"]), now
        ).isoformat()
        by_window[window_start].append(point["value"])

    # Apply the aggregation function to each window
    aggregated = {ts: agg_func(values) for ts, values in by_window.items()}

    # Format for the frontend
    if metric_type == "latency":
        result_list = [
            {
                "date": ts,
                "p50": val,
                "p99": float(np.percentile(by_window[ts], 99) if by_window[ts] else 0),
            }
            for ts, val in sorted(aggregated.items())
        ]
    else:  # Handles cost and tokens
        result_list = [
            {"date": ts, metric_type: val} for ts, val in sorted(aggregated.items())
        ]

    return fill_missing_windows(result_list, now, metric_type)


# --- Data Fetching Logic ---


def _fetch_paginated_runs(client, project_name, run_type):
    all_runs_for_type = []
    start_time_boundary = datetime.now(timezone.utc) - timedelta(days=8)
    end_time_cursor = None
    page_count = 0

    print(f"Fetching '{run_type}' runs with exclusive cursor pagination...")
    while True:
        try:
            runs_page = list(
                client.list_runs(
                    project_name=project_name,
                    run_type=run_type,
                    start_time=start_time_boundary,
                    end_time=end_time_cursor,
                    limit=100,
                )
            )
            if not runs_page:
                break
            all_runs_for_type.extend(runs_page)
            end_time_cursor = runs_page[-1].start_time - timedelta(microseconds=1)
            page_count += 1
            time.sleep(0.2)
        except Exception as e:
            print(f"Error during pagination for '{run_type}': {e}")
            break

    print(f"--> Fetched {len(all_runs_for_type)} total '{run_type}' runs.")
    return all_runs_for_type


# --- Metric Calculation Functions (Restored) ---


def _calculate_trace_metrics(runs, now):
    top_level_traces = [run for run in runs if run.parent_run_id is None]

    trace_counts = {}
    latency_by_window = defaultdict(list)
    for run in top_level_traces:
        window_start_ts = _get_window_start_for_timestamp(
            run.start_time, now
        ).isoformat()
        status = "error" if run.error else "success"
        if window_start_ts not in trace_counts:
            trace_counts[window_start_ts] = {"success": 0, "error": 0}
        trace_counts[window_start_ts][status] += 1
        if run.end_time and run.start_time:
            latency = (run.end_time - run.start_time).total_seconds()
            latency_by_window[window_start_ts].append(latency)

    trace_count_list = [
        {"date": d, "success": v["success"], "error": v["error"]}
        for d, v in sorted(trace_counts.items())
    ]
    filled_trace_count_list = fill_missing_windows(trace_count_list, now, "count")

    trace_latency_list = []
    for ts, latencies in sorted(latency_by_window.items()):
        p50 = float(np.percentile(latencies, 50)) if latencies else 0.0
        p99 = float(np.percentile(latencies, 99)) if latencies else 0.0
        trace_latency_list.append({"date": ts, "p50": p50, "p99": p99})
    filled_latency_list = fill_missing_windows(trace_latency_list, now, "latency")

    error_rate_list = []
    for item in filled_trace_count_list:
        total = item["success"] + item["error"]
        rate = (item["error"] / total) * 100 if total > 0 else 0.0
        error_rate_list.append({"date": item["date"], "rate": rate})

    return {
        "trace_count": filled_trace_count_list,
        "trace_latency": filled_latency_list,
        "trace_error_rate": error_rate_list,
    }


def _calculate_llm_metrics(llm_runs, now):
    llm_counts = {}
    llm_latency_by_window = defaultdict(list)
    for run in llm_runs:
        window_start_ts = _get_window_start_for_timestamp(
            run.start_time, now
        ).isoformat()
        status = "error" if run.error else "success"
        if window_start_ts not in llm_counts:
            llm_counts[window_start_ts] = {"success": 0, "error": 0}
        llm_counts[window_start_ts][status] += 1
        if run.end_time and run.start_time:
            latency = (run.end_time - run.start_time).total_seconds()
            llm_latency_by_window[window_start_ts].append(latency)

    llm_count_list = [
        {"date": d, "success": v["success"], "error": v["error"]}
        for d, v in sorted(llm_counts.items())
    ]
    filled_llm_count_list = fill_missing_windows(llm_count_list, now, "count")

    llm_latency_list = []
    for ts, latencies in sorted(llm_latency_by_window.items()):
        p50 = float(np.percentile(latencies, 50)) if latencies else 0.0
        p99 = float(np.percentile(latencies, 99)) if latencies else 0.0
        llm_latency_list.append({"date": ts, "p50": p50, "p99": p99})
    filled_latency_list = fill_missing_windows(llm_latency_list, now, "latency")

    llm_error_rate_list = []
    for item in filled_llm_count_list:
        total = item["success"] + item["error"]
        rate = (item["error"] / total) * 100 if total > 0 else 0.0
        llm_error_rate_list.append({"date": item["date"], "rate": rate})

    return {
        "llm_count": filled_llm_count_list,
        "llm_latency": filled_latency_list,
        "llm_error_rate": llm_error_rate_list,
    }


def _calculate_cost_and_token_metrics(llm_runs: list, now: datetime):
    """
    Calculates cost and token metrics from a list of LLM runs.
    This version uses direct attributes from the run object for simplicity and robustness.
    """
    total_cost_data = []
    cost_per_trace_data = []
    output_tokens_data = []
    output_tokens_per_trace_data = []
    input_tokens_data = []
    input_tokens_per_trace_data = []

    for run in llm_runs:
        # Use direct attributes, ensuring cost is converted to a float for numpy compatibility.
        cost = float(getattr(run, "total_cost", 0.0) or 0.0)
        input_tokens = int(getattr(run, "input_tokens", 0) or 0)
        output_tokens = int(getattr(run, "output_tokens", 0) or 0)

        # Append data points with timestamps
        timestamp = run.start_time.isoformat()
        total_cost_data.append({"time": timestamp, "value": cost})
        cost_per_trace_data.append(
            {"time": timestamp, "value": cost}
        )  # Cost is per-run (trace)
        output_tokens_data.append({"time": timestamp, "value": output_tokens})
        output_tokens_per_trace_data.append({"time": timestamp, "value": output_tokens})
        input_tokens_data.append({"time": timestamp, "value": input_tokens})
        input_tokens_per_trace_data.append({"time": timestamp, "value": input_tokens})

    return {
        "total_cost": _aggregate_by_hour(total_cost_data, now, sum, "cost"),
        "cost_per_trace": _aggregate_by_hour(
            cost_per_trace_data, now, _median, "latency"
        ),
        "output_tokens": _aggregate_by_hour(output_tokens_data, now, sum, "count"),
        "output_tokens_per_trace": _aggregate_by_hour(
            output_tokens_per_trace_data, now, _median, "latency"
        ),
        "input_tokens": _aggregate_by_hour(input_tokens_data, now, sum, "count"),
        "input_tokens_per_trace": _aggregate_by_hour(
            input_tokens_per_trace_data, now, _median, "latency"
        ),
    }


def _aggregate_tool_data(tool_data_points: list, now: datetime, all_tool_names: set):
    """
    Aggregates a list of tool run data points into final metrics structures
    for run counts, median latencies, and error rates.
    """
    # 1. Group raw data points by time window and then by tool name.
    by_window_tool = defaultdict(
        lambda: defaultdict(lambda: {"latencies": [], "errors": 0, "runs": 0})
    )

    for point in tool_data_points:
        window_start = _get_window_start_for_timestamp(
            datetime.fromisoformat(point["timestamp"]), now
        ).isoformat()
        tool_name = point["name"]

        by_window_tool[window_start][tool_name]["latencies"].append(point["latency"])
        by_window_tool[window_start][tool_name]["runs"] += 1
        if point["error"]:
            by_window_tool[window_start][tool_name]["errors"] += 1

    # 2. Process the aggregated data into final list format for each metric.
    run_counts, median_latencies, error_rates = [], [], []
    sorted_windows = sorted(by_window_tool.keys())

    for ts in sorted_windows:
        # Initialize entries with all known tool names set to 0.
        counts_entry = {tool: 0 for tool in all_tool_names}
        latencies_entry = {tool: 0.0 for tool in all_tool_names}
        errors_entry = {tool: 0.0 for tool in all_tool_names}

        counts_entry["date"] = ts
        latencies_entry["date"] = ts
        errors_entry["date"] = ts

        sorted_tools = sorted(by_window_tool[ts].keys())

        for tool_name in sorted_tools:
            data = by_window_tool[ts][tool_name]
            counts_entry[tool_name] = data["runs"]
            latencies_entry[tool_name] = _median(data["latencies"])
            errors_entry[tool_name] = (
                (data["errors"] / data["runs"]) * 100 if data["runs"] > 0 else 0.0
            )

        run_counts.append(counts_entry)
        median_latencies.append(latencies_entry)
        error_rates.append(errors_entry)

    # 3. Fill in any missing time windows with default empty values.
    return (
        fill_missing_windows(run_counts, now, "tool_breakdown", all_tool_names),
        fill_missing_windows(median_latencies, now, "tool_breakdown", all_tool_names),
        fill_missing_windows(error_rates, now, "tool_breakdown", all_tool_names),
    )


def _calculate_tool_metrics(tool_runs: list, now: datetime):
    """
    Calculates all tool-related metrics by first extracting a simple list of
    data points, then passing them to a dedicated aggregation function.
    """
    # 1. Create a simple, flat list of data points and gather all unique tool names.
    tool_data_points = []
    all_tool_names = set()
    for run in tool_runs:
        latency = (
            (run.end_time - run.start_time).total_seconds()
            if run.end_time and run.start_time
            else 0.0
        )
        all_tool_names.add(run.name)
        tool_data_points.append(
            {
                "name": run.name,
                "timestamp": run.start_time.isoformat(),
                "latency": latency,
                "error": bool(run.error),
            }
        )

    # 2. Pass the unified data list and all tool names to the aggregator.
    run_counts, median_latencies, error_rates = _aggregate_tool_data(
        tool_data_points, now, all_tool_names
    )

    return {
        "tool_run_count": run_counts,
        "tool_median_latency": median_latencies,
        "tool_error_rate": error_rates,
    }


# --- Main Orchestrator (Restored to Full Functionality) ---


def fetch_and_cache_all_metrics():
    """
    Orchestrator that fetches and processes data for each metric group separately
    to optimize performance.
    """
    print("\n--- Starting Full Metrics Fetch ---")
    now = datetime.now(timezone.utc)
    client = Client(
        api_key=os.getenv(
            "LANGSMITH_API_KEY", getattr(config, "LANGSMITH_API_KEY", None)
        )
    )
    project_name = os.getenv("LANGSMITH_PROJECT", "insurance-helpdesk")

    all_metrics = {}

    try:
        chain_runs = _fetch_paginated_runs(client, project_name, "chain")
        if chain_runs:
            trace_metrics = _calculate_trace_metrics(chain_runs, now)
            all_metrics.update(trace_metrics)
            for key, data in trace_metrics.items():
                set_cached_metric(key, data)
    except Exception as e:
        print(f"Error processing trace metrics: {e}")

    time.sleep(1)  # Add a delay to avoid rate limiting

    try:
        llm_runs = _fetch_paginated_runs(client, project_name, "llm")
        if llm_runs:
            llm_metrics = _calculate_llm_metrics(llm_runs, now)
            all_metrics.update(llm_metrics)
            for key, data in llm_metrics.items():
                set_cached_metric(key, data)

            cost_metrics = _calculate_cost_and_token_metrics(llm_runs, now)
            all_metrics.update(cost_metrics)
            for key, data in cost_metrics.items():
                set_cached_metric(key, data)
    except Exception as e:
        print(f"Error processing LLM/cost metrics: {e}")

    time.sleep(1)  # Add another delay

    try:
        tool_runs = _fetch_paginated_runs(client, project_name, "tool")
        if tool_runs:
            tool_metrics = _calculate_tool_metrics(tool_runs, now)

            all_metrics.update(tool_metrics)
            for key, data in tool_metrics.items():
                set_cached_metric(key, data)
    except Exception as e:
        print(f"Error processing tool metrics: {e}")

    print("\n--- [INFO] All metrics processed and cached successfully ---")
