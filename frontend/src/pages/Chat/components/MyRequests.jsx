import { useState, useEffect } from "react";
import { Clock, CheckCircle, XCircle, AlertCircle, User } from "lucide-react";
import axios from "axios";
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";

const MyRequests = () => {
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMyStatus = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem("user_id");
      const response = await axios.get(`http://localhost:8001/api/pending-approvals/${userId}`);
      
      if (response.data && response.data.status) {
        setCurrentStatus(response.data.status);
      } else {
        setCurrentStatus('no_history');
      }
      
      setError(null);
    } catch (err) {
      console.error("Error fetching user status:", err);
      setError("Failed to fetch your request status");
      setCurrentStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'declined':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'pending':
        return <Clock className="h-8 w-8 text-yellow-600" />;
      case 'no_history':
        return <User className="h-8 w-8 text-gray-400" />;
      default:
        return <AlertCircle className="h-8 w-8 text-gray-600" />;
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'We’ve approved your request. Changes will be applied shortly.';
      case 'declined':
        return 'Your request has been reviewed, but we’re unable to approve it at this time.';
      case 'pending':
        return 'We’ve received your request and it’s pending approval.';
      case 'no_history':
        return 'We couldn’t find any requests linked to your account.';
      default:
        return 'Unable to determine status.';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 border-green-200 dark:border-green-500/20';
      case 'declined':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-500/20';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-red-200 dark:border-yellow-500/20';
      case 'no_history':
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-500/20';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-500/20';
    }
  };

  useEffect(() => {
    fetchMyStatus();
  }, []);

  if (loading) {
    return <Loader text="Checking your request status..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchMyStatus} />;
  }

  return (
    <div className="space-y-6 p-10">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            My Request Status
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Check the status of your latest request
          </p>
        </div>
        <button
          onClick={fetchMyStatus}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? "Checking..." : "Refresh"}
        </button>
      </div>

      {/* Status Display */}
      <div className="bg-white dark:bg-[#292828] p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
            {getStatusIcon(currentStatus)}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">
            {currentStatus === 'no_history' ? 'No Requests' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
            {getStatusText(currentStatus)}
          </p>
          
          <div className="inline-block">
            <span className={`px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(currentStatus)}`}>
              {currentStatus === 'no_history' ? 'No History' : currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyRequests; 