import React, { useState } from "react";
import BrainUI from "./BrainUI.jsx";
import brainIcon from "./brain.png";
import "./BrainStyles.css";

export default function BrainToggle() {
  const [open, setOpen] = useState(false);

  const toggleUI = () => setOpen(prev => !prev);

  
  return (
    <>
    <img
    src={brainIcon}
    alt="BCI Control"
    className={`brain-icon ${open ? "active" : ""}`}
    onClick={toggleUI}
    title="BCI Control"
    />


      {/* dim overlay */}
      {open && <div className="panel-overlay" onClick={toggleUI} />}

      {/* slide-out panel */}
      <div className={`brain-panel ${open ? "open" : ""}`}>
        <BrainUI />
      </div>
    </>
  );
}
