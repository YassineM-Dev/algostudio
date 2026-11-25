const { app, BrowserWindow, Menu, protocol, net, shell, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const { autoUpdater } = require('electron-updater');

// Register custom secure scheme so Monaco Workers, ES modules, localStorage, and PDFs work seamlessly
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'algostudio',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

const DIST_DIR = path.join(__dirname, '..', 'dist');
const ICON_PATH = path.join(__dirname, '..', 'build', 'icon.png');
const PRELOAD_PATH = path.join(__dirname, 'preload.cjs');
const PKG_PATH = path.join(__dirname, '..', 'package.json');

let mainWindow = null;

function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', payload);
  }
}

function isPublishConfigured() {
  try {
    const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf-8'));
    const pub = pkg?.build?.publish;
    const entry = Array.isArray(pub) ? pub[0] : pub;
    if (!entry) return false;
    if (entry.provider === 'github') {
      return Boolean(
        entry.owner &&
          entry.repo &&
          !String(entry.owner).includes('VOTRE_COMPTE')
      );
    }
    if (entry.provider === 'generic') {
      return Boolean(entry.url && !String(entry.url).includes('VOTRE_'));
    }
    return true;
  } catch {
    return false;
  }
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({ state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus({ state: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      state: 'downloading',
      percent: Math.round(progress.percent || 0),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus({ state: 'downloaded', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    sendUpdateStatus({ state: 'up-to-date', version: app.getVersion() });
  });

  autoUpdater.on('error', (err) => {
    sendUpdateStatus({
      state: 'error',
      message: err?.message || 'Impossible de vérifier les mises à jour.',
    });
  });

  ipcMain.handle('updater:get-version', () => app.getVersion());

  ipcMain.handle('updater:check', async () => {
    if (!app.isPackaged) {
      sendUpdateStatus({
        state: 'up-to-date',
        version: app.getVersion(),
        message: 'Mode développement local (v' + app.getVersion() + ').',
      });
      return;
    }
    if (!isPublishConfigured()) {
      sendUpdateStatus({
        state: 'not-configured',
        version: app.getVersion(),
        message:
          'Auto-update prêt : renseignez votre compte GitHub dans package.json pour distribuer les mises à jour.',
      });
      return;
    }
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      sendUpdateStatus({
        state: 'error',
        message: err?.message || 'Erreur lors de la vérification.',
      });
    }
  });

  ipcMain.handle('updater:install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  // Silent background check 5s after launch + every 4 hours when packaged and configured
  if (app.isPackaged && isPublishConfigured()) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 5000);
    setInterval(() => {
      autoUpdater.checkForUpdates().catch(() => {});
    }, 4 * 60 * 60 * 1000);
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1380,
    height: 860,
    minWidth: 960,
    minHeight: 620,
    title: "AlgoStudio — IDE d'Algorithmique & Bac Informatique",
    backgroundColor: '#0B0B0F',
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: PRELOAD_PATH,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      plugins: true,
    },
  });

  Menu.setApplicationMenu(null);

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open local Guide PDF & kiteb.net Bac PDFs in a clean dedicated PDF window; external pages in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isLocalApp = url.startsWith('algostudio://');
    const isKitebPdf = /^https?:\/\/(www\.)?kiteb\.net\/.+\.pdf$/i.test(url);

    if (isLocalApp || isKitebPdf) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1080,
          height: 820,
          title: isKitebPdf
            ? 'Sujet Bac Informatique (kiteb.net) — AlgoStudio'
            : "Guide Complet d'Algorithmique — AlgoStudio",
          backgroundColor: '#0B0B0F',
          icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
          autoHideMenuBar: true,
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: true,
            plugins: true,
          },
        },
      };
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    mainWindow.loadURL(devUrl);
  } else {
    mainWindow.loadURL('algostudio://app/index.html');
  }
}

app.whenReady().then(() => {
  protocol.handle('algostudio', (request) => {
    const urlObj = new URL(request.url);
    let pathname = decodeURIComponent(urlObj.pathname);
    if (!pathname || pathname === '/') {
      pathname = '/index.html';
    }

    const safeRel = path.normalize(pathname).replace(/^([/\\])+/, '');
    const candidate = path.resolve(DIST_DIR, safeRel);

    if (!candidate.startsWith(DIST_DIR)) {
      return new Response('Forbidden', { status: 403 });
    }

    const finalPath =
      fs.existsSync(candidate) && fs.statSync(candidate).isFile()
        ? candidate
        : path.join(DIST_DIR, 'index.html');

    return net.fetch(pathToFileURL(finalPath).toString());
  });

  setupAutoUpdater();
  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
