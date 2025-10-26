const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

// Prevent multiple Electron instances (avoids double window bug)
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const devURL = 'http://localhost:5173';
  const prodPath = path.join(__dirname, 'dist', 'index.html');

  // Try to connect to Vite dev server; fallback to production build
  http
    .get(devURL, res => {
      if (res.statusCode === 200) {
        console.log('🧠 Vite dev server detected, loading from localhost');
        mainWindow.loadURL(devURL);
        mainWindow.webContents.openDevTools();
      } else {
        console.log('⚙️ No dev server, loading production build');
        mainWindow.loadFile(prodPath);
      }
    })
    .on('error', () => {
      console.log('⚙️ No dev server, loading production build');
      mainWindow.loadFile(prodPath);
    });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC example
ipcMain.on('toMain', (event, data) => {
  console.log('[Main Process] Received:', data);
  if (mainWindow) {
    mainWindow.webContents.send('fromMain', 'Message received!');
  }
});
