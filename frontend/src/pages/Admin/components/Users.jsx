import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Users = () => {
  const [usersData, setUsersData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8000/api/v1/users/getAllUsersData`,
          { withCredentials: true }
        );
        setUsersData(response.data.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Users
        </h2>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          onClick={() => navigate("/register")}
        >
          Add User
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700">
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Username</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Email</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Account Creation Date</th>
              <th className="text-gray-700 dark:text-gray-300 text-left py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800">
            {usersData.map((user) => (
              <tr key={user.username} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  {user.username}
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  {user.email}
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  {user.createdAt ? user.createdAt.split("T")[0] : "N/A"}
                </td>
                <td className="text-gray-900 dark:text-gray-100 py-3 px-4">
                  <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                    Delete
                  </button>
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