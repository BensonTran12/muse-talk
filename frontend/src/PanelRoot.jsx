import React from "react";
import BrainUI from "./BrainUI.jsx";
import "./BrainStyles.css";

export default function PanelRoot() {
  const close = () => window.electronAPI?.closePanel();

  return (
    <>
      <div className="brain-panel open">
        <BrainUI />
      </div>
      {/* optional dim overlay INSIDE the panel window; click to close */}
      <div className="panel-overlay" onClick={close} />
    </>
  );
}
