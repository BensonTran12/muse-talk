<<<<<<< HEAD
  // BCI UI stuff. fake data rn.
  import React, { useState, useEffect, useRef } from "react";

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

    // highlight active direction like before
    const highlight = (active) => ({
      fontSize: "3.2rem",
      opacity: active ? 1 : 0.35,
      transition: "0.2s",
      color: active ? "#00eaff" : "#666"
    });


    return (
      <div className="bci-container" style={{ position: "relative", zIndex: 1 }}>
        <div className="header">
          <span className="title">BCI Control</span>
          <span className={`status ${connected ? "ok" : ""}`}>
            {status}
          </span>
        </div>

        <div className="hud">
          <div className={prediction === "UP" ? "active" : ""}>↑</div>
          <div className="mid">
            <div className={prediction === "LEFT" ? "active" : ""}>←</div>
            <div className={prediction === "NEUTRAL" ? "active" : ""}>●</div>
            <div className={prediction === "RIGHT" ? "active" : ""}>→</div>
          </div>
          <div className={prediction === "DOWN" ? "active" : ""}>↓</div>
        </div>

        <div className="output-row">
          <strong>Output:</strong> {prediction}

          <button
            className={`train-btn ${trainingMode ? "recording" : ""}`}
            onClick={toggleTraining}
            disabled={!connected}
          >
            {trainingMode ? "Recording" : "Start Training"}
          </button>

          {trainingMode && <span className="save-count">{saved}</span>}
        </div>

        <canvas ref={graphRef} width="350" height="120" className="graph" />

        <div className="legend">
          <span className="a">Alpha</span> · 
          <span className="b">Beta</span> · 
          <span className="t">Theta</span> · 
          <span className="g">Gamma</span>
        </div>

        <button className="connect-btn" onClick={toggleConnect}>
          {connected ? "Disconnect" : "Connect Headset"}
        </button>
      </div>
    );

  }
=======
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
>>>>>>> bf473ae659659f5300bde6369742f2d5e2845955
