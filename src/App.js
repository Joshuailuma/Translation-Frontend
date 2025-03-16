import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { ClipLoader } from "react-spinners";
import Auth from "./Auth";

const socket = io("https://prod.mobile.buildwithseamless.co");

function App() {
  const [user, setUser] = useState(localStorage.getItem("token"));
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [audio, setAudio] = useState(null);
  const [inputLanguage, setInputLanguage] = useState("en-US");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [loading, setLoading] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    socket.on("receive_translation", (data) => {
      setTranslatedText(data.translated_text);
      setLoading(false);
    });
  }, []);

  const startRecording = async () => {
    setLoading(true);
    setAudio(null);
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (event) => {
      audioChunksRef.current.push(event.data);
    };
    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      sendAudioToBackend(audioBlob);
      audioChunksRef.current = [];
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendAudioToBackend = async (audioBlob) => {
    setLoading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "audio.webm");
    formData.append("input_language", inputLanguage);

    try {
      const response = await axios.post("https://prod.mobile.buildwithseamless.co/speech-to-text", formData, {
        headers: { Authorization: `Bearer ${user}` },
      });
      setTranscript(response.data.transcript);
      sendTranslation(response.data.transcript);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const sendTranslation = async (text) => {
    try {
      const response = await axios.post(
        "https://prod.mobile.buildwithseamless.co/translate",
        { text, target_language: targetLanguage },
        { headers: { Authorization: `Bearer ${user}` } }
      );
      setTranslatedText(response.data.translated_text);
      requestTextToSpeech(response.data.translated_text);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const requestTextToSpeech = async (text) => {
    try {
      const response = await axios.post(
        "https://prod.mobile.buildwithseamless.co/text-to-speech",
        { text, language_code: targetLanguage },
        { headers: { Authorization: `Bearer ${user}` } }
      );
      setAudio(`data:audio/mp3;base64,${response.data.audio}`);
      setLoading(false);
    } catch (error) {
      console.error("Error:", error);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  if (!user) {
    return <Auth setUser={setUser} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">Healthcare Translation Web App</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
          Logout
        </button>

        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
              <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-lg">

                {/* Record Button */}
                <div className="flex justify-center mb-4">
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`px-6 py-3 rounded-md font-semibold transition w-full sm:w-auto ${
                      recording ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
                    } text-white`}
                  >
                    {recording ? "Stop Recording" : "Start Recording"}
                  </button>
                </div>

                {/* Loading Spinner */}
                {loading && (
                  <div className="flex justify-center my-4">
                    <ClipLoader color="#3b82f6" size={50} />
                  </div>
                )}

                {/* Transcript Box */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Transcript:</h3>
                  <p className="border border-gray-300 p-3 rounded-md bg-gray-50 min-h-[50px] text-gray-800">
                    {transcript || "No transcript available"}
                  </p>
                </div>

                {/* Translated Text */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-700">Translated Text:</h3>
                  <p className="border border-gray-300 p-3 rounded-md bg-gray-50 min-h-[50px] text-gray-800">
                    {translatedText || "No translation available"}
                  </p>
                </div>

                  {/* Input Language Selection */}
                        <div className="mb-4">
                          <label className="text-lg font-semibold text-gray-700 block mb-2">Input Language:</label>
                          <select
                            value={inputLanguage}
                            onChange={(e) => setInputLanguage(e.target.value)}
                            className="border border-gray-300 p-2 rounded-md w-full bg-white text-gray-800"
                          >
                            <option value="en-US">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>

                {/* Target Language Selection */}
                <div className="mb-4">
                  <label className="text-lg font-semibold text-gray-700 block mb-2">Target Language:</label>
                  <select
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full bg-white text-gray-800"
                  >
                   <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                  </select>
                </div>

                {/* Audio Playback */}
                {audio && (
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-gray-700">Audio Playback:</h3>
                    <audio controls className="w-full mt-2">
                      <source src={audio} type="audio/mp3" />
                    </audio>
                  </div>
                )}
              </div>
            </div>

      </div>
    </div>
  );
}

export default App;
