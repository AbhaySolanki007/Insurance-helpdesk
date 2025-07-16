import os
import sqlite3
import json
from datetime import datetime, timedelta
from langsmith.client import Client  # Corrected import for LangSmith SDK
import config

# Path to the cache DB (placed in the same directory as this file)
DB_PATH = os.path.join(os.path.dirname(__file__), "metrics_cache.sqlite")

# Table schema
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


# Call this on import to ensure table exists
init_db()


# --- Cache Access Functions ---
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
            (cache_key, json.dumps(data), datetime.utcnow().isoformat()),
        )
    conn.close()


def get_last_7_days():
    """Get the last 7 days as a list of date strings"""
    today = datetime.now().date()
    dates = []
    for i in range(6, -1, -1):  # 6 to 0, so we get last 7 days including today
        date = today - timedelta(days=i)
        dates.append(date.isoformat())
    return dates


def fill_missing_dates(data_list, metric_type="count"):
    """Fill in missing dates with zero/default values"""
    expected_dates = get_last_7_days()
    date_map = {item["date"]: item for item in data_list}

    filled_data = []
    for date in expected_dates:
        if date in date_map:
            filled_data.append(date_map[date])
        else:
            # Create default entry based on metric type
            if metric_type == "count":
                filled_data.append({"date": date, "success": 0, "error": 0})
            elif metric_type == "latency":
                filled_data.append({"date": date, "p50": 0.0, "p99": 0.0})
            elif metric_type == "rate":
                filled_data.append({"date": date, "rate": 0.0})
            elif metric_type == "cost":
                filled_data.append({"date": date, "cost": 0.0})
            elif metric_type == "tokens":
                filled_data.append({"date": date, "count": 0})
            elif metric_type == "tokens_per_trace":
                filled_data.append({"date": date, "p50": 0.0, "p99": 0.0})
            elif metric_type == "tool_breakdown":
                filled_data.append({"date": date})

    return filled_data


# --- Metric Fetching Logic ---
def fetch_and_cache_all_metrics():
    """
    Fetch all required metrics from LangSmith and cache them.
    Only fetches data from the last 7 days for consistent frontend graphing.
    """
    # Calculate date range for last 7 days
    start_date = datetime.now() - timedelta(days=7)

    # Initialize LangSmith client
    client = Client(
        api_key=os.getenv(
            "LANGSMITH_API_KEY", getattr(config, "LANGSMITH_API_KEY", None)
        )
    )

    # --- TRACE COUNT ---
    try:
        runs = list(
            client.list_runs(
                run_type="chain",
                project_name=os.getenv("LANGSMITH_PROJECT", "insurance-helpdesk"),
                start_time=start_date,
                limit=1000,
            )
        )
        trace_counts = {}
        for run in runs:
            print(type(runs[0]))
            print(runs[0])
            date = run.start_time.date().isoformat()
            status = "error" if run.error else "success"
            if date not in trace_counts:
                trace_counts[date] = {"success": 0, "error": 0}
            trace_counts[date][status] += 1
        trace_count_list = [
            {"date": d, "success": v["success"], "error": v["error"]}
            for d, v in sorted(trace_counts.items())
        ]
        # Fill missing dates
        trace_count_list = fill_missing_dates(trace_count_list, "count")
        set_cached_metric("trace_count", trace_count_list)
    except Exception as e:
        print(f"Error fetching trace_count: {e}")

    # --- TRACE LATENCY (P50, P99) ---
    try:
        from collections import defaultdict
        import numpy as np

        latency_by_date = defaultdict(list)
        for run in runs:
            if run.end_time and run.start_time:
                latency = (run.end_time - run.start_time).total_seconds()
                date = run.start_time.date().isoformat()
                latency_by_date[date].append(latency)
        trace_latency_list = []
        for date, latencies in sorted(latency_by_date.items()):
            if latencies:
                p50 = float(np.percentile(latencies, 50))
                p99 = float(np.percentile(latencies, 99))
            else:
                p50 = p99 = 0.0
            trace_latency_list.append({"date": date, "p50": p50, "p99": p99})
        # Fill missing dates
        trace_latency_list = fill_missing_dates(trace_latency_list, "latency")
        set_cached_metric("trace_latency", trace_latency_list)
    except Exception as e:
        print(f"Error fetching trace_latency: {e}")

    # --- TRACE ERROR RATE ---
    try:
        error_rate_list = []
        for item in trace_count_list:
            total = item["success"] + item["error"]
            rate = (item["error"] / total) * 100 if total > 0 else 0.0
            error_rate_list.append({"date": item["date"], "rate": rate})
        set_cached_metric("trace_error_rate", error_rate_list)
    except Exception as e:
        print(f"Error fetching trace_error_rate: {e}")

    # --- LLM COUNT ---
    try:
        llm_runs = list(
            client.list_runs(
                run_type="llm",
                project_name=os.getenv("LANGSMITH_PROJECT", "insurance-helpdesk"),
                start_time=start_date,
                limit=1000,
            )
        )
        llm_counts = {}
        for run in llm_runs:
            date = run.start_time.date().isoformat()
            status = "error" if run.error else "success"
            if date not in llm_counts:
                llm_counts[date] = {"success": 0, "error": 0}
            llm_counts[date][status] += 1
        llm_count_list = [
            {"date": d, "success": v["success"], "error": v["error"]}
            for d, v in sorted(llm_counts.items())
        ]
        # Fill missing dates
        llm_count_list = fill_missing_dates(llm_count_list, "count")
        set_cached_metric("llm_count", llm_count_list)
    except Exception as e:
        print(f"Error fetching llm_count: {e}")

    # --- LLM LATENCY (P50, P99) ---
    try:
        from collections import defaultdict
        import numpy as np

        llm_latency_by_date = defaultdict(list)
        for run in llm_runs:
            if run.end_time and run.start_time:
                latency = (run.end_time - run.start_time).total_seconds()
                date = run.start_time.date().isoformat()
                llm_latency_by_date[date].append(latency)
        llm_latency_list = []
        for date, latencies in sorted(llm_latency_by_date.items()):
            if latencies:
                p50 = float(np.percentile(latencies, 50))
                p99 = float(np.percentile(latencies, 99))
            else:
                p50 = p99 = 0.0
            llm_latency_list.append({"date": date, "p50": p50, "p99": p99})
        # Fill missing dates
        llm_latency_list = fill_missing_dates(llm_latency_list, "latency")
        set_cached_metric("llm_latency", llm_latency_list)
    except Exception as e:
        print(f"Error fetching llm_latency: {e}")

    # --- LLM ERROR RATE ---
    try:
        llm_error_rate_list = []
        for item in llm_count_list:
            total = item["success"] + item["error"]
            rate = (item["error"] / total) * 100 if total > 0 else 0.0
            llm_error_rate_list.append({"date": item["date"], "rate": rate})
        set_cached_metric("llm_error_rate", llm_error_rate_list)
    except Exception as e:
        print(f"Error fetching llm_error_rate: {e}")

    # --- COST & TOKENS METRICS ---
    try:
        from collections import defaultdict
        import numpy as np

        cost_by_date = defaultdict(list)
        output_tokens_by_date = defaultdict(list)
        input_tokens_by_date = defaultdict(list)
        for run in llm_runs:
            # Try to extract cost and token usage from extra['usage_metadata'] or response_metadata
            usage = None
            if run.extra:
                usage = run.extra.get("usage_metadata")
                if not usage and "response_metadata" in run.extra:
                    usage = run.extra["response_metadata"].get("token_usage")
            if usage:
                date = run.start_time.date().isoformat()
                # Cost
                cost = usage.get("total_cost") or usage.get("cost") or 0.0
                cost_by_date[date].append(cost)
                # Output tokens
                output_tokens = (
                    usage.get("output_tokens") or usage.get("completion_tokens") or 0
                )
                output_tokens_by_date[date].append(output_tokens)
                # Input tokens
                input_tokens = (
                    usage.get("input_tokens") or usage.get("prompt_tokens") or 0
                )
                input_tokens_by_date[date].append(input_tokens)
        # --- Total Cost ---
        total_cost_list = [
            {"date": date, "cost": float(np.sum(costs))}
            for date, costs in sorted(cost_by_date.items())
        ]
        total_cost_list = fill_missing_dates(total_cost_list, "cost")
        set_cached_metric("total_cost", total_cost_list)
        # --- Cost per Trace (P50, P99) ---
        cost_per_trace_list = []
        for date, costs in sorted(cost_by_date.items()):
            if costs:
                p50 = float(np.percentile(costs, 50))
                p99 = float(np.percentile(costs, 99))
            else:
                p50 = p99 = 0.0
            cost_per_trace_list.append({"date": date, "p50": p50, "p99": p99})
        cost_per_trace_list = fill_missing_dates(
            cost_per_trace_list, "tokens_per_trace"
        )
        set_cached_metric("cost_per_trace", cost_per_trace_list)
        # --- Output Tokens (total) ---
        output_tokens_list = [
            {"date": date, "count": int(np.sum(tokens))}
            for date, tokens in sorted(output_tokens_by_date.items())
        ]
        output_tokens_list = fill_missing_dates(output_tokens_list, "tokens")
        set_cached_metric("output_tokens", output_tokens_list)
        # --- Output Tokens per Trace (P50, P99) ---
        output_tokens_per_trace_list = []
        for date, tokens in sorted(output_tokens_by_date.items()):
            if tokens:
                p50 = float(np.percentile(tokens, 50))
                p99 = float(np.percentile(tokens, 99))
            else:
                p50 = p99 = 0.0
            output_tokens_per_trace_list.append({"date": date, "p50": p50, "p99": p99})
        output_tokens_per_trace_list = fill_missing_dates(
            output_tokens_per_trace_list, "tokens_per_trace"
        )
        set_cached_metric("output_tokens_per_trace", output_tokens_per_trace_list)
        # --- Input Tokens (total) ---
        input_tokens_list = [
            {"date": date, "count": int(np.sum(tokens))}
            for date, tokens in sorted(input_tokens_by_date.items())
        ]
        input_tokens_list = fill_missing_dates(input_tokens_list, "tokens")
        set_cached_metric("input_tokens", input_tokens_list)
        # --- Input Tokens per Trace (P50, P99) ---
        input_tokens_per_trace_list = []
        for date, tokens in sorted(input_tokens_by_date.items()):
            if tokens:
                p50 = float(np.percentile(tokens, 50))
                p99 = float(np.percentile(tokens, 99))
            else:
                p50 = p99 = 0.0
            input_tokens_per_trace_list.append({"date": date, "p50": p50, "p99": p99})
        input_tokens_per_trace_list = fill_missing_dates(
            input_tokens_per_trace_list, "tokens_per_trace"
        )
        set_cached_metric("input_tokens_per_trace", input_tokens_per_trace_list)
    except Exception as e:
        print(f"Error fetching cost/tokens metrics: {e}")

    # --- TOOL METRICS ---
    try:
        from collections import defaultdict
        import numpy as np

        tool_runs = list(
            client.list_runs(
                run_type="tool",
                project_name=os.getenv("LANGSMITH_PROJECT", "insurance-helpdesk"),
                start_time=start_date,
                limit=1000,
            )
        )
        # Prepare nested dicts: {date: {tool_name: [values...]}}
        count_by_date_tool = defaultdict(lambda: defaultdict(int))
        latency_by_date_tool = defaultdict(lambda: defaultdict(list))
        error_by_date_tool = defaultdict(
            lambda: defaultdict(lambda: [0, 0])
        )  # [error_count, total_count]
        for run in tool_runs:
            date = run.start_time.date().isoformat()
            tool_name = run.name
            # Count
            count_by_date_tool[date][tool_name] += 1
            # Latency
            if run.end_time and run.start_time:
                latency = (run.end_time - run.start_time).total_seconds()
                latency_by_date_tool[date][tool_name].append(latency)
            # Error rate
            if run.error:
                error_by_date_tool[date][tool_name][0] += 1  # error_count
            error_by_date_tool[date][tool_name][1] += 1  # total_count
        # --- Run Count by Tool ---
        tool_run_count_list = []
        for date in sorted(count_by_date_tool.keys()):
            entry = {"date": date}
            for tool, count in count_by_date_tool[date].items():
                entry[tool] = count
            tool_run_count_list.append(entry)
        # Fill missing dates with empty tool breakdowns
        tool_run_count_list = fill_missing_dates(tool_run_count_list, "tool_breakdown")
        set_cached_metric("tool_run_count", tool_run_count_list)
        # --- Median Latency by Tool ---
        tool_median_latency_list = []
        for date in sorted(latency_by_date_tool.keys()):
            entry = {"date": date}
            for tool, latencies in latency_by_date_tool[date].items():
                entry[tool] = float(np.median(latencies)) if latencies else 0.0
            tool_median_latency_list.append(entry)
        tool_median_latency_list = fill_missing_dates(
            tool_median_latency_list, "tool_breakdown"
        )
        set_cached_metric("tool_median_latency", tool_median_latency_list)
        # --- Error Rate by Tool ---
        tool_error_rate_list = []
        for date in sorted(error_by_date_tool.keys()):
            entry = {"date": date}
            for tool, (error_count, total_count) in error_by_date_tool[date].items():
                rate = (error_count / total_count) * 100 if total_count > 0 else 0.0
                entry[tool] = rate
            tool_error_rate_list.append(entry)
        tool_error_rate_list = fill_missing_dates(
            tool_error_rate_list, "tool_breakdown"
        )
        set_cached_metric("tool_error_rate", tool_error_rate_list)
    except Exception as e:
        print(f"Error fetching tool metrics: {e}")
