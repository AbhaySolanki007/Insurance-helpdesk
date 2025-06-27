import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const {id} = useParams(); // Get :id from route to match it to id in sessionStorage
  // const storedUserId = sessionStorage.getItem("userId"); // Get userId from sessionStorage

  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await axios.get("http://localhost:8000/api/v1/users/current-user", {
          withCredentials: true,
        });
        console.log("response auth provider",res)
        // if (res.data.user._id !== id) {
        //   setIsAuthenticated(false); // ✅ Block access if ID doesn't match
        // } else {
        //   setIsAuthenticated(true);
        // }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [id]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
