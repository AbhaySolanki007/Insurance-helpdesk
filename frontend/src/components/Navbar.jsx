import { useContext, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Context } from "../context/ContextApi";
import {
  UserRoundCog,
  Menu,
  X,
  Settings,
  LogOut,
  User,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = ({ isSidebarOpen }) => {
  const { onChat } = useContext(Context);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");

  // Check if we're in the chats section
  const isChatsSection = location.pathname.includes('/chats');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); 

  const logoutUser = async () => {
    try {
      // First clear local storage and state
      localStorage.clear();
      
      // Then attempt server logout
      const response = await axios.post(
        "http://localhost:8001/api/v1/users/logout",
        {},
        {
          headers: {
            "Content-Type": "application/json"
          },
          withCredentials: true
        }
      );
      
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Already cleared localStorage above, just redirect
      navigate("/login");
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-[#181818] h-16"
    >
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img
              className="h-8 w-auto transition-all duration-300"
              src={isChatsSection ? (isSidebarOpen ? "/cywardenLogoWhite.png" : "/Globe.png") : "/cywardenLogoWhite.png"}
              alt="cywarden"
            />
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* User Menu - Desktop */}
          {userId && (
            <div className="hidden md:block">
              <div className="relative inline-block text-left">
                <button
                  className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800"
                  onClick={() => document.getElementById('user-menu').classList.toggle('hidden')}
                >
                  <UserRoundCog className="w-5 h-5" />
                </button>
                
                <div
                  id="user-menu"
                  className="hidden absolute right-0 mt-2 w-48 rounded-lg bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-700"
                >
                  <div className="py-1">
                    <Link
                      to={`/profile/${userId}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      to={`/chat/${userId}`}
                      className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Chat
                    </Link>
                    <button
                      onClick={logoutUser}
                      className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700"
                    >
                      <LogOut className="mr-3 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        {userId && (
          <div className="px-4 pt-2 pb-3 space-y-1 bg-gray-900 border-t border-gray-800">
            <Link
              to={`/profile/${userId}`}
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <User className="h-4 w-4 mr-3" />
              Your Profile
            </Link>
            <Link
              to={`/chat/${userId}`}
              className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <Settings className="h-4 w-4 mr-3" />
              Chat
            </Link>
            <button
              onClick={logoutUser}
              className="w-full flex items-center px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
