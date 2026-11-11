const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('node:path');

let obsClient = null;

async function getOBSClient() {
  if (!obsClient) {
    const { default: OBSWebSocket } = await import('obs-websocket-js');
    obsClient = new OBSWebSocket();
  }
  return obsClient;
}

ipcMain.handle('obs:connect', async (_event, { host, port, password }) => {
  const client = await getOBSClient();
  if (client.identified) {
    try { await client.disconnect(); } catch {}
  }
  await client.connect(`ws://${host}:${port}`, password || undefined);
  return true;
});

ipcMain.handle('obs:disconnect', async () => {
  if (obsClient) {
    try { await obsClient.disconnect(); } finally { obsClient = null; }
  }
  return true;
});

ipcMain.handle('obs:request', async (_event, requestType, requestData) => {
  if (!obsClient || !obsClient.identified) throw new Error('Сначала подключись к OBS');
  return obsClient.call(requestType, requestData || {});
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 1080, minHeight: 700,
    backgroundColor: '#0b0814', title: 'STREAMX STUDIO',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  if (obsClient) { try { obsClient.disconnect(); } catch {} }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
