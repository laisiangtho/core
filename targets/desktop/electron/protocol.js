/**
 * app:// scheme serving the built renderer.
 *
 * file:// gives every local page the same opaque origin and breaks module
 * workers and fetch semantics. A privileged standard scheme gives the renderer
 * a real origin (app://lai), so IndexedDB, fetch and workers behave as on the web.
 */
import { net, protocol } from 'electron';
import { normalize, join, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

export const APP_ORIGIN = 'app://lai';

export function registerAppScheme() {
  protocol.registerSchemesAsPrivileged([{
    scheme: 'app',
    privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, stream: true },
  }]);
}

export function serveAppScheme(root) {
  const base = normalize(root.endsWith(sep) ? root : root + sep);
  protocol.handle('app', async (request) => {
    const url = new URL(request.url);
    if (url.host !== 'lai') return new Response('Not found', { status: 404 });
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = normalize(join(base, pathname));
    if (!file.startsWith(base)) return new Response('Forbidden', { status: 403 });
    try {
      return await net.fetch(pathToFileURL(file).toString());
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}
