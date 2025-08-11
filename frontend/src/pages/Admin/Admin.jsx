import { useState } from "react";
import {
  Menu,
  X,
  Ticket,
  Users,
  BarChart2,
  CheckCircle,
} from "lucide-react";
import UsersComponent from "./components/Users";
import TicketsComponent from "./components/Tickets";
import AnalyticsComponent from "./components/Analytics/Analytics";
import ApprovalsComponent from "./components/Approvals";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-full sm:w-64" : "w-20"
          } bg-[#f4f7fc] dark:bg-[#181818] text-gray-900 dark:text-white transition-all duration-300 ease-in-out`}
      >
        <div className="flex items-center p-4 ml-2 border-b border-gray-200 dark:border-gray-600">
          <button
            onClick={toggleSidebar}
            className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
          >
            {!sidebarOpen && <Menu size={20} />}
          </button>
          <div className="flex flex-row justify-between items-center">
            <h2 className={`text-xl font-bold mr-30 text-gray-900 dark:text-white transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 w-0 -translate-x-2'}`}>
              Admin
            </h2>
            <button
              onClick={toggleSidebar}
              className="flex-shrink-0 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
            >
              {sidebarOpen && <X size={20} />}
            </button>
          </div>
        </div>

        <div className="py-4">
          <button
            onClick={() => {
              setActiveTab("tickets");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full ${sidebarOpen ? 'px-4' : 'px-2'} py-3 ${activeTab === "tickets" ? "bg-blue-600 dark:bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"}`}
          >
            <Ticket size={23} className="flex-shrink-0 ml-4" />
            <span className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
              Tickets
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("users");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full ${sidebarOpen ? 'px-4' : 'px-2'} py-3 ${activeTab === "users" ? "bg-blue-600 dark:bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
          >
            <Users size={23} className="flex-shrink-0 ml-4" />
            <span className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
              Users
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("analytics");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full ${sidebarOpen ? 'px-4' : 'px-2'} py-3 ${activeTab === "analytics" ? "bg-blue-600 dark:bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
          >
            <BarChart2 size={23} className="flex-shrink-0 ml-4" />
            <span className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
              }`}>
              Analytics
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab("approvals");
              setSidebarOpen(false);
              return;
            }}
            className={`flex items-center w-full ${sidebarOpen ? 'px-4' : 'px-2'} py-3 ${activeTab === "approvals" ? "bg-blue-600 dark:bg-blue-600 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              }`}
          >
            <CheckCircle size={23} className="flex-shrink-0 ml-4" />
            <span className={`ml-3 transition-all duration-300 ease-in-out whitespace-nowrap ${sidebarOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'}`}>
              Approvals
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-white dark:bg-[#1e1e1e]">
          {activeTab === "tickets" && <TicketsComponent />}
          {activeTab === "users" && <UsersComponent />}
          {activeTab === "analytics" && <AnalyticsComponent />}
          {activeTab === "approvals" && <ApprovalsComponent />}
        </main>
      </div>
    </div>
  );
}
