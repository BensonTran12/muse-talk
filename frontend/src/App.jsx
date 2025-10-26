// BCI UI stuff. fake data rn.
import React, { useState, useEffect, useRef } from "react";
import "./App.css";

// --- CONFIGURATION CONSTANTS (WHEEL & MAPPING) ---
const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];

// maps data to directional inputs
const COMMAND_MAP = {
  LEFT: 'ROTATE_CCW',
  RIGHT: 'ROTATE_CW',
  UP: 'SELECT',
  DOWN: 'BACK',
  NEUTRAL: 'NONE',
};

const SNAP_DISTANCE = 80; // Cursor must be within 80px to snap
const MOCK_INTERVAL = 700; // Time between fake BCI predictions

// wheel data structure
const WHEEL_DATA = {
  ROOT: {
    items: [
      { name: "Words/Phrases", child: "WORDSPHRASES" },
      { name: "Letters/Characters", child: "LETTERSCHARACTERS" },
    ],
  },
  
  WORDSPHRASES: {
    items: [
      { name: "Hello!" },
      { name: "Thank you." },
      { name: "Yes." },
      { name: "No." },
      { name: "I don't understand" },
    ],
  },
  LETTERSCHARACTERS: {
    items: [
      { name: "#", child: "NUMBERS" },
      { name: "A-I", child: "AI" },
      { name: "J-Q", child: "JQ" },
      { name: "R-Z", child: "RZ" },
    ],
  },
  NUMBERS: {
    items: [
      { name: "0" },
      { name: "1" },
      { name: "2" },
      { name: "3" },
      { name: "4" },
      { name: "5" },
      { name: "6" },
      { name: "7" },
      { name: "8" },
      { name: "9" },
    ],
  },
  AI: {
    items: [
      { name: "A" }, { name: "B" }, { name: "C" }, { name: "D" }, { name: "E" }, { name: "F" }, { name: "G" }, { name: "H" }, { name: "I" },
    ],
  },
  JQ: {
    items: [
      { name: "J" }, { name: "K" }, { name: "L" }, { name: "M" }, { name: "N" }, { name: "O" }, { name: "P" }, { name: "Q" },
    ],
  },
  RZ: {
    items: [
      { name: "R" }, { name: "S" }, { name: "T" }, { name: "U" }, { name: "V" }, { name: "W" }, { name: "X" }, { name: "Y" }, { name: "Z" },
    ],
  },
};
// aim assist - distance calculator
const calculateDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// rotation functionality
const getRotation = (numItems, index) => {
  if (numItems === 0) return 0;
  const anglePerItem = 360 / numItems;
  // Rotates the wheel to center the selected index at the top (0 degrees)
  return -(index * anglePerItem) + (anglePerItem / 2);
};

// --- RENDER WHEEL LAYER FUNCTION (Defined outside App for stability) ---
const renderWheelLayer = (wheelKey, index, totalLayers, layerIndex) => {
  const wheel = WHEEL_DATA[wheelKey];
  if (!wheel) return null;

  const numItems = wheel.items.length;
  const anglePerItem = 360 / numItems;
  const rotation = getRotation(numItems, index);

  const wheelSize = 100 + layerIndex * 150;

  return (
    <div
      key={wheelKey}
      style={{
        ...styles.wheelLayer,
        width: wheelSize + 'px',
        height: wheelSize + 'px',
        transform: `rotate(${rotation}deg)`,
        zIndex: totalLayers - layerIndex,
      }}
    >
      {/* Render the slices (items) */}
      {wheel.items.map((item, i) => (
        <div
          key={i}
          style={{
            ...styles.wheelSlice,
            borderColor: i === index ? '#00eaff' : 'lightgray', // Highlight selected item
            transform: `rotate(${i * anglePerItem}deg) skewY(${90 - anglePerItem}deg)`,
            backgroundColor: i === index ? 'rgba(0, 234, 255, 0.2)' : 'transparent',
            fontSize: 10 + layerIndex * 2 + 'px'
          }}
        >
          <div style={styles.sliceContent}>
            {item.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function App() {
  // BCI states
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);

  // Wheel/Navigation States
  const [activeWheelKey, setActiveWheelKey] = useState("ROOT");
  const [history, setHistory] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cursor aim assist
  const [cursor, setCursor] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  const graphRef = useRef(null);
  const mockRef = useRef(null);
  const targetRefs = useRef({});
  const targetPositions = useRef([]);

  //navigation 
  const handleCommand = (command) => {
    const currentWheel = WHEEL_DATA[activeWheelKey];
    const numItems = currentWheel.items.length;
    const selectedItem = currentWheel.items[selectedIndex];

    switch (command) {
      case 'ROTATE_CW':
        setSelectedIndex(prev => (prev + 1) % numItems);
        break;

      case 'ROTATE_CCW':
        setSelectedIndex(prev => (prev - 1 + numItems) % numItems);
        break;

      case 'SELECT':
        if (selectedItem.child) {
          setHistory(prev => [...prev, activeWheelKey]);
          setActiveWheelKey(selectedItem.child);
          setSelectedIndex(0);
        } else {
          console.log(`FINAL SELECTION: Executing command for ${selectedItem.name}`); // trigger final action
        }
        break;

      case 'BACK':
        if (history.length > 0) {
          const lastKey = history[history.length - 1];
          setHistory(prev => prev.slice(0, -1));
          setActiveWheelKey(lastKey);
          setSelectedIndex(0);
        }
        break;

      default:
        break;
    }
  };

  // connection logic
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

  // Main prediction handler - snapping or command dispatch
  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    // Convert BCI prediction to a command type
    const command = COMMAND_MAP[prediction];

    if (command && command !== 'NONE') {
      handleCommand(command);
    }

    // aim assist 
    if (prediction !== "NEUTRAL" && prediction in COMMAND_MAP) {
      targetPositions.current.forEach(target => {
        const dist = calculateDistance(cursor, target);
        if (dist < SNAP_DISTANCE) {
          // If close, trigger snap 
          console.log(`AIM ASSIST SNAP: Moving cursor to ${target.id}`);
          setCursor({ x: target.x, y: target.y });
        }
      });
    }

    if (trainingMode) setSaved(prev => prev + 1);
  }, [prediction, connected]);

  // Manual Keyboard Input
  useEffect(() => {
    const handleKeyPress = (event) => {
      // Map the pressed key to a BCI direction
      let newPrediction = null;
      switch (event.key.toLowerCase()) {
        case 'a':
          newPrediction = 'LEFT';
          break;
        case 'd':
          newPrediction = 'RIGHT';
          break;
        case 'w':
          newPrediction = 'UP';
          break;
        case 's':
          newPrediction = 'DOWN';
          break;
        default:
          return;
      }

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
  }, [connected]); 
  
  // EEG graph animator
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
    let animationFrameId;

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

      animationFrameId = requestAnimationFrame(render);
    }

    function loop() {
      if (connected) push();
      animationFrameId = requestAnimationFrame(loop);
    }
    
    if(connected) {
      push();
      render();
      loop();
    }
    
    return () => cancelAnimationFrame(animationFrameId);

  }, [connected]);

  // cleanup when component goes poof
  useEffect(() => {
    return () => clearInterval(mockRef.current);
  }, []);

  const toggleTraining = () => {
    setSaved(0);
    setTrainingMode(prev => !prev);
  };
  
  // Get all keys of active and parent wheels to render
  const wheelKeysToRender = [activeWheelKey, ...history].reverse();
  const totalLayers = wheelKeysToRender.length;

  return (
    <div style={styles.container}>
      <h1>BCI Multilayer Wheel 🧠</h1>

      <div style={{ ...styles.statusDot, backgroundColor: connected ? "lime" : "gray" }} />
      <p>Status: <strong>{status}</strong> | Layer: <strong>{activeWheelKey}</strong></p>

      <button style={styles.button} onClick={toggleConnect} ref={el => targetRefs.current['connect-btn'] = el}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>

      {/* WHEEL DISPLAY AREA */}
      <div style={styles.wheelDisplay}>
        {wheelKeysToRender.map((key, index) =>
          renderWheelLayer(
            key,
            key === activeWheelKey ? selectedIndex : 0,
            totalLayers,
            index // index 0 is the innermost layer (ROOT)
          )
        )}
      </div>

      <div style={styles.controlRow}>
        <h2 style={{ marginRight: "1rem" }}>
          Command: <span style={{ fontWeight: 700 }}>{COMMAND_MAP[prediction]}</span>
        </h2>

        {/* Training Button (Aim Assist Target) */}
        <button
          style={{
            ...styles.button,
            ...(trainingMode ? styles.recordingButton : styles.trainingButton)
          }}
          onClick={toggleTraining}
          disabled={!connected}
          ref={el => targetRefs.current['train-btn'] = el}
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

      {/* Debug Info for Wheel */}
      <div style={styles.debugInfo}>
        <p>Selected Item: {WHEEL_DATA[activeWheelKey].items[selectedIndex].name}</p>
        <p>History: [{history.join(' > ')}]</p>
        {/* Optional Cursor Debugging: Show current mouse position */}
        <p>Cursor Position: ({Math.round(cursor.x)}, {Math.round(cursor.y)})</p> 
      </div>
    </div>
  );
}

// --- STYLING ---
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
  },
  // --- WHEEL-SPECIFIC STYLES ---
  wheelDisplay: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '400px', 
    width: '400px',
    margin: '30px auto',
  },
  wheelLayer: {
    position: 'absolute',
    borderRadius: '50%',
    border: '4px solid #333',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'transform 0.2s ease-out',
  },
  wheelSlice: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '50%',
    transformOrigin: '0% 100%',
    overflow: 'hidden',
    border: '1px solid rgba(255,255,255,0.2)',
    boxSizing: 'border-box',
    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)',
  },
  sliceContent: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    width: '180%',
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    transform: 'rotate(90deg) skewY(0deg) translateY(-50%) translateX(25%)',
    transformOrigin: '0% 0%',
    textShadow: '0 0 3px black',
  },
  debugInfo: {
    marginTop: '20px',
    fontSize: '0.9em',
    color: '#aaa'
  }
};