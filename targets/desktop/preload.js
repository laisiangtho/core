/**
 * Preload (sandboxed, context-isolated). Exposes a minimal, explicit API as
 * window.lai; no Electron or Node object crosses into the renderer.
 * Built as CommonJS (out/preload/index.cjs), as sandboxed preloads require.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('lai', Object.freeze({
  /** @param {{ defaultName: string, content: string }} options */
  saveFile: (options) => ipcRenderer.invoke('lai:save-file', options),
  openExternal: (url) => ipcRenderer.invoke('lai:open-external', url),
  appInfo: () => ipcRenderer.invoke('lai:app-info'),
}));
