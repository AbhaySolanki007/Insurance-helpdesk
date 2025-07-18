import { ChevronDown, MessageSquare, FileText, Globe } from "lucide-react";
import { useEffect } from "react";

function Sidebar({
  isSidebarOpen,
  setIsSidebarOpen,
  startNewChat,
  handleChatClick,
  handlePolicyClick,
  handleChatHistoryClick,
  showChat,
  showChatHistory,
  isL2Panel,
  setIsL2Panel,
  toggle,
  setToggle,
  languages,
  selectedLanguage,
  isLanguageDropdownOpen,
  setIsLanguageDropdownOpen,
  getCurrentLanguage,
  handleLanguageSelect,
  isViewingHistoryDetail
}) {
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.language-dropdown')) {
        setIsLanguageDropdownOpen(false);
      }
    };

    if (isLanguageDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isLanguageDropdownOpen, setIsLanguageDropdownOpen]);

  return (
    <div
      className={`fixed left-0 bg-[#f4f7fc] dark:bg-[#181818] transition-all duration-300 ${
        isSidebarOpen ? 'w-72' : 'w-20'
      } flex flex-col`}
      style={{ 
        top: '64px',
        height: 'calc(100vh - 64px)'
      }}
    >
      {/* Main Sidebar Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Sidebar Toggle Button */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-l-lg bg-gray-100 dark:bg-gray-500/20 shadow-sm hover:shadow-md z-50"
          >
            <ChevronDown
              className={`h-4 w-4 text-gray-600 dark:text-gray-400 transform transition-transform duration-200 ${
                isSidebarOpen ? 'rotate-90' : '-rotate-90'
              }`}
            />
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={startNewChat}
            className={`w-full flex items-center justify-center gap-2 bg-gray-200 border border-2 border-blue-500 hover:bg-gray-300 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white py-3 px-4 rounded-xl transition-colors ${
              !isSidebarOpen ? 'px-2' : ''
            }`}
            title="New Chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 4V20M20 12H4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {isSidebarOpen && <span>New Chat</span>}
          </button>
        </div>

        {/* View Toggle Buttons */}
        <div className="px-4 space-y-6">
          <button
            onClick={handleChatClick}
            className={`w-full flex items-center ${
              isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
            } ${
              showChat && !showChatHistory && !isViewingHistoryDetail
                ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
            } transition-colors p-3 rounded-full`}
            title="Chat"
          >
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-6">
                  <MessageSquare size={20} />
                  <span className="font-medium">Chat</span>
                </div>
              </>
            ) : (
              <MessageSquare size={20} />
            )}
          </button>

          <button
            onClick={handlePolicyClick}
            className={`w-full flex items-center ${
              isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
            } ${
              !showChat && !showChatHistory
                ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
            } transition-colors p-3 rounded-full`}
            title="Policy"
          >
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-6">
                  <FileText size={20} />
                  <span className="font-medium">Policy</span>
                </div>
              </>
            ) : (
              <FileText size={20} />
            )}
          </button>

          <button
            onClick={handleChatHistoryClick}
            className={`w-full flex items-center ${
              isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
            } ${
              showChatHistory || isViewingHistoryDetail
                ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                : 'text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white'
            } transition-colors p-3 rounded-full`}
            title="Chat History"
          >
            {isSidebarOpen ? (
              <>
                <div className="flex items-center gap-6">
                  <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24h110.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24v104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/>
                  </svg>
                  <span className="font-medium">Chat History</span>
                </div>
              </>
            ) : (
              <svg width="20" height="20" viewBox="0 0 512 512" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24h110.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24v104c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 space-y-4 border-t border-gray-200 dark:border-white/10">
        {/* Language Selection */}
        {isSidebarOpen ? (
          <div className="relative language-dropdown">
            <button
              onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
              className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{getCurrentLanguage().flag}</span>
                <span>{getCurrentLanguage().name}</span>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isLanguageDropdownOpen && (
              <div className="absolute bottom-full left-0 w-full mb-1 bg-white dark:bg-[#181818] border border-gray-200 dark:border-white/10 rounded-lg overflow-hidden">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleLanguageSelect(lang.code)}
                    className={`w-full flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-white ${
                      selectedLanguage === lang.code ? 'bg-gray-100 dark:bg-white/10' : ''
                    }`}
                  >
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                    {selectedLanguage === lang.code && (
                      <span className="ml-auto text-indigo-600 dark:text-indigo-400">✓</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
            className="w-full p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-white"
            title={`Current: ${getCurrentLanguage().name}`}
          >
            <Globe className="h-4 w-4 mx-auto" />
          </button>
        )}

        {/* L1/L2 Panel Switch */}
        {isSidebarOpen ? (
          <div className="flex items-center justify-between px-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">Panel Selection</span>
            <div className="flex items-center gap-2">
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  isL2Panel
                    ? "bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20"
                    : "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                }`}
              >
                {isL2Panel ? "L2" : "L1"}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              setIsL2Panel(!isL2Panel);
              setToggle(!toggle);
            }}
            className={`w-full p-2 rounded-lg ${
              isL2Panel
                ? "bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            }`}
            title={isL2Panel ? "Switch to L1" : "Switch to L2"}
          >
            <div className="flex items-center justify-center">
              {isL2Panel ? "L2" : "L1"}
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

export default Sidebar; 