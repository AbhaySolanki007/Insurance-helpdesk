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
} from "recharts";

const Analytics = () => {
  const ticketStatusData = [
    { name: "Open", value: 35, color: "#FF6384" },
    { name: "In Progress", value: 45, color: "#36A2EB" },
    { name: "Closed", value: 20, color: "#4BC0C0" },
  ];

  const resolutionTimeData = [
    { name: "Jan", avgTime: 3.2 },
    { name: "Feb", avgTime: 2.8 },
    { name: "Mar", avgTime: 2.5 },
    { name: "Apr", avgTime: 2.0 },
  ];

  const chatInteractionData = [
    { name: "Jan", avgTime: 8.5 },
    { name: "Feb", avgTime: 7.2 },
    { name: "Mar", avgTime: 6.8 },
    { name: "Apr", avgTime: 5.9 },
  ];

  const issueTypeData = [
    { name: "Claims", value: 40, color: "#FF6384" },
    { name: "Billing", value: 25, color: "#36A2EB" },
    { name: "Technical", value: 15, color: "#4BC0C0" },
    { name: "Coverage", value: 20, color: "#FFCE56" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6">
        Analytics Dashboard
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Summary Cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Ticket Overview
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Open Tickets</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">35</p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Closed Today</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">12</p>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Avg. Response Time
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">2.5h</p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Chatbot Interactions
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">543</p>
            </div>
          </div>
        </div>

        {/* Pie Chart - Ticket Status */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Ticket Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={ticketStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {ticketStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Line Chart - Resolution Time */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Average Resolution Time (Hours)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={resolutionTimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#4BC0C0"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Line Chart - Chat Interaction */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Average Chatbot Interaction Time (Minutes)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chatInteractionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="avgTime"
                stroke="#36A2EB"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Issue Types */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Issue Types
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={issueTypeData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {issueTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Performance */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">
            Recent Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Chatbot Resolution Rate
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  85%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: "85%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  L1 Escalation Rate
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  10%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "10%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  L2 Escalation Rate
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  5%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: "5%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Customer Satisfaction
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  92%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "92%" }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 