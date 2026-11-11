const { contextBridge } = require('electron');
contextBridge.exposeInMainWorld('streamx', {
  platform: process.platform,
  version: '0.1.0'
});