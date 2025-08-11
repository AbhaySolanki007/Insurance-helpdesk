import { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Context } from "../../../context/ContextApi";
import Sidebar from "./Sidebar";
import MyRequests from "./MyRequests";
import Policy from "./Policy";

function ChatLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isViewingHistoryDetail, setIsViewingHistoryDetail] = useState(false);
  const [chatSession, setChatSession] = useState(0);
  const { toggle, setToggle, theme } = useContext(Context);
  const [isL2Panel, setIsL2Panel] = useState(false);
  
  // Language selection state and options
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "pt-BR", name: "Portuguese", flag: "🇵🇹-🇧🇷" },
  ];

  const navigate = useNavigate();
  const location = useLocation();

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsLanguageDropdownOpen(false);
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === selectedLanguage) || languages[0];
  };

  // Handle view changes
  const startNewChat = () => {
    setShowChat(true);
    setShowChatHistory(false);
    setShowMyRequests(false);
    setShowPolicy(false);
    setSelectedChat(null);
    setIsViewingHistoryDetail(false);
    setChatSession(s => s + 1);
    navigate(`/chat`, { replace: true });
  };

  const handlePolicyClick = () => {
    setShowPolicy(true);
    setShowChat(false);
    setShowChatHistory(false);
    setShowMyRequests(false);
    setIsViewingHistoryDetail(false);
    navigate(`/chat/policy`, { replace: true });
  };

  const handleChatClick = () => {
    setShowChat(true);
    setShowChatHistory(false);
    setShowMyRequests(false);
    setShowPolicy(false);
    setSelectedChat(null);
    setIsViewingHistoryDetail(false);
    navigate(`/chat`, { replace: true });
  };

  const handleChatHistoryClick = () => {
    setShowChatHistory(true);
    setShowChat(false);
    setShowMyRequests(false);
    setShowPolicy(false);
    setIsViewingHistoryDetail(false);
    navigate(`/chat/history`, { replace: true });
  };

  const handleMyRequestsClick = () => {
    setShowMyRequests(true);
    setShowChat(false);
    setShowChatHistory(false);
    setShowPolicy(false);
    setIsViewingHistoryDetail(false);
    navigate(`/chat/requests`, { replace: true });
  };

  const handleSelectChat = (chat) => {
    setSelectedChat(chat);
    setShowChat(true);
    setShowChatHistory(false);
    setShowMyRequests(false);
    setShowPolicy(false);
    setIsViewingHistoryDetail(true);
    navigate(`/chat`, { replace: true });
  };

  // Effect to sync URL with view state
  useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (!userId) return;

    if (location.pathname.endsWith('/policy')) {
      setShowPolicy(true);
      setShowChat(false);
      setShowChatHistory(false);
      setShowMyRequests(false);
      setIsViewingHistoryDetail(false);
    } else if (location.pathname.endsWith('/history')) {
      setShowPolicy(false);
      setShowChatHistory(true);
      setShowChat(false);
      setShowMyRequests(false);
      setIsViewingHistoryDetail(false);
      setSelectedChat(null);
    } else if (location.pathname.endsWith('/requests')) {
      setShowPolicy(false);
      setShowMyRequests(true);
      setShowChat(false);
      setShowChatHistory(false);
      setIsViewingHistoryDetail(false);
    } else if (location.pathname === `/chat`) {
      setShowPolicy(false);
      setShowChat(true);
      setShowChatHistory(false);
      setShowMyRequests(false);
      setIsViewingHistoryDetail(false);
    }
  }, [location.pathname]);

  return (
    <div className="flex h-[calc(100vh-64px)] bg-[#f8f7ff] dark:bg-[#1e1e1e]">
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        startNewChat={startNewChat}
        handleChatClick={handleChatClick}
        handlePolicyClick={handlePolicyClick}
        handleChatHistoryClick={handleChatHistoryClick}
        handleMyRequestsClick={handleMyRequestsClick}
        showChat={showChat}
        showChatHistory={showChatHistory}
        showMyRequests={showMyRequests}
        showPolicy={showPolicy}
        isL2Panel={isL2Panel}
        setIsL2Panel={setIsL2Panel}
        toggle={toggle}
        setToggle={setToggle}
        languages={languages}
        selectedLanguage={selectedLanguage}
        isLanguageDropdownOpen={isLanguageDropdownOpen}
        setIsLanguageDropdownOpen={setIsLanguageDropdownOpen}
        getCurrentLanguage={getCurrentLanguage}
        handleLanguageSelect={handleLanguageSelect}
        isViewingHistoryDetail={isViewingHistoryDetail}
      />

      {/* Main Content Area */}
      <div 
        className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-20'} relative h-[calc(100vh-64px)]`}
      >
        {showMyRequests ? (
          <MyRequests />
        ) : showPolicy ? (
          <Policy />
        ) : (
          <Outlet context={{ 
            selectedLanguage,
            isL2Panel,
            setIsL2Panel,
            showChat,
            showChatHistory,
            theme,
            isSidebarOpen,
            selectedChat,
            handleSelectChat,
            chatSession,
          }} />
        )}
      </div>
    </div>
  );
}

export default ChatLayout; 