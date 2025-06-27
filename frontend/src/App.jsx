import Navbar from "./components/Navbar";
import Chats from "./pages/Chats";
import Error from "./components/Error";
import { loginAction } from "./utils/Actions";
import { useEffect, useState } from "react";
import AdminDashboard from "./pages/Admin";
import Policy from "./pages/Policy";
import Profile from "./pages/Profile";
import {
  Hero,
  Login,
} from "./pages";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useParams,
} from "react-router";

// Create a layout component that includes the navbar and an outlet for the page content
const RootLayout = () => {
  return (
    <>
      <Navbar />
    <div className="h-screen flex flex-col scrollbar-hide" data-theme="lemonade">
      <Outlet />
    </div>
    </>
  );
};

const ProtectedRoute = () => {
  const { id } = useParams();
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("user_id");
    const storedUserName = localStorage.getItem("name");
    
    if (storedUserId && storedUserName && storedUserId === id) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [id]);

  if (isAuthenticated === null) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="loading loading-ring loading-lg"></div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};


// Then modify your router configuration
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <Error />,
    children: [
      {
        path: "",
        element: <Hero />,
      },
      {
        path: "login",
        element: <Login />,
        action: loginAction,
      },
      {
        // Protected routes go under this path
        element: <ProtectedRoute />,
        children: [
          {
            path: "chat/:id",
            element: <Chats />,
          },
          {
            path: "chat/:id/policy",
            element: <Chats />,
          },
          {
            path: "policies/:id",
            element: <Policy />,
          },
          {
            path: "profile/:id",
            element: <Profile />,
          },
          // {
          //   path: "admin/:id",
          //   element: <AdminDashboard />,
          // },
          // Add other protected routes here
        ],
      },
    ],
  },
  {
    // Protected routes go under this path
    element: <ProtectedRoute />,
    children: [
      {
        path: "admin/:id",
        element: <AdminDashboard />,
      },
      // Add other protected routes here
    ],
  },
  // {
  //   path: "/admin",
  //   element: <AdminDashboard />,
  // },
]);

const App = () => {
  return <RouterProvider router={router} />;
};

export default App;
