import { useState, useEffect } from "react";
import {
  LineChart,
  PieChart,
  Pie,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ComposedChart,
} from "recharts";
import axios from "axios";

export default function Analytics() {
  const [metricsData, setMetricsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      <div className="flex items-center justify-center h-64">
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

  // Calculate summary statistics
  const getLatestData = (dataArray) => {
    return dataArray[dataArray.length - 1] || {};
  };

  const getActiveDays = (dataArray) => {
    return dataArray.filter(item => 
      (item.success && item.success > 0) || 
      (item.error && item.error > 0) ||
      (item.count && item.count > 0)
    );
  };

  const latestTraceData = getLatestData(metricsData.trace_count || []);
  const latestLLMData = getLatestData(metricsData.llm_count || []);
  const latestToolData = getLatestData(metricsData.tool_run_count || {});

  // Calculate total metrics across all days
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

  // Prepare chart data
  const traceChartData = (metricsData.trace_count || []).map(item => ({
    date: item.date,
    success: item.success || 0,
    error: item.error || 0,
    total: (item.success || 0) + (item.error || 0),
  }));

  const llmChartData = (metricsData.llm_count || []).map(item => ({
    date: item.date,
    success: item.success || 0,
    error: item.error || 0,
    total: (item.success || 0) + (item.error || 0),
  }));

  const latencyChartData = (metricsData.trace_latency || []).map(item => ({
    date: item.date,
    p50: item.p50 || 0,
    p99: item.p99 || 0,
  }));

  const llmLatencyChartData = (metricsData.llm_latency || []).map(item => ({
    date: item.date,
    p50: item.p50 || 0,
    p99: item.p99 || 0,
  }));

  const errorRateChartData = (metricsData.trace_error_rate || []).map(item => ({
    date: item.date,
    rate: item.rate || 0,
  }));

  const llmErrorRateChartData = (metricsData.llm_error_rate || []).map(item => ({
    date: item.date,
    rate: item.rate || 0,
  }));

  const costChartData = (metricsData.total_cost || []).map(item => ({
    date: item.date,
    cost: item.cost || 0,
  }));

  const tokenChartData = (metricsData.input_tokens || []).map(item => ({
    date: item.date,
    input: item.count || 0,
    output: getLatestData(metricsData.output_tokens || []).count || 0,
  }));

  // Tool performance data
  const toolPerformanceData = Object.keys(latestToolData)
    .filter(key => key !== 'date')
    .map(toolName => ({
      name: toolName,
      runs: latestToolData[toolName] || 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  const toolLatencyData = Object.keys(getLatestData(metricsData.tool_median_latency || {}))
    .filter(key => key !== 'date')
    .map(toolName => ({
      name: toolName,
      latency: getLatestData(metricsData.tool_median_latency || {})[toolName] || 0,
    }))
    .sort((a, b) => b.latency - a.latency);

  // Calculate peak performance day
  const peakDay = traceChartData.reduce((max, item) => 
    item.total > max.total ? item : max, { total: 0 }
  );

  // Calculate average error rate
  const avgErrorRate = errorRateChartData.reduce((sum, item) => sum + item.rate, 0) / 
    errorRateChartData.filter(item => item.rate > 0).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          System Performance Analytics
        </h2>
        <button
          onClick={fetchMetricsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Enhanced Summary Cards */}
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Peak: {peakDay.total} on {peakDay.date}
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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Avg Error Rate: {(totalLLMErrors / totalLLMCalls * 100).toFixed(1)}%
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tool Executions
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {Object.values(latestToolData).reduce((sum, val) => sum + (val || 0), 0)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {Object.keys(latestToolData).filter(key => key !== 'date').length} active tools
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Most used: {toolPerformanceData[0]?.name || 'N/A'}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            System Health
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {avgErrorRate.toFixed(2)}%
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Average error rate
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {getActiveDays(metricsData.trace_count || []).length} active days
          </p>
        </div>
      </div>

      {/* Performance Overview Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Trends */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Daily Usage Trends
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={traceChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="success"
                stackId="1"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Success"
              />
              <Area
                type="monotone"
                dataKey="error"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
                name="Error"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* LLM Performance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            LLM Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={llmChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="success"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Success"
              />
              <Area
                type="monotone"
                dataKey="error"
                stackId="1"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.6}
                name="Error"
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Total"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trace Latency */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Trace Latency Performance (seconds)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={latencyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="P50 Latency"
              />
              <Line
                type="monotone"
                dataKey="p99"
                stroke="#F59E0B"
                strokeWidth={2}
                name="P99 Latency"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LLM Latency */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            LLM Latency Performance (seconds)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={llmLatencyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="p50"
                stroke="#10B981"
                strokeWidth={2}
                name="P50 Latency"
              />
              <Line
                type="monotone"
                dataKey="p99"
                stroke="#EF4444"
                strokeWidth={2}
                name="P99 Latency"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Error Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trace Error Rate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Trace Error Rate Trend (%)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={errorRateChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#EF4444"
                strokeWidth={2}
                name="Error Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LLM Error Rate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            LLM Error Rate Trend (%)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={llmErrorRateChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="rate"
                stroke="#F59E0B"
                strokeWidth={2}
                name="LLM Error Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tool Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool Usage Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Tool Usage Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={toolPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="runs" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tool Latency Comparison */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Tool Latency Comparison (seconds)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={toolLatencyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="latency" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost and Token Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Analysis */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Cost Analysis
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={costChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Total Cost ($)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Token Usage */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Token Usage
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={tokenChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="input"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Input Tokens"
              />
              <Line
                type="monotone"
                dataKey="output"
                stroke="#10B981"
                strokeWidth={2}
                name="Output Tokens"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Peak Performance Day</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{peakDay.date}</p>
            <p className="text-sm text-blue-600 dark:text-blue-400">{peakDay.total} total traces</p>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-800 dark:text-green-200">Best Latency</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {Math.min(...latencyChartData.map(item => item.p50).filter(val => val > 0)).toFixed(3)}s
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">Lowest P50 latency</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-purple-800 dark:text-purple-200">Most Used Tool</h4>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {toolPerformanceData[0]?.name || 'N/A'}
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              {toolPerformanceData[0]?.runs || 0} executions
            </p>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200">System Reliability</h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {(100 - avgErrorRate).toFixed(1)}%
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">Success rate</p>
          </div>
          
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 dark:text-red-200">Highest Latency</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {Math.max(...latencyChartData.map(item => item.p99).filter(val => val > 0)).toFixed(1)}s
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">Peak P99 latency</p>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-800 dark:text-indigo-200">Active Days</h4>
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {getActiveDays(metricsData.trace_count || []).length}
            </p>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">Days with activity</p>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
          Detailed Metrics Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Metric
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Latest Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Peak Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  Total Cost
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  ${getLatestData(metricsData.total_cost || {}).cost?.toFixed(4) || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  ${Math.max(...(metricsData.total_cost || []).map(item => item.cost || 0)).toFixed(4)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getLatestData(metricsData.total_cost || {}).date || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  Input Tokens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {getLatestData(metricsData.input_tokens || {}).count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {Math.max(...(metricsData.input_tokens || []).map(item => item.count || 0))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getLatestData(metricsData.input_tokens || {}).date || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  Output Tokens
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {getLatestData(metricsData.output_tokens || {}).count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {Math.max(...(metricsData.output_tokens || []).map(item => item.count || 0))}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getLatestData(metricsData.output_tokens || {}).date || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  LLM Error Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {getLatestData(metricsData.llm_error_rate || {}).rate?.toFixed(2) || 0}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {Math.max(...(metricsData.llm_error_rate || []).map(item => item.rate || 0)).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getLatestData(metricsData.llm_error_rate || {}).date || 'N/A'}
                </td>
              </tr>
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  Trace Error Rate
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {getLatestData(metricsData.trace_error_rate || {}).rate?.toFixed(2) || 0}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {Math.max(...(metricsData.trace_error_rate || []).map(item => item.rate || 0)).toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {getLatestData(metricsData.trace_error_rate || {}).date || 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
