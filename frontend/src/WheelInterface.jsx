import React, { useState, useEffect } from 'react';
import './WheelStyles.css'; // New dedicated CSS file

// --- CONFIGURATION CONSTANTS (WHEEL DATA) ---
const WHEEL_DATA = {
  ROOT: {
    items: [
      { name: "Words/Phrases", child: "WORDSPHRASES" },
      { name: "Letters/Characters", child: "LETTERSCHARACTERS" },
    ],
  },
  WORDSPHRASES: {
    items: [
      { name: "Hello!" }, { name: "Thank you." }, { name: "Yes." }, { name: "No." }, { name: "I don't understand" },
    ],
  },
  LETTERSCHARACTERS: {
    items: [
      { name: "#", child: "NUMBERS" }, { name: "A-I", child: "AI" }, { name: "J-Q", child: "JQ" }, { name: "R-Z", child: "RZ" },
    ],
  },
  NUMBERS: { items: Array.from({ length: 10 }, (_, i) => ({ name: `${i}` })) },
  AI: { items: "ABCDEFGHI".split('').map(char => ({ name: char })) },
  JQ: { items: "JKLMNOPQ".split('').map(char => ({ name: char })) },
  RZ: { items: "RSTUVWXYZ".split('').map(char => ({ name: char })) },
};

// Maps BCI directions to a command type
const COMMAND_MAP = {
  LEFT: 'ROTATE_CCW',
  RIGHT: 'ROTATE_CW',
  UP: 'SELECT',
  DOWN: 'BACK',
  NEUTRAL: 'NONE',
};

// --- RENDERING HELPERS ---
const getRotation = (numItems, index) => {
  if (numItems === 0) return 0;
  const anglePerItem = 360 / numItems;
  return -(index * anglePerItem) + (anglePerItem / 2);
};

const renderWheelLayer = (wheelKey, index, totalLayers, layerIndex) => {
  const wheel = WHEEL_DATA[wheelKey];
  if (!wheel) return null;

  const numItems = wheel.items.length;
  const rotation = getRotation(numItems, index);
  const wheelSize = 100 + layerIndex * 150;

  return (
    <div
      key={wheelKey}
      className="wheelLayer"
      style={{
        width: `${wheelSize}px`,
        height: `${wheelSize}px`,
        transform: `rotate(${rotation}deg)`,
        zIndex: totalLayers - layerIndex,
      }}
    >
      {wheel.items.map((item, i) => (
        <div
          key={i}
          className="wheelSlice"
          style={{
            borderColor: i === index ? '#00eaff' : 'lightgray',
            transform: `rotate(${i * (360 / numItems)}deg) skewY(${90 - (360 / numItems)}deg)`,
            backgroundColor: i === index ? 'rgba(0, 234, 255, 0.2)' : 'transparent',
          }}
        >
          <div className="sliceContent">{item.name}</div>
        </div>
      ))}
    </div>
  );
};


export default function WheelInterface({ prediction, isVisible }) {
    // Wheel/Navigation States
    const [activeWheelKey, setActiveWheelKey] = useState("ROOT");
    const [history, setHistory] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // --- NAVIGATION COMMAND HANDLER ---
    const handleCommand = (command) => {
        if (!WHEEL_DATA[activeWheelKey]) return;
        
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
                    console.log(`FINAL SELECTION: Executing command for ${selectedItem.name}`);
                    // Execute final BCI action here
                }
                break;
            case 'BACK':
                if (history.length > 0) {
                    const lastKey = history[history.length - 1];
                    setHistory(prev => prev.slice(0, -1));
                    setActiveWheelKey(lastKey);
                    setSelectedIndex(0);
                }
                // Note: The visibility prop 'isVisible' now handles the full closure.
                break;
            default:
                break;
        }
    };

    // --- EFFECT HOOK: BCI Prediction -> Command Execution ---
    useEffect(() => {
        // Only run if the wheel is visible to the user
        if (!isVisible || prediction === "NEUTRAL" || prediction === "…thinking…") {
            return;
        }
        
        const command = COMMAND_MAP[prediction];
        if (command && command !== 'NONE') {
            handleCommand(command);
        }
    }, [prediction, isVisible]); // Dependency on the BCI output passed from parent

    // Get all keys of active and parent wheels to render
    const wheelKeysToRender = [activeWheelKey, ...history].reverse();
    const totalLayers = wheelKeysToRender.length;
    
    // Reset state when component is hidden and then shown again
    useEffect(() => {
        if (isVisible) {
            setActiveWheelKey("ROOT");
            setHistory([]);
            setSelectedIndex(0);
        }
    }, [isVisible]);


    return (
        <div className="wheel-container">
            <p className="wheel-status-text">
                Layer: {activeWheelKey} | Item: {WHEEL_DATA[activeWheelKey].items[selectedIndex]?.name}
            </p>
            <div className="wheelDisplay">
                {wheelKeysToRender.map((key, index) =>
                    renderWheelLayer(key, key === activeWheelKey ? selectedIndex : 0, totalLayers, index)
                )}
            </div>
            <div className="debug-info">
                <p>History: [{history.join(' > ')}]</p>
            </div>
        </div>
    );
}