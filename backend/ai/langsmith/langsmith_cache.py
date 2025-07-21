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


def fill_missing_windows(data_list, now, metric_type="count"):
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
                filled_data.append({"date": ts})
    return filled_data


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


def _calculate_cost_and_token_metrics(llm_runs, now):
    cost_by_window = defaultdict(list)
    output_tokens_by_window = defaultdict(list)
    input_tokens_by_window = defaultdict(list)

    for run in llm_runs:
        usage = None
        if run.extra:
            usage = run.extra.get("usage_metadata")
            if not usage and "response_metadata" in run.extra:
                usage = run.extra["response_metadata"].get("token_usage")
        if usage:
            ts = _get_window_start_for_timestamp(run.start_time, now).isoformat()
            cost_by_window[ts].append(
                usage.get("total_cost") or usage.get("cost") or 0.0
            )
            output_tokens_by_window[ts].append(
                usage.get("output_tokens") or usage.get("completion_tokens") or 0
            )
            input_tokens_by_window[ts].append(
                usage.get("input_tokens") or usage.get("prompt_tokens") or 0
            )

    total_cost_list = [
        {"date": ts, "cost": float(np.sum(costs))}
        for ts, costs in sorted(cost_by_window.items())
    ]
    filled_total_cost_list = fill_missing_windows(total_cost_list, now, "cost")

    cost_per_trace_list = []
    for ts, costs in sorted(cost_by_window.items()):
        p50 = float(np.percentile(costs, 50)) if costs else 0.0
        p99 = float(np.percentile(costs, 99)) if costs else 0.0
        cost_per_trace_list.append({"date": ts, "p50": p50, "p99": p99})
    filled_cost_per_trace_list = fill_missing_windows(
        cost_per_trace_list, now, "tokens_per_trace"
    )

    output_tokens_list = [
        {"date": ts, "count": int(np.sum(tokens))}
        for ts, tokens in sorted(output_tokens_by_window.items())
    ]
    filled_output_tokens_list = fill_missing_windows(output_tokens_list, now, "tokens")

    output_tokens_per_trace_list = []
    for ts, tokens in sorted(output_tokens_by_window.items()):
        p50 = float(np.percentile(tokens, 50)) if tokens else 0.0
        p99 = float(np.percentile(tokens, 99)) if tokens else 0.0
        output_tokens_per_trace_list.append({"date": ts, "p50": p50, "p99": p99})
    filled_output_tokens_per_trace_list = fill_missing_windows(
        output_tokens_per_trace_list, now, "tokens_per_trace"
    )

    input_tokens_list = [
        {"date": ts, "count": int(np.sum(tokens))}
        for ts, tokens in sorted(input_tokens_by_window.items())
    ]
    filled_input_tokens_list = fill_missing_windows(input_tokens_list, now, "tokens")

    input_tokens_per_trace_list = []
    for ts, tokens in sorted(input_tokens_by_window.items()):
        p50 = float(np.percentile(tokens, 50)) if tokens else 0.0
        p99 = float(np.percentile(tokens, 99)) if tokens else 0.0
        input_tokens_per_trace_list.append({"date": ts, "p50": p50, "p99": p99})
    filled_input_tokens_per_trace_list = fill_missing_windows(
        input_tokens_per_trace_list, now, "tokens_per_trace"
    )

    return {
        "total_cost": filled_total_cost_list,
        "cost_per_trace": filled_cost_per_trace_list,
        "output_tokens": filled_output_tokens_list,
        "output_tokens_per_trace": filled_output_tokens_per_trace_list,
        "input_tokens": filled_input_tokens_list,
        "input_tokens_per_trace": filled_input_tokens_per_trace_list,
    }


def _calculate_tool_metrics(tool_runs, now):
    count_by_window_tool = defaultdict(lambda: defaultdict(int))
    latency_by_window_tool = defaultdict(lambda: defaultdict(list))
    error_by_window_tool = defaultdict(lambda: defaultdict(lambda: [0, 0]))

    for run in tool_runs:
        ts = _get_window_start_for_timestamp(run.start_time, now).isoformat()
        tool_name = run.name
        count_by_window_tool[ts][tool_name] += 1
        if run.end_time and run.start_time:
            latency = (run.end_time - run.start_time).total_seconds()
            latency_by_window_tool[ts][tool_name].append(latency)
        if run.error:
            error_by_window_tool[ts][tool_name][0] += 1
        error_by_window_tool[ts][tool_name][1] += 1

    tool_run_count_list = [
        {"date": ts, **counts} for ts, counts in sorted(count_by_window_tool.items())
    ]
    filled_tool_run_count_list = fill_missing_windows(
        tool_run_count_list, now, "tool_breakdown"
    )

    tool_median_latency_list = []
    for ts in sorted(latency_by_window_tool.keys()):
        entry = {"date": ts}
        for tool, latencies in latency_by_window_tool[ts].items():
            entry[tool] = float(np.median(latencies)) if latencies else 0.0
        tool_median_latency_list.append(entry)
    filled_tool_median_latency_list = fill_missing_windows(
        tool_median_latency_list, now, "tool_breakdown"
    )

    tool_error_rate_list = []
    for ts in sorted(error_by_window_tool.keys()):
        entry = {"date": ts}
        for tool, (err_count, total_count) in error_by_window_tool[ts].items():
            entry[tool] = (err_count / total_count) * 100 if total_count > 0 else 0.0
        tool_error_rate_list.append(entry)
    filled_tool_error_rate_list = fill_missing_windows(
        tool_error_rate_list, now, "tool_breakdown"
    )

    return {
        "tool_run_count": filled_tool_run_count_list,
        "tool_median_latency": filled_tool_median_latency_list,
        "tool_error_rate": filled_tool_error_rate_list,
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
