const { contextBridge, ipcRenderer } = require('electron');

// Main Electron API for generic communication
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => {
    const validChannels = ['toMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },

  on: (channel, callback) => {
    const validChannels = ['fromMain'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  }
});

// Dedicated bridge for Muse → Python → Electron communication
contextBridge.exposeInMainWorld('museAPI', {
  start: () => ipcRenderer.invoke('muse:start'),
  stop: () => ipcRenderer.invoke('muse:stop'),
  onStatus: (callback) => ipcRenderer.on('muse:status', (_, msg) => callback(msg)),
  onData: (callback) => ipcRenderer.on('muse:data', (_, data) => callback(data))
});
