import { useMemo } from "react";

export const useChartDataProcessor = (metricsData) => {
  // Helper function to format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  // Helper function to get latest data point
  const getLatestData = (dataArray) => {
    return dataArray[dataArray.length - 1] || {};
  };

  const processedData = useMemo(() => {
    if (!metricsData) return null;

    // Get latest data points
    const latestTraceData = getLatestData(metricsData.trace_count || []);
    const latestLLMData = getLatestData(metricsData.llm_count || []);
    const latestCostData = getLatestData(metricsData.total_cost || []);
    const latestInputTokensData = getLatestData(metricsData.input_tokens || []);
    const latestOutputTokensData = getLatestData(metricsData.output_tokens || []);

    // Calculate totals from available data
    const totalTraces = (metricsData.trace_count || []).reduce((sum, item) => 
      sum + (item.success || 0) + (item.error || 0), 0
    );
    const totalLLMCalls = (metricsData.llm_count || []).reduce((sum, item) => 
      sum + (item.success || 0) + (item.error || 0), 0
    );
    const totalErrors = (metricsData.trace_count || []).reduce((sum, item) => 
      sum + (item.error || 0), 0
    );
    const totalLLMErrors = (metricsData.llm_count || []).reduce((sum, item) => 
      sum + (item.error || 0), 0
    );
    const totalCost = (metricsData.total_cost || []).reduce((sum, item) => 
      sum + (item.cost || 0), 0
    );
    const totalInputTokens = (metricsData.input_tokens || []).reduce((sum, item) => 
      sum + (item.count || 0), 0
    );
    const totalOutputTokens = (metricsData.output_tokens || []).reduce((sum, item) => 
      sum + (item.count || 0), 0
    );

    // Prepare chart data with formatted dates
    const traceChartData = (metricsData.trace_count || []).map(item => ({
      date: formatDate(item.date),
      success: item.success || 0,
      error: item.error || 0,
      total: (item.success || 0) + (item.error || 0),
    }));

    const llmChartData = (metricsData.llm_count || []).map(item => ({
      date: formatDate(item.date),
      success: item.success || 0,
      error: item.error || 0,
      total: (item.success || 0) + (item.error || 0),
    }));

    const latencyChartData = (metricsData.trace_latency || []).map(item => ({
      date: formatDate(item.date),
      p50: item.p50 || 0,
      p99: item.p99 || 0,
    }));

    const llmLatencyChartData = (metricsData.llm_latency || []).map(item => ({
      date: formatDate(item.date),
      p50: item.p50 || 0,
      p99: item.p99 || 0,
    }));

    const errorRateChartData = (metricsData.trace_error_rate || []).map(item => ({
      date: formatDate(item.date),
      rate: item.rate || 0,
    }));

    const llmErrorRateChartData = (metricsData.llm_error_rate || []).map(item => ({
      date: formatDate(item.date),
      rate: item.rate || 0,
    }));

    const costChartData = (metricsData.total_cost || []).map(item => ({
      date: formatDate(item.date),
      cost: item.cost || 0,
    }));

    const inputTokensChartData = (metricsData.input_tokens || []).map(item => ({
      date: formatDate(item.date),
      count: item.count || 0,
    }));

    const outputTokensChartData = (metricsData.output_tokens || []).map(item => ({
      date: formatDate(item.date),
      count: item.count || 0,
    }));

    const costPerTraceChartData = (metricsData.cost_per_trace || []).map(item => ({
      date: formatDate(item.date),
      p50: item.p50 || 0,
      p99: item.p99 || 0,
    }));

    const inputTokensPerTraceChartData = (metricsData.input_tokens_per_trace || []).map(item => ({
      date: formatDate(item.date),
      p50: item.p50 || 0,
      p99: item.p99 || 0,
    }));

    const outputTokensPerTraceChartData = (metricsData.output_tokens_per_trace || []).map(item => ({
      date: formatDate(item.date),
      p50: item.p50 || 0,
      p99: item.p99 || 0,
    }));

    // Tool performance data
    const toolRunCountData = (metricsData.tool_run_count || []).map(item => {
      const toolData = { date: formatDate(item.date) };
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          toolData[key] = item[key] || 0;
        }
      });
      return toolData;
    });

    // Tool latency data
    const toolLatencyData = (metricsData.tool_median_latency || []).map(item => {
      const toolData = { date: formatDate(item.date) };
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          toolData[key] = item[key] || 0;
        }
      });
      return toolData;
    });

    // Tool error rate data
    const toolErrorRateData = (metricsData.tool_error_rate || []).map(item => {
      const toolData = { date: formatDate(item.date) };
      Object.keys(item).forEach(key => {
        if (key !== 'date') {
          toolData[key] = item[key] || 0;
        }
      });
      return toolData;
    });

    // Get latest tool data for summary - improved to handle empty data better
    const latestToolData = getLatestData(metricsData.tool_run_count || []);
    const toolPerformanceData = Object.keys(latestToolData)
      .filter(key => key !== 'date' && latestToolData[key] > 0)
      .map(toolName => ({
        name: toolName,
        runs: latestToolData[toolName] || 0,
      }))
      .sort((a, b) => b.runs - a.runs);

    // Calculate total tool runs across all time periods
    const totalToolRuns = (metricsData.tool_run_count || []).reduce((total, item) => {
      return total + Object.keys(item).reduce((itemTotal, key) => {
        return key !== 'date' ? itemTotal + (item[key] || 0) : itemTotal;
      }, 0);
    }, 0);

    // Calculate peak performance day
    const peakDay = traceChartData.reduce((max, item) => 
      item.total > max.total ? item : max, { total: 0, date: 'N/A' }
    );

    return {
      // Summary data
      totalTraces,
      totalLLMCalls,
      totalErrors,
      totalLLMErrors,
      totalCost,
      totalInputTokens,
      totalOutputTokens,
      totalToolRuns,
      latestTraceData,
      latestLLMData,
      latestCostData,
      latestInputTokensData,
      latestOutputTokensData,
      
      // Chart data
      traceChartData,
      llmChartData,
      latencyChartData,
      llmLatencyChartData,
      errorRateChartData,
      llmErrorRateChartData,
      costChartData,
      inputTokensChartData,
      outputTokensChartData,
      costPerTraceChartData,
      inputTokensPerTraceChartData,
      outputTokensPerTraceChartData,
      toolRunCountData,
      toolLatencyData,
      toolErrorRateData,
      toolPerformanceData,
      peakDay,
    };
  }, [metricsData]);

  return processedData;
}; 