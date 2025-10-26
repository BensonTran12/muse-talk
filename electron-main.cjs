const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require("path");

let iconWindow;
let panelWindow;

function createWindows() {
  const display = screen.getPrimaryDisplay();
  const { width: screenW, height: screenH } = display.bounds;

  const ICON_SIZE = 64;
  const PANEL_W = 360;
  const PANEL_H = 700;

  // Position icon on the right side, vertically centered
  const ICON_X = screenW - ICON_SIZE - 10;
  const ICON_Y = Math.round(screenH / 2 - ICON_SIZE / 2);

  // ✅ ICON WINDOW
  iconWindow = new BrowserWindow({
    width: ICON_SIZE,
    height: ICON_SIZE,
    x: ICON_X,
    y: ICON_Y,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  iconWindow.loadURL("http://localhost:5173/icon.html");

  // ✅ PANEL WINDOW (hidden initially)
  panelWindow = new BrowserWindow({
    width: PANEL_W,
    height: PANEL_H,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  panelWindow.loadURL("http://localhost:5173/panel.html");

  iconWindow.on("closed", () => {
    iconWindow = null;
    if (panelWindow) panelWindow.close();
  });

  panelWindow.on("closed", () => {
    panelWindow = null;
  });
}

// ✅ IPC Controls
let panelOpen = false;

ipcMain.on("toggle-panel", () => {
  if (!iconWindow || !panelWindow) return;

  const { x, y } = iconWindow.getBounds();

  if (panelOpen) {
    panelWindow.hide();
    iconWindow.focus();
    panelOpen = false;
  } else {
    panelWindow.setPosition(x - 360, y - (700 - 64) / 2);
    panelWindow.show();
    panelWindow.focus();
    panelOpen = true;
  }
});

ipcMain.on("close-panel", () => {
  if (panelWindow) panelWindow.hide();
  if (iconWindow) iconWindow.focus();
});

app.whenReady().then(createWindows);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});