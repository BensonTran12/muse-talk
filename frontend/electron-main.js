const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')


let mainWindow


function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    })


    const devURL = 'http://localhost:5173'
    const prodPath = path.join(__dirname, 'dist', 'index.html')


    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL(devURL)
        mainWindow.webContents.openDevTools()
    } else {
        mainWindow.loadFile(prodPath)
    }
}


app.whenReady().then(() => {
    createWindow()


    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
})


app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})


// Example IPC channel
ipcMain.on('toMain', (event, data) => {
    console.log('[Main Process] Received:', data)
    mainWindow.webContents.send('fromMain', 'Message received!')
})