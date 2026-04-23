const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');
const serverManager = require('./src/main/serverManager');

const APP_NAME = 'Tetra';
app.setName(APP_NAME);
process.title = APP_NAME;

let mainWindow = null;
let tray = null;
let isQuitting = false;
let hasCleanedUpServers = false;

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
    app.quit();
}

function resolveLogoPath() {
    const candidates = [
        path.join(app.getAppPath(), 'logo.png'),
        path.join(__dirname, 'logo.png'),
        path.join(process.cwd(), 'logo.png'),
    ];

    return candidates.find(candidate => fs.existsSync(candidate));
}

const logoPath = resolveLogoPath();

function getAppIcon() {
    if (!logoPath) {
        return undefined;
    }

    const image = nativeImage.createFromPath(logoPath);
    return image.isEmpty() ? undefined : image;
}

function getTrayIcon() {
    if (!logoPath) {
        return nativeImage.createEmpty();
    }

    const image = nativeImage.createFromPath(logoPath);
    if (image.isEmpty()) {
        return nativeImage.createEmpty();
    }

    if (process.platform === 'darwin') {
        return image.resize({ width: 24, height: 24 });
    }

    return image.resize({ width: 24, height: 24 });
}

function ensureDockIcon() {
    if (process.platform !== 'darwin' || !app.dock) {
        return;
    }

    if (logoPath) {
        const icon = nativeImage.createFromPath(logoPath);
        if (!icon.isEmpty()) {
            const dockIcon = icon.resize({ width: 128, height: 128 });
            app.dock.setIcon(dockIcon);
            setTimeout(() => {
                app.dock.setIcon(dockIcon);
            }, 200);
        }
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        title: APP_NAME,
        icon: getAppIcon(),
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
    if (app.dock) {
        app.dock.show();
    }
    ensureDockIcon();
     });

    const { setupIpcHandlers } = require('./src/main/ipcHandlers');
    setupIpcHandlers(mainWindow);
}

app.whenReady().then(async () => {
    await serverManager.cleanupManagedPodmanContainers();
    ensureDockIcon();
    createWindow();

    app.on('browser-window-created', () => {
        ensureDockIcon();
    });

    app.on('second-instance', () => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore();
            }
            mainWindow.show();
            mainWindow.focus();
            if (app.dock) {
                app.dock.show();
            }
        }
    });

    ensureDockIcon();

    if (tray) {
        tray.destroy();
    }
    tray = new Tray(getTrayIcon());

    const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => {
        if (mainWindow) {
          mainWindow.show();
                    if (app.dock) app.dock.show();
                    ensureDockIcon();
        }
      }
    },
    { type: 'separator' },
        { label: `Quit ${APP_NAME}`, click: () => {
        isQuitting = true;
        app.quit();
      }
    }
     ]);

        tray.setToolTip(`${APP_NAME} Server`);
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
                if (app.dock)
                    app.dock.hide();
        } else {
            mainWindow.show();
            if (app.dock)
                app.dock.show();
            ensureDockIcon();
        }
        }
    });

  app.on('activate', () => {
        ensureDockIcon();
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        if (app.dock)
            app.dock.show();
        } else if (mainWindow) {
            mainWindow.show();
            if (app.dock)
                app.dock.show();
        }
    });
});

app.on('before-quit', () => {
    isQuitting = true;
});

app.on('will-quit', async (event) => {
    if (hasCleanedUpServers) {
        return;
    }

    event.preventDefault();
    hasCleanedUpServers = true;

    try {
        await serverManager.stopServer();
    } catch (err) {
        console.error('Failed to stop servers on quit:', err);
    }

    if (tray) {
        tray.destroy();
        tray = null;
    }

    app.exit(0);
});

app.on('window-all-closed', () => {
  // Do nothing to keep the app running in the background.
});
