// Application de bureau The Legend of Nashi : une fenêtre Electron qui affiche le jeu assemblé.
// Le jeu reste le même HTML autonome que la version de test ; aucune page externe n'est chargée.
'use strict';
const { app, BrowserWindow, clipboard, ipcMain, screen, session, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { createSaveStore } = require('./saves.js');
const { createHosting } = require('./hosting.js');
const { createSteam } = require('./steam.js');

const ROOT = path.resolve(__dirname, '..');
// Journal du processus principal. Sous Windows, un jeu lancé sans console (Steam, Explorateur) n'a pas toujours de
// sortie utilisable : écrire dessus lèverait EBADF et arrêterait le jeu au démarrage. Le journal ne doit jamais gêner.
function log(...parts) {
  try {
    console.log(...parts);
  } catch {}
}
const DEV = !app.isPackaged;

// Le jeu s'appelait « Canaan Online » : son dossier de données (sauvegardes, affichage) portait ce nom. Au premier
// lancement sous le nouveau nom, les sauvegardes et réglages de l'ancien dossier sont copiés (jamais déplacés ni
// effacés). Rien n'est copié quand un dossier de données est imposé (--user-data-dir, tests).
function adoptOldData() {
  if (app.commandLine.hasSwitch('user-data-dir')) return;
  const now = app.getPath('userData'),
    old = path.join(app.getPath('appData'), 'Canaan Online');
  if (path.resolve(now) === path.resolve(old) || !fs.existsSync(old)) return;
  try {
    fs.mkdirSync(now, { recursive: true });
    for (const name of ['saves', 'display.json'])
      if (fs.existsSync(path.join(old, name)) && !fs.existsSync(path.join(now, name)))
        fs.cpSync(path.join(old, name), path.join(now, name), {
          recursive: true,
          errorOnExist: false,
          force: false
        });
  } catch (error) {
    log('[données] copie de l’ancien dossier impossible :', error.message);
  }
}
adoptOldData();

// Nom du HTML assemblé. En développement, il est déduit de la version unique déclarée dans runtime-config.js
// (comme tools/build_canaan.py). Dans le jeu installé, les sources ne sont pas livrées : la version vient de
// package.json, que les tests gardent identique à CANAAN_VERSION.
function gameFile() {
  if (app.isPackaged)
    return path.join(ROOT, 'CANAAN_ONLINE_V' + app.getVersion().replace(/\./g, '_') + '.html');
  const config = fs.readFileSync(path.join(ROOT, 'src', 'canaan', 'scripts', 'runtime-config.js'), 'utf8');
  const match = /CANAAN_VERSION\s*=\s*'(\d+(?:\.\d+)*[a-z]?)'/.exec(config);
  if (!match) throw new Error('Version introuvable dans runtime-config.js');
  return path.join(ROOT, 'CANAAN_ONLINE_V' + match[1].replace(/\./g, '_') + '.html');
}

// Affichage (menu Paramètres du jeu) : plein écran, taille de la zone de jeu, échelle et synchronisation verticale.
// Gardé dans display.json, dans le dossier de données. La VSync se règle au démarrage de Chromium : la changer
// demande de relancer le jeu (bouton dans les Paramètres).
const DISPLAY_DEFAULT = Object.freeze({ fullscreen: false, width: 1440, height: 900, zoom: 1, vsync: true });
const ZOOMS = [0.75, 0.9, 1, 1.1, 1.25, 1.5];
function displayFile() {
  return path.join(app.getPath('userData'), 'display.json');
}
function cleanDisplay(raw) {
  const d = { ...DISPLAY_DEFAULT };
  if (!raw || typeof raw !== 'object') return d;
  if (typeof raw.fullscreen === 'boolean') d.fullscreen = raw.fullscreen;
  if (typeof raw.vsync === 'boolean') d.vsync = raw.vsync;
  if (Number.isInteger(raw.width) && raw.width >= 960 && raw.width <= 7680) d.width = raw.width;
  if (Number.isInteger(raw.height) && raw.height >= 600 && raw.height <= 4320) d.height = raw.height;
  if (ZOOMS.includes(raw.zoom)) d.zoom = raw.zoom;
  return d;
}
function readDisplay() {
  try {
    return cleanDisplay(JSON.parse(fs.readFileSync(displayFile(), 'utf8')));
  } catch {
    return { ...DISPLAY_DEFAULT };
  }
}
function writeDisplay() {
  try {
    fs.mkdirSync(path.dirname(displayFile()), { recursive: true });
    fs.writeFileSync(displayFile(), JSON.stringify(display, null, 2));
  } catch {
    // Un dossier en lecture seule ne doit jamais empêcher de jouer.
  }
}
const display = readDisplay();
// Steam : succès du joueur quand le jeu est lancé par Steam (sinon inactif) ; la superposition (Maj+Tab) se règle avant
// le démarrage de Chromium.
const steam = createSteam({ log });
steam.enableOverlay();
// VSync coupée : Chromium dessine aussi vite qu'il peut (la limite d'images du jeu reste réglable).
const VSYNC_AT_START = display.vsync;
if (!display.vsync) {
  app.commandLine.appendSwitch('disable-gpu-vsync');
  app.commandLine.appendSwitch('disable-frame-rate-limit');
}
// Tailles proposées : les résolutions courantes qui tiennent sur l'écran de la fenêtre.
const SIZES = [
  [1280, 720],
  [1366, 768],
  [1440, 900],
  [1600, 900],
  [1680, 1050],
  [1920, 1080],
  [2560, 1440],
  [3840, 2160]
];
function displayState() {
  const win = mainWindow;
  const area = win
    ? screen.getDisplayMatching(win.getBounds()).workAreaSize
    : screen.getPrimaryDisplay().workAreaSize;
  const [w, h] = win && !win.isFullScreen() ? win.getContentSize() : [display.width, display.height];
  return {
    fullscreen: !!win?.isFullScreen(),
    width: w,
    height: h,
    zoom: display.zoom,
    zooms: ZOOMS,
    vsync: display.vsync,
    vsyncActive: VSYNC_AT_START,
    sizes: SIZES.filter(([sw, sh]) => sw <= area.width && sh <= area.height)
  };
}
function sendDisplay() {
  mainWindow?.webContents.send('display:changed', displayState());
}

// Sauvegardes : trois slots en fichiers dans le dossier de données de l'application.
// Le jeu y accède uniquement par ces messages ; chaque argument est vérifié ici.
let store = null;
let mainWindow = null;
const SAVE_OPS = Object.freeze({
  list: () => store.list(),
  read: slot => store.read(slot),
  write: (slot, text) => store.write(slot, text),
  backup: (slot, reason) => store.backup(slot, reason),
  backupText: (prefix, reason, text) => store.backupText(prefix, reason, text),
  remove: slot => store.remove(slot)
});
for (const [op, run] of Object.entries(SAVE_OPS)) {
  ipcMain.on('saves:' + op, (event, ...args) => {
    // Seule la page du jeu, dans la fenêtre principale, peut toucher aux sauvegardes.
    if (
      !mainWindow ||
      event.sender !== mainWindow.webContents ||
      event.senderFrame !== mainWindow.webContents.mainFrame
    ) {
      event.returnValue = { ok: false, error: 'Origine refusée' };
      return;
    }
    try {
      event.returnValue = { ok: true, value: run(...args) };
    } catch (error) {
      event.returnValue = { ok: false, error: String(error.message || error) };
    }
  });
}
ipcMain.on('saves:open-folder', event => {
  if (mainWindow && event.sender === mainWindow.webContents) shell.openPath(store.dir);
});

// Jouer à plusieurs : relais de l'hôte sur Tailscale ou sur le réseau local (hosting.js). L'état est renvoyé à la page.
let hosting = null;
const fromGame = event =>
  !!mainWindow &&
  event.sender === mainWindow.webContents &&
  event.senderFrame === mainWindow.webContents.mainFrame;
ipcMain.handle('net:host-tailscale', async event => {
  if (!fromGame(event)) throw new Error('Origine refusée');
  return hosting.startTailscale();
});
ipcMain.handle('net:host-lan', async event => {
  if (!fromGame(event)) throw new Error('Origine refusée');
  return hosting.startLan();
});
ipcMain.handle('net:host-stop', async event => {
  if (!fromGame(event)) throw new Error('Origine refusée');
  await hosting.stop();
  return true;
});
ipcMain.handle('net:host-status', event => (fromGame(event) ? hosting.status() : null));
// Copier l'invitation (texte court seulement).
// Affichage : lu et changé seulement par la page du jeu ; chaque valeur est vérifiée.
ipcMain.handle('steam:status', event => (fromGame(event) ? steam.status() : null));
ipcMain.on('steam:unlock', (event, ids) => {
  if (fromGame(event)) steam.unlock(ids);
});
ipcMain.handle('display:get', event => (fromGame(event) ? displayState() : null));
ipcMain.handle('display:set', (event, options) => {
  if (!fromGame(event) || !options || typeof options !== 'object') return null;
  const win = mainWindow;
  if (typeof options.fullscreen === 'boolean') win.setFullScreen(options.fullscreen);
  if (Array.isArray(options.size) && SIZES.some(([w, h]) => w === options.size[0] && h === options.size[1])) {
    if (win.isFullScreen()) win.setFullScreen(false);
    if (win.isMaximized()) win.unmaximize();
    [display.width, display.height] = options.size;
    win.setContentSize(display.width, display.height);
    win.center();
  }
  if (ZOOMS.includes(options.zoom)) {
    display.zoom = options.zoom;
    win.webContents.setZoomFactor(display.zoom);
  }
  if (typeof options.vsync === 'boolean') display.vsync = options.vsync;
  writeDisplay();
  return displayState();
});
// Relance (VSync changée) : la page a sauvegardé la partie juste avant.
ipcMain.on('display:relaunch', event => {
  if (!fromGame(event)) return;
  app.relaunch();
  app.exit(0);
});
ipcMain.on('net:copy', (event, text) => {
  if (fromGame(event) && typeof text === 'string' && text.length <= 500) clipboard.writeText(text);
});

function createWindow() {
  const win = new BrowserWindow({
    width: display.width,
    height: display.height,
    useContentSize: true,
    fullscreen: display.fullscreen,
    minWidth: 960,
    minHeight: 600,
    title: 'The Legend of Nashi',
    backgroundColor: '#0b0906',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
      // Le son démarre sans clic préalable : une partie lancée à la manette (sans souris ni clavier) a aussi sa musique.
      autoplayPolicy: 'no-user-gesture-required',
      devTools: DEV
    }
  });
  win.removeMenu();
  win.once('ready-to-show', () => win.show());
  // Le jeu ne quitte jamais sa page : seul le rechargement de la page du jeu est permis
  // (ouverture d'une aventure, retour au menu). Aucune autre navigation ni nouvelle fenêtre.
  const page = pathToFileURL(gameFile()).href;
  win.webContents.on('will-navigate', (event, url) => {
    if (url.split('#')[0] !== page) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  // F11 : plein écran · F12 : outils de développement (hors version installée).
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    if (input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    } else if (input.key === 'F12' && DEV) {
      win.webContents.toggleDevTools();
      event.preventDefault();
    }
  });
  // Plein écran (F11 ou Paramètres) et taille choisie à la main : gardés pour la prochaine fois.
  const remember = () => {
    display.fullscreen = win.isFullScreen();
    if (!display.fullscreen && !win.isMaximized()) [display.width, display.height] = win.getContentSize();
    writeDisplay();
    sendDisplay();
  };
  win.on('enter-full-screen', remember);
  win.on('leave-full-screen', remember);
  let resizeTimer = null;
  win.on('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(remember, 400);
  });
  win.webContents.on('did-finish-load', () => win.webContents.setZoomFactor(display.zoom));
  win.loadFile(gameFile());
  mainWindow = win;
  win.on('closed', () => {
    if (mainWindow === win) mainWindow = null;
  });
  return win;
}

app.whenReady().then(() => {
  store = createSaveStore(path.join(app.getPath('userData'), 'saves'));
  hosting = createHosting({
    onStatus: status => mainWindow?.webContents.send('net:host-status', status)
  });
  // Aucune autorisation (caméra, micro, notifications…) n'est accordée.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
// En quittant : relais arrêté.
app.on('before-quit', () => {
  hosting?.stop();
});
