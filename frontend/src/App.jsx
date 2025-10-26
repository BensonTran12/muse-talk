import React from "react";
import BrainUI from "./BrainUI.jsx";
import BrainToggle from "./BrainToggle.jsx";

const SNAP_DISTANCE = 80; // Cursor must be within 80 pixels of a target center to snap.
const MOCK_INTERVAL = 700; // Time between fake BCI predictions

// --- aim assist - calculates distance between cursor and UI element ---
const calculateDistance = (p1, p2) => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export default function App() {
  return (
    <>
      <BrainToggle />
    </>
  );
}
