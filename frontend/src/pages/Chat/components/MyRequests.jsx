import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, Calendar, User } from "lucide-react";
import axios from "axios";
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";

const MyRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyRequests = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("user_id");
      const response = await axios.get(`http://localhost:8001/api/user-requests/${userId}`);
      setRequests(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching user requests:", err);
      setError("Failed to fetch your requests");
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'declined':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-500/20';
    }
  };

  useEffect(() => {
    fetchMyRequests();
  }, []);

  if (loading) {
    return <Loader text="Loading your requests..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchMyRequests} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            My Requests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track the status of your submitted requests
          </p>
        </div>
        <button
          onClick={fetchMyRequests}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#292828] p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Requests
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {requests.length}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#292828] p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Pending
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {requests.filter(req => req.status?.toLowerCase() === 'pending').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#292828] p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Approved
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {requests.filter(req => req.status?.toLowerCase() === 'approved').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white dark:bg-[#292828] rounded-xl shadow-lg">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Request History
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {requests.length === 0 
              ? "No requests found" 
              : `${requests.length} request${requests.length !== 1 ? 's' : ''} in your history`
            }
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No requests yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Your submitted requests will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {requests.map((request) => (
              <div key={request.id || request.thread_id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                          {request.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTimestamp(request.timestamp)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Request Details:
                      </h4>
                      <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                        {request.details && typeof request.details === 'object' ? (
                          Object.entries(request.details).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium w-24">{key}:</span>
                              <span className="flex-1">{String(value)}</span>
                            </div>
                          ))
                        ) : (
                          <p>{request.details || "No details provided"}</p>
                        )}
                      </div>
                    </div>

                    {request.admin_notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                        <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">
                          Admin Notes:
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                          {request.admin_notes}
                        </p>
                      </div>
                    )}

                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Request ID: {request.id || request.thread_id}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests; 