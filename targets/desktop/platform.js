/**
 * Desktop platform services, backed by the preload bridge (window.lai).
 * The renderer has no Node.js access; every native action goes through IPC.
 */
export function createPlatform() {
  const bridge = window.lai;
  if (!bridge) throw new Error('desktop platform: window.lai is missing — the preload script did not run');
  return Object.freeze({
    id: 'desktop',
    capabilities: Object.freeze({
      saveFile: (options) => bridge.saveFile(options),
      openExternal: (url) => bridge.openExternal(url),
      appInfo: () => bridge.appInfo(),
    }),
  });
}
