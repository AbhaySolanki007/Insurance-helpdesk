import { useState } from "react";
import { useAnalyticsData } from "./useAnalyticsData";
import { useChartDataProcessor } from "./useChartDataProcessor";
import {
  TimeSeriesLineChart,
  UsageTrendChart,
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent,
  DoughnutChartComponent,
  RadarChartComponent,
} from "./ChartComponents";
import Loader from "../../../../components/Loader";
import ErrorBox from "../../../../components/ErrorBox";

// Configuration for different sections
const SECTION_CONFIG = {
  traces: {
    title: "Traces",
    charts: [
      {
        type: "usageTrend",
        title: "Trace Count",
        subtitle: "Total number of traces over time.",
        dataKey: "traceChartData",
        successKey: "success",
        errorKey: "error",
        totalKey: "total"
      },
      {
        type: "areaChart",
        title: "Trace Latency Trends",
        subtitle: "Trace latency percentiles over time with area visualization.",
        dataKey: "latencyChartData",
        dataKeys: ["p50", "p99"],
        colors: ["#3B82F6", "#8B5CF6"],
        yAxisLabel: "Seconds"
      },
      {
        type: "barChart",
        title: "Trace Error Rate",
        subtitle: "Percent of traces that errored over time.",
        dataKey: "errorRateChartData",
        dataKeys: ["rate"],
        colors: ["#F59E0B"],
        yAxisLabel: "Rate %",
        yAxisFormatter: "traceErrorRate"
      }
    ]
  },
  llm: {
    title: "LLM Calls",
    charts: [
      {
        type: "usageTrend",
        title: "LLM Count",
        subtitle: "Number of LLM calls over time.",
        dataKey: "llmChartData",
        successKey: "success",
        errorKey: "error",
        totalKey: "total"
      },
      {
        type: "areaChart",
        title: "LLM Latency Trends",
        subtitle: "LLM call latency percentiles over time with area visualization.",
        dataKey: "llmLatencyChartData",
        dataKeys: ["p50", "p99"],
        colors: ["#3B82F6", "#8B5CF6"],
        yAxisLabel: "Seconds"
      },
      {
        type: "barChart",
        title: "LLM Error Rate",
        subtitle: "Percent of LLM calls that errored over time.",
        dataKey: "llmErrorRateChartData",
        dataKeys: ["rate"],
        colors: ["#F59E0B"],
        yAxisLabel: "Percentage",
        yAxisFormatter: "percentageDecimal"
      }
    ]
  },
  cost: {
    title: "Cost & Tokens",
    charts: [
      {
        type: "areaChart",
        title: "Total Cost Trends",
        subtitle: "Total cost over time with cumulative visualization.",
        dataKey: "costChartData",
        dataKeys: ["cost"],
        colors: ["#10B981"],
        yAxisLabel: "Cost ($)",
        yAxisFormatter: "cost"
      },
      {
        type: "lineChart",
        title: "Cost per Trace",
        subtitle: "Median cost per trace over time.",
        dataKey: "costPerTraceChartData",
        dataKeys: ["p50", "p99"],
        colors: ["#3B82F6", "#8B5CF6"],
        yAxisLabel: "Cost ($)",
        yAxisFormatter: "cost"
      },
      {
        type: "barChart",
        title: "Input Tokens",
        subtitle: "Input tokens used over time.",
        dataKey: "inputTokensChartData",
        dataKeys: ["count"],
        colors: ["#F59E0B"],
        yAxisLabel: "Token Count",
        yAxisFormatter: "tokensThousands"
      },
      {
        type: "areaChart",
        title: "Output Tokens",
        subtitle: "Output tokens generated over time.",
        dataKey: "outputTokensChartData",
        dataKeys: ["count"],
        colors: ["#8B5CF6"],
        yAxisLabel: "Token Count",
        yAxisFormatter: "tokensK"
      },
      {
        type: "barChart",
        title: "Input Tokens per Trace",
        subtitle: "Input tokens used per trace over time.",
        dataKey: "inputTokensPerTraceChartData",
        dataKeys: ["p50", "p99"],
        colors: ["#3B82F6", "#8B5CF6"],
        yAxisLabel: "Token Count",
        yAxisFormatter: "tokensThousands"
      },
      {
        type: "lineChart",
        title: "Output Tokens per Trace",
        subtitle: "Output tokens generated per trace over time.",
        dataKey: "outputTokensPerTraceChartData",
        dataKeys: ["p50", "p99"],
        colors: ["#10B981", "#EF4444"],
        yAxisLabel: "Token Count",
        yAxisFormatter: "tokensHundreds"
      }
    ]
  },
  tools: {
    title: "Tools",
    charts: [
      {
        type: "barChart",
        title: "Tool Run Count",
        subtitle: "Tool run counts over time",
        dataKey: "toolRunCountData",
        dataKeys: ["create_ticket", "faq_search", "get_policy_data", "get_user_data"],
        colors: ["#F59E0B", "#10B981", "#8B5CF6", "#A0522D"],
        yAxisLabel: "Number of runs",
        yAxisFormatter: "toolCount"
      },
      {
        type: "areaChart",
        title: "Tool Latency Trends",
        subtitle: "Tool latency over time with area visualization",
        dataKey: "toolLatencyData",
        dataKeys: ["faq_search", "get_policy_data", "get_user_data"],
        colors: ["#10B981", "#8B5CF6", "#A0522D"],
        yAxisLabel: "Seconds",
        yAxisFormatter: "toolLatency"
      },
      {
        type: "lineChart",
        title: "Tool Error Rate",
        subtitle: "Tool error rate over time",
        dataKey: "toolErrorRateData",
        dataKeys: ["faq_search", "get_policy_data", "get_user_data"],
        colors: ["#EF4444", "#F59E0B", "#8B5CF6"],
        yAxisLabel: "Rate %",
        yAxisFormatter: "toolErrorRate"
      }
    ]
  }
};

// Component to render a single chart
const ChartRenderer = ({ chart, data }) => {
  const chartData = data[chart.dataKey];
  
  if (!chartData || chartData.length === 0) {
    return null;
  }

  const chartComponent = (() => {
    switch (chart.type) {
      case "usageTrend":
        return (
          <UsageTrendChart
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            successKey={chart.successKey}
            errorKey={chart.errorKey}
            totalKey={chart.totalKey}
            yAxisFormatter={chart.yAxisFormatter}
          />
        );
      
      case "timeSeries":
        return (
          <TimeSeriesLineChart
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKeys={chart.dataKeys}
            colors={chart.colors}
            yAxisLabel={chart.yAxisLabel}
            yAxisFormatter={chart.yAxisFormatter}
          />
        );
      
      case "lineChart":
        return (
          <TimeSeriesLineChart
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKeys={chart.dataKeys}
            colors={chart.colors}
            yAxisLabel={chart.yAxisLabel}
            yAxisFormatter={chart.yAxisFormatter}
          />
        );
      
      case "areaChart":
        return (
          <AreaChartComponent
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKeys={chart.dataKeys}
            colors={chart.colors}
            yAxisLabel={chart.yAxisLabel}
            yAxisFormatter={chart.yAxisFormatter}
          />
        );
      
      case "barChart":
        return (
          <BarChartComponent
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKeys={chart.dataKeys}
            colors={chart.colors}
            yAxisLabel={chart.yAxisLabel}
            yAxisFormatter={chart.yAxisFormatter}
          />
        );
      
      case "pieChart":
        return (
          <PieChartComponent
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKey={chart.dataKeys?.[0] || "value"}
            nameKey={chart.nameKey || "name"}
          />
        );
      
      case "doughnutChart":
        return (
          <DoughnutChartComponent
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKey={chart.dataKeys?.[0] || "value"}
            nameKey={chart.nameKey || "name"}
          />
        );
      
      case "radarChart":
        return (
          <RadarChartComponent
            data={chartData}
            title={chart.title}
            subtitle={chart.subtitle}
            dataKeys={chart.dataKeys}
            colors={chart.colors}
          />
        );
      
      default:
        return null;
    }
  })();

    return chartComponent;
};

// Component to render a section
const SectionRenderer = ({ sectionKey, data, processedData }) => {
  const section = SECTION_CONFIG[sectionKey];
  
  if (!section) return null;

  // Separate full-width charts from grid charts
  const fullWidthCharts = section.charts.filter(chart => chart.type === "usageTrend");
  const gridCharts = section.charts.filter(chart => chart.type !== "usageTrend");

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-2">
        {section.title}
      </h3>
      <div className="space-y-6">
        {/* Render full-width charts first */}
        {fullWidthCharts.map((chart, index) => (
          <ChartRenderer key={`full-${index}`} chart={chart} data={processedData} />
        ))}
        
        {/* Render grid charts in 2-column layout */}
        {gridCharts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gridCharts.map((chart, index) => (
              <ChartRenderer key={`grid-${index}`} chart={chart} data={processedData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Component to render a single tab
const TabRenderer = ({ tabKey, data, processedData }) => {
  if (tabKey === "all") {
    return (
      <div className="space-y-12">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
          All Metrics
        </h2>
        {Object.keys(SECTION_CONFIG).map(sectionKey => (
          <SectionRenderer 
            key={sectionKey} 
            sectionKey={sectionKey} 
            data={data} 
            processedData={processedData}
          />
        ))}
      </div>
    );
  }

  const section = SECTION_CONFIG[tabKey];
  if (!section) return null;

  // Separate full-width charts from grid charts
  const fullWidthCharts = section.charts.filter(chart => chart.type === "usageTrend");
  const gridCharts = section.charts.filter(chart => chart.type !== "usageTrend");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        {section.title}
      </h2>
      <div className="space-y-6">
        {/* Render full-width charts first */}
        {fullWidthCharts.map((chart, index) => (
          <ChartRenderer key={`full-${index}`} chart={chart} data={processedData} />
        ))}
        
        {/* Render grid charts in 2-column layout */}
        {gridCharts.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {gridCharts.map((chart, index) => (
              <ChartRenderer key={`grid-${index}`} chart={chart} data={processedData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Analytics() {
  const { metricsData, loading, error, fetchMetricsData } = useAnalyticsData();
  const processedData = useChartDataProcessor(metricsData);
  const [activeTab, setActiveTab] = useState("all");

  if (loading) {
    return <Loader text="Loading analytics data..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchMetricsData} />;
  } 

  if (!processedData) {
    return <div>No data available</div>;
  }

  const tabs = [
    { id: "all", label: "All" },
    { id: "traces", label: "Traces" },
    { id: "llm", label: "LLM Calls" },
    { id: "cost", label: "Cost & Tokens" },
    { id: "tools", label: "Tools" },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Traces
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {processedData.totalTraces}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Success: {processedData.totalTraces - processedData.totalErrors} | Error: {processedData.totalErrors}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            LLM Calls
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {processedData.totalLLMCalls}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Success: {processedData.totalLLMCalls - processedData.totalLLMErrors} | Error: {processedData.totalLLMErrors}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Total Cost
          </h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            ${processedData.totalCost.toFixed(4)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Latest: ${(processedData.latestCostData.cost || 0).toFixed(4)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Token Usage
          </h3>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {processedData.totalInputTokens + processedData.totalOutputTokens}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Input: {processedData.totalInputTokens} | Output: {processedData.totalOutputTokens}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tool Usage
          </h3>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {processedData.totalToolRuns}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Active Tools: {processedData.toolPerformanceData.length} | Top: {processedData.toolPerformanceData[0]?.name || 'None'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex overflow-x-auto space-x-8">
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
        <TabRenderer 
          tabKey={activeTab} 
          data={processedData} 
          processedData={processedData}
        />
      </div>
    </div>
  );
}