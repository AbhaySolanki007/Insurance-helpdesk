import { useState, useEffect, useContext } from 'react';
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Context } from './context/ContextApi';
import Login from './pages/Login';
import Chats from './pages/Chats';
import Hero from './pages/Hero';
import Profile from './pages/Profile';
import Video from './pages/Video';
import Admin from './pages/Admin';
import Error from './components/Error';
import bgVideo from './assets/bg-blocks.mp4';
import ChatLayout from './pages/Chat/components/ChatLayout';
import ChatView from './pages/Chat/components/ChatView';
import ChatHistory from './pages/Chat/components/ChatHistory';
import Policy from './pages/Chat/components/Policy';

// Create a layout component that includes the navbar and background
const RootLayout = ({ theme, toggleTheme, themePreference, updateThemePreference }) => {
  return (
    <div className="min-h-screen bg-white dark:bg-[#1e1e1e] text-slate-900 dark:text-white relative scrollbar-hide overflow-x-hidden">
      {/* Background Video */}
      <div className="fixed inset-0 w-full h-full z-0">
        <video
          autoPlay
          loop
          muted
          className="absolute min-w-full min-h-full object-cover opacity-10 dark:opacity-5"
        >
          <source src={bgVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen scrollbar-hide">
        {/* Fixed Navbar */}
        <Navbar
          currentTheme={theme}
          toggleTheme={toggleTheme}
          themePreference={themePreference}
          updateThemePreference={updateThemePreference}
        />

        {/* Main Content - Positioned below navbar */}
        <main className="flex-1 mt-16 scrollbar-hide overflow-y-auto overflow-x-hidden">
          <Outlet context={{ theme, toggleTheme, themePreference, updateThemePreference }} />
        </main>
      </div>
    </div>
  );
};

function App() {
  // Initialize theme and preference from localStorage or default values
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [themePreference, setThemePreference] = useState(() => localStorage.getItem("themePreference") || "auto");
  const { signingOut } = useContext(Context);

  // Custom function to update theme preference
  const updateThemePreference = (newPreference) => {
    setThemePreference(newPreference);
    localStorage.setItem("themePreference", newPreference);
  };

  // Theme management
  useEffect(() => {
    const updateTheme = () => {
      let selectedTheme = theme;

      if (themePreference === "auto") {
        const hour = new Date().getHours();
        const isDay = hour >= 6 && hour < 18;
        selectedTheme = isDay ? "light" : "dark";
      } else {
        selectedTheme = themePreference;
      }

      setTheme(selectedTheme);
      localStorage.setItem("theme", selectedTheme);
      document.documentElement.setAttribute("data-theme", selectedTheme);

      if (selectedTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    updateTheme();

    // Only set interval for auto mode
    let interval;
    if (themePreference === "auto") {
      interval = setInterval(updateTheme, 60000); // Check every minute
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [themePreference, theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemePreference(newTheme);
  };

  // Create the router configuration
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route
        element={
          <RootLayout
            theme={theme}
            toggleTheme={toggleTheme}
            themePreference={themePreference}
            updateThemePreference={updateThemePreference}
          />
        }
        errorElement={<Error />}
      >
        <Route path="/" element={<Hero />} />
        <Route path="login" element={<Login />} />
        <Route path="/chat/:userId" element={<ChatLayout />}>
          <Route index element={<ChatView />} />
          <Route path="history" element={<ChatHistory />} />
          <Route path="policy" element={<Policy />} />
        </Route>
        <Route path="profile/:id" element={<Profile />} />
        <Route path="video" element={<Video />} />
        <Route path="admin" element={<Admin />} />
      </Route>
    )
  );

  return (
    <>
      {signingOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
      )}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
