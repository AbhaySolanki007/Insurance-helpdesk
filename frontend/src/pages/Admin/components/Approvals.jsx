import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, User, MessageSquare, Calendar } from "lucide-react";
import axios from "axios";
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";
import { toast } from "react-toastify";

const Approvals = () => {
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingDecision, setProcessingDecision] = useState(null);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await axios.get("http://localhost:8001/api/pending-approvals");
      console.log(response.data);
      setPendingApprovals(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching pending approvals:", err);
      setError("Failed to fetch pending approvals");
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (threadId, decision) => {
    try {
      setProcessingDecision(threadId);
      const response = await axios.post(`http://localhost:8001/api/approve-update/${threadId}`, {
        decision: decision
      });

      if (response.status === 200) {
        // Remove the processed approval from the list
        setPendingApprovals(prev => prev.filter(approval => approval.thread_id !== threadId));
      }
      toast.success(`Request ${decision} successfully`);
    } catch (err) {
      console.error(`Error processing ${decision}:`, err);
      setError(`Failed to ${decision} the request`);
    } finally {
      setProcessingDecision(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";

    // Check if timestamp is a UUID (which is invalid for date parsing)
    if (typeof timestamp === 'string' && timestamp.includes('-') && timestamp.length === 36) {
      return "Recent"; // For UUID timestamps, show "Recent" instead
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return "Recent";
      }
      return date.toLocaleString();
    } catch (error) {
      return "Recent";
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  if (loading) {
    return <Loader text="Loading pending approvals..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchPendingApprovals} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Approval Inbox
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Review and approve pending user requests
          </p>
        </div>
        <button
          onClick={fetchPendingApprovals}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-6 rounded-2xl shadow-lg border border-blue-200 dark:border-blue-500/20 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                Total Pending Approvals
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {pendingApprovals.length}
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 rounded-2xl">
              <Clock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-6 rounded-2xl shadow-lg border border-green-200 dark:border-green-500/20 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide">
                Recent Requests
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {pendingApprovals.filter(approval => {
                  // Handle UUID timestamps by considering them as recent
                  if (typeof approval.timestamp === 'string' && approval.timestamp.includes('-') && approval.timestamp.length === 36) {
                    return true; // Consider UUID timestamps as recent
                  }

                  try {
                    const timestamp = new Date(approval.timestamp);
                    if (isNaN(timestamp.getTime())) {
                      return true; // Consider invalid dates as recent
                    }
                    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
                    return timestamp > oneHourAgo;
                  } catch (error) {
                    return true; // Consider error cases as recent
                  }
                }).length}
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-2xl">
              <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-500/20 hover:shadow-xl transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide">
                Active Users
              </p>
              <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">
                {new Set(pendingApprovals.map(approval => approval.user_id)).size}
              </p>
            </div>
            <div className="p-4 bg-purple-500/10 rounded-2xl">
              <User className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Approval List */}
      <div className="bg-white dark:bg-[#292828] rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <div className="p-8 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Pending Approvals
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {pendingApprovals.length === 0
              ? "No pending approvals"
              : `${pendingApprovals.length} request${pendingApprovals.length !== 1 ? 's' : ''} waiting for review`
            }
          </p>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No pending approvals at the moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {pendingApprovals.map((approval) => (
              <div key={approval.thread_id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
                          User ID: {approval.user_id}
                        </h3>
                        <div className="flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTimestamp(approval.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 text-xs font-medium rounded-full border border-yellow-200 dark:border-yellow-500/20">
                      Pending Review
                    </span>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Request Details */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      Requested Changes
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      {approval.details && typeof approval.details === 'object' ? (
                        <div className="space-y-2">
                          {Object.entries(approval.details).map(([key, value]) => (
                            <div key={key} className="flex items-center">
                              <span className="font-medium text-gray-600 dark:text-gray-400 w-16 flex-shrink-0 capitalize text-xs">
                                {key}:
                              </span>
                              <span className="flex-1 font-medium text-gray-900 dark:text-white text-sm">
                                {String(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 dark:text-gray-400 italic text-sm">
                          {approval.details || "No details provided"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Thread ID */}
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono mb-4">
                    Thread ID: {approval.thread_id}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(approval.thread_id, "approved")}
                      disabled={processingDecision === approval.thread_id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      {processingDecision === approval.thread_id ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleDecision(approval.thread_id, "declined")}
                      disabled={processingDecision === approval.thread_id}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      {processingDecision === approval.thread_id ? "Processing..." : "Decline"}
                    </button>
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

export default Approvals;
