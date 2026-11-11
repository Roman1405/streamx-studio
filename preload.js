const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('streamx', {
  platform: process.platform,
  version: '0.1.0',
  obsConnect: (settings) => ipcRenderer.invoke('obs:connect', settings),
  obsDisconnect: () => ipcRenderer.invoke('obs:disconnect'),
  obsRequest: (requestType, requestData) => ipcRenderer.invoke('obs:request', requestType, requestData)
});
