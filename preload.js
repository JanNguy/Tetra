const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  startServer: (settings, routes) => ipcRenderer.invoke('start-server', settings, routes),
  stopServer: () => ipcRenderer.invoke('stop-server'),
  checkPort: (port) => ipcRenderer.invoke('check-port', port),
  restartServer: (settings, routes) => ipcRenderer.invoke('restart-server', settings, routes),
  loadData: () => ipcRenderer.invoke('load-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  onServerLog: (callback) => ipcRenderer.on('server-log', callback),
  onServerError: (callback) => ipcRenderer.on('server-error', callback),
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('server-log');
    ipcRenderer.removeAllListeners('server-error');
  }
});
