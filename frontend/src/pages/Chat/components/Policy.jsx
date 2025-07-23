import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";
import { 
  FileText, 
  Calendar, 
  AlertCircle,
  Hash,
  Tag,
  Clock,
  DollarSign,
  Shield,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
  CheckCircle,
  XCircle,
  Zap,
  TrendingUp,
  Activity
} from 'lucide-react';
import { FaPlane, FaHeartbeat, FaPaw, FaUserShield, FaBuilding, FaHome, FaCar } from 'react-icons/fa';

const Policy = ({ isSidebarOpen }) => {
  const { id } = useParams();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPolicy, setExpandedPolicy] = useState(null);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const baseURL = "http://localhost:8001";

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'expired':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'pending':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'expired':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPolicyIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'travel':
        return <FaPlane className="h-6 w-6 text-blue-400" />;
      case 'health':
        return <FaHeartbeat className="h-6 w-6 text-red-400" />;
      case 'pet':
        return <FaPaw className="h-6 w-6 text-amber-400" />;
      case 'life':
        return <FaUserShield className="h-6 w-6 text-indigo-400" />;
      case 'business':
        return <FaBuilding className="h-6 w-6 text-purple-400" />;
      case 'home':
        return <FaHome className="h-6 w-6 text-emerald-400" />;
      case 'car':
        return <FaCar className="h-6 w-6 text-cyan-400" />;
      default:
        return <FileText className="h-6 w-6 text-gray-400" />;
    }
  };

  const getPolicyGradient = (type) => {
    switch (type?.toLowerCase()) {
      case 'travel':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-blue-900/20 from-white/50 via-white/50 to-blue-100/20';
      case 'health':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-rose-900/20 from-white/50 via-white/50 to-rose-100/20';
      case 'pet':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-amber-900/20 from-white/50 via-white/50 to-amber-100/20';
      case 'life':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-indigo-900/20 from-white/50 via-white/50 to-indigo-100/20';
      case 'business':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-purple-900/20 from-white/50 via-white/50 to-purple-100/20';
      case 'home':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-emerald-900/20 from-white/50 via-white/50 to-emerald-100/20';
      case 'car':
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-cyan-900/20 from-white/50 via-white/50 to-cyan-100/20';
      default:
        return 'dark:from-slate-800/50 dark:via-slate-800/50 dark:to-slate-800/50 from-white/50 via-white/50 to-slate-100/20';
    }
  };

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const userId = id || localStorage.getItem("user_id");
        if (!userId) {
          setError('User ID not found');
          setLoading(false);
          return;
        }
        const response = await axios.get(`${baseURL}/api/user/policies/${userId}`);
        setPolicies(response.data.policies || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching policies:", err);
        setError('Failed to fetch policies');
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [id]);

  const filteredPolicies = policies.filter(policy => {
    if (activeTab === 'all') return true;
    return policy.policy_status.toLowerCase() === activeTab;
  });

  if (loading) {
    return <Loader text="Loading policies..." />;
  }

  if (error) {
    return <ErrorBox error={error} showRetry={false} />;
  }

  if (!policies.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <p className="text-xl font-semibold text-white mb-2">No policy data available</p>
          <p className="text-slate-400">Contact support to set up your insurance policy.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-6">
      <div className="max-w-[1400px] mx-auto space-y-8 px-6">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-white/80 via-slate-50/80 to-gray-50/80 dark:from-[#2d1d4d]/90 dark:via-[#3d2869]/90 dark:to-[#4c3385]/90 border border-gray-200/50 dark:border-slate-700/50 p-8 rounded-3xl backdrop-blur-xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/80 to-purple-500/80 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-indigo-500 to-purple-500 p-3 rounded-2xl">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                  Your Insurance Policies
                </h2>
                <p className="text-gray-600 dark:text-slate-400 mt-1">Manage and view your policy details</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 bg-white/60 dark:bg-slate-800/30 p-2 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 backdrop-blur-sm">
          {['all', 'active', 'pending', 'expired'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 capitalize ${
                activeTab === tab
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-slate-700/50'
              }`}
            >
              {tab}
              <span className="ml-2 text-xs opacity-70">
                {tab === 'all' ? policies.length : policies.filter(p => p.policy_status.toLowerCase() === tab).length}
              </span>
            </button>
          ))}
        </div>

        {/* Policy Cards */}
        <div className="grid grid-cols-1 gap-8">
          {filteredPolicies.map((policy, index) => (
            <div 
              key={index}
              onMouseEnter={() => setHoveredCard(index)}
              onMouseLeave={() => setHoveredCard(null)}
              className={`relative group bg-gradient-to-br ${getPolicyGradient(policy.policy_type)} border border-gray-200/50 dark:border-slate-700/50 rounded-3xl overflow-hidden backdrop-blur-2xl backdrop-saturate-150 bg-opacity-50 shadow-lg transform transition-transform duration-300 ease-out ${
                hoveredCard === index ? 'scale-[1.01]' : 'scale-100'
              }`}
            >
              <div className="absolute inset-0 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl"></div>
              <div className="relative p-8">
                {/* Policy Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur-lg dark:hidden"></div>
                      <div className="relative bg-white/80 dark:bg-slate-800/80 p-4 rounded-2xl border border-gray-200/50 dark:border-slate-700/50">
                        {getPolicyIcon(policy.policy_type)}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white capitalize">{policy.policy_type} Insurance</h3>
                      <p className="text-gray-600 dark:text-slate-400">Policy ID: {policy.policy_id}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(policy.policy_status)}`}>
                      {getStatusIcon(policy.policy_status)}
                      <span className="font-medium capitalize">{policy.policy_status}</span>
                    </div>
                  </div>
                </div>

                {/* Policy Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Premium Amount */}
                  <div className="group/item bg-white/80 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-green-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">Premium Amount</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">${policy.premium_amount}</div>
                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-sm">
                      <TrendingUp className="h-3 w-3" />
                      <span>Annual</span>
                    </div>
                  </div>

                  {/* Coverage Amount */}
                  <div className="group/item bg-white/80 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-blue-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">Coverage Amount</span>
                    </div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white mb-1">₹{policy.coverage_amount}</div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 text-sm">
                      <Shield className="h-3 w-3" />
                      <span>Protected</span>
                    </div>
                  </div>

                  {/* Issue Date */}
                  <div className="group/item bg-white/80 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-purple-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">Issue Date</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white mb-1">{policy.issue_date}</div>
                    <div className="text-purple-600 dark:text-purple-400 text-sm">Start Date</div>
                  </div>

                  {/* Expiry Date */}
                  <div className="group/item bg-white/80 dark:bg-slate-800/30 hover:bg-white dark:hover:bg-slate-800/50 p-6 rounded-2xl border border-gray-200/50 dark:border-slate-700/50 transition-all duration-300 hover:border-orange-500/30">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <span className="text-gray-600 dark:text-slate-400 text-sm font-medium">Expiry Date</span>
                    </div>
                    <div className="text-lg font-bold text-gray-800 dark:text-white mb-1">{policy.expiry_date}</div>
                    <div className="text-orange-600 dark:text-orange-400 text-sm">Valid Until</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedPolicy(expandedPolicy === index ? null : index)}
                    className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 rounded-xl text-gray-800 dark:text-white font-medium transition-all duration-300 hover:scale-105"
                  >
                    <Eye className="h-4 w-4" />
                    {expandedPolicy === index ? (
                      <>
                        <span>Hide Details</span>
                        <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        <span>View Details</span>
                        <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>

                {/* Expanded Content */}
                {expandedPolicy === index && policy.markdown_format && (
                  <div className="mt-8 pt-8 border-t border-gray-200/50 dark:border-slate-700/50 animate-fadeIn">
                    <div className="bg-white/80 dark:bg-slate-800/20 rounded-2xl p-6 border border-gray-200/50 dark:border-slate-700/30">
                      <div className="prose dark:prose-invert max-w-none">
                        <MarkdownRenderer content={policy.markdown_format} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Policy;