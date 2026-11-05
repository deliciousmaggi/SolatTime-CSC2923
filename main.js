// main.js - Electron main process: creates the application window.
const { app, BrowserWindow, session } = require('electron');
const path = require('path');

const API_URLS = [
  'https://api.waktusolat.app/*',
  'https://api.alquran.cloud/*',
];

function allowApiRequests() {
  session.defaultSession.webRequest.onHeadersReceived({ urls: API_URLS }, (details, callback) => {
    const headers = {};
    for (const [name, value] of Object.entries(details.responseHeaders)) {
      if (name.toLowerCase() !== 'access-control-allow-origin') {
        headers[name] = value;
      }
    }
    headers['Access-Control-Allow-Origin'] = ['*'];
    callback({ responseHeaders: headers });
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1180,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'SolatTime',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.openDevTools();   // remove the // to open the Console on start
}

app.whenReady().then(() => {
  allowApiRequests();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});