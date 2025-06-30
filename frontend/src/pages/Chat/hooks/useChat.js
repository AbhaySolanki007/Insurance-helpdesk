import { useState } from 'react';
import axios from 'axios';

const useChat = ({
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
  displayValue
}) => {
  const baseURL = "http://localhost:8001";

  const handleSend = async (e) => {
    e.preventDefault();
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
            language: selectedLanguage
          }
        );
        setManualInput(""); // Clear manual input
        console.log("response of chat:", response);

        const botResponse = response.data.response || "No response generated.";

        // Add empty bot message that will be progressively filled
        setMessages((prev) => [...prev, { text: "", sender: "bot" }]);

        // Keep typing indicator until the progressive typing is complete
        let displayedText = "";
        for (let i = 0; i <= botResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 25)); // 25ms delay between each character
          displayedText = botResponse.substring(0, i);
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              text: displayedText,
              sender: "bot",
            };
            return newMessages;
          });
        }

        // Only turn off typing indicator after progressive typing is complete
        setIsTyping(false);

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
            language: selectedLanguage
          });
          const newResponse = l2Response.data.response || "No response was generated";
          const botResponse2 = "L2 Agent Here!\n\n" + newResponse;

          // Add empty message for L2 response
          setMessages((prev) => [...prev, { text: "", sender: "bot" }]);
          setIsTyping(true);

          // Progressive typing for L2 response
          displayedText = "";
          for (let i = 0; i <= botResponse2.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 25));
            displayedText = botResponse2.substring(0, i);
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[newMessages.length - 1] = {
                text: displayedText,
                sender: "bot",
              };
              return newMessages;
            });
          }
          
          // Finally turn off typing indicator
          setIsTyping(false);
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

  return { handleSend };
};

export default useChat; 