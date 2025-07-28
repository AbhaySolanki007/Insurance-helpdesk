import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Context } from "../context/ContextApi";
import {
  UserRoundCog,
  Menu,
  X,
  Settings,
  LogOut,
  User,
  Sun,
  Moon,
  Shield,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";

const Navbar = ({ isSidebarOpen, currentTheme, toggleTheme }) => {
  const { onChat } = useContext(Context);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const userId = localStorage.getItem("user_id");
  const userEmail = localStorage.getItem("user_email");
  
  // Check if user is owner (you can change this email to your desired owner email)
  const isOwner = userEmail === "v.vashisht@gmail.com"; // Change this to your desired owner email
  
  // Check if we're in the chats section or on home page
  const isChatsSection = location.pathname.includes('/chats');
  const isHomePage = location.pathname === '/';

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

  // Handle click outside to close user menu
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
        const userMenu = document.getElementById('user-menu');
        if (userMenu) {
          userMenu.classList.add('hidden');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []); 

  // Function to close user menu
  const closeUserMenu = () => {
    setUserMenuOpen(false);
  };

  const logoutUser = async () => {
    try {
      // Close menu first
      closeUserMenu();
      
      // First clear local storage and state
      localStorage.clear();
      
      // Then attempt server logout
      const response = await axios.post(
        "http://localhost:8001/api/logout/",
        {},
        {
          headers: {
            "Content-Type": "application/json"
          },
          withCredentials: true
        }
      );
      
      toast.success("Logged out successfully!");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Already cleared localStorage above, just redirect
      navigate("/login");
    }
  };

  // Force dark theme classes if on home page
  const navClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
    isHomePage ? 'bg-[#181818]' : 'bg-[#f4f7fc] dark:bg-[#181818]'
  } h-16`;

  return (
    <nav className={navClasses}>
      <div className="h-full flex items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center">
            <img
              className="h-8 w-auto transition-all duration-300"
              src={isChatsSection ? (isSidebarOpen ? "/cywardenLogoWhite.png" : "/Globe.png") : (isHomePage || currentTheme === 'dark') ? "/cywardenLogoWhite.png" : "/cywarden-logo.png"}
              alt="cywarden"
            />
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle Button - Hidden on Home Page */}
          {!isHomePage && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors duration-200"
              title={`Switch to ${currentTheme === 'light' ? 'dark' : 'light'} mode`}
            >
              {currentTheme === 'light' ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>
          )}

          {/* User Menu - Desktop */}
          {userId && (
            <div className="hidden md:block" ref={userMenuRef}>
              <div className="relative inline-block text-left">
                <button
                  className={`inline-flex items-center justify-center p-2 rounded-full ${
                    isHomePage ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    const userMenu = document.getElementById('user-menu');
                    if (userMenu) {
                      userMenu.classList.toggle('hidden');
                    }
                  }}
                >
                  <UserRoundCog className="w-5 h-5" />
                </button>
                
                <div
                  id="user-menu"
                  className={`${userMenuOpen ? '' : 'hidden'} absolute right-0 mt-2 w-48 rounded-lg ${
                    isHomePage ? 'bg-slate-800' : 'bg-white dark:bg-slate-800'
                  } shadow-lg ring-1 ring-black ring-opacity-5 divide-y ${
                    isHomePage ? 'divide-slate-700' : 'divide-slate-200 dark:divide-slate-700'
                  }`}
                >
                  <div className="py-1">
                    <Link
                      to={`/profile/${userId}`}
                      onClick={closeUserMenu}
                      className={`flex items-center px-4 py-2 text-sm ${
                        isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <User className="mr-3 h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      to={`/chat/${userId}`}
                      onClick={closeUserMenu}
                      className={`flex items-center px-4 py-2 text-sm ${
                        isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      <Settings className="mr-3 h-4 w-4" />
                      Chat
                    </Link>
                    {isOwner && (
                      <Link
                        to="/admin"
                        onClick={closeUserMenu}
                        className={`flex items-center px-4 py-2 text-sm ${
                          isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <Shield className="mr-3 h-4 w-4" />
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={logoutUser}
                      className={`w-full flex items-center px-4 py-2 text-sm ${
                        isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
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
            className={`md:hidden inline-flex items-center justify-center p-2 rounded-md ${
              isHomePage ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
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
          <div className={`px-4 pt-2 pb-3 space-y-1 ${
            isHomePage ? 'bg-slate-800 border-slate-700' : 'bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700'
          }`}>
            {/* Theme Toggle in Mobile Menu - Hidden on Home Page */}
            {!isHomePage && (
              <button
                onClick={toggleTheme}
                className="w-full flex items-center px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {currentTheme === 'light' ? (
                  <>
                    <Moon className="h-4 w-4 mr-3" />
                    Dark Mode
                  </>
                ) : (
                  <>
                    <Sun className="h-4 w-4 mr-3" />
                    Light Mode
                  </>
                )}
              </button>
            )}

            <Link
              to={`/profile/${userId}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg ${
                isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <User className="h-4 w-4 mr-3" />
              Your Profile
            </Link>
            <Link
              to={`/chat/${userId}`}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg ${
                isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Settings className="h-4 w-4 mr-3" />
              Chat
            </Link>
            {isOwner && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-lg ${
                  isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Shield className="h-4 w-4 mr-3" />
                Admin Panel
              </Link>
            )}
            <button
              onClick={logoutUser}
              className={`w-full flex items-center px-3 py-2 rounded-lg ${
                isHomePage ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
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
