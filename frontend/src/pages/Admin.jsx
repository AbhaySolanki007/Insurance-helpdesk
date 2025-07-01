import { useState } from "react";
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
import {
  Search,
  User,
  Bell,
  ChevronDown,
  Menu,
  X,
  Home,
  Ticket,
  Users,
  BarChart2,
  MessageSquare,
  UserRoundCog,
} from "lucide-react";
import { Link, redirect, useNavigate } from "react-router";
import axios from "axios";
import { toast } from "react-toastify";

// Sample data for demonstration
const ticketsData = [
  {
    id: "TKT-001",
    description: "Claim processing delay",
    creationDate: "2025-04-10",
    status: "Open",
  },
  {
    id: "TKT-002",
    description: "Coverage dispute",
    creationDate: "2025-04-09",
    status: "In Progress",
  },
  {
    id: "TKT-003",
    description: "Premium adjustment request",
    creationDate: "2025-04-08",
    status: "Closed",
  },
  {
    id: "TKT-004",
    description: "Policy renewal issue",
    creationDate: "2025-04-07",
    status: "Open",
  },
  {
    id: "TKT-005",
    description: "Missing documentation",
    creationDate: "2025-04-06",
    status: "In Progress",
  },
  {
    id: "TKT-006",
    description: "Incorrect billing amount",
    creationDate: "2025-04-05",
    status: "Closed",
  },
  {
    id: "TKT-007",
    description: "System access problem",
    creationDate: "2025-04-04",
    status: "Open",
  },
];

// const usersData = [
//   {
//     username: "john_doe",
//     email: "john.doe@example.com",
//     creationDate: "2024-12-15",
//   },
//   {
//     username: "jane_smith",
//     email: "jane.smith@example.com",
//     creationDate: "2025-01-10",
//   },
//   {
//     username: "robert_johnson",
//     email: "robert.j@example.com",
//     creationDate: "2025-01-25",
//   },
//   {
//     username: "sarah_williams",
//     email: "sarah.w@example.com",
//     creationDate: "2025-02-14",
//   },
//   {
//     username: "michael_brown",
//     email: "michael.b@example.com",
//     creationDate: "2025-03-03",
//   },
//   {
//     username: "emma_davis",
//     email: "emma.d@example.com",
//     creationDate: "2025-03-22",
//   },
// ];

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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const logoutUser = async () => {
    try {
      const response = await axios.post(
        "http://localhost:8000/api/v1/users/logout",
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      console.log("Logout response:", response);
      if (response.status === 200) {
        toast.success("Logged out successfully!");
        // Redirect to login page or perform any other action
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out. Please try again.");
    }
  };

  const [usersData2, setUsersData2] = useState([]);
  const userTabHandle = async () => {
    setActiveTab("users");
    setSidebarOpen(false);
    try {
      const response = await axios.get(
        `http://localhost:8000/api/v1/users/getAllUsersData`,
        { withCredentials: true }
      );
      console.log("response:", response);
      setUsersData2(response.data.data);
      //   usersData2 = response.data.data;
      console.log("UsersData2:", usersData2);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-full sm:w-64" : "w-20"
        } bg-gray-800 text-white transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {sidebarOpen && <h2 className="text-xl font-bold">Admin</h2>}
          <button
            onClick={toggleSidebar}
            className="p-1 rounded-md hover:bg-gray-700"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <div className="py-4">
          <button
            onClick={() => {
              setActiveTab("tickets");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full px-4 py-3 ${
              activeTab === "tickets" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            <Ticket size={20} />
            {sidebarOpen && <span className="ml-3">Tickets</span>}
          </button>

          <button
            // onClick={() => {
            //   setActiveTab("users");
            //   setSidebarOpen(false);
            //   return;
            // }}
            onClick={userTabHandle}
            className={`flex items-center w-full px-4 py-3 ${
              activeTab === "users" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            <Users size={20} />
            {sidebarOpen && <span className="ml-3">Users</span>}
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full px-4 py-3 ${
              activeTab === "analytics" ? "bg-blue-600" : "hover:bg-gray-700"
            }`}
          >
            <BarChart2 size={20} />
            {sidebarOpen && <span className="ml-3">Analytics</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Navbar */}
        <header className="bg-white shadow">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <img
                className="h-5 md:h-7 mr-2"
                src="https://frontendcywardenlogo.s3.us-east-1.amazonaws.com/Globe.png"
                alt="cywarden"
              />
              {/* <img src="/api/placeholder/40/40" alt="Logo" className="h-8 w-8 mr-2" /> */}
              {/* <h1 className="text-xl font-semibold text-gray-800">Insurance Admin Panel</h1> */}
            </div>
            <div className="flex items-center sm:space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="max-w-24 sm:max-w-48 lg:max-w-60 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search
                  className="absolute left-3 top-2.5 text-gray-400"
                  size={18}
                />
              </div>
              <button className="p-2 rounded-full hover:bg-gray-100">
                <Bell size={20} />
              </button>
              <div className="flex items-center cursor-pointer">
                <div className="dropdown dropdown-end">
                  <div
                    tabIndex={0}
                    role="button"
                    className="flex items-center text-primary rounded-full p-2 hover:bg-white/10"
                  >
                    <div className="h-5 w-5 md:h-8 md:w-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <User size={16} />
                    </div>
                    <span className="ml-2 mr-1 text-sm sm:text-base">
                      Admin
                    </span>
                    <ChevronDown size={16} />
                  </div>
                  <ul
                    tabIndex={0}
                    className="menu dropdown-content bg-slate-800 rounded-xl z-10 mt-2 w-52 p-2 shadow-lg border border-slate-700"
                  >
                    <li>
                      <Link
                        to=".."
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        Your Profile
                      </Link>
                    </li>
                    <li>
                      <Link
                        to=".."
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        Settings
                      </Link>
                    </li>
                    <li>
                      <div
                        onClick={logoutUser}
                        className="text-gray-300 hover:text-white hover:bg-slate-700"
                      >
                        Logout
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {activeTab === "tickets" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Tickets
                </h2>
                <button className="btn btn-primary">New Ticket</button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Ticket ID</th>
                      <th>Description</th>
                      <th>Creation Date</th>
                      <th>Status</th>
                      {/* <th>Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {ticketsData.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{ticket.id}</td>
                        <td>{ticket.description}</td>
                        <td>{ticket.creationDate}</td>
                        <td>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              ticket.status === "Open"
                                ? "bg-red-100 text-red-800"
                                : ticket.status === "In Progress"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        {/* <td>
													<button className="btn btn-sm btn-ghost">View</button>
												</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "users" && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">Users</h2>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate("/register")}
                >
                  Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Account Creation Date</th>
                      {/* <th>Actions</th> */}
                    </tr>
                  </thead>
                  <tbody>
                    {usersData2.map((user) => (
                      <tr key={user.username}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        {/* <td>{user.creationDate}</td> */}
                        <td>{user.createdAt.split("T")[0]}</td>
                        {/* <td>
													<button className="btn btn-sm btn-ghost">View</button>
												</td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Analytics Dashboard
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Summary Cards */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    Ticket Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Open Tickets</p>
                      <p className="text-2xl font-bold text-blue-600">35</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Closed Today</p>
                      <p className="text-2xl font-bold text-green-600">12</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Avg. Response Time
                      </p>
                      <p className="text-2xl font-bold text-yellow-600">2.5h</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">
                        Chatbot Interactions
                      </p>
                      <p className="text-2xl font-bold text-purple-600">543</p>
                    </div>
                  </div>
                </div>

                {/* Pie Chart - Ticket Status */}
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
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
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
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
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
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
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
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
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-medium text-gray-700 mb-4">
                    Recent Performance
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Chatbot Resolution Rate
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          85%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: "85%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          L1 Escalation Rate
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          10%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: "10%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          L2 Escalation Rate
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          5%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: "5%" }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Customer Satisfaction
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          92%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
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
          )}
        </main>
      </div>
    </div>
  );
}
