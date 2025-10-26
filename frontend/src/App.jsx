// BCI UI stuff. fake data rn.
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// fake model classes. real later
const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];

// maps data to directional inputs
const WASD_MAP = {
  UP: "w",
  DOWN: "s",
  LEFT: "a",
  RIGHT: "d",
  NEUTRAL: null,
};

const SNAP_DISTANCE = 80; // Cursor must be within 80px to snap
const MOCK_INTERVAL = 700; // Time between fake BCI predictions

// aim assist - distance calculator
const calculateDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export default function App() {
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);

  // Cursor aim assist
  const [cursor, setCursor] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  const graphRef = useRef(null);
  const mockRef = useRef(null);
  const targetRefs = useRef({});
  const targetPositions = useRef([]);

  // connect or bail
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

  // fake brain loop. swap out later w/ real inference
  const startMockPredictions = () => {
    if (mockRef.current) clearInterval(mockRef.current);

    mockRef.current = setInterval(() => {
      const r = DIR[Math.floor(Math.random() * DIR.length)];
      setPrediction(r);
      if (trainingMode) setSaved(prev => prev + 1);
    }, MOCK_INTERVAL);
  };

  // Update aim assist target positions
  useEffect(() => {
    const updateTargetPositions = () => {
      targetPositions.current = Object.keys(targetRefs.current)
        .map(key => {
          const node = targetRefs.current[key];
          if (!node) return null;
          const rect = node.getBoundingClientRect();
          return {
            id: key,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
          };
        })
        .filter(Boolean);
    };

    updateTargetPositions();
    window.addEventListener("resize", updateTargetPositions);
    return () => window.removeEventListener("resize", updateTargetPositions);
  }, []);

  // track mouse for aim assist simulation
  useEffect(() => {
    const updateCursor = e => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", updateCursor);
    return () => window.removeEventListener("mousemove", updateCursor);
  }, []);

  // Main prediction handler - snapping or keyboard dispatch
  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    if (trainingMode) setSaved(prev => prev + 1);

    if (prediction !== "NEUTRAL") {
      let snapped = false;

      targetPositions.current.forEach(target => {
        const dist = calculateDistance(cursor, target);
        if (dist < SNAP_DISTANCE) {
          setCursor({ x: target.x, y: target.y });
          snapped = true;
        }
      });

      if (!snapped) {
        const keyToPress = WASD_MAP[prediction];
        if (keyToPress) {
          const down = new KeyboardEvent("keydown", { key: keyToPress });
          document.dispatchEvent(down);
          setTimeout(() =>
            document.dispatchEvent(new KeyboardEvent("keyup", { key: keyToPress })),
            50
          );
        }
      }
    }
  }, [prediction, connected]);

  // fake eeg line animator
  useEffect(() => {
    const canvas = graphRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const colors = {
      alpha: "#00eaff",
      beta: "#00ff90",
      theta: "#ffdd00",
      gamma: "#ff3b3b"
    };

    const data = {
      alpha: [],
      beta: [],
      theta: [],
      gamma: []
    };

    function push() {
      data.alpha.push(Math.random() * 40 + 60);
      data.beta.push(Math.random() * 35 + 55);
      data.theta.push(Math.random() * 30 + 50);
      data.gamma.push(Math.random() * 25 + 45);

      Object.keys(data).forEach(k => {
        if (data[k].length > W) data[k].shift();
      });
    }

    function render() {
      ctx.clearRect(0, 0, W, H);

      Object.keys(data).forEach(k => {
        ctx.strokeStyle = colors[k];
        ctx.beginPath();
        data[k].forEach((v, i) => {
          const min = 30, max = 110;
          const y = H - ((v - min) / (max - min)) * H;
          ctx.lineTo(i, y);
        });
        ctx.stroke();
      });

      requestAnimationFrame(render);
    }

    function loop() {
      if (connected) push();
      requestAnimationFrame(loop);
    }

    push();
    render();
    loop();
  }, [connected]);

  // cleanup when component goes poof
  useEffect(() => {
    return () => clearInterval(mockRef.current);
  }, []);

  const toggleTraining = () => {
    setSaved(0);
    setTrainingMode(prev => !prev);
  };

  return (
    <div style={styles.container}>
      <h1>BCI Brain Control</h1>

      <div style={{ ...styles.statusDot, backgroundColor: connected ? "lime" : "gray" }} />

      <p>Status: <strong>{status}</strong></p>

      <button style={styles.button} onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>

      <div style={styles.controlRow}>
        <h2>Output: {prediction}</h2>

        <button
          style={{
            ...styles.button,
            backgroundColor: trainingMode ? "#ffcc00" : "#ddd"
          }}
          onClick={toggleTraining}
          disabled={!connected}
        >
          {trainingMode ? "Recording..." : "Start Training"}
        </button>

        {trainingMode && <span style={styles.savedText}>Saved: {saved}</span>}
      </div>

      <canvas ref={graphRef} width="700" height="200" style={styles.canvas} />

      <div style={styles.legend}>
        <span style={{ color: "#00eaff" }}>Alpha</span> ·{" "}
        <span style={{ color: "#00ff90" }}>Beta</span> ·{" "}
        <span style={{ color: "#ffdd00" }}>Theta</span> ·{" "}
        <span style={{ color: "#ff3b3b" }}>Gamma</span>
      </div>
    </div>
  );
}

const styles = {
  container: { textAlign: "center", padding: "2rem", fontFamily: "Arial, sans-serif" },
  button: { fontSize: "1.1rem", padding: "0.6rem 1.2rem", margin: "0.7rem", borderRadius: "6px", cursor: "pointer" },
  statusDot: { width: "16px", height: "16px", borderRadius: "50%", margin: "10px auto" },
  canvas: { marginTop: "1rem", border: "1px solid #0ff", borderRadius: "6px" },
  legend: { marginTop: "6px", fontSize: "0.9rem", fontWeight: "600" },
  controlRow: { display: "flex", justifyContent: "center", alignItems: "center", gap: "1.5rem" },
  savedText: { fontSize: "1.2rem", fontWeight: "600", color: "#333" }
};
