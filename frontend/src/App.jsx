// BCI UI stuff. fake data rn.
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// fake model classes. real later
const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];

export default function App() {
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);

  const mockRef = useRef(null); // holds mock interval

  // connect or bail
  const toggleConnect = () => {
    if (connected) {
      // kill stream
      clearInterval(mockRef.current);
      setConnected(false);
      setStatus("Disconnected");
      setPrediction("…thinking…");
    } else {
      // fake connect
      setConnected(true);
      setStatus("Connected ");
      startMockPredictions();
    }
  };

  // fake brain loop. swap out later w/ real inference
  const startMockPredictions = () => {
    if (mockRef.current) clearInterval(mockRef.current);
    mockRef.current = setInterval(() => {
      const r = DIR[Math.floor(Math.random() * DIR.length)];
      setPrediction(r);
      if (trainingMode) setSaved(prev => prev + 1);
    }, 700);
  };

  // cleanup when component goes poof
  useEffect(() => {
    return () => clearInterval(mockRef.current);
  }, []);

  // start/end training mode
  const toggleTraining = () => {
    setTrainingMode(!trainingMode);
    if (!trainingMode) setSaved(0); // reset counter
  };

  // gives a rad direction wheel vibe
  const wheelPos = {
    transform: `rotate(${getRotation(prediction)}deg)`,
    transition: "0.2s ease-out"
  };

  return (
    <div style={styles.container}>
      <h1>BCI Brain Control </h1>

      {/* lil dot to show live connection */}
      <div style={{...styles.statusDot, backgroundColor: connected ? "lime" : "gray"}} />

      <p>Status: <strong>{status}</strong></p>

      {/* connect / disconnect */}
      <button style={styles.button} onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>

      {/* the wheel */}
      <div style={styles.wheelContainer}>
        <img
          src="https://png.pngtree.com/png-vector/20230220/ourlarge/pngtree-spin-wheel-vector-illustration-png-image_6606505.png"
          alt="wheel"
          style={{...styles.wheelImg, ...wheelPos}}
        />
      </div>

      {/* thought output */}
      <h2>Output: {prediction}</h2>

      {/* training mode toggle */}
      <button
        style={{...styles.button, backgroundColor: trainingMode ? "#ffcc00" : "#ddd"}}
        onClick={toggleTraining}
        disabled={!connected}
      >
        {trainingMode ? " Recording..." : "Start Training"}
      </button>

      {/* how many samples logged */}
      {trainingMode && (
        <p>Saved: {saved}</p>
      )}   
    </div>
  );
}

// stupid helper bc wheel needs angles
function getRotation(dir) {
  switch (dir) {
    case "UP": return 0;
    case "RIGHT": return 90;
    case "DOWN": return 180;
    case "LEFT": return 270;
    default: return 0; // neutral
  }
}

// UI junk. fine for now
const styles = {
  container: {
    textAlign: "center",
    padding: "2rem",
    fontFamily: "Arial, sans-serif"
  },
  button: {
    fontSize: "1.1rem",
    margin: "0.7rem",
    padding: "0.6rem 1.2rem",
    cursor: "pointer",
    borderRadius: "6px"
  },
  statusDot: {
    width: "15px",
    height: "15px",
    borderRadius: "50%",
    margin: "0 auto",
    marginBottom: "10px"
  },
  wheelContainer: {
    marginTop: "2rem",
    display: "flex",
    justifyContent: "center"
  },
  wheelImg: {
    width: "120px",
    height: "120px"
  }
};