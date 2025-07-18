import { useState } from 'react';
import axios from 'axios';

const useChat = ({
  setIsTyping,
  setIsThinking,
  setManualInput,
  setFinalTranscript,
  setMessages,
  setIsChatStarted,
  selectedLanguage,
  isL2Panel,
  setIsL2Panel,
  isChatStarted,
  displayValue
}) => {
  const baseURL = "http://localhost:8001";

  const handleSend = async (e) => {
    e.preventDefault();
    setIsThinking(true); // Start thinking phase
    setIsTyping(false); // Ensure typing is off during thinking
    
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

        // Initial API call - thinking phase
        const response = await axios.post(
          // ${baseURL}/predict/${isL2Panel ? "l2" : "l1"},
          `${baseURL}/api/chat`,
          {
            query: displayValue,
            user_id,
            language: selectedLanguage
          }
        );
        console.log("response of query from Backend:", response.data)
        setIsL2Panel(response.data.is_l2)

        setManualInput("");
        const responses = response.data.responses || ["No response generated."];

        // End thinking phase, start typing phase
        setIsThinking(false);
        setIsTyping(true);

        // Handle multiple responses from the array
        for (let responseIndex = 0; responseIndex < responses.length; responseIndex++) {
          const currentResponse = responses[responseIndex];
          
          // Add empty bot message that will be progressively filled
          setMessages((prev) => [...prev, { 
            text: "", 
            sender: "bot", 
            isL2: response.data.is_l2,
            isTransition: responseIndex === 0 // First response is transition
          }]);

          // Progressive typing for current response
          let displayedText = "";
          for (let i = 0; i <= currentResponse.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 25));
            displayedText = currentResponse.substring(0, i);
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                text: displayedText,
                sender: "bot",
                isL2: response.data.is_l2,
                isTransition: responseIndex === 0 // First response is transition
              };
              return newMessages;
            });
          }
        }

        setIsTyping(false);

      } catch (error) {
        console.error("Error fetching response:", error);
        setIsThinking(false);
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { text: "⚠️ Error fetching response!", sender: "bot", isL2: isL2Panel },
        ]);
      }
    }
  };

  return { handleSend };
};

export default useChat;