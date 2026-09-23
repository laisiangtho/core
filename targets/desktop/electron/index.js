/**
 * Electron main process entry.
 */
import { app, BrowserWindow } from 'electron';
import { fileURLToPath } from 'node:url';

import { registerIpc } from './ipc.js';
import { registerAppScheme, serveAppScheme } from './protocol.js';
import { createMainWindow } from './window.js';

const RENDERER_ROOT = fileURLToPath(new URL('../renderer/', import.meta.url));

registerAppScheme(); // must run before 'ready'

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });

  app.whenReady().then(() => {
    serveAppScheme(RENDERER_ROOT);
    registerIpc();
    createMainWindow();
    app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createMainWindow(); });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}
