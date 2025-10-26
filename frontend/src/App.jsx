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

        // presses key down
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

    // --- NEW EFFECT HOOK FOR MANUAL KEYBOARD INPUT ---
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Map the pressed key to a BCI direction
      let newPrediction = null;
      switch (event.key.toLowerCase()) {
        case 'w':
          newPrediction = 'UP';
          break;
        case 's':
          newPrediction = 'DOWN';
          break;
        case 'a':
          newPrediction = 'LEFT';
          break;
        case 'd':
          newPrediction = 'RIGHT';
          break;
        default:
          // Ignore other keys
          return;
      }

      // Prevent the default browser action (like scrolling)
      event.preventDefault();

      // Only update prediction if the headset is "connected"
      if (connected) {
        setPrediction(newPrediction);
        
        // Optional: Reset to NEUTRAL shortly after to simulate a momentary thought/tap
        setTimeout(() => {
          setPrediction('NEUTRAL');
        }, 100);
      }
    };

    // Attach the event listener to the entire window
    window.addEventListener('keydown', handleKeyPress);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [connected]); // Re-attach if connected state changes
// --- END NEW EFFECT HOOK ---

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
            ...(trainingMode ? styles.recordingButton : styles.trainingButton)
          }}
          onClick={toggleTraining}
          disabled={!connected}
        >
          {trainingMode ? "Recording..." : "Start Training"}
        </button>


          {trainingMode && <span style={styles.savedText}>Saved: {saved}</span>}
        </div>

        {/* direction hud restored */}
        <div style={styles.hud}>
          <div style={highlight(prediction === "UP")}>↑</div>

          <div style={styles.midRow}>
            <div style={highlight(prediction === "LEFT")}>←</div>
            <div style={highlight(prediction === "NEUTRAL")}>●</div>
            <div style={highlight(prediction === "RIGHT")}>→</div>
          </div>

          <div style={highlight(prediction === "DOWN")}>↓</div>
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
  container: {
    minHeight: "100vh",
    paddingTop: "1rem",
    paddingBottom: "1.5rem",
    fontFamily: "Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    background: "radial-gradient(circle at 50% -30%, #0d1b2a, #000000 85%)",
    color: "#e0faff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.7rem"
  },

  button: {
    fontSize: "1.1rem",
    padding: "0.55rem 1.1rem",
    borderRadius: "10px",
    cursor: "pointer",
    border: "1px solid #00eaff",
    background: "rgba(0,150,200,0.18)",
    color: "#e0faff",
    transition: "all 0.18s ease-in-out",
    fontWeight: "600"
  },

  trainingButton: {
    border: "2px solid #00eaff",
    background: "rgba(0,150,200,0.4)",
    boxShadow: "0 0 12px rgba(0,200,255,0.6)"
  },

  recordingButton: {
    background: "rgba(220,0,0,0.7)",
    border: "2px solid #ff4747",
    color: "#fff",
    boxShadow: "0 0 16px rgba(255,60,60,0.9)"
  },

  statusDot: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    border: "2px solid #00eaff",
    boxShadow: "0 0 8px #00eaff",
    marginBottom: "0.2rem"
  },

  controlRow: {
    width: "80%",
    maxWidth: "820px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "1rem",
    padding: "0.6rem",
    borderRadius: "12px",
    background: "rgba(0, 60, 90, 0.28)",
    border: "1px solid rgba(0,200,255,0.25)",
    backdropFilter: "blur(6px)",
    marginTop: "0.4rem"
  },

  savedText: {
    fontSize: "1.15rem",
    fontWeight: "600",
    color: "#ffd447",
    textShadow: "0 0 6px rgba(255,200,60,0.45)"
  },

  hud: {
    marginTop: "0.2rem",
    fontSize: "3.0rem",
    userSelect: "none",
    textShadow: "0 0 10px rgba(0,200,255,0.5)"
  },

  midRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "3rem"
  },

  canvas: {
    marginTop: "0.7rem",
    border: "1px solid rgba(0,200,255,0.35)",
    borderRadius: "10px",
    width: "90%",
    maxWidth: "860px",
    height: "200px",
    background: "rgba(0,25,45,0.55)",
    boxShadow: "0 0 14px rgba(0,200,255,0.15)"
  },

  legend: {
    marginTop: "4px",
    fontSize: "0.95rem",
    fontWeight: "600",
    opacity: 0.85
  }
};
