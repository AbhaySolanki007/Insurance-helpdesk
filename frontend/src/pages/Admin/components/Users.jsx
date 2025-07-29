import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Loader from "../../../components/Loader";
import ErrorBox from "../../../components/ErrorBox";

const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axios.get('http://localhost:8001/api/admin/users');
      setUsersData(response.data.users || []);
      console.log('Fetched users:', response.data);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Memoized processed data
  const processedUsersData = useMemo(() => {
    if (!usersData || usersData.length === 0) return [];

    return usersData.map(user => ({
      ...user,
      initials: user.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      displayName: user.name,
      displayEmail: user.email,
      displayPhone: user.phone || 'N/A',
      displayLocation: user.location || 'N/A',
      displayAddress: user.address || 'N/A'
    }));
  }, [usersData]);

  // Generate avatar colors based on user name
  const getAvatarColor = (name) => {
    const colors = [
      'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
      'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600',
      'bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600',
      'bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600',
      'bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-600',
      'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600',
      'bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600',
      'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  if (isLoading) {
    return <Loader text="Loading users data..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchUsers} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Users
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and view all registered users
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Refresh Data
        </button>
      </div>
      
      {/* Modern Glassmorphism Table */}
      <div className="relative">
        {/* Multiple background layers for enhanced glassmorphism */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-purple-600/10 rounded-2xl"></div>
        <div className="absolute inset-0 bg-white/20 dark:bg-gray-900/20 backdrop-blur-md rounded-2xl border border-white/30 dark:border-gray-700/30 shadow-2xl"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent dark:from-gray-800/40 rounded-2xl"></div>
        
        <div className="relative overflow-hidden rounded-2xl border-2 border-white/40 dark:border-gray-700/40 bg-white/25 dark:bg-gray-900/25 backdrop-blur-xl shadow-2xl">
          {/* Table Header */}
          <div className="px-6 py-4 border-b-2 border-white/30 dark:border-gray-700/30 bg-gradient-to-r from-white/40 via-blue-500/10 to-purple-500/10 dark:from-gray-800/40 dark:via-blue-500/5 dark:to-purple-500/5 backdrop-blur-sm">
            <div className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  User
                </h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Phone
                </h3>
              </div>
              <div className="col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Location
                </h3>
              </div>
              <div className="col-span-3">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Address
                </h3>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-white/20 dark:divide-gray-700/20">
            {processedUsersData.map((user, index) => (
              <div 
                key={user.user_id} 
                className="px-6 py-4 hover:bg-gradient-to-r hover:from-white/30 hover:via-blue-500/5 hover:to-purple-500/5 dark:hover:from-gray-800/30 dark:hover:via-blue-500/5 dark:hover:to-purple-500/5 transition-all duration-300 group cursor-pointer"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* User Column */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-xl ${getAvatarColor(user.displayName)} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 group-hover:shadow-2xl`}>
                        <span className="text-white font-semibold text-sm">
                          {user.initials}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors duration-300">
                          {user.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {user.user_id}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Column */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                          <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayEmail}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Email
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Phone Column */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayPhone}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Phone
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location Column */}
                  <div className="col-span-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-rose-400 via-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayLocation}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Location
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Address Column */}
                  <div className="col-span-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-400 via-gray-500 to-slate-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow duration-300">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={user.displayAddress}>
                          {user.displayAddress}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Address
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {processedUsersData.length === 0 && (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 dark:from-slate-600 dark:via-gray-700 dark:to-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No users found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                There are currently no users in the system.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Users; 