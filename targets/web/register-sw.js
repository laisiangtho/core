/**
 * Service worker registration (web target only). A new version waits until
 * every tab of the app is closed, so running pages never mix asset versions.
 */
export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error(`service worker registration failed: ${err.message}`);
    });
  });
}
