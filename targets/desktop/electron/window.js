/**
 * Main window lifecycle and navigation policy.
 */
import { app, BrowserWindow, shell } from 'electron';
import { fileURLToPath } from 'node:url';

import { APP_ORIGIN } from './protocol.js';

const PRELOAD = fileURLToPath(new URL('../preload/index.cjs', import.meta.url));

/** Dev server URL (set by electron-vite in development), otherwise app://. */
export function rendererUrl() {
  const dev = process.env.ELECTRON_RENDERER_URL;
  return !app.isPackaged && dev ? dev : `${APP_ORIGIN}/index.html`;
}

export function createMainWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    show: false,
    backgroundColor: '#181818',
    title: 'Lai Siangtho',
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: false,
    },
  });

  const origin = new URL(rendererUrl()).origin;
  win.webContents.on('will-navigate', (event, url) => {
    if (new URL(url).origin !== origin) event.preventDefault();
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL(rendererUrl());
  return win;
}
