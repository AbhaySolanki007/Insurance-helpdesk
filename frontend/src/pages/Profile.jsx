import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { User, Mail, Calendar } from "lucide-react";

const Profile = () => {
  const { id } = useParams();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    // Get user data from localStorage
    const userId = localStorage.getItem("user_id");
    const username = localStorage.getItem("username");
    const emailData = localStorage.getItem("emailData");
    const parsedEmailData = emailData ? JSON.parse(emailData) : null;

    if (userId === id) {
      setUserData({
        id: userId,
        username: username,
        email: parsedEmailData?.email || "Not available",
        joinDate: new Date().toLocaleDateString() // You might want to store this in localStorage as well
      });
    }
  }, [id]);

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 pt-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 pt-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="p-8 sm:p-10 bg-gray-900">
            <div className="flex items-center gap-6">
              <div className="h-24 w-24 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <User className="h-12 w-12 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{userData.username}</h1>
                <p className="text-gray-400 mt-1">User Profile</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="p-8 sm:p-10 space-y-6">
            <div className="grid gap-6">
              {/* Email */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Mail className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Email</p>
                    <p className="text-white font-medium">{userData.email}</p>
                  </div>
                </div>
              </div>

              {/* User ID */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <User className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">User ID</p>
                    <p className="text-white font-medium">{userData.id}</p>
                  </div>
                </div>
              </div>

              {/* Join Date */}
              <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Calendar className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Joined</p>
                    <p className="text-white font-medium">{userData.joinDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 