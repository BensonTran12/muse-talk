import React from "react";
import IconLauncher from "./IconLauncher.jsx";
import PanelRoot from "./PanelRoot.jsx";

export default function App() {
  const hash = window.location.hash.replace("#", "");

  if (hash === "panel") {
    return <PanelRoot />;
  }

  return <IconLauncher />;
}
