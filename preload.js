const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  togglePanel: () => ipcRenderer.send("toggle-panel"),
});