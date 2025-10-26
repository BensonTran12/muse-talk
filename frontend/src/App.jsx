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

export default function App() {
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);
  const graphRef = useRef(null);
  //const fpsRef = useRef(0);
  //const lastFrameRef = useRef(Date.now());
  //const [history, setHistory] = useState([]);



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
      setHistory(h => [r, ...h].slice(0, 6)); // last 6 shown
      if (trainingMode) setSaved(prev => prev + 1);
    }, 700);
  };

  // cleanup when component goes poof
  useEffect(() => {
    return () => clearInterval(mockRef.current);
  }, []);

  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    const keyToPress = WASD_MAP[prediction];

    if (keyToPress) {
      console.log(`BCI Command: ${prediction}. Dispatching keydown event for: ${keyToPress.toUpperCase()}`);
      
      // change later to work with 
      
      const event = new KeyboardEvent('keydown', {
        key: keyToPress,
        code: keyToPress.toUpperCase(),
        bubbles: true
      });
      document.dispatchEvent(event);

      // Optionally dispatch 'keyup' to simulate a tap
      const keyupEvent = new KeyboardEvent('keyup', {
        key: keyToPress,
        code: keyToPress.toUpperCase(),
        bubbles: true
      });
      setTimeout(() => document.dispatchEvent(keyupEvent), 50);

    } else if (prediction === "NEUTRAL") {
      console.log("BCI Command: NEUTRAL. No key dispatched.");
    }
  }, [prediction, connected]); // Reruns whenever prediction changes

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


  // start/end training mode
  const toggleTraining = () => {
    setTrainingMode(!trainingMode);
    if (!trainingMode) setSaved(0); // reset counter
  };

  // gives a rad direction wheel vibe
 // const wheelPos = {
  //  transform: `rotate(${getRotation(prediction)}deg)`,
 //   transition: "0.2s ease-out"
 // };
  // highlight active direction
  const highlight = active => ({
    fontSize: "3.2rem",
    opacity: active ? 1 : 0.35,
    transition: "0.2s",
    color: active ? "#00eaff" : "#666"
  });


  return (
    <div style={styles.container}>
      {/* header bar */}
      <div style={styles.header}>
        <span style={styles.brand}>🧠 MuseTalk LIVE</span>
        <span>{status}</span>
      </div>

      <h1>BCI Brain Control </h1>

      {/* lil dot to show live connection */}
      <div style={{...styles.statusDot, backgroundColor: connected ? "lime" : "gray"}} />

      <p>Status: <strong>{status}</strong></p>

      {/* connect / disconnect */}
      <button style={styles.button} onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>

      {/* the wheel 
      <div style={styles.wheelContainer}>
        <img
          src="https://png.pngtree.com/png-vector/20230220/ourlarge/pngtree-spin-wheel-vector-illustration-png-image_6606505.png"
          alt="wheel"
          style={{...styles.wheelImg, ...wheelPos}}
        />
      </div> */}
      {/* direction hud */}
      <div style={styles.hud}>
        <div style={highlight(prediction === "UP")}>↑</div>
        <div style={styles.midRow}>
         <div style={highlight(prediction === "LEFT")}>←</div>
         <div style={highlight(prediction === "NEUTRAL")}>●</div>
         <div style={highlight(prediction === "RIGHT")}>→</div>
        </div>
        <div style={highlight(prediction === "DOWN")}>↓</div>
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
      {/* eeg graph */}
    <canvas
      ref={graphRef}
      width="700"
      height="190"
      style={styles.canvas}
    />

    <div style={styles.legend}>
      <span style={{color:"#00eaff"}}>Alpha</span> ·{" "}
      <span style={{color:"#00ff90"}}>Beta</span> ·{" "}
      <span style={{color:"#ffdd00"}}>Theta</span> ·{" "}
      <span style={{color:"#ff3b3b"}}>Gamma</span>
    </div>


    </div>
  );
}

// stupid helper bc wheel needs angles
//function getRotation(dir) {
 // switch (dir) {
  //  case "UP": return 0;
  //  case "RIGHT": return 90;
   // case "DOWN": return 180;
   // case "LEFT": return 270;
   // default: return 0; // neutral
 // }
//}

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
  }
};