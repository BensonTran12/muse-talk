// BCI UI — polished panel (uses the brand styles you added in BrainStyles.css)
import React, { useState, useEffect, useRef } from "react";

// Fake model classes. (Swap with real inference later.)
const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];

// Map predictions to WASD keys
const WASD_MAP = {
  UP: "w",
  DOWN: "s",
  LEFT: "a",
  RIGHT: "d",
  NEUTRAL: null,
};

const SNAP_DISTANCE = 80;     // px cursor must be within to snap
const MOCK_INTERVAL = 700;    // ms between fake predictions

const distance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
};

export default function BrainUI() {
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);

  // Cursor position (for snap simulation)
  const [cursor, setCursor] = useState({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  const graphRef = useRef(null);
  const mockRef = useRef(null);

  // targets used by snap assist (we’ll attach refs to arrows)
  const targetRefs = useRef({
    UP: null,
    DOWN: null,
    LEFT: null,
    RIGHT: null,
    NEUTRAL: null,
  });
  const targetCenters = useRef([]);

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

  // fake brain loop — replace with real model later
  const startMockPredictions = () => {
    if (mockRef.current) clearInterval(mockRef.current);
    mockRef.current = setInterval(() => {
      const r = DIR[Math.floor(Math.random() * DIR.length)];
      setPrediction(r);
      if (trainingMode) setSaved((p) => p + 1);
    }, MOCK_INTERVAL);
  };

  // track mouse for snap simulation (dev-visible only)
  useEffect(() => {
    const update = (e) => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  // compute centers of our snap targets
  const computeCenters = () => {
    targetCenters.current = Object.entries(targetRefs.current)
      .map(([id, node]) => {
        if (!node) return null;
        const rect = node.getBoundingClientRect();
        return {
          id,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      })
      .filter(Boolean);
  };

  useEffect(() => {
    computeCenters();
    window.addEventListener("resize", computeCenters);
    return () => window.removeEventListener("resize", computeCenters);
  }, []);

  // main prediction handler (snap or dispatch key)
  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    if (trainingMode) setSaved((p) => p + 1);

    if (prediction !== "NEUTRAL") {
      let snapped = false;
      for (const t of targetCenters.current) {
        if (distance(cursor, t) < SNAP_DISTANCE) {
          setCursor({ x: t.x, y: t.y });
          snapped = true;
          break;
        }
      }
      if (!snapped) {
        const key = WASD_MAP[prediction];
        if (key) {
          const down = new KeyboardEvent("keydown", { key });
          const up = new KeyboardEvent("keyup", { key });
          document.dispatchEvent(down);
          setTimeout(() => document.dispatchEvent(up), 50);
        }
      }
    }
  }, [prediction, connected]); // eslint-disable-line react-hooks/exhaustive-deps

  // fake EEG animator
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
      gamma: "#ff3b3b",
    };

    const series = { alpha: [], beta: [], theta: [], gamma: [] };

    const push = () => {
      series.alpha.push(Math.random() * 40 + 60);
      series.beta.push(Math.random() * 35 + 55);
      series.theta.push(Math.random() * 30 + 50);
      series.gamma.push(Math.random() * 25 + 45);
      Object.keys(series).forEach((k) => {
        if (series[k].length > W) series[k].shift();
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      Object.keys(series).forEach((k) => {
        ctx.strokeStyle = colors[k];
        ctx.beginPath();
        series[k].forEach((v, i) => {
          const min = 30,
            max = 110;
          const y = H - ((v - min) / (max - min)) * H;
          if (i === 0) ctx.moveTo(0, y);
          else ctx.lineTo(i, y);
        });
        ctx.stroke();
      });
      requestAnimationFrame(draw);
    };

    const loop = () => {
      if (connected) push();
      requestAnimationFrame(loop);
    };

    push();
    draw();
    loop();
  }, [connected]);

  useEffect(() => () => clearInterval(mockRef.current), []);

  const toggleTraining = () => {
    setSaved(0);
    setTrainingMode((p) => !p);
  };

  // helper for arrow highlighting (fallback if CSS class not used)
  const arrowStyle = (active) => ({
    fontSize: "48px",
    opacity: active ? 1 : 0.35,
    transition: "0.2s",
  });

  return (
    <div className="panel-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="panel-title">BCI Control</div>
        <div className={`status ${connected ? "ok" : ""}`}>{status}</div>
      </div>

      {/* Arrows (perfectly centered, snap refs attached) */}
      <div className="brain-arrows" onMouseEnter={computeCenters}>
        <div
          className="arrow"
          ref={(el) => (targetRefs.current.UP = el)}
          style={arrowStyle(prediction === "UP")}
        >
          ↑
        </div>

        <div className="arrow-row">
          <div
            className="arrow"
            ref={(el) => (targetRefs.current.LEFT = el)}
            style={arrowStyle(prediction === "LEFT")}
          >
            ←
          </div>
          <div
            className="arrow"
            ref={(el) => (targetRefs.current.NEUTRAL = el)}
            style={arrowStyle(prediction === "NEUTRAL")}
          >
            •
          </div>
          <div
            className="arrow"
            ref={(el) => (targetRefs.current.RIGHT = el)}
            style={arrowStyle(prediction === "RIGHT")}
          >
            →
          </div>
        </div>

        <div
          className="arrow"
          ref={(el) => (targetRefs.current.DOWN = el)}
          style={arrowStyle(prediction === "DOWN")}
        >
          ↓
        </div>
      </div>

      {/* Output / training row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        <div className="output-label">
          <strong>Output:</strong> {prediction}
        </div>



      </div>

      {/* EEG graph */}
      <canvas ref={graphRef} width="310" height="150" className="eeg-box" />

      {/* Legend */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ color: "#00eaff" }}>Alpha</span> ·{" "}
        <span style={{ color: "#00ff90" }}>Beta</span> ·{" "}
        <span style={{ color: "#ffdd00" }}>Theta</span> ·{" "}
        <span style={{ color: "#ff3b3b" }}>Gamma</span>
      </div>

      {/* Connect */}
      <button className="main-btn" onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>
      <button
        className={`main-btn training-btn ${trainingMode ? "recording" : ""}`}
        onClick={toggleTraining}
        disabled={!connected}
        style={{ marginTop: 18 }}
      >
        {trainingMode ? "Recording…" : "Start Training"}
      </button>

      {trainingMode && (
        <div className="record-counter">
          {saved}
        </div>
      )}



    </div>
  );
}
