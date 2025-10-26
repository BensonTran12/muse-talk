import React from "react";
import { createRoot } from "react-dom/client";
import IconLauncher from "./IconLauncher.jsx";
import PanelRoot from "./PanelRoot.jsx";

console.log("✅ main.jsx loaded", window.location.pathname);

const rootEl = document.getElementById("root");

if (!rootEl) {
  console.error(" No #root element found");
}

const isPanel = window.location.pathname.includes("panel");
const App = isPanel ? <PanelRoot /> : <IconLauncher />;

createRoot(rootEl).render(App);
