# # 7. services/audio_service.py
# """Audio recording and processing services."""
# import threading
# import pyaudio
# import speech_recognition as sr

# import config

# # Initialize recognizer
# recognizer = sr.Recognizer()

# # Global variables
# audio_buffer = []
# stop_event = threading.Event()
# audio = pyaudio.PyAudio()


# def record_audio():
#     """Record audio in a loop until `stop_event` is set."""
#     stream = audio.open(
#         format=getattr(pyaudio, config.AUDIO_FORMAT),
#         channels=config.CHANNELS,
#         rate=config.RATE,
#         input=True,
#         frames_per_buffer=config.CHUNK,
#     )
#     while not stop_event.is_set():
#         data = stream.read(config.CHUNK)
#         audio_buffer.append(data)
#     stream.stop_stream()
#     stream.close()


# def start_recording():
#     """Start recording audio."""
#     stop_event.clear()
#     audio_buffer.clear()
#     threading.Thread(target=record_audio, daemon=True).start()
#     return {"status": "Recording started"}


# def stop_recording():
#     """Stop recording and return recognized text."""
#     stop_event.set()

#     # Wait briefly for the recording thread to finish
#     threading.Event().wait(0.5)

#     if not audio_buffer:
#         return {"error": "No audio recorded"}

#     # Convert raw audio data to AudioData format
#     audio_data = sr.AudioData(
#         b"".join(audio_buffer), config.RATE, 2  # Sample width (2 bytes = 16-bit)
#     )

#     try:
#         text = recognizer.recognize_google(audio_data)
#         return {"text": text}
#     except sr.UnknownValueError:
#         return {"error": "Could not understand audio"}
#     except sr.RequestError as e:
#         return {"error": f"API request failed: {e}"}
