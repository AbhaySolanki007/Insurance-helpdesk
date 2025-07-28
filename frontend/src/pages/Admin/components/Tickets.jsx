import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search,
  MoreHorizontal,
  Clock,
  User,
  CheckCircle,
  Circle,
  ArrowUp,
  ArrowDown,
  Minus,
  Calendar,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";

const Tickets = () => {
  const [ticketsData, setTicketsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("board"); // "board" or "list"

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8001/api/tickets/all');
      setTicketsData(response.data.tickets || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch tickets');
      console.error('Error fetching tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Memoized processed data
  const processedTicketsData = useMemo(() => {
    if (!ticketsData || ticketsData.length === 0) return [];

    return ticketsData.map(ticket => ({
      ...ticket,
      formattedDate: formatDate(ticket.created_at),
      displaySummary: ticket.summary || 'No summary',
      displayAssignee: ticket.assignee || 'Unassigned',
      displayStatus: ticket.status || 'To Do',
      displayPriority: ticket.priority || 'Medium'
    }));
  }, [ticketsData]);

  // Memoized filtered tickets
  const filteredTickets = useMemo(() => {
    return processedTicketsData.filter(ticket => {
      const matchesSearch = ticket.displaySummary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || ticket.displayStatus === statusFilter;
      const matchesPriority = priorityFilter === "all" || ticket.displayPriority === priorityFilter;
      const matchesAssignee = assigneeFilter === "all" || ticket.displayAssignee === assigneeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
    });
  }, [processedTicketsData, searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  // Memoized status columns for board view
  const statusColumns = useMemo(() => {
    const statuses = ["To Do", "In Progress", "In Review", "Done"];
    return statuses.map(status => ({
      status,
      tickets: filteredTickets.filter(ticket => ticket.displayStatus === status)
    })).filter(column => column.tickets.length > 0); // Only show columns with tickets
  }, [filteredTickets]);

  // Memoized unique assignees for filter dropdown
  const uniqueAssignees = useMemo(() => {
    return Array.from(new Set(processedTicketsData.map(t => t.displayAssignee)));
  }, [processedTicketsData]);

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status) {
      case "To Do":
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
      case "In Progress":
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
      case "In Review":
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      case "Done":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "Highest":
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      case "High":
        return <ArrowUp className="h-3 w-3 text-red-500" />;
      case "Medium":
        return <Minus className="h-3 w-3 text-yellow-500" />;
      case "Low":
        return <ArrowDown className="h-3 w-3 text-blue-500" />;
      case "Lowest":
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const TicketCard = ({ ticket, status }) => {
    const getCardColor = (status) => {
      switch (status) {
        case "To Do":
          return "bg-orange-100/80 dark:bg-[#493026]";
        case "In Progress":
          return "bg-blue-100/80 dark:bg-[#1f333e]";
        case "In Review":
          return "bg-yellow-100/80 dark:bg-[#3b3a1e]";
        case "Done":
          return "bg-green-100/80 dark:bg-[#1e3b2c]";
        default:
          return "bg-gray-100/80 dark:bg-gray-800/50 shadow-gray-200/50";
      }
    };

    return (
      <div className={`${getCardColor(status)} rounded-xl shadow-sm hover:shadow-md transition-shadow p-3 mb-2 cursor-pointer`}>
        <div className="flex items-start justify-between mb-4 mt-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded flex items-center justify-center">
              <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {ticket.id}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2 mb-6">
          {ticket.displaySummary}
        </h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-300 dark:bg-gray-900 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {ticket.displayAssignee.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{ticket.displayAssignee}</span>
          </div>
        </div>
      </div>
    );
  };

  const ListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-300 dark:border-gray-600" style={{ minWidth: '900px' }}>
        <thead>
          <tr className="border-b-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '100px' }}>Key</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '250px' }}>Summary</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '70px' }}>Type</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '90px' }}>Priority</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '100px' }}>Status</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '120px' }}>Assignee</th>
            <th className="text-left py-4 px-4 text-sm font-medium text-gray-700 dark:text-gray-300" style={{ minWidth: '70px' }}>Created</th>
          </tr>
        </thead>
        <tbody>
          {filteredTickets.map((ticket) => (
            <tr key={ticket.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{ticket.id}</span>
                  {getPriorityIcon(ticket.displayPriority)}
                </div>
              </td>
              <td className="py-4 px-4 border-r border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {ticket.displaySummary}
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Task
                </span>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {getPriorityIcon(ticket.displayPriority)}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.displayPriority}</span>
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <span className={getStatusBadge(ticket.displayStatus)}>
                  {ticket.displayStatus}
                </span>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.displayAssignee}</span>
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 dark:text-gray-400">{ticket.formattedDate}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const BoardView = () => {
    const getStatusColumnColor = (status) => {
      switch (status) {
        case "To Do":
          return "bg-orange-50/80 dark:bg-orange-900/10";
        case "In Progress":
          return "bg-blue-50/80 dark:bg-blue-900/10";
        case "In Review":
          return "bg-yellow-50/80 dark:bg-yellow-900/10";
        case "Done":
          return "bg-green-50/80 dark:bg-green-900/10";
        default:
          return "bg-gray-50/50 dark:bg-gray-800/50";
      }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
        {statusColumns.map(({ status, tickets }) => (
          <div key={status} className={`${getStatusColumnColor(status)} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                {status === "To Do" && <div className="w-2 h-2 bg-orange-500 rounded-full"></div>}
                {status === "In Progress" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                {status === "In Review" && <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>}
                {status === "Done" && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
                {status}
                <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs h-5 w-5 rounded-full ml-2 flex items-center justify-center">
                  {tickets.length}
                </span>
              </h3>
            </div>
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} status={status} />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const SummaryView = () => {
    // Calculate status data for doughnut chart
    const statusData = useMemo(() => {
      const statusCounts = {
        "To Do": 0,
        "In Progress": 0,
        "In Review": 0,
        "Done": 0
      };

      filteredTickets.forEach(ticket => {
        if (statusCounts.hasOwnProperty(ticket.displayStatus)) {
          statusCounts[ticket.displayStatus]++;
        }
      });

      return statusCounts;
    }, [filteredTickets]);

    // Calculate priority data for bar chart
    const priorityData = useMemo(() => {
      const priorityCounts = {
        "Highest": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
        "Lowest": 0
      };

      filteredTickets.forEach(ticket => {
        if (priorityCounts.hasOwnProperty(ticket.displayPriority)) {
          priorityCounts[ticket.displayPriority]++;
        }
      });

      // If no data, show sample data for demonstration
      if (Object.values(priorityCounts).every(count => count === 0)) {
        return {
          "Highest": 2,
          "High": 1,
          "Medium": 3,
          "Low": 1,
          "Lowest": 0
        };
      }

      return priorityCounts;
    }, [filteredTickets]);

    const totalWorkItems = Object.values(statusData).reduce((sum, count) => sum + count, 0);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Overview - Doughnut Chart */}
        <div className="bg-[#f9f9f9] dark:bg-[#292828] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Status overview
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a snapshot of the status of your work items.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-16">
            <div className="relative w-64 h-64">
              {/* Doughnut Chart */}
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={Object.entries(statusData).filter(([_, count]) => count > 0).map(([status, count]) => ({
                      name: status,
                      value: count
                    }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={0}
                    dataKey="value"
                    onMouseOver={() => { }}
                    onMouseOut={() => { }}
                    style={{
                      cursor: 'default',
                      transition: 'none'
                    }}
                  >
                    {Object.entries(statusData).filter(([_, count]) => count > 0).map(([status, count]) => {
                      const colors = {
                        "To Do": "#3b82f6", // blue
                        "In Progress": "#10b981", // green
                        "In Review": "#f59e0b", // orange
                        "Done": "#ec4899" // pink
                      };
                      return (
                        <Cell
                          key={status}
                          fill={colors[status]}
                          onMouseOver={() => { }}
                          onMouseOut={() => { }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalWorkItems}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total work items
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2">
              {Object.entries(statusData).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded"
                      style={{
                        backgroundColor: status === "To Do" ? "#3b82f6" :
                          status === "In Progress" ? "#10b981" :
                            status === "In Review" ? "#f59e0b" : "#ec4899"
                      }}
                    ></div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{status}: {count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Priority Breakdown - Bar Chart */}
        <div className="bg-[#f9f9f9] dark:bg-[#292828] rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Priority breakdown
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get a holistic view of how work is being prioritized. See what your team's been{" "}
                <span className="text-blue-600 dark:text-blue-400">focusing on</span>.
              </p>
            </div>
          </div>

          {/* Vertical Bar Chart */}
          <div className="h-65">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(priorityData).map(([priority, count]) => ({
                  priority,
                  count,
                  icon: priority
                }))}
                margin={{
                  top: 10,
                  right: 30,
                  left: 20,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="priority"
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={{ stroke: '#6B7280' }}
                  axisLine={{ stroke: '#6B7280' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  tickLine={{ stroke: '#6B7280' }}
                  axisLine={{ stroke: '#6B7280' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#807e7d',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }}
                  labelStyle={{ color: '#F9FAFB' }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onMouseOver={(data, index) => {
                    // Keep tooltip but prevent visual changes
                  }}
                  onMouseOut={(data, index) => {
                    // Keep tooltip but prevent visual changes
                  }}
                  style={{
                    cursor: 'default',
                    transition: 'none'
                  }}
                >
                  {Object.entries(priorityData).map(([priority, count], index) => {
                    // Custom smooth colors for each priority
                    const getPriorityColor = (priority) => {
                      switch (priority) {
                        case "Highest":
                          return "#FF6B6B"; // Soft red
                        case "High":
                          return "#4ECDC4"; // Soft teal
                        case "Medium":
                          return "#45B7D1"; // Soft blue
                        case "Low":
                          return "#96CEB4"; // Soft green
                        case "Lowest":
                          return "#FFEAA7"; // Soft yellow
                        default:
                          return "#DDA0DD"; // Soft purple
                      }
                    };
                    
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={getPriorityColor(priority)}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Loader text="Loading tickets data..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchTickets} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Tickets
        </h2>
        <button
          onClick={fetchTickets}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={viewMode === "summary"}
          />
        </div>

        <div className="flex overflow-x-auto gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={viewMode === "summary"}
          >
            <option value="all">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="In Review">In Review</option>
            <option value="Done">Done</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={viewMode === "summary"}
          >
            <option value="all">All Priority</option>
            <option value="Highest">Highest</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
            <option value="Lowest">Lowest</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={viewMode === "summary"}
          >
            <option value="all">All Assignees</option>
            {uniqueAssignees.map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("board")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === "board"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === "list"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode("summary")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${viewMode === "summary"
              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
          >
            Summary
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {viewMode === "board" ? <BoardView /> : viewMode === "list" ? <ListView /> : <SummaryView />}
      </div>
    </div>
  );
};

export default Tickets; 