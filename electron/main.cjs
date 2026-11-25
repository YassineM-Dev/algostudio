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

const GITHUB_OWNER = 'King-Joyboy';
const GITHUB_REPO = 'algostudio';
const GITHUB_RELEASES_BASE = `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/releases`;
const GITHUB_LATEST_API = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
const DIRECT_SETUP_URL = `${GITHUB_RELEASES_BASE}/latest/download/AlgoStudio-Setup.exe`;
const DIRECT_PORTABLE_URL = `${GITHUB_RELEASES_BASE}/latest/download/AlgoStudio-Portable.exe`;

let mainWindow = null;
let isManualUpdateCheck = false;
let isCheckingUpdate = false;

function logUpdater(message) {
  try {
    const logPath = path.join(app.getPath('userData'), 'updater.log');
    const line = `[${new Date().toISOString()}] ${message}\n`;
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch {
    // ignore logging failure
  }
}

function sendUpdateStatus(payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('updater:status', payload);
  }
}

function isPortableRun() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) return true;
  if (!app.isPackaged) return false;
  const appUpdateYml = path.join(process.resourcesPath, 'app-update.yml');
  return !fs.existsSync(appUpdateYml);
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

function parseSemver(v) {
  const clean = String(v || '')
    .trim()
    .replace(/^v/i, '')
    .split('-')[0];
  const parts = clean.split('.').map((n) => Number.parseInt(n, 10) || 0);
  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
}

function isNewerVersion(remoteVersion, currentVersion) {
  const r = parseSemver(remoteVersion);
  const c = parseSemver(currentVersion);
  for (let i = 0; i < 3; i++) {
    if (r[i] > c[i]) return true;
    if (r[i] < c[i]) return false;
  }
  return false;
}

async function checkLatestReleaseViaGitHubApi() {
  const res = await net.fetch(GITHUB_LATEST_API, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': `AlgoStudio/${app.getVersion()}`,
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub API HTTP ${res.status}`);
  }
  const data = await res.json();
  const latestVersion = String(data.tag_name || '').replace(/^v/i, '').trim();
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const portable = isPortableRun();

  const preferredAsset = assets.find((a) =>
    portable
      ? /portable.*\.exe$/i.test(a.name || '')
      : /setup.*\.exe$/i.test(a.name || '')
  );

  const downloadUrl =
    preferredAsset?.browser_download_url ||
    (portable ? DIRECT_PORTABLE_URL : DIRECT_SETUP_URL);

  return {
    latestVersion,
    downloadUrl,
    hasUpdate: Boolean(latestVersion && isNewerVersion(latestVersion, app.getVersion())),
  };
}

function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.logger = {
    info: (m) => logUpdater(`INFO: ${m}`),
    warn: (m) => logUpdater(`WARN: ${m}`),
    error: (m) => logUpdater(`ERROR: ${m}`),
    debug: () => {},
  };

  autoUpdater.on('checking-for-update', () => {
    logUpdater('checking-for-update');
    if (isManualUpdateCheck) {
      sendUpdateStatus({ state: 'checking' });
    }
  });

  autoUpdater.on('update-available', (info) => {
    logUpdater(`update-available: ${info.version}`);
    sendUpdateStatus({ state: 'available', version: info.version });
  });

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus({
      state: 'downloading',
      percent: Math.round(progress.percent || 0),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    logUpdater(`update-downloaded: ${info.version}`);
    sendUpdateStatus({ state: 'downloaded', version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    logUpdater(`update-not-available (current v${app.getVersion()})`);
    if (isManualUpdateCheck) {
      sendUpdateStatus({ state: 'up-to-date', version: app.getVersion() });
    }
  });

  autoUpdater.on('error', async (err) => {
    const rawMsg = err?.message || 'Impossible de vérifier les mises à jour.';
    logUpdater(`updater error: ${rawMsg}`);

    // Fallback: check GitHub API directly so users still get a 1-click download button if auto-updater hits an issue
    try {
      const gh = await checkLatestReleaseViaGitHubApi();
      if (gh.hasUpdate) {
        logUpdater(`fallback detected v${gh.latestVersion} -> ${gh.downloadUrl}`);
        sendUpdateStatus({
          state: 'manual-download',
          version: gh.latestVersion,
          downloadUrl: gh.downloadUrl,
          message: `Nouvelle version v${gh.latestVersion} disponible.`,
        });
        return;
      }
      if (isManualUpdateCheck) {
        sendUpdateStatus({ state: 'up-to-date', version: app.getVersion() });
      }
      return;
    } catch (fallbackErr) {
      logUpdater(`fallback failed: ${fallbackErr?.message || fallbackErr}`);
    }

    if (isManualUpdateCheck) {
      sendUpdateStatus({
        state: 'error',
        message: 'Impossible de contacter GitHub. Vérifiez votre connexion Internet.',
      });
    }
  });

  async function runUpdateCheck(manual) {
    if (isCheckingUpdate) return;
    isCheckingUpdate = true;
    isManualUpdateCheck = manual;

    try {
      if (!app.isPackaged) {
        if (manual) {
          sendUpdateStatus({
            state: 'up-to-date',
            version: app.getVersion(),
            message: `Mode développement local (v${app.getVersion()}).`,
          });
        }
        return;
      }

      if (!isPublishConfigured()) {
        if (manual) {
          sendUpdateStatus({
            state: 'not-configured',
            version: app.getVersion(),
            message:
              'Auto-update prêt : renseignez votre compte GitHub dans package.json pour distribuer les mises à jour.',
          });
        }
        return;
      }

      // Portable build cannot self-replace via NSIS: check GitHub API and offer 1-click download
      if (isPortableRun()) {
        if (manual) {
          sendUpdateStatus({ state: 'checking' });
        }
        logUpdater('portable mode detected — checking GitHub API');
        const gh = await checkLatestReleaseViaGitHubApi();
        if (gh.hasUpdate) {
          sendUpdateStatus({
            state: 'manual-download',
            version: gh.latestVersion,
            downloadUrl: gh.downloadUrl,
            message: `Version Portable : v${gh.latestVersion} disponible !`,
          });
        } else if (manual) {
          sendUpdateStatus({
            state: 'up-to-date',
            version: app.getVersion(),
            message: `AlgoStudio Portable est à jour (v${app.getVersion()}).`,
          });
        }
        return;
      }

      await autoUpdater.checkForUpdates();
    } catch (err) {
      logUpdater(`runUpdateCheck error: ${err?.message || err}`);
      if (manual) {
        sendUpdateStatus({
          state: 'error',
          message: 'Impossible de vérifier les mises à jour. Vérifiez votre connexion Internet.',
        });
      }
    } finally {
      isCheckingUpdate = false;
    }
  }

  ipcMain.handle('updater:get-version', () => app.getVersion());

  ipcMain.handle('updater:check', async () => {
    await runUpdateCheck(true);
  });

  ipcMain.handle('updater:install', () => {
    logUpdater('user clicked install — calling quitAndInstall(false, true)');
    setImmediate(() => {
      autoUpdater.quitAndInstall(false, true);
    });
  });

  ipcMain.handle('updater:open-download', async (_event, url) => {
    const target =
      typeof url === 'string' &&
      url.startsWith(`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/`)
        ? url
        : isPortableRun()
          ? DIRECT_PORTABLE_URL
          : DIRECT_SETUP_URL;
    await shell.openExternal(target);
  });

  // Silent background check 4s after launch + every 4 hours when packaged and configured
  if (app.isPackaged && isPublishConfigured()) {
    setTimeout(() => {
      void runUpdateCheck(false);
    }, 4000);
    setInterval(() => {
      void runUpdateCheck(false);
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

  // Open local Guide PDF & verified Bac Algorithmique PDFs in a clean dedicated PDF window; external pages/ZIPs in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    const isLocalApp = url.startsWith('algostudio://');
    const isExamPdf = /^https?:\/\/(files\.reviserbac\.tn|(?:www\.)?kiteb\.net)\/.+\.pdf$/i.test(url);

    if (isLocalApp || isExamPdf) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          width: 1080,
          height: 820,
          title: isExamPdf
            ? 'Sujet Bac Algorithmique — AlgoStudio'
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
