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
  ComposedChart,
} from "recharts";

// Helper function to format y-axis values based on chart type
const formatYAxisValue = (value, formatter) => {
  if (!formatter) return value;
  
  switch (formatter) {
    case 'percentage':
      return `${(value * 100).toFixed(1)}%`;
    case 'percentageDecimal':
      return value.toFixed(1);
    case 'traceErrorRate':
      return `${value.toFixed(1)}%`;
    case 'cost':
      return `$${value.toFixed(1)}`;
    case 'tokensK':
      return `${(value / 1000).toFixed(0)}k`;
    case 'tokensHundreds':
      return value.toFixed(0);
    case 'tokensThousands':
      return `${(value / 1000).toFixed(0)}k`;
    case 'toolCount':
      return value.toFixed(0);
    case 'toolLatency':
      return value.toFixed(1);
    case 'toolErrorRate':
      return `${(value * 100).toFixed(1)}%`;
    default:
      return value;
  }
};

// Reusable chart components
export const TimeSeriesLineChart = ({ data, title, subtitle, dataKeys, colors, yAxisLabel = "", yAxisFormatter = null }) => (
  <div className="bg-gray-100 dark:bg-black rounded-lg p-6 shadow-md">
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
        <YAxis 
          label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} 
          stroke="#9CA3AF"
          tickFormatter={(value) => formatYAxisValue(value, yAxisFormatter)}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
          formatter={(value, name) => [formatYAxisValue(value, yAxisFormatter), name]}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
        />
        {dataKeys.map((key, index) => (
          <Line
            key={key}
            type="linear"
            dataKey={key}
            stroke={colors[index]}
            strokeWidth={2}
            name={key}
            dot={{ r: 3, fill: colors[index], stroke: colors[index], strokeWidth: 2 }}
            activeDot={{ r: 5, fill: colors[index], stroke: colors[index], strokeWidth: 2 }}
            connectNulls={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const UsageTrendChart = ({ data, title, subtitle, successKey, errorKey, totalKey, yAxisFormatter = null }) => (
  <div className="bg-gray-100 dark:bg-black rounded-lg p-6 shadow-md">
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
        <YAxis 
          stroke="#9CA3AF"
          tickFormatter={(value) => formatYAxisValue(value, yAxisFormatter)}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: '#1F2937', 
            border: '1px solid #374151',
            borderRadius: '8px',
            color: '#F9FAFB'
          }}
          formatter={(value, name) => [formatYAxisValue(value, yAxisFormatter), name]}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '10px' }}
          iconType="circle"
          iconSize={8}
        />
        <Line
          type="linear"
          dataKey={successKey}
          stroke="#10B981"
          strokeWidth={2}
          name="Success"
          dot={{ r: 3, fill: '#10B981', stroke: '#10B981', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: '#10B981', stroke: '#10B981', strokeWidth: 2 }}
          connectNulls={false}
        />
        <Line
          type="linear"
          dataKey={errorKey}
          stroke="#EF4444"
          strokeWidth={2}
          name="Error"
          dot={{ r: 3, fill: '#EF4444', stroke: '#EF4444', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: '#EF4444', stroke: '#EF4444', strokeWidth: 2 }}
          connectNulls={false}
        />
        <Line
          type="linear"
          dataKey={totalKey}
          stroke="#3B82F6"
          strokeWidth={2}
          name="Total"
          dot={{ r: 3, fill: '#3B82F6', stroke: '#3B82F6', strokeWidth: 2 }}
          activeDot={{ r: 5, fill: '#3B82F6', stroke: '#3B82F6', strokeWidth: 2 }}
          connectNulls={false}
        />
      </ComposedChart>
    </ResponsiveContainer>
  </div>
);
 