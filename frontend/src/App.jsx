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

const SNAP_DISTANCE = 80; // Cursor must be within 80 pixels of a target center to snap.
const MOCK_INTERVAL = 700; // Time between fake BCI predictions

// --- aim assist - calculates distance between cursor and UI element ---
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

  // aim assist states + cursor control
  const [cursor, setCursor] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const targetRefs = useRef({});
  const targetPositions = useRef([]);
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
      if (trainingMode) {
        setSaved(prev => prev + 1);
      }
    }, 700);
      if (trainingMode) setSaved(prev => prev + 1);
    }, MOCK_INTERVAL);
  };

// 1. Hook to recalculate target positions on mount/resize
  useEffect(() => {
    // Function to calculate target positions
    const updateTargetPositions = () => {
      targetPositions.current = [];
      Object.keys(targetRefs.current).forEach(key => {
        const node = targetRefs.current[key];
        if (node) {
          const rect = node.getBoundingClientRect();
          targetPositions.current.push({
            id: key,
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            rect: rect
          });
        }
      });
    };

    // Run once and on resize
    updateTargetPositions();
    window.addEventListener('resize', updateTargetPositions);
    return () => window.removeEventListener('resize', updateTargetPositions);
  }, [connected]); // Recalc when connected elements are visible

    // 2. Hook to track the user's cursor position
  useEffect(() => {
    const updateCursor = (e) => {
      setCursor({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', updateCursor);
    return () => window.removeEventListener('mousemove', updateCursor);
  }, []);

useEffect(() => {
  if (!connected || prediction === "…thinking…") return;

    if (trainingMode) {
      setSaved(prev => prev + 1);
    }
  // Function: Runs the snap-to-target check
  const snapToTarget = (currentCursor) => {
    let closestTarget = null;
    let minDistance = SNAP_DISTANCE;

    targetPositions.current.forEach(target => {
      const distance = calculateDistance(currentCursor, target);
      if (distance < minDistance) {
        minDistance = distance;
        closestTarget = target;
      }
    });

    if (closestTarget) {
      console.log(`AIM ASSIST: Snapping to ${closestTarget.id}`);
      
      // In a real Electron app, this is where you send the IPC command:
      // ipcRenderer.send('move-cursor', closestTarget.x, closestTarget.y);
      
      // For this browser simulation, we just update the internal cursor state
      setCursor({ x: closestTarget.x, y: closestTarget.y });

      return true; // Snap occurred
    }
    return false; // No snap
  };

  // 3. MAIN EFFECT HOOK: BCI Prediction -> Command Execution
  useEffect(() => {
    if (!connected || prediction === "…thinking…" || prediction === "NEUTRAL") return;

    // --- SNAP CHECK ---
    const snapped = snapToTarget(cursor);

    if (snapped) {
      // If snap occurred, we're done; skip WASD simulation
      return;
    }

    // --- WASD DISPATCH (if no snap) ---
    const keyToPress = WASD_MAP[prediction];
    
    if (keyToPress) {
      console.log(`BCI Command: ${prediction}. Dispatching keydown for: ${keyToPress.toUpperCase()}`);
      
      // Simulate keydown event
      const event = new KeyboardEvent('keydown', { key: keyToPress, bubbles: true });
      document.dispatchEvent(event);

      // Simulate keyup event after a short delay
      const keyupEvent = new KeyboardEvent('keyup', { key: keyToPress, bubbles: true });
      setTimeout(() => document.dispatchEvent(keyupEvent), 50);
    }
  }, [prediction, connected, cursor]); // Dependencies for re-run

  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    const keyToPress = WASD_MAP[prediction];

    if (keyToPress) {
      console.log(`BCI Command: ${prediction}. Dispatching keydown event for: ${keyToPress.toUpperCase()}`);

      
      // change later to work 
      
      const event = new KeyboardEvent('keydown', {
        key: keyToPress,
        code: keyToPress.toUpperCase(),
        bubbles: true
      });
      document.dispatchEvent(event);

      const keyupEvent = new KeyboardEvent('keyup', {
        key: keyToPress,
        code: keyToPress.toUpperCase(),
        bubbles: true
      });
      setTimeout(() => document.dispatchEvent(keyupEvent), 50);

    } else if (prediction === "NEUTRAL") {
      console.log("BCI Command: NEUTRAL. No key dispatched.");
    }

  }, [prediction, connected, trainingMode]); //  Added trainingMode to deps


  // fake eeg line animator
// fake EEG multi-band animator
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
            const y = H - (v / 100) * H;
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
  }, [prediction, connected, cursor]); // Reruns whenever prediction changes

   // cleanup when component goes poof
  useEffect(() => {
    return () => clearInterval(mockRef.current);
  }, []);

  const toggleTraining = () => {
    setSaved(0);  // always reset when training starts
    setTrainingMode(prev => !prev);
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


    {/* Output + Control Bar */}
    <div style={styles.controlRow}>
      <h2 style={{ marginRight: "1rem" }}>
        Output: <span style={{fontWeight: 700}}>{prediction}</span>
      </h2>
      {/* thought output */}
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

      {trainingMode && (
        <span style={styles.savedText}>Saved: {saved}</span>
      )}
    </div>


    {/* eeg graph */}
    <canvas
      ref={graphRef}
      width="700"
      height="200"
      style={styles.canvas}
    />

    <div style={styles.legend}>
      <span style={{color:"#00eaff"}}>Alpha</span> ·{" "}
      <span style={{color:"#00ff90"}}>Beta</span> ·{" "}
      <span style={{color:"#ffdd00"}}>Theta</span> ·{" "}
      <span style={{color:"#ff3b3b"}}>Gamma</span>
    </div>


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
  },
    hud: {
    marginTop: "1.8rem"
  },
  midRow: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center"
  },
  header: {
    width: "100%",
    padding: "0.5rem",
    display: "flex",
    justifyContent: "space-between",
    background: "#222",
    color: "#0ff",
    fontWeight: "600",
    fontSize: "1rem"
  },
  brand: { fontSize: "1.1rem" },
  canvas: {
    marginTop: "1rem",
    border: "1px solid #0ff",
    borderRadius: "6px"
  },
  historyBox: {
    marginTop: "0.8rem",
    fontSize: "1.3rem"
  },
  histItem: {
    margin: "0 6px",
    color: "#00eaff"
  },
  legend: {
  marginTop: "6px",
  fontSize: "0.9rem",
  fontWeight: "600"
  },
  controlRow: {
  marginTop: "1.5rem",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "1rem"
},
savedText: {
  fontSize: "1.2rem",
  fontWeight: "600",
  color: "#333"
}
};