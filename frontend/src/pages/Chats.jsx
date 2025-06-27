import { useState, useRef, useEffect, useContext } from "react";
import { Send, Mic, StopCircle, Plus, MessageSquare, FileText, ChevronDown, ChevronUp, Menu, Home, Briefcase, Heart, Dog, Activity, Car, Plane, AlertCircle, User, Globe } from "lucide-react";
import axios from "axios";
import { Context } from "../context/ContextApi.jsx";
import MarkdownRenderer from "../components/MarkdownRenderer.jsx";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Policy from './Policy';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [audio, setAudio] = useState({ isRecording: false });
  const { toggle, setToggle, setOnChat } = useContext(Context);
  const [isTyping, setIsTyping] = useState(false);
  const [isL2Panel, setIsL2Panel] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [policyData, setPolicyData] = useState(null);

  // Language selection state and options from Chat1.jsx
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);

  // Language options from Chat1.jsx
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "es", name: "Spanish", flag: "🇪🇸" },
    { code: "pt-BR", name: "Portuguese", flag: "🇵🇹-🇧🇷" },
  ];

  const handleLanguageSelect = (languageCode) => {
    setSelectedLanguage(languageCode);
    setIsLanguageDropdownOpen(false);
  };

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === selectedLanguage) || languages[0];
  };

  // Close dropdown when clicking outside - from Chat1.jsx
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
  }, [isLanguageDropdownOpen]);

  const baseURL = "http://localhost:8001";

  // to handle interim and final transcripts properly
  const [finalTranscript, setFinalTranscript] = useState("");
  const [manualInput, setManualInput] = useState(""); // New state for manual typing

  const displayValue = manualInput || `${finalTranscript}`.trim();
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  // This ref holds the microphone stream
  const streamRef = useRef(null);
  // Deepgram connection ref
  const deepgramSocketRef = useRef(null);

  const navigate = useNavigate();

  // Add new state for sidebar
  const [chatHistory, setChatHistory] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [isPoliciesExpanded, setIsPoliciesExpanded] = useState(true);
  const [selectedChat, setSelectedChat] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    return () => {
      setToggle(false);
    };
  }, []);

  // Fetch policy data when component mounts
  useEffect(() => {
    const fetchPolicyData = async () => {
      try {
        const userId = localStorage.getItem("user_id");
        if (!userId) {
          console.error("❌ No user_id found in localStorage");
          return;
        }
        const response = await axios.get(`${baseURL}/api/user/policies/${userId}`);
        setPolicyData(response.data.policies);
      } catch (error) {
        console.error("Error fetching policy data:", error);
        if (error.response?.status === 404) {
          setPolicyData([]); // Set empty array for no policies
        }
      }
    };
    fetchPolicyData();
  }, []);

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

  const handleSend = async (e) => {
    e.preventDefault();
    if (audio.isRecording) {
      // Stop the audio recording if it's currently active
      handleAudioOnFrontend(); // This will stop the recording
    }
    setIsTyping(true);
    // Clear input immediately when sending
    setManualInput("");
    setFinalTranscript("");

    if (displayValue.trim()) {
      const userMessage = { text: displayValue, sender: "user" };
      setMessages((prev) => [...prev, userMessage]);
      if (!isChatStarted) setIsChatStarted(true);

      try {
        let username = localStorage.getItem("username");
        let user_id = localStorage.getItem("user_id");
        console.log(user_id);
        console.log(username);
        console.log("Selected language:", selectedLanguage);

        const response = await axios.post(
          `${baseURL}/predict/${isL2Panel ? "l2" : "l1"}`,
          {
            query: displayValue,
            user_id,
            language: selectedLanguage // Include language in the request
          }
        );
        setManualInput(""); // Clear manual input
        console.log("response of chat:", response);

        const botResponse = response.data.response || "No response generated.";

        setIsTyping(false);
        console.log(response);

        // Typing effect for first response
        let displayedText = "";
        setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

        for (let i = 0; i <= botResponse.length; i++) {
          setTimeout(() => {
            displayedText = botResponse.substring(0, i);
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                text: displayedText,
                sender: "bot",
              };
              return newMessages;
            });
          }, i * 25);
        }

        if (botResponse.includes("L2")) {
          setToggle(true);
          setIsL2Panel(true);
          // Wait for the first message to finish typing
          await new Promise((resolve) =>
            setTimeout(resolve, botResponse.length * 25 + 100)
          );

          // Get L2 response
          const l2Response = await axios.post(`${baseURL}/predict/l2`, {
            query: displayValue,
            user_id,
            language: selectedLanguage // Include language in L2 request too
          });
          const newResponse =
            l2Response.data.response || "No response was generated";
          const botResponse2 = "L2 Agent Here!\n\n" + newResponse;

          // Add new message for L2 response
          setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

          // Typing effect for second response
          for (let i = 0; i <= botResponse2.length; i++) {
            setTimeout(() => {
              displayedText = botResponse2.substring(0, i);
              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  text: displayedText,
                  sender: "bot",
                };
                return newMessages;
              });
            }, i * 25);
          }
        }
      } catch (error) {
        console.error("Error fetching response:", error);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { text: "⚠️ Error fetching response!", sender: "bot" },
        ]);
      }
    }
  };

  // Handle manual input changes
  const handleInputChange = (e) => {
    // When input is completely cleared (either by backspace or Ctrl+A + backspace)
    if (e.target.value === "") {
      setManualInput("");
      setFinalTranscript("");
      return;
    }

    setManualInput(e.target.value);
    // Clear transcripts when user starts typing
    if (e.target.value && finalTranscript) {
      setFinalTranscript("");
    }
  };

  const handleAudioOnFrontend = async () => {
    if (audio.isRecording) {
      // Stop recording
      mediaRecorderRef.current?.stop();
      streamRef.current?.getTracks().forEach(track => track.stop());
      deepgramSocketRef.current?.close();

      setAudio({ isRecording: false });
      return;
    }

    try {
      setAudio({ isRecording: true });

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize Deepgram connection
      const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY; // Replace with your actual Deepgram API key
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?language=${selectedLanguage}&punctuate=true&interim_results=true`;

      deepgramSocketRef.current = new WebSocket(deepgramUrl, ['token', deepgramApiKey]);

      deepgramSocketRef.current.onopen = () => {
        console.log('Deepgram WebSocket connection opened');

        // Set up MediaRecorder
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
          audioBitsPerSecond: 128000,
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0 && deepgramSocketRef.current?.readyState === WebSocket.OPEN) {
            deepgramSocketRef.current.send(event.data);
          }
        };

        mediaRecorderRef.current.start(250); // Send data every 250ms
      };

      deepgramSocketRef.current.onmessage = (message) => {
        const data = JSON.parse(message.data);
        const transcript = data.channel?.alternatives?.[0]?.transcript;

        if (transcript && data.is_final) {
          setFinalTranscript(prev => `${prev} ${transcript}`.trim());
          setManualInput("");
        }
      };

      deepgramSocketRef.current.onclose = () => {
        console.log('Deepgram WebSocket connection closed');
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setAudio({ isRecording: false });
      };

      deepgramSocketRef.current.onerror = (error) => {
        console.error('Deepgram WebSocket error:', error);
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setAudio({ isRecording: false });
      };

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setAudio({ isRecording: false });
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (audio.isRecording) {
        mediaRecorderRef.current?.stop();
        streamRef.current?.getTracks().forEach(track => track.stop());
        deepgramSocketRef.current?.close();
      }
    };
  }, [audio.isRecording]);

  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 250);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  useEffect(() => {
    setOnChat(true);
    return () => {
      if (deepgramSocketRef.current) {
        deepgramSocketRef.current.close();
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setOnChat(false);
    };
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [manualInput, finalTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add new function for starting a new chat
  const startNewChat = () => {
    setMessages([]);
    setSelectedChat(null);
    setIsChatStarted(false);
  };

  return (
    <>
      <Navbar isSidebarOpen={isSidebarOpen} />
      <div className="flex h-screen bg-[#1e1e1e]">
        {/* Sidebar */}
        <div
          className={`fixed left-0 bg-[#181818] transition-all duration-300 ${
            isSidebarOpen ? 'w-72' : 'w-20'
          } flex flex-col`}
          style={{ 
            top: '64px', // Navbar height
            height: 'calc(100vh - 64px)' // Subtract navbar height from viewport height
          }}
        >
          {/* Main Sidebar Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Sidebar Toggle Button */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-l-lg bg-[#1e1e1e] shadow-sm hover:shadow-md z-50"
              >
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transform transition-transform duration-200 ${
                    isSidebarOpen ? 'rotate-90' : '-rotate-90'
                  }`}
                />
              </button>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={startNewChat}
                className={`w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 px-4 rounded-xl transition-colors ${
                  !isSidebarOpen ? 'px-2' : ''
                }`}
                title="New Chat"
              >
                <Plus size={20} />
                {isSidebarOpen && <span>New Chat</span>}
              </button>
            </div>

            {/* View Toggle Buttons */}
            <div className="px-4 space-y-6">
              <button
                onClick={() => {
                  setShowChat(true);
                  setShowChatHistory(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
                } ${
                  showChat && !showChatHistory
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                onClick={() => {
                  const userId = localStorage.getItem("user_id");
                  navigate(`/chat/${userId}/policy`);
                  setShowChat(false);
                  setShowChatHistory(false);
                }}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
                } ${
                  !showChat && !showChatHistory
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
                onClick={async () => {
                  setShowChatHistory(true);
                  setShowChat(false);
                  await fetchChatHistory();
                }}
                className={`w-full flex items-center ${
                  isSidebarOpen ? 'justify-start pl-6' : 'justify-center'
                } ${
                  showChatHistory
                    ? 'bg-white/10 text-white'
                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
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
          <div className="p-4 space-y-4 border-t border-white/10">
            {/* Language Selection */}
            {isSidebarOpen ? (
              <div className="relative language-dropdown">
                <button
                  onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span>{getCurrentLanguage().flag}</span>
                    <span>{getCurrentLanguage().name}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isLanguageDropdownOpen && (
                  <div className="absolute bottom-full left-0 w-full mb-1 bg-[#181818] border border-white/10 rounded-lg overflow-hidden">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleLanguageSelect(lang.code)}
                        className={`w-full flex items-center gap-2 p-2 hover:bg-white/5 text-white ${
                          selectedLanguage === lang.code ? 'bg-white/10' : ''
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                        {selectedLanguage === lang.code && (
                          <span className="ml-auto text-indigo-400">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="w-full p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white"
                title={`Current: ${getCurrentLanguage().name}`}
              >
                <Globe className="h-4 w-4 mx-auto" />
              </button>
            )}

            {/* L1/L2 Panel Switch */}
            {isSidebarOpen ? (
              <div className="flex items-center justify-between px-2">
                <span className="text-sm text-gray-400">Panel Selection</span>
                <div className="flex items-center gap-2">
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isL2Panel
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {isL2Panel ? "L2" : "L1"}
                  </div>
                  <div className="relative inline-block w-8 align-middle select-none">
                    <input
                      type="checkbox"
                      checked={isL2Panel}
                      onChange={() => {
                        setIsL2Panel(!isL2Panel);
                        setToggle(!toggle);
                      }}
                      className={`absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out
                        ${isL2Panel ? "transform translate-x-full border-rose-500" : "border-emerald-500"}`}
                      style={{
                        top: '2px',
                        left: '2px',
                      }}
                    />
                    <label
                      className={`block h-5 overflow-hidden rounded-full cursor-pointer ${
                        isL2Panel ? "bg-rose-500/20" : "bg-emerald-500/20"
                      }`}
                    ></label>
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
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-emerald-500/20 text-emerald-400"
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

        {/* Main Content Area */}
        <div 
          className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-20'} relative`}
          style={{ marginTop: '64px' }} // Add top margin to account for navbar
        >
          {/* Content Container */}
          <div className="h-full flex flex-col relative">
            {showChat && !showChatHistory && (
              <>
                <div className={`flex-1 ${messages.length === 0 && !isTyping ? 'overflow-hidden' : 'overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20'}`}>
                  <div className="max-w-5xl mx-auto px-4 py-6 h-full">
                    <div className="h-full">
                      {messages.length === 0 && !isTyping && (
                        <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
                          <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#9333EA]/70 to-[#3B82F6]/70 text-transparent bg-clip-text leading-relaxed">
                            Welcome to Cywarden Assistant
                          </h2>
                          <p className="text-[#94A3B8] max-w-md mb-8">
                            Your AI-powered insurance guide. Ask me anything about your policies, claims, or general insurance inquiries.
                          </p>

                          {/* Example Cards Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                            {/* Example Card 1 - Health Insurance */}
                            <div 
                              onClick={() => {
                                setManualInput("What does my health insurance policy cover for preventive care?");
                                textareaRef.current?.focus();
                              }}
                              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer"
                            >
                              <div className="absolute inset-0">
                                <img 
                                  src="https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&q=80" 
                                  alt="Health Insurance" 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#000000]/50 to-[#000000]/20"></div>
                              </div>
                              <div className="relative p-6">
                                <div className="bg-[#9333EA]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                  <FileText className="h-6 w-6 text-[#9333EA]/80" />
                                </div>
                                <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Policy Coverage</h3>
                                <p className="text-[#CBD5E1]">
                                  "What does my health insurance policy cover for preventive care?"
                                </p>
                              </div>
                            </div>

                            {/* Example Card 2 - Car Insurance */}
                            <div 
                              onClick={() => {
                                setManualInput("How do I file a claim for my recent car accident?");
                                textareaRef.current?.focus();
                              }}
                              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer"
                            >
                              <div className="absolute inset-0">
                                <img 
                                  src="https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80" 
                                  alt="Car Insurance" 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#000000]/50 to-[#000000]/20"></div>
                              </div>
                              <div className="relative p-6">
                                <div className="bg-[#3B82F6]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                  <AlertCircle className="h-6 w-6 text-[#3B82F6]/80" />
                                </div>
                                <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Claims Process</h3>
                                <p className="text-[#CBD5E1]">
                                  "How do I file a claim for my recent car accident?"
                                </p>
                              </div>
                            </div>

                            {/* Example Card 3 - Policy Updates */}
                            <div 
                              onClick={() => {
                                setManualInput("What are my current policy renewal dates?");
                                textareaRef.current?.focus();
                              }}
                              className="group relative overflow-hidden rounded-2xl transition-all hover:scale-105 cursor-pointer"
                            >
                              <div className="absolute inset-0">
                                <img 
                                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80" 
                                  alt="Policy Updates" 
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#000000]/90 via-[#000000]/50 to-[#000000]/20"></div>
                              </div>
                              <div className="relative p-6">
                                <div className="bg-[#10B981]/20 backdrop-blur-sm w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                  <User className="h-6 w-6 text-[#10B981]/80" />
                                </div>
                                <h3 className="text-[#F1F5F9] text-xl font-medium mb-3">Policy Updates</h3>
                                <p className="text-[#CBD5E1]">
                                  "What are my current policy renewal dates?"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-start max-w-3xl mt-7 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"}`}>
                            <div className={`flex-shrink-0 ${msg.sender === "user" ? "ml-4" : "mr-4"}`}>
                              {msg.sender === "bot" ? (
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                  <MessageSquare className="h-5 w-5 text-white" />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                  <User className="h-5 w-5 text-white" />
                                </div>
                              )}
                            </div>
                            <div
                              className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                                msg.sender === "user"
                                  ? "bg-purple-600/20 text-white border border-purple-500/20"
                                  : "bg-white/5 text-white border border-white/5"
                              }`}
                            >
                              <MarkdownRenderer content={msg.text} />
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="flex items-start max-w-3xl">
                            <div className="flex-shrink-0 mr-4">
                              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <MessageSquare className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <div className="px-4 py-3 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5">
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                                <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                </div>

                {/* Fixed Input Area */}
                <div className="bg-[#1e1e1e] backdrop-blur-md py-4 px-4">
                  <div className="max-w-5xl mx-auto">
                    <div className="bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-end p-2">
                        <div className="flex-1">
                          <textarea
                            ref={textareaRef}
                            value={displayValue}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={isTyping}
                            placeholder={isTyping ? "Please wait for response..." : "Message..."}
                            className={`w-full bg-transparent text-white placeholder-gray-400 focus:outline-none resize-none px-3 py-2 max-h-32 ${
                              isTyping ? 'cursor-not-allowed opacity-70' : ''
                            }`}
                            rows="1"
                          />
                        </div>
                        <div className="flex items-center gap-2 px-2">
                          <button
                            onClick={handleAudioOnFrontend}
                            disabled={isTyping || audio.isRecording}
                            className={`p-2 rounded-lg transition-all ${
                              audio.isRecording
                                ? "bg-red-500/20 text-red-400"
                                : isTyping
                                ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                                : "text-gray-400 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            {audio.isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                          </button>
                          <button
                            onClick={handleSend}
                            disabled={isTyping || !displayValue.trim()}
                            className={`p-2 rounded-lg transition-all ${
                              isTyping || !displayValue.trim()
                                ? "bg-purple-600/10 cursor-not-allowed opacity-70" 
                                : "bg-purple-600/20 hover:bg-purple-600/30"
                            } text-purple-300`}
                          >
                            {isTyping ? (
                              <div className="flex items-center justify-center w-5 h-5">
                                <div className="w-4 h-4 border-2 border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <Send className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-center mt-3 text-gray-400 text-xs">
                      Powered by AI • Type your message or use voice input • Language: {getCurrentLanguage().name}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Chat History View */}
            {showChatHistory && (
              <div className="flex-1 overflow-y-auto py-6 px-4">
                <div className="max-w-5xl mx-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-white">Chat History</h2>
                    <div className="text-sm text-gray-400">{chatHistory.length} conversations</div>
                  </div>
                  <div className="grid gap-4">
                    {chatHistory.map((chat, index) => {
                      const [query] = chat.split('||');
                      return (
                        <button
                          key={index}
                          onClick={() => {
                            setSelectedChat(index);
                            setShowChat(true);
                            setShowChatHistory(false);
                          }}
                          className="group relative w-full text-left p-6 rounded-xl transition-all duration-200 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20"
                        >
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                              <MessageSquare className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="font-medium text-white truncate pr-4">{query}</h3>
                                <span className="text-sm text-gray-500">Today</span>
                              </div>
                              <p className="text-sm text-gray-400 line-clamp-2">
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
            )}

            {/* Policy View */}
            {!showChat && !showChatHistory && (
              <div className="flex-1 overflow-y-auto">
                <Policy />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Chat;