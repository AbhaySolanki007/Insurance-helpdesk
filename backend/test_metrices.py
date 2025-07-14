from ai.langsmith.langsmith_cache import fetch_and_cache_all_metrics, get_cached_metric

# Fetch and cache all metrics
fetch_and_cache_all_metrics()

# Print the cached metrics
print("Trace Count:", get_cached_metric("trace_count")[0])
print("Trace Latency:", get_cached_metric("trace_latency")[0])
print("Trace Error Rate:", get_cached_metric("trace_error_rate")[0])
