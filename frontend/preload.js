const { contextBridge, ipcRenderer } = require('electron')


// Safely expose limited Electron API to the renderer
contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => {
        const validChannels = ['toMain']
        if (validChannels.includes(channel)) {
            ipcRenderer.send(channel, data)
        }
    },


    on: (channel, callback) => {
        const validChannels = ['fromMain']
        if (validChannels.includes(channel)) {
            ipcRenderer.on(channel, (event, ...args) => callback(...args))
        }
    }
})