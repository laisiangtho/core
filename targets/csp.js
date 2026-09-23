/**
 * Injects a Content-Security-Policy <meta> into index.html for production
 * builds only; the Vite dev server needs inline styles and a websocket that the
 * production policy does not allow.
 */
export function csp(policy) {
  const content = Object.entries(policy).map(([k, v]) => `${k} ${v.join(' ')}`).join('; ');
  return {
    name: 'lai-csp',
    apply: 'build',
    transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content }, injectTo: 'head' }],
  };
}

/** Policy shared by both targets; each target may extend it. */
export const basePolicy = Object.freeze({
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://raw.githubusercontent.com'],
  'worker-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'none'"],
});
