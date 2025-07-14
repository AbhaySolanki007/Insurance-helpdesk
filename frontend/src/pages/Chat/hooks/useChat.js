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
  setToggle,
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
        const botResponse = response.data.response || "No response generated.";

        // End thinking phase, start typing phase
        setIsThinking(false);
        setIsTyping(true);

        // Add empty bot message that will be progressively filled
        // setMessages((prev) => [...prev, { text: "", sender: "bot", isL2: isL2Panel }]);
        setMessages((prev) => [...prev, { text: "", sender: "bot", isL2: response.data.is_l2 }]);

        // Progressive typing
        let displayedText = "";
        for (let i = 0; i <= botResponse.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 25));
          displayedText = botResponse.substring(0, i);
          setMessages((prev) => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              text: displayedText,
              sender: "bot",
              isL2: response.data.is_l2
            };
            return newMessages;
          });
        }

        setIsTyping(false);

        // if (botResponse.includes("L2....")) {
        //   setToggle(true);
        //   setIsL2Panel(true);
          
        //   // Add transition message
        //   setMessages((prev) => [...prev, { 
        //     text: "transition_to_l2",
        //     sender: "system",
        //     isTransition: true 
        //   }]);

        //   // L2 thinking phase
        //   setIsThinking(true);
        //   setIsTyping(false);

        //   // Get L2 response
        //   const l2Response = await axios.post(${baseURL}/predict/l2, {
        //     query: displayValue,
        //     user_id,
        //     language: selectedLanguage
        //   });

        //   const newResponse = l2Response.data.response || "No response was generated";
        //   const botResponse2 = "L2 Agent Here!\n\n" + newResponse;

        //   // End L2 thinking phase, start L2 typing phase
        //   setIsThinking(false);
        //   setIsTyping(true);

        //   // Add empty message for L2 response
        //   setMessages((prev) => [...prev, { text: "", sender: "bot", isL2: true }]);

        //   // Progressive typing for L2 response
        //   displayedText = "";
        //   for (let i = 0; i <= botResponse2.length; i++) {
        //     await new Promise(resolve => setTimeout(resolve, 25));
        //     displayedText = botResponse2.substring(0, i);
        //     setMessages((prev) => {
        //       const newMessages = [...prev];
        //       newMessages[newMessages.length - 1] = {
        //         text: displayedText,
        //         sender: "bot",
        //         isL2: true
        //       };
        //       return newMessages;
        //     });
        //   }
          
        //   setIsTyping(false);
        // }
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