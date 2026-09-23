/**
 * Web build plugin: emits sw.js with the precache list and manifest.webmanifest.
 *
 * Files in public/ are copied without processing, so a hand-written sw.js
 * there could not know the hashed asset names. This plugin runs at the end of
 * the build, when the full list of emitted files is known.
 *
 * The manifest <link> is injected after Vite's HTML processing: a link written
 * in index.html would be rewritten to a hashed copy under assets/, breaking the
 * manifest's relative icon paths. Keeping the manifest here (not in public/)
 * keeps it out of the desktop build.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

export function webShell({ swSource, manifestSource, publicDir }) {
  return {
    name: 'lai-web-shell',
    transformIndexHtml: {
      order: 'post',
      handler: () => [{ tag: 'link', attrs: { rel: 'manifest', href: './manifest.webmanifest' }, injectTo: 'head' }],
    },
    configureServer(server) {
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(readFileSync(manifestSource));
      });
    },
    generateBundle(_options, bundle) {
      const manifest = readFileSync(manifestSource, 'utf8');
      JSON.parse(manifest); // fail the build on malformed JSON
      this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: manifest });

      // index.html is emitted by Vite's HTML plugin, which may run after this hook.
      const files = new Set([...Object.keys(bundle), ...listFiles(publicDir), 'manifest.webmanifest', 'index.html']);
      files.delete('sw.js');
      const precache = [...files].filter((f) => !f.endsWith('.map')).sort().map((f) => `./${f}`);

      const hash = createHash('sha256');
      for (const f of Object.keys(bundle).sort()) {
        const item = bundle[f];
        hash.update(f).update(item.type === 'chunk' ? item.code : item.source);
      }
      for (const f of listFiles(publicDir)) hash.update(f).update(readFileSync(join(publicDir, f)));

      const source = readFileSync(swSource, 'utf8');
      if (!source.includes('/*__PRECACHE__*/[]') || !source.includes('__CACHE_VERSION__')) {
        this.error('sw.js: placeholders /*__PRECACHE__*/[] and __CACHE_VERSION__ are required');
      }
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: source
          .replace('/*__PRECACHE__*/[]', JSON.stringify(precache))
          .replace('__CACHE_VERSION__', hash.digest('hex').slice(0, 12)),
      });
    },
  };
}

function listFiles(dir, base = dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full, base) : [relative(base, full).split('\\').join('/')];
  });
}
