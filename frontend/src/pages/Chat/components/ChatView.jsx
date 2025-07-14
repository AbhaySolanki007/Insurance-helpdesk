import { useState, useRef, useEffect, useContext } from "react";
import { Send, Mic, StopCircle, MessageSquare, User, ArrowDown } from "lucide-react";
import { Context } from "../../../context/ContextApi";
import MarkdownRenderer from "../../../components/MarkdownRenderer";
import { useOutletContext } from "react-router-dom";
import WelcomeScreen from "./WelcomeScreen";
import useAudioRecording from "../hooks/useAudioRecording";
import useChat from "../hooks/useChat";

function ChatView() {
  const { selectedLanguage, isL2Panel, setIsL2Panel } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const { toggle, setToggle, setOnChat } = useContext(Context);
  const [isTyping, setIsTyping] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const {
    audio,
    handleAudioOnFrontend,
    finalTranscript,
    setFinalTranscript,
    interimTranscript,
    setInterimTranscript,
    mediaRecorderRef,
    streamRef,
    deepgramSocketRef
  } = useAudioRecording(selectedLanguage);

  const displayValue = manualInput || `${finalTranscript}${interimTranscript ?  `${interimTranscript}` : ''}`.trim();

  const { handleSend: originalHandleSend } = useChat({
    setIsTyping,
    setManualInput,
    setFinalTranscript,
    setMessages,
    setIsChatStarted,
    selectedLanguage,
    isL2Panel,
    setToggle,
    setIsL2Panel,
    isChatStarted,
    displayValue,
    setIsThinking
  });

  const handleSend = async (e) => {
    e.preventDefault();
    if (isTyping || isProcessing) return;
    
    const currentInput = displayValue.trim();
    if (!currentInput) return;

    try {
      setIsProcessing(true);
      await originalHandleSend(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.value === "") {
      setManualInput("");
      setFinalTranscript("");
      setInterimTranscript("");
      return;
    }

    setManualInput(e.target.value);
    if (e.target.value && (finalTranscript || interimTranscript)) {
      setFinalTranscript("");
      setInterimTranscript("");
    }
  };

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
      if (!isTyping && !isProcessing) {
        handleSend(e);
      }
    }
  };

  useEffect(() => {
    setOnChat(true);
    return () => {
      if (deepgramSocketRef.current && deepgramSocketRef.current.readyState === WebSocket.OPEN) {
        deepgramSocketRef.current.close();
      }
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setOnChat(false);
    };
  }, []);

  useEffect(() => {
    // console.log('Current display value:', displayValue); // Debug log
    // console.log('Final transcript:', finalTranscript); // Debug log
    // console.log('Interim transcript:', interimTranscript); // Debug log
    autoResizeTextarea();
  }, [displayValue, finalTranscript, interimTranscript]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full flex flex-col">
      <div className={`flex-1 ${messages.length === 0 && !isThinking ? 'overflow-hidden' : 'overflow-y-auto scrollbar-hide'}`}>
        <div className="max-w-5xl mx-auto px-4 py-6">
          {messages.length === 0 && !isThinking && <WelcomeScreen setManualInput={setManualInput} textareaRef={textareaRef} />}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.isTransition ? (
                <div className="w-full my-6 flex flex-col items-center gap-2">
                  <div className="w-full border-t-2 border-dashed border-red-300 dark:border-red-500/30"></div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 rounded-full border border-red-200 dark:border-red-500/20">
                    <ArrowDown className="w-4 h-4 text-red-500 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      Transferring to L2 Support Agent
                    </span>
                  </div>
                </div>
              ) : (
                  <div className={`flex items-start max-w-3xl mt-7 ${msg.sender === "user" ? "flex-row-reverse" : "flex-row"} gap-3`}>
                  {/* Avatar Container */}
                  <div className={`flex-shrink-0 pt-2 ${msg.sender === "user" ? "ml-3" : "mr-3"}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.sender === "user" 
                        ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 ring-2 ring-purple-200 dark:ring-purple-500/30"
                        : msg.isL2
                          ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-2 ring-red-200 dark:ring-red-500/30"
                          : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-500/30"
                    }`}>
                      {msg.sender === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <div className="text-xs font-semibold">
                          {msg.isL2 ? 'L2' : 'L1'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className={`px-4 py-3 rounded-2xl backdrop-blur-sm ${
                      msg.sender === "user"
                        ? "bg-purple-200/20 dark:bg-purple-600/20 text-black dark:text-white border border-purple-200 dark:border-purple-500/20"
                        : "bg-gray-100 dark:bg-white/5 text-black dark:text-white border border-gray-200 dark:border-white/5"
                    }`}
                  >
                    <MarkdownRenderer content={msg.text} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator - only shown during initial processing */}
          {isThinking && !isTyping && (
            <div className="flex justify-start mt-7">
              <div className="flex items-start max-w-3xl gap-3">
                <div className="flex-shrink-0 mr-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isL2Panel
                      ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 ring-2 ring-red-200 dark:ring-red-500/30"
                      : "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-500/30"
                  }`}>
                    <div className="text-xs font-semibold">
                      {isL2Panel ? 'L2' : 'L1'}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/5 backdrop-blur-sm border border-gray-200 dark:border-white/5">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-black/50 dark:bg-white/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-black/50 dark:bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-2 h-2 bg-black/50 dark:bg-white/50 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Area */}
      <div className="bg-white dark:bg-[#1e1e1e] backdrop-blur-md py-4 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
            <div className="flex items-end p-2">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  value={displayValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Message..."
                  className="w-full bg-transparent text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none resize-none px-3 py-2 max-h-32"
                  rows="1"
                />
              </div>
              <div className="flex items-center gap-2 px-2">
                <button
                  onClick={handleAudioOnFrontend}
                  disabled={isTyping}
                  className={`p-2 rounded-lg transition-all ${
                    audio.isRecording
                      ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30"
                      : isTyping
                      ? "bg-gray-200 dark:bg-gray-500/20 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : "text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-white/10 hover:text-gray-700 dark:hover:text-white"
                  }`}
                >
                  {audio.isRecording ? <StopCircle className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
                <button
                  onClick={handleSend}
                  disabled={isTyping || isProcessing || !displayValue.trim()}
                  className={`p-2 rounded-lg transition-all ${
                    isTyping || isProcessing || !displayValue.trim()
                      ? "bg-purple-100 dark:bg-purple-600/10 text-purple-600 dark:text-purple-300 cursor-not-allowed opacity-70"
                      : "bg-purple-100 dark:bg-purple-600/20 hover:bg-purple-200 dark:hover:bg-purple-600/30 text-purple-600 dark:text-purple-300"
                  }`}
                >
                  {isTyping || isProcessing ? (
                    <div className="flex items-center justify-center w-5 h-5">
                      <div className="w-4 h-4 border-2 border-purple-600 dark:border-purple-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="text-center mt-3 text-gray-500 dark:text-gray-400 text-xs">
            {audio.isRecording ? "🎤 Recording in progress..." : "Powered by AI • Type your message or use voice input"}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatView;  