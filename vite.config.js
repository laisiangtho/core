/**
 * Web (PWA) build: targets/web → dist/web
 */
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

import { basePolicy, csp } from './targets/csp.js';
import { webShell } from './targets/web/shell-plugin.js';

const r = (p) => resolve(import.meta.dirname, p);

export default defineConfig({
  root: r('targets/web'),
  publicDir: r('public'),
  base: './',
  build: {
    outDir: r('dist/web'),
    emptyOutDir: true,
  },
  worker: { format: 'es' },
  server: { fs: { allow: [r('.')] } },
  plugins: [
    csp({ ...basePolicy, 'manifest-src': ["'self'"] }),
    webShell({
      swSource: r('targets/web/sw.js'),
      manifestSource: r('targets/web/manifest.webmanifest'),
      publicDir: r('public'),
    }),
  ],
});
