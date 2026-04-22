const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (app.dock) app.dock.hide();
      return false;
    }
  });

  mainWindow.on('show', () => {
    if (app.dock) app.dock.show();
  });

  // Setup IPC handlers
  const { setupIpcHandlers } = require('./src/main/ipcHandlers');
  setupIpcHandlers(mainWindow);
}

app.whenReady().then(() => {
  createWindow();

  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  if (process.platform === 'darwin') {
    tray.setTitle('Tetra');
  }
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => { 
        if (mainWindow) {
          mainWindow.show(); 
          if (app.dock) app.dock.show();
        }
      } 
    },
    { type: 'separator' },
    { label: 'Quit Tetra', click: () => { 
        isQuitting = true; 
        app.quit(); 
      } 
    }
  ]);
  
  tray.setToolTip('Tetra Server');
  tray.setContextMenu(contextMenu);
  
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
        if (app.dock) app.dock.hide();
      } else {
        mainWindow.show();
        if (app.dock) app.dock.show();
      }
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      if (app.dock) app.dock.show();
    } else if (mainWindow) {
      mainWindow.show();
      if (app.dock) app.dock.show();
    }
  });
});

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  // Do nothing to keep the app running in the background.
});