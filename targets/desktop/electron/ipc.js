/**
 * IPC handlers behind window.lai. Each handler validates its sender and input;
 * the renderer is treated as untrusted.
 */
import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import { writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

import { rendererUrl } from './window.js';

export function registerIpc() {
  handle('lai:save-file', async (event, options) => {
    if (typeof options?.defaultName !== 'string' || typeof options?.content !== 'string') {
      throw new Error('save-file: expected { defaultName: string, content: string }');
    }
    const win = BrowserWindow.fromWebContents(event.sender);
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      defaultPath: basename(options.defaultName),
      filters: [{ name: 'Text', extensions: ['txt'] }],
    });
    if (canceled || !filePath) return { saved: false };
    await writeFile(filePath, options.content, 'utf8');
    return { saved: true, path: filePath };
  });

  handle('lai:open-external', async (_event, url) => {
    const u = new URL(String(url));
    if (u.protocol !== 'https:') throw new Error(`open-external: refusing non-https URL ${u.href}`);
    await shell.openExternal(u.href);
  });

  // `runtime` is a display string: shared code prints it without knowing what
  // this target runs on (app/ must stay target-agnostic).
  handle('lai:app-info', () => ({
    name: app.getName(),
    version: app.getVersion(),
    runtime: `Electron ${process.versions.electron}`,
    platform: process.platform,
  }));
}

function handle(channel, fn) {
  ipcMain.handle(channel, (event, ...args) => {
    const origin = new URL(rendererUrl()).origin;
    if (new URL(event.senderFrame.url).origin !== origin) {
      throw new Error(`${channel}: rejected sender ${event.senderFrame.url}`);
    }
    return fn(event, ...args);
  });
}
