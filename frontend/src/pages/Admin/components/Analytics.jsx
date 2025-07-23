import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import axios from "axios";

// Reusable chart components
const TimeSeriesLineChart = ({ data, title, subtitle, dataKeys, colors, yAxisLabel = "" }) => (
  <div className="p-6">
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {subtitle}
    </p>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" />
        <YAxis label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Legend />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[index]}
            strokeWidth={2}
            name={key}
            dot={false}
            activeDot={{ r: 4, stroke: colors[index], strokeWidth: 2, fill: '#1F2937' }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const UsageTrendChart = ({ data, title, subtitle, successKey, errorKey, totalKey }) => (
  <div className="p-6">
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {subtitle}
    </p>
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey={successKey}
          stroke="#10B981"
          strokeWidth={2}
          name="Success"
          dot={false}
          activeDot={{ r: 4, stroke: '#10B981', strokeWidth: 2, fill: '#1F2937' }}
        />
        <Line
          type="monotone"
          dataKey={errorKey}
          stroke="#EF4444"
          strokeWidth={2}
          name="Error"
          dot={false}
          activeDot={{ r: 4, stroke: '#EF4444', strokeWidth: 2, fill: '#1F2937' }}
        />
        <Line
          type="monotone"
          dataKey={totalKey}
          stroke="#3B82F6"
          strokeWidth={2}
          name="Total"
          dot={false}
          activeDot={{ r: 4, stroke: '#3B82F6', strokeWidth: 2, fill: '#1F2937' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);

const ToolUsageChart = ({ data, title, subtitle }) => (
  <div className="p-6">
    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
      {title}
    </h3>
    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
      {subtitle}
    </p>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="name" stroke="#9CA3AF" />
        <YAxis stroke="#9CA3AF" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
        />
        <Bar dataKey="runs" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const ToolTimeSeriesChart = ({ data, title, subtitle }) => {
  const toolKeys = Object.keys(data[0] || {}).filter(key => key !== 'date');
  
  return (
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {subtitle}
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1F2937', 
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F9FAFB'
            }}
          />
          <Legend />
          {toolKeys.map((tool, index) => (
            <Line
              key={tool}
              type="monotone"
              dataKey={tool}
              stroke={`hsl(${index * 60}, 70%, 50%)`}
              strokeWidth={2}
              name={tool}
              dot={false}
              activeDot={{ r: 4, stroke: `hsl(${index * 60}, 70%, 50%)`, strokeWidth: 2, fill: '#1F2937' }}
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function Analytics() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    fetchMetricsData();
  }, []);

  const fetchMetricsData = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8001/api/metrics");
      setMetricsData(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching metrics:", err);
      setError("Failed to fetch metrics data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[650px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-800 dark:text-red-200">{error}</p>
        <button
          onClick={fetchMetricsData}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metricsData) {
    return <div>No data available</div>;
  }

  // Helper function to format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Helper function to get latest data point
  const getLatestData = (dataArray) => {
    return dataArray[dataArray.length - 1] || {};
  };

  // Helper function to get active days
  const getActiveDays = (dataArray) => {
    return dataArray.filter(item => {
      if (item.success && item.success > 0) return true;
      if (item.error && item.error > 0) return true;
      if (item.count && item.count > 0) return true;
      if (item.cost && item.cost > 0) return true;
      if (item.p50 && item.p50 > 0) return true;
      if (item.p99 && item.p99 > 0) return true;
      if (item.rate && item.rate > 0) return true;
      return false;
    });
  };

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

  // Get latest tool data for summary
  const latestToolData = getLatestData(metricsData.tool_run_count || {});
  const toolPerformanceData = Object.keys(latestToolData)
    .filter(key => key !== 'date')
    .map(toolName => ({
      name: toolName,
      runs: latestToolData[toolName] || 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  // Calculate peak performance day
  const peakDay = traceChartData.reduce((max, item) => 
    item.total > max.total ? item : max, { total: 0, date: 'N/A' }
  );

  const tabs = [
    { id: "all", label: "All" },
    { id: "traces", label: "Traces" },
    { id: "llm", label: "LLM Calls" },
    { id: "cost", label: "Cost & Tokens" },
    { id: "tools", label: "Tools" },
    { id: "runtypes", label: "Run Types" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "all":
        return (
          <div className="space-y-12">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              All Metrics
            </h2>
            
            {/* Traces Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Traces
              </h3>
              <div className="space-y-6">
                <UsageTrendChart
                  data={traceChartData}
                  title="Trace Count"
                  subtitle="Total number of traces over time."
                  successKey="success"
                  errorKey="error"
                  totalKey="total"
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimeSeriesLineChart
                    data={latencyChartData}
                    title="Trace Latency"
                    subtitle="Trace latency percentiles over time."
                    dataKeys={["p50", "p99"]}
                    colors={["#3B82F6", "#8B5CF6"]}
                    yAxisLabel="Seconds"
                  />
                  <TimeSeriesLineChart
                    data={errorRateChartData}
                    title="Trace Error Rate"
                    subtitle="Percent of traces that errored over time."
                    dataKeys={["rate"]}
                    colors={["#F59E0B"]}
                    yAxisLabel="Percentage"
                  />
                </div>
              </div>
            </div>

            {/* LLM Calls Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                LLM Calls
              </h3>
              <div className="space-y-6">
                <UsageTrendChart
                  data={llmChartData}
                  title="LLM Count"
                  subtitle="Number of LLM calls over time."
                  successKey="success"
                  errorKey="error"
                  totalKey="total"
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <TimeSeriesLineChart
                    data={llmLatencyChartData}
                    title="LLM Latency"
                    subtitle="LLM call latency percentiles over time."
                    dataKeys={["p50", "p99"]}
                    colors={["#3B82F6", "#8B5CF6"]}
                    yAxisLabel="Seconds"
                  />
                  <TimeSeriesLineChart
                    data={llmErrorRateChartData}
                    title="LLM Error Rate"
                    subtitle="Percent of LLM calls that errored over time."
                    dataKeys={["rate"]}
                    colors={["#F59E0B"]}
                    yAxisLabel="Percentage"
                  />
                </div>
              </div>
            </div>

            {/* Cost & Tokens Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Cost & Tokens
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesLineChart
                  data={costChartData}
                  title="Total Cost"
                  subtitle="Total cost over time."
                  dataKeys={["cost"]}
                  colors={["#10B981"]}
                  yAxisLabel="Cost ($)"
                />
                <TimeSeriesLineChart
                  data={costPerTraceChartData}
                  title="Cost per Trace"
                  subtitle="Median cost per trace."
                  dataKeys={["p50", "p99"]}
                  colors={["#3B82F6", "#8B5CF6"]}
                  yAxisLabel="Cost ($)"
                />
                <TimeSeriesLineChart
                  data={outputTokensChartData}
                  title="Output Tokens"
                  subtitle="Total output tokens over time."
                  dataKeys={["count"]}
                  colors={["#8B5CF6"]}
                  yAxisLabel="Token Count"
                />
                <TimeSeriesLineChart
                  data={outputTokensPerTraceChartData}
                  title="Output Tokens per Trace"
                  subtitle="Output tokens used per trace over time."
                  dataKeys={["p50", "p99"]}
                  colors={["#3B82F6", "#8B5CF6"]}
                  yAxisLabel="Token Count"
                />
                <TimeSeriesLineChart
                  data={inputTokensChartData}
                  title="Input Tokens"
                  subtitle="Total input tokens over time."
                  dataKeys={["count"]}
                  colors={["#F59E0B"]}
                  yAxisLabel="Token Count"
                />
                <TimeSeriesLineChart
                  data={inputTokensPerTraceChartData}
                  title="Input Tokens per Trace"
                  subtitle="Input tokens used per trace over time."
                  dataKeys={["p50", "p99"]}
                  colors={["#3B82F6", "#8B5CF6"]}
                  yAxisLabel="Token Count"
                />
              </div>
            </div>

            {/* Tools Section */}
            {toolPerformanceData.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                  Tools
                </h3>
                <div className="space-y-6">
                  <ToolTimeSeriesChart
                    data={toolRunCountData}
                    title="Run Count by Tool"
                    subtitle="Tool run counts over time."
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ToolTimeSeriesChart
                      data={toolLatencyData}
                      title="Median Latency by Tool"
                      subtitle="Median tool latency over time."
                    />
                    <ToolTimeSeriesChart
                      data={toolErrorRateData}
                      title="Error Rate by Tool"
                      subtitle="Tool error rate over time."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Run Types Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
                Run Types
              </h3>
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">Run Types data will be available when backend provides the metrics</p>
              </div>
            </div>
          </div>
        );

      case "traces":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Traces
            </h2>
            <div className="space-y-6">
              <UsageTrendChart
                data={traceChartData}
                title="Trace Count"
                subtitle="Total number of traces over time."
                successKey="success"
                errorKey="error"
                totalKey="total"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesLineChart
                  data={latencyChartData}
                  title="Trace Latency"
                  subtitle="Trace latency percentiles over time."
                  dataKeys={["p50", "p99"]}
                  colors={["#3B82F6", "#8B5CF6"]}
                  yAxisLabel="Seconds"
                />
                <TimeSeriesLineChart
                  data={errorRateChartData}
                  title="Trace Error Rate"
                  subtitle="Percent of traces that errored over time."
                  dataKeys={["rate"]}
                  colors={["#F59E0B"]}
                  yAxisLabel="Percentage"
                />
              </div>
            </div>
          </div>
        );

      case "llm":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              LLM Calls
            </h2>
            <div className="space-y-6">
              <UsageTrendChart
                data={llmChartData}
                title="LLM Count"
                subtitle="Number of LLM calls over time."
                successKey="success"
                errorKey="error"
                totalKey="total"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TimeSeriesLineChart
                  data={llmLatencyChartData}
                  title="LLM Latency"
                  subtitle="LLM call latency percentiles over time."
                  dataKeys={["p50", "p99"]}
                  colors={["#3B82F6", "#8B5CF6"]}
                  yAxisLabel="Seconds"
                />
                <TimeSeriesLineChart
                  data={llmErrorRateChartData}
                  title="LLM Error Rate"
                  subtitle="Percent of LLM calls that errored over time."
                  dataKeys={["rate"]}
                  colors={["#F59E0B"]}
                  yAxisLabel="Percentage"
                />
              </div>
            </div>
          </div>
        );

      case "cost":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Cost & Tokens
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TimeSeriesLineChart
                data={costChartData}
                title="Total Cost"
                subtitle="Total cost over time."
                dataKeys={["cost"]}
                colors={["#10B981"]}
                yAxisLabel="Cost ($)"
              />
              <TimeSeriesLineChart
                data={costPerTraceChartData}
                title="Cost per Trace"
                subtitle="Median cost per trace."
                dataKeys={["p50", "p99"]}
                colors={["#3B82F6", "#8B5CF6"]}
                yAxisLabel="Cost ($)"
              />
              <TimeSeriesLineChart
                data={outputTokensChartData}
                title="Output Tokens"
                subtitle="Total output tokens over time."
                dataKeys={["count"]}
                colors={["#8B5CF6"]}
                yAxisLabel="Token Count"
              />
              <TimeSeriesLineChart
                data={outputTokensPerTraceChartData}
                title="Output Tokens per Trace"
                subtitle="Output tokens used per trace over time."
                dataKeys={["p50", "p99"]}
                colors={["#3B82F6", "#8B5CF6"]}
                yAxisLabel="Token Count"
              />
              <TimeSeriesLineChart
                data={inputTokensChartData}
                title="Input Tokens"
                subtitle="Total input tokens over time."
                dataKeys={["count"]}
                colors={["#F59E0B"]}
                yAxisLabel="Token Count"
              />
              <TimeSeriesLineChart
                data={inputTokensPerTraceChartData}
                title="Input Tokens per Trace"
                subtitle="Input tokens used per trace over time."
                dataKeys={["p50", "p99"]}
                colors={["#3B82F6", "#8B5CF6"]}
                yAxisLabel="Token Count"
              />
            </div>
          </div>
        );

      case "tools":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Tools
            </h2>
            {toolPerformanceData.length > 0 ? (
              <div className="space-y-6">
                <ToolTimeSeriesChart
                  data={toolRunCountData}
                  title="Run Count by Tool"
                  subtitle="Tool run counts over time."
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <ToolTimeSeriesChart
                    data={toolLatencyData}
                    title="Median Latency by Tool"
                    subtitle="Median tool latency over time."
                  />
                  <ToolTimeSeriesChart
                    data={toolErrorRateData}
                    title="Error Rate by Tool"
                    subtitle="Tool error rate over time."
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400">No tool data available</p>
              </div>
            )}
          </div>
        );

      case "runtypes":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
              Run Types
            </h2>
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">Run Types data will be available when backend provides the metrics</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          System Performance Analytics
        </h1>
        <button
          onClick={fetchMetricsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Traces
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {totalTraces}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Success: {totalTraces - totalErrors} | Error: {totalErrors}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            LLM Calls
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {totalLLMCalls}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Success: {totalLLMCalls - totalLLMErrors} | Error: {totalLLMErrors}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Cost
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            ${totalCost.toFixed(4)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest: ${(latestCostData.cost || 0).toFixed(4)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token Usage
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {totalInputTokens + totalOutputTokens}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Input: {totalInputTokens} | Output: {totalOutputTokens}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? "border-green-500 text-green-600 dark:text-green-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div>
        {renderTabContent()}
      </div>
    </div>
  );
}
