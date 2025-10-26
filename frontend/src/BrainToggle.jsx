import React, { useEffect, useState, useRef } from "react";
import BrainUI from "./BrainUI.jsx";
import brainIcon from "./brain.png";
import "./BrainStyles.css";

export default function BrainToggle() {
  const [open, setOpen] = useState(false);
  const iconRef = useRef(null);

  const applyIconRegion = () => {
    if (!window.electronAPI || !iconRef.current) return;
    const rect = iconRef.current.getBoundingClientRect();

    window.electronAPI.setInteractiveRegion({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  };

  useEffect(() => {
    // Closed default: only icon clickable
    window.electronAPI?.setWindowPassThrough(true);
    applyIconRegion();

    const update = () => applyIconRegion();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const openPanel = () => {
    setOpen(true);

    if (window.electronAPI) {
      // Accept input everywhere
      window.electronAPI.setWindowPassThrough(false);
      window.electronAPI.setInteractiveRegion(null);

      // Grow window to panel
      window.electronAPI.resizeWindow({ width: 360, height: 700 });
      window.electronAPI.focusWindow?.();
    }
  };

  const closePanel = () => {
    setOpen(false);

    if (window.electronAPI) {
      // Click-through besides icon
      window.electronAPI.setWindowPassThrough(true);

      // Shrink to icon size
      window.electronAPI.resizeWindow({ width: 56, height: 56 });

      // Reapply icon-only region
      setTimeout(applyIconRegion, 10);
    }
  };
  const toggleUI = () => {
  if (open) {
    window.electronAPI.send("close-panel");
  } else {
    window.electronAPI.send("open-panel");
  }
  setOpen(prev => !prev);
};


  return (
    <>
      <img
        ref={iconRef}
        src={brainIcon}
        alt="BCI Control"
        className={`brain-icon ${open ? "active" : ""}`}
        onClick={() => (open ? closePanel() : openPanel())}
        title="BCI Control"
      />

      {open && (
        <>
          <div className="panel-overlay" onClick={closePanel} />
          <div className="brain-panel open">
            <BrainUI />
          </div>
        </>
      )}
    </>
  );
}
