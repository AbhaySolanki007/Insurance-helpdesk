import { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';

function ChatHistory() {
  const [chatHistory, setChatHistory] = useState([]);
  const { showChatHistory } = useOutletContext();
  const baseURL = "http://localhost:8001";

  // Function to fetch chat history
  const fetchChatHistory = async () => {
    try {
      const userId = localStorage.getItem("user_id");
      console.log("🔍 Fetching chat history for user_id:", userId);
      
      if (!userId) {
        console.error("❌ No user_id found in localStorage");
        return;
      }

      const historyResponse = await axios.get(`${baseURL}/api/chat/history/${userId}`);
      console.log("📊 Chat history response:", historyResponse.data);
      setChatHistory(historyResponse.data.history || []);
      
    } catch (error) {
      console.error("❌ Error fetching chat history:", error);
      setChatHistory([]);
    }
  };

  useEffect(() => {
    if (showChatHistory) {
      fetchChatHistory();
    }
  }, [showChatHistory]);

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#1e1e1e]">
      <div className="h-full overflow-y-auto scrollbar-hide py-4 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Chat History</h2>
            <div className="text-sm text-gray-500 dark:text-gray-400">{chatHistory.length} conversations</div>
          </div>
          <div className="grid gap-4">
            {chatHistory.map((chat, index) => {
              // Safely extract the query from the chat object
              const query = typeof chat === 'string' 
                ? chat.split('||')[0] 
                : (chat.query || chat.message || 'Conversation ' + (index + 1));
              
              return (
                <button
                  key={index}
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
                        Click to continue this conversation
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatHistory; 