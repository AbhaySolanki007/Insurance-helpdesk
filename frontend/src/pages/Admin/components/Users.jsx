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

  if (isLoading) {
    return <Loader text="Loading users data..." />;
  }

  if (error) {
    return <ErrorBox error={error} onRetry={fetchUsers} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Users
        </h2>
        <button
          onClick={fetchUsers}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Data
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 dark:border-gray-600" style={{ minWidth: '750px' }}>  
          <thead>
            <tr className="border-b-2 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700">
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '80px' }}>User ID</th>
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '120px' }}>Name</th>
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '150px' }}>Email</th>
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '100px' }}>Phone</th>
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 border-r border-gray-300 dark:border-gray-600" style={{ minWidth: '70px' }}>Location</th>
              <th className="text-left py-4 px-3 text-sm font-medium text-gray-700 dark:text-gray-300" style={{ minWidth: '150px' }}>Address</th>
            </tr>
          </thead>
          <tbody>
            {processedUsersData.map((user) => (
              <tr key={user.user_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td className="py-4 px-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.user_id}</span>
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {user.initials}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.displayName}</span>
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-900 dark:text-gray-100">{user.displayEmail}</span>
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{user.displayPhone}</span>
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap border-r border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-orange-600 dark:text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{user.displayLocation}</span>
                  </div>
                </td>
                <td className="py-4 px-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate" title={user.displayAddress}>{user.displayAddress}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users; 