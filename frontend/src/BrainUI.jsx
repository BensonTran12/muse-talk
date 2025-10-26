// BCI UI stuff. fake data 
import React, { useState, useEffect, useRef } from "react";
import WheelInterface from './WheelInterface.jsx'; // NEW IMPORT
import "./BrainStyles.css";

// --- CONFIGURATION CONSTANTS ---
const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];
const MOCK_INTERVAL = 700; 

// The specific BCI sequence required to activate the wheel UI
const ACTIVATION_SEQUENCE = ['UP', 'DOWN', 'UP'];
const SEQUENCE_TIMEOUT = 1500; 

export default function BrainUI() {
  // BCI & UI States
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  
  // Activation States
  const [isWheelActive, setIsWheelActive] = useState(false);
  const [sequenceBuffer, setSequenceBuffer] = useState([]);

  // Refs
  const mockRef = useRef(null);
  const sequenceTimerRef = useRef(null);
  const graphRef = useRef(null);


  // --- BCI MOCK LOGIC ---
  const startMockPredictions = () => {
    if (mockRef.current) clearInterval(mockRef.current);
    mockRef.current = setInterval(() => {
      const r = DIR[Math.floor(Math.random() * DIR.length)];
      setPrediction(r);
    }, MOCK_INTERVAL);
  };

  const toggleConnect = () => {
    if (connected) {
      clearInterval(mockRef.current);
      setConnected(false);
      setStatus("Disconnected");
      setPrediction("…thinking…");
    } else {
      setConnected(true);
      setStatus("Connected");
      startMockPredictions();
    }
  };

  // --- USE EFFECT HOOKS ---

  // Listens for the activation sequence 
  useEffect(() => {
    if (!connected || isWheelActive || prediction === "NEUTRAL" || prediction === "…thinking…") {
      return;
    }

    if (sequenceTimerRef.current) clearTimeout(sequenceTimerRef.current);

    // Sequence checking logic
    const newBuffer = [...sequenceBuffer, prediction];
    
    if (
      newBuffer.length === ACTIVATION_SEQUENCE.length &&
      newBuffer.every((val, index) => val === ACTIVATION_SEQUENCE[index])
    ) {
      setIsWheelActive(true); // *** ACTIVATION SUCCESS ***
      setSequenceBuffer([]);
    } else if (newBuffer.length > ACTIVATION_SEQUENCE.length) {
      // If buffer overflows, reset it (keep only the last input)
      setSequenceBuffer([prediction]); 
    } else {
      setSequenceBuffer(newBuffer);
    }

    // Set a timer to clear the buffer if the user waits too long
    sequenceTimerRef.current = setTimeout(() => {
      setSequenceBuffer([]);
    }, SEQUENCE_TIMEOUT);

  }, [prediction, connected, isWheelActive]);
  
  // Cleanup hook
  useEffect(() => {
    return () => {
      clearInterval(mockRef.current);
      clearTimeout(sequenceTimerRef.current);
    };
  }, []);

  // --- RENDERING ---

  return (
    <div className="bci-container">
      <div className="header">
        <span className="title">BCI Control</span>
        <span className={`status ${connected ? "ok" : ""}`}>{status}</span>
      </div>

      {!isWheelActive ? (
        // --- INACTIVE STATUS VIEW ---
        <div className="inactive-view">
          <h2>Awaiting Activation</h2>
          <p>Sequence: <strong>{ACTIVATION_SEQUENCE.join(' - ')}</strong></p>
          <div className="sequence-display">
            Input: <strong>{sequenceBuffer.join(' - ')}</strong>
          </div>
          <p className="current-pred">Current BCI Prediction: {prediction}</p>
        </div>
      ) : (
        // --- ACTIVE WHEEL VIEW (Passes current BCI prediction as prop) ---
        <WheelInterface 
            prediction={prediction} 
            isVisible={isWheelActive} 
        />
      )}
      
      <canvas ref={graphRef} width="350" height="120" className="graph" />

      <div className="legend">
        <span className="a">Alpha</span> · <span className="b">Beta</span> · <span className="t">Theta</span> · <span className="g">Gamma</span>
      </div>

      <button className="connect-btn" onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>
    </div>
  );
}