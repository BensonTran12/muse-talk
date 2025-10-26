// BrainUI.jsx — FINAL POLISHED VERSION 
import React, { useState, useEffect, useRef } from "react";

const DIR = ["UP", "DOWN", "LEFT", "RIGHT", "NEUTRAL"];

const WASD_MAP = {
  UP: "w",
  DOWN: "s",
  LEFT: "a",
  RIGHT: "d",
  NEUTRAL: null
};

const SNAP_DISTANCE = 80;
const MOCK_INTERVAL = 700;

const distance = (p1, p2) => Math.hypot(p1.x - p2.x, p1.y - p2.y);

export default function BrainUI() {
  const [status, setStatus] = useState("Disconnected");
  const [prediction, setPrediction] = useState("…thinking…");
  const [connected, setConnected] = useState(false);
  const [trainingMode, setTrainingMode] = useState(false);
  const [saved, setSaved] = useState(0);

  const [cursor, setCursor] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  });

  const graphRef = useRef(null);
  const mockRef = useRef(null);

  const targetRefs = useRef({
    UP: null,
    DOWN: null,
    LEFT: null,
    RIGHT: null,
    NEUTRAL: null
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

  const startMockPredictions = () => {
    if (mockRef.current) clearInterval(mockRef.current);
    mockRef.current = setInterval(() => {
      const r = DIR[Math.floor(Math.random() * DIR.length)];
      setPrediction(r);
      if (trainingMode) setSaved(prev => prev + 1);
    }, MOCK_INTERVAL);
  };

  useEffect(() => {
    const update = e => setCursor({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", update);
    return () => window.removeEventListener("mousemove", update);
  }, []);

  const computeCenters = () => {
    targetCenters.current = Object.entries(targetRefs.current)
      .map(([id, el]) => {
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return { id, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      })
      .filter(Boolean);
  };

  useEffect(() => {
    computeCenters();
    window.addEventListener("resize", computeCenters);
    return () => window.removeEventListener("resize", computeCenters);
  }, []);

  useEffect(() => {
    if (!connected || prediction === "…thinking…") return;

    if (trainingMode) setSaved(p => p + 1);

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
  }, [prediction, connected]); // eslint-disable-line

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

    const series = { alpha: [], beta: [], theta: [], gamma: [] };

    const push = () => {
      series.alpha.push(Math.random() * 40 + 60);
      series.beta.push(Math.random() * 35 + 55);
      series.theta.push(Math.random() * 30 + 50);
      series.gamma.push(Math.random() * 25 + 45);
      Object.keys(series).forEach(k => {
        if (series[k].length > W) series[k].shift();
      });
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      Object.keys(series).forEach(k => {
        ctx.strokeStyle = colors[k];
        ctx.beginPath();
        series[k].forEach((v, i) => {
          const min = 30, max = 110;
          const y = H - ((v - min) / (max - min)) * H;
          i === 0 ? ctx.moveTo(0, y) : ctx.lineTo(i, y);
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
    setTrainingMode(p => !p);
  };

  const arrowStyle = active => ({
    fontSize: "44px",
    opacity: active ? 1 : 0.32,
    transition: "0.15s"
  });

  return (
    <div className="panel-container">
      {/* HEADER */}
      <div className="panel-header">
        <div className="panel-title">BCI Control</div>
        <div className={`status ${connected ? "ok" : ""}`}>{status}</div>
      </div>

      {/* ARROWS */}
      <div className="brain-arrows" onMouseEnter={computeCenters}>
        <div ref={el => (targetRefs.current.UP = el)} style={arrowStyle(prediction === "UP")}>↑</div>

        <div className="arrow-row">
          <div ref={el => (targetRefs.current.LEFT = el)} style={arrowStyle(prediction === "LEFT")}>←</div>
          <div ref={el => (targetRefs.current.NEUTRAL = el)} style={arrowStyle(prediction === "NEUTRAL")}>•</div>
          <div ref={el => (targetRefs.current.RIGHT = el)} style={arrowStyle(prediction === "RIGHT")}>→</div>
        </div>

        <div ref={el => (targetRefs.current.DOWN = el)} style={arrowStyle(prediction === "DOWN")}>↓</div>
      </div>

      {/* OUTPUT + TRAINING */}
      <div className="output-row">
        <strong>Output:</strong> {prediction}
      </div>

      <canvas ref={graphRef} width="310" height="115" className="eeg-box" />

      <div className="legend">
        <span className="a">Alpha</span> · <span className="b">Beta</span> · <span className="t">Theta</span> · <span className="g">Gamma</span>
      </div>

      <button className="main-btn connect-btn" onClick={toggleConnect}>
        {connected ? "Disconnect" : "Connect Headset"}
      </button>

      <button
        className={`main-btn train-btn ${trainingMode ? "recording" : ""}`}
        onClick={toggleTraining}
        disabled={!connected}
      >
        {trainingMode ? "Recording" : "Start Training"}
      </button>

      {trainingMode && (
        <div className="save-count">{saved}</div>
      )}
    </div>
  );
}
