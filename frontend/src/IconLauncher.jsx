import React from "react";
import brainImg from "./brain.png";

export default function IconLauncher() {
  return (
    <div
      style={{
        width: "48px",
        height: "48px",
        borderRadius: "50%",
        backgroundImage: `url(${brainImg})`,
        backgroundSize: "cover",
        cursor: "pointer",
      }}
      onClick={() => window.electronAPI.togglePanel()}
    />
  );
}
