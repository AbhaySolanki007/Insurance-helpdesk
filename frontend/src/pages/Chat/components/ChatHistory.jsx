import { useState, useEffect } from 'react';
import { MessageSquare, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';

function ChatHistory() {
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const { showChatHistory } = useOutletContext();
  const baseURL = "http://localhost:8001";

  const fetchChatHistory = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      
      if (!userId) {
        console.error("No user_id found in localStorage");
        return;
      }

      const historyResponse = await axios.get(`${baseURL}/api/chat/history/${userId}`);
      
      const rawHistory = historyResponse.data.history || [];
      const parsedHistory = rawHistory.map(item => {
        if (typeof item === 'string') {
          try {
            return JSON.parse(item);
          } catch (error) {
            console.error('Error parsing chat history item:', error);
            return null;
          }
        }
        return item;
      }).filter(Boolean);

      setChatHistory(parsedHistory);
      
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    if (showChatHistory) {
      fetchChatHistory();
    }
  }, [showChatHistory]);
  
  const handleConversationClick = (chat) => {
    setSelectedChat(chat);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const renderDetailView = () => {
    const messages = Array.isArray(selectedChat) ? selectedChat : [selectedChat];
    return (
      <div>
        <button 
          onClick={handleBackToList}
          className="flex items-center gap-2 mb-6 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to History
        </button>
        <div className="space-y-8">
          {messages.map((message, index) => (
            <div key={index}>
              {/* User Message */}
              <div className="flex justify-end items-start gap-3">
                <div className="px-4 py-3 rounded-2xl bg-purple-200/20 dark:bg-purple-600/20 text-black dark:text-white border border-purple-200 dark:border-purple-500/20 max-w-3xl">
                  {message.input}
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              </div>
              
              {/* Bot Message */}
              <div className="flex justify-start items-start gap-3 mt-4">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0 font-semibold text-xs">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 text-black dark:text-white border border-gray-200 dark:border-white/5 max-w-3xl">
                  {message.output}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderListView = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chat History</h2>
        <div className="text-sm text-gray-500 dark:text-gray-400">{chatHistory.length} conversations</div>
      </div>
      <div className="grid gap-4">
        {chatHistory.map((chat, index) => {
          const query = chat.input || `Conversation ${index + 1}`;
          return (
            <button
              key={index}
              onClick={() => handleConversationClick(chat)}
              className="group relative w-full text-left p-6 rounded-xl transition-all duration-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/5 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-gray-900 dark:text-white truncate pr-4">{query}</h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {chat.timestamp ? new Date(chat.timestamp).toLocaleDateString() : 'Today'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    Click to view conversation
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#1e1e1e]">
      <div className="h-full overflow-y-auto scrollbar-hide py-4 px-4">
        <div className="max-w-5xl mx-auto">
          {selectedChat ? renderDetailView() : renderListView()}
        </div>
      </div>
    </div>
  );
}

export default ChatHistory; 