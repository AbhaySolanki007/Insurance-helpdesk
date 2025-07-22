import { useState, useEffect } from "react";
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

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "To Do":
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
      case "In Progress":
        return `${baseClasses} bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300`;
      case "Done":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300`;
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "High":
        return <ArrowUp className="h-3 w-3 text-red-500" />;
      case "Medium":
        return <Minus className="h-3 w-3 text-yellow-500" />;
      case "Low":
        return <ArrowDown className="h-3 w-3 text-green-500" />;
      default:
        return <Minus className="h-3 w-3 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "border-l-red-500";
      case "Medium":
        return "border-l-yellow-500";
      case "Low":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
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

  const filteredTickets = ticketsData.filter(ticket => {
    const matchesSearch = ticket.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === "all" || ticket.assignee === assigneeFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesAssignee;
  });

  const getStatusColumns = () => {
    const statuses = ["To Do", "In Progress", "Done"];
    return statuses.map(status => ({
      status,
      tickets: filteredTickets.filter(ticket => ticket.status === status)
    }));
  };

  const TicketCard = ({ ticket }) => (
    <div className={`bg-white dark:bg-gray-900 border-l-4 ${getPriorityColor(ticket.priority)} border rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 mb-3 cursor-pointer`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {ticket.id}
          </span>
          <div className="flex items-center gap-1">
            {getPriorityIcon(ticket.priority)}
          </div>
        </div>
      </div>
      
      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {ticket.summary}
      </h3>
      
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>{ticket.assignee}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(ticket.created_at)}</span>
        </div>
      </div>
    </div>
  );

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
                  {getPriorityIcon(ticket.priority)}
                </div>
              </td>
              <td className="py-4 px-4 border-r border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-900 dark:text-gray-100 truncate">
                  {ticket.summary}
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                  Task
                </span>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1">
                  {getPriorityIcon(ticket.priority)}
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.priority}</span>
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <span className={getStatusBadge(ticket.status)}>
                  {ticket.status}
                </span>
              </td>
              <td className="py-4 px-4 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <User className="h-3 w-3 text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.assignee}</span>
                </div>
              </td>
              <td className="py-4 px-4 whitespace-nowrap">
                <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(ticket.created_at)}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const BoardView = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {getStatusColumns().map(({ status, tickets }) => (
        <div key={status} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
              {status === "To Do" && <Circle className="h-4 w-4 text-gray-400" />}
              {status === "In Progress" && <Clock className="h-4 w-4 text-blue-500" />}
              {status === "Done" && <CheckCircle className="h-4 w-4 text-green-500" />}
              {status}
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs px-2 py-1 rounded-full">
                {tickets.length}
              </span>
            </h3>
          </div>
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                No tickets in this status
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[650px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900/50 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-center items-center h-32">
          <div className="text-red-600 dark:text-red-400">
            Error: {error}
          </div>
        </div>
      </div>
    );
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
          />
        </div>
        
        <div className="flex overflow-x-auto gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Assignees</option>
            {Array.from(new Set(ticketsData.map(t => t.assignee))).map(assignee => (
              <option key={assignee} value={assignee}>{assignee}</option>
            ))}
          </select>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {filteredTickets.length} issues
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("board")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === "board"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            Board
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === "list"
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            }`}
          >
            List
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {viewMode === "board" ? <BoardView /> : <ListView />}
      </div>
    </div>
  );
};

export default Tickets; 