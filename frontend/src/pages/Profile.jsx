import { useEffect, useState, useContext } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { User, MessageSquare, Bell, Settings, Activity, ChevronRight } from "lucide-react";
import { Context } from "../context/ContextApi";
import axios from "axios";
import "./Profile.css";

const Profile = () => {
  const { id } = useParams();
  const { theme, toggleTheme } = useOutletContext();
  const [userData, setUserData] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsAlerts: false,
    chatHistory: true
  });

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userId = localStorage.getItem("user_id");
        const username = localStorage.getItem("username");
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }

        if (userId === id) {
          setUserData({
            id: userId,
            name: username,
            join_date: new Date().toISOString()
          });

          const historyResponse = await axios.get(`http://localhost:8001/api/chat/history/${userId}`);
          setChatHistory(historyResponse.data.history || []);
        } else {
          setError("User not found");
        }
      } catch (err) {
        setError(err.message);
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  const handleSettingToggle = (settingKey) => {
    const newSettings = {
      ...settings,
      [settingKey]: !settings[settingKey]
    };
    setSettings(newSettings);
    localStorage.setItem("userSettings", JSON.stringify(newSettings));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="shimmer w-32 h-32 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {error || "User not found"}
            </h2>
          </div>
        </div>
      </div>
    );
  }

  const stats = {
    totalChats: chatHistory.length,
    resolvedChats: chatHistory.filter(chat => chat.resolved).length,
    pendingChats: chatHistory.filter(chat => !chat.resolved).length,
    l2Transfers: chatHistory.filter(chat => chat.output?.includes('L2')).length
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pt-20 px-4 pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Info Card */}
          <div className="profile-card bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/50 rounded-xl p-6 border shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="icon-container h-20 w-20 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <User className="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-hover" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {userData.name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Member since {new Date(userData.join_date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: MessageSquare, label: 'Total Chats', value: stats.totalChats, color: 'blue' },
              { icon: Activity, label: 'Resolved Chats', value: stats.resolvedChats, color: 'green' },
              { icon: Bell, label: 'Pending Chats', value: stats.pendingChats, color: 'yellow' },
              { icon: Activity, label: 'L2 Transfers', value: stats.l2Transfers, color: 'purple' }
            ].map((stat, index) => (
              <div key={index} className="stat-card bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/50 rounded-xl p-4 border shadow-lg backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`icon-container p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-500/20`}>
                    <stat.icon className={`h-5 w-5 text-${stat.color}-600 dark:text-${stat.color}-400 animate-hover`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </p>
                    <p className="text-xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat History Section */}
          <div className="lg:col-span-2 bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/50 rounded-xl p-6 border shadow-lg backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Recent Conversations
              </h2>
            </div>
            <div className="space-y-4">
              {chatHistory.slice(-5).map((chat, index) => (
                <div key={index} className="chat-item bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/50 rounded-xl p-4 border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="icon-container p-2 rounded-lg bg-indigo-100 dark:bg-indigo-500/20">
                        <MessageSquare className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-hover" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {chat.input.substring(0, 50)}...
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {chat.output?.includes('L2') ? 'Transferred to L2' : 'L1 Support'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-600 animate-hover" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Settings & Preferences */}
          <div className="bg-white/80 dark:bg-gray-800/80 border-gray-200 dark:border-gray-700/50 rounded-xl p-6 border shadow-lg backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="icon-container p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                <Settings className="h-6 w-6 text-gray-600 dark:text-gray-400 animate-hover" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Quick Settings
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'theme', label: 'Dark Theme', value: theme === 'dark', onChange: toggleTheme },
                { key: 'emailNotifications', label: 'Email Notifications', value: settings.emailNotifications, onChange: () => handleSettingToggle('emailNotifications') },
                { key: 'smsAlerts', label: 'SMS Alerts', value: settings.smsAlerts, onChange: () => handleSettingToggle('smsAlerts') },
                { key: 'chatHistory', label: 'Chat History', value: settings.chatHistory, onChange: () => handleSettingToggle('chatHistory') }
              ].map((setting) => (
                <div 
                  key={setting.key}
                  onClick={setting.onChange}
                  className="settings-toggle flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700/50 rounded-lg border cursor-pointer hover:bg-opacity-80 transition-all duration-300"
                >
                  <span className="text-gray-700 dark:text-gray-300">
                    {setting.label}
                  </span>
                  <div className={`toggle-switch w-11 h-6 ${setting.value
                    ? 'bg-indigo-500 dark:bg-indigo-500/50' 
                    : 'bg-gray-300 dark:bg-gray-700'} rounded-full p-1`}
                  >
                    <div className={`toggle-handle w-4 h-4 rounded-full transform transition-transform ${
                      setting.value
                        ? 'translate-x-5 bg-white' 
                        : 'translate-x-0 bg-gray-400'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 