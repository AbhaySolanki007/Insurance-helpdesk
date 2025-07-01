import { useState, useRef } from 'react';

function useAudioRecording(selectedLanguage) {
  const [audio, setAudio] = useState({ isRecording: false });
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const deepgramSocketRef = useRef(null);

  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (deepgramSocketRef.current && deepgramSocketRef.current.readyState === WebSocket.OPEN) {
        deepgramSocketRef.current.close();
      }
      
      // Clear refs and transcripts
      mediaRecorderRef.current = null;
      streamRef.current = null;
      deepgramSocketRef.current = null;
      setInterimTranscript("");
      
      setAudio({ isRecording: false });
    } catch (error) {
      console.error('Error stopping recording:', error);
      setAudio({ isRecording: false });
    }
  };

  const handleAudioOnFrontend = async () => {
    // If already recording, stop it
    if (audio.isRecording) {
      stopRecording();
      return;
    }

    try {
      // Start new recording
      setAudio({ isRecording: true });
      setInterimTranscript("");
      setFinalTranscript(""); // Clear final transcript when starting new recording

      // Get microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      streamRef.current = stream;

      // Initialize Deepgram connection
      const deepgramApiKey = import.meta.env.VITE_DEEPGRAM_API_KEY;
      const deepgramUrl = `wss://api.deepgram.com/v1/listen?language=${selectedLanguage}&punctuate=true&interim_results=true&endpointing=true`;

      const socket = new WebSocket(deepgramUrl, ['token', deepgramApiKey]);
      deepgramSocketRef.current = socket;

      socket.onopen = () => {
        console.log('🎤 Deepgram WebSocket connection opened');

        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm',
          audioBitsPerSecond: 128000
        });
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          console.log('🛑 MediaRecorder stopped');
          stopRecording();
        };

        mediaRecorder.start(250);
      };

      socket.onmessage = (message) => {
        try {
          const received = JSON.parse(message.data);
          const transcript = received.channel?.alternatives?.[0]?.transcript;

          if (transcript && transcript.trim()) { // Only process non-empty transcripts
            console.log('Received transcript:', { isFinal: received.is_final, text: transcript }); // Debug log
            
            if (received.is_final) {
              setFinalTranscript(prev => {
                const newTranscript = prev ? `${prev} ${transcript}` : transcript;
                console.log('Setting final transcript:', newTranscript); // Debug log
                return newTranscript.trim();
              });
              setInterimTranscript("");
            } else {
              console.log('Setting interim transcript:', transcript); // Debug log
              setInterimTranscript(transcript.trim());
            }
          }
        } catch (error) {
          console.error('Error processing transcript:', error);
        }
      };

      socket.onclose = () => {
        console.log('🔌 Deepgram WebSocket connection closed');
        stopRecording();
      };

      socket.onerror = (error) => {
        console.error('❌ Deepgram WebSocket error:', error);
        stopRecording();
      };

    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      stopRecording();
    }
  };

  return {
    audio,
    handleAudioOnFrontend,
    finalTranscript,
    setFinalTranscript,
    interimTranscript,
    setInterimTranscript,
    mediaRecorderRef,
    streamRef,
    deepgramSocketRef
  };
}

export default useAudioRecording; 