const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('algoUpdater', {
  isDesktop: true,
  getVersion: () => ipcRenderer.invoke('updater:get-version'),
  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  installUpdate: () => ipcRenderer.invoke('updater:install'),
  openDownload: (url) => ipcRenderer.invoke('updater:open-download', url),
  onStatus: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('updater:status', handler);
    return () => ipcRenderer.removeListener('updater:status', handler);
  },
});
