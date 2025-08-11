import { useState, useEffect } from 'react';
import { MessageSquare, User, ArrowLeft, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useOutletContext } from 'react-router-dom';
import Loader from '../../../components/Loader';
import ErrorBox from '../../../components/ErrorBox';

function ChatHistory() {
  const [chatHistory, setChatHistory] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showChatHistory } = useOutletContext();
  const baseURL = "http://localhost:8001";

  const fetchChatHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const userId = localStorage.getItem("user_id");
      
      if (!userId) {
        console.error("No user_id found in localStorage");
        setError("User ID not found");
        return;
      }

      const historyResponse = await axios.get(`${baseURL}/api/chat/history/${userId}`);
      console.log("History Response: ", historyResponse);
      
      const rawHistory = historyResponse.data.history || [];
      console.log("Raw History: ", rawHistory);
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

      console.log("Parsed History: ", parsedHistory);
      
      // Group messages into conversations based on timestamp proximity
      const conversations = groupMessagesIntoConversations(parsedHistory);
      setChatHistory(conversations);
      
    } catch (error) {
      console.error("Error fetching chat history:", error);
      setError("Failed to fetch chat history");
      setChatHistory([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to group individual messages into conversations
  const groupMessagesIntoConversations = (messages) => {
    if (!messages || messages.length === 0) return [];
    
    const conversations = [];
    let currentConversation = [];
    let lastTimestamp = null;
    
    messages.forEach((message, index) => {
      const currentTimestamp = message.timestamp ? new Date(message.timestamp).getTime() : Date.now();
      
      // If this is the first message or if there's a significant time gap (> 30 minutes), start a new conversation
      if (lastTimestamp === null || (currentTimestamp - lastTimestamp) > 30 * 60 * 1000) {
        if (currentConversation.length > 0) {
          conversations.push({
            id: conversations.length,
            messages: currentConversation,
            timestamp: currentConversation[0].timestamp,
            firstMessage: currentConversation[0].input || 'Conversation'
          });
        }
        currentConversation = [message];
      } else {
        currentConversation.push(message);
      }
      
      lastTimestamp = currentTimestamp;
    });
    
    // Add the last conversation
    if (currentConversation.length > 0) {
      conversations.push({
        id: conversations.length,
        messages: currentConversation,
        timestamp: currentConversation[0].timestamp,
        firstMessage: currentConversation[0].input || 'Conversation'
      });
    }
    
    return conversations;
  };

  useEffect(() => {
    if (showChatHistory) {
      fetchChatHistory();
    }
  }, [showChatHistory]);
  
  const handleConversationClick = (conversation) => {
    setSelectedChat(conversation);
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  const renderDetailView = () => {
    const messages = selectedChat.messages || [];
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
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">{chatHistory.length} conversations</div>
          <button
            onClick={fetchChatHistory}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>
      
      {chatHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-40">
          <div className="relative mb-6">
            {/* Background circle with gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-full blur-xl opacity-50"></div>
            <div className="relative w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <MessageCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No conversations yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Start chatting with our AI assistant to see your conversation history here.
          </p>
          
          {/* Decorative elements */}
          <div className="flex items-center gap-2 mt-8 text-gray-400 dark:text-gray-500">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {chatHistory.map((conversation, index) => {
            const firstMessage = conversation.firstMessage || `Conversation ${index + 1}`;
            const messageCount = conversation.messages.length;
            return (
              <button
                key={conversation.id || index}
                onClick={() => handleConversationClick(conversation)}
                className="group relative w-full text-left p-6 rounded-xl transition-all duration-200 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-white/5 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white truncate pr-4">{firstMessage}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {conversation.timestamp ? new Date(conversation.timestamp).toLocaleDateString() : 'Today'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {messageCount} message{messageCount !== 1 ? 's' : ''} • Click to view conversation
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 h-full bg-white dark:bg-[#1e1e1e]">
      <div className="h-full overflow-y-auto scrollbar-hide py-4 px-4">
        <div className="max-w-5xl mx-auto">
          {loading ? (
            <Loader text="Loading chat history..." />
          ) : error ? (
            <ErrorBox error={error} onRetry={fetchChatHistory} />
          ) : selectedChat ? (
            renderDetailView()
          ) : (
            renderListView()
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatHistory; 