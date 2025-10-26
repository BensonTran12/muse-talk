const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");

let mainWindow;

// Prevent duplicate windows
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      sandbox: false,
    }
  });

  const devURL = "http://localhost:5173";
  const prodURL = path.join(__dirname, "dist", "index.html");

  // Try to load Vite dev server
  http.get(devURL, res => {
    mainWindow.loadURL(devURL); // <-- CRITICAL: load sidebar UI route
  }).on("error", () => {
    mainWindow.loadFile(prodURL);
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});