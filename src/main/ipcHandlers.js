const { app, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const serverManager = require('./serverManager');

function setupIpcHandlers(mainWindow) {
  
  // Helper to send logs to the frontend
  const onLog = (type, message) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (type === 'error') {
        mainWindow.webContents.send('server-error', { type, message });
      } else {
        mainWindow.webContents.send('server-log', { type, message });
      }
    }
  };

  ipcMain.handle('start-server', async (event, settings, routes) => {
    try {
      const port = settings && settings.port ? parseInt(settings.port) : null;
      if (!port) throw new Error('Invalid port');
      
      await serverManager.startServer(port, settings, routes, onLog);
      return true;
    } catch (err) {
      onLog('error', err.message);
      throw err;
    }
  });

  ipcMain.handle('stop-server', async () => {
    try {
      await serverManager.stopServer();
      onLog('info', 'Server stopped');
      return true;
    } catch (err) {
      onLog('error', `Failed to stop server: ${err.message}`);
      throw err;
    }
  });

  ipcMain.handle('check-port', async (event, portRaw) => {
    const port = parseInt(portRaw);
    return await serverManager.checkPortAvailability(port);
  });

  ipcMain.handle('restart-server', async (event, settings, routes) => {
    try {
      const port = settings && settings.port ? parseInt(settings.port) : null;
      if (!port) throw new Error('Invalid port');
      
      await serverManager.startServer(port, settings, routes, onLog);
      return true;
    } catch (err) {
      onLog('error', err.message);
      throw err;
    }
  });

  ipcMain.handle('load-data', () => {
    try {
      const configPath = path.join(app.getPath('userData'), 'config.json');
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (err) {
      console.error('Failed to load data:', err);
      return null;
    }
  });

  ipcMain.handle('save-data', (event, data) => {
    try {
      // Basic validation: ensure data is an object
      if (typeof data !== 'object' || data === null) {
        throw new Error('Data must be an object');
      }
      const configPath = path.join(app.getPath('userData'), 'config.json');
      fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
      return true;
    } catch (err) {
      console.error('Failed to save data:', err);
      return false;
    }
  });
}

module.exports = { setupIpcHandlers };
