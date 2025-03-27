import React, { useState, useEffect, useRef } from "react";
import { io } from 'socket.io-client';
import Webcam from 'react-webcam';

const VideoStreamer = () => {
    const [chatInput, setChatInput] = useState("");
    const [messages, setMessages] = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [action, setAction] = useState(""); // State to track the action
    const [isRecording, setIsRecording] = useState(false); // State to track audio recording
    const [transcript, setTranscript] = useState(""); // State to store live transcription

    const user = "YourUserName"; // Replace with the desired username
    const socketRef = useRef(null);
    const webcamRef = useRef(null);
    const streamingRef = useRef(false); // Ref to hold streaming state
    const recognitionRef = useRef(null); // Ref to hold speech recognition

    useEffect(() => {
        // Open socket connection with WebSocket transport
        socketRef.current = io('http://192.168.29.38:5000');
        socketRef.current.on("connect", () => {
            console.log("Connected to Socket.IO server");
        });

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            setSelectedVoice(availableVoices[0]); // Set default to the first voice
        };

        socketRef.current.on("chat", (chat) => {
            setMessages(prevMessages => [...prevMessages, chat]);
        });

        socketRef.current.on("stream", (data) => {
            data.messages.forEach((message) => {
                speakMessage(message); // Speak each message received
            });
        });

       

        window.speechSynthesis.onvoiceschanged = loadVoices;

        // Initialize speech recognition
        if (window.SpeechRecognition || window.webkitSpeechRecognition) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (e) => {
                const transcript = Array.from(e.results)
                    .map(result => result[0])
                    .map(result => result.transcript)
                    .join(' ');

                setTranscript(transcript);
            };

            recognitionRef.current.onend = () => {
                if (isRecording) {
                    recognitionRef.current.start(); // Restart recording if still in recording mode
                }
            };
        }

        async function requestPermissions() {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
            } catch (err) {
                console.error("Permissions denied:", err);
                alert("Please allow access to the microphone and camera.");
            }
        }
    
        requestPermissions();





        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const updateChatInput = (e) => {
        setChatInput(e.target.value);
    };

    const sendChat = (e) => {
        e.preventDefault();
        socketRef.current.emit("chat", { user: user, msg: chatInput });
        setChatInput("");
    };

    // Function to start and stop streaming
    const toggleStreaming = (selectedAction) => {
        if (isStreaming) {
            setIsStreaming(false); // Stop streaming
            streamingRef.current = false; // Update the ref
        } else {
            setIsStreaming(true); // Start streaming
            streamingRef.current = true; // Update the ref
            setAction(selectedAction); // Set the action based on the button clicked
            streamVideo(selectedAction); // Call the streaming function with the action
        }
    };

    const streamVideo = (selectedAction) => {
        if (!webcamRef.current) return;

        const intervalId = setInterval(() => {
            if (!streamingRef.current) {
                clearInterval(intervalId); // Stop if not streaming
                return;
            }

            // Capture frame from the webcam
            const imageSrc = webcamRef.current.getScreenshot();

            if (imageSrc) {
                console.log("Sending frame to server"); // Log when sending frame
                // Emit image and action to the backend through socket
                socketRef.current.emit("stream", { image: imageSrc, action: selectedAction });
            }
        }, 4000); // Send a frame every 100 milliseconds (adjust as needed)
    };

    const speakMessage = (message) => {
        const utterance = new SpeechSynthesisUtterance(message);
        window.speechSynthesis.speak(utterance);
    };

    const stopSpeaking = () => {
        window.speechSynthesis.cancel(); // Stop any ongoing speech
    };

    const handleMouseClick = () => {
        if (action === "Find") { // Only enable in "Find" mode
            if (isRecording) {
                // Stop recording
                recognitionRef.current.stop();
                setIsRecording(false);
                speakMessage(transcript); // Speak out the transcript
                setTranscript(""); // Reset the transcript after speaking
            } else {
                // Start recording
                recognitionRef.current.start();
                setIsRecording(true);
            }
        }
    };

    return (
        <div className="flex flex-col content-center items-center gap-5" onClick={handleMouseClick}>
            <div>
                {messages.map((message, ind) => (
                    <div key={ind}>{`${message.user}: ${message.msg}`}</div>
                ))}
            </div>
           {/*  <form onSubmit={sendChat} onClick={() => speakMessage("Type the object to Find")}>
                <input
                    value={chatInput}
                    onChange={updateChatInput}
                    placeholder="Type your message here..."
                    className="p-2 rounded-lg mr-10"
                />
                <button type="submit" className=" text-white">Send</button>
            </form> */}

            {/* Camera Frame */}
            <div style={{ position: 'relative', width: '90%', maxWidth: '600px', marginTop: '20px' }}>
                <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }} // Use front camera
                    style={{ width: '100%', height: 'auto', border: '5px solid #a397d0' }}
                />
                {(!isStreaming) && (
                    <div className="overlay" /> // Overlay when not streaming
                )}
                {isStreaming ? (
                    <button onClick={() => { stopSpeaking(); toggleStreaming(); speakMessage("Back to Home "); }} className="mt-10 ml-[40%] mr-10 border-white text-white">Stop</button> // Single stop button
                ) : (
                    <>
                        {/* <button onClick={() => { stopSpeaking(); toggleStreaming("Find"); speakMessage("Find Tab.. Click anywhere to start recording.. Click again to stop recording "); }} className="mt-10 ml-20 mr-10 border-white text-white">Find</button> */}
                        <button onClick={() => { stopSpeaking(); toggleStreaming("SafeStreet"); speakMessage('SafeStreet Tab.. '); }} className=" mt-10 ml-[37%]  border-white text-white">SafeStreet</button>
                    </>
                )}
            </div>

            {/* Live transcription */}
            {isRecording && (
                <div className="transcript-container">
                    <p>{transcript}</p>
                </div>
            )}
        </div>
    );
};

export default VideoStreamer;
