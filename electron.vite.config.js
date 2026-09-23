/**
 * Desktop build: main + preload + renderer → out/
 * Packaging (out/ → release/) is configured in electron-builder.yml.
 */
import { resolve } from 'node:path';
import { defineConfig } from 'electron-vite';

import { basePolicy, csp } from './targets/csp.js';

const r = (p) => resolve(import.meta.dirname, p);

export default defineConfig({
  main: {
    build: {
      outDir: r('out/main'),
      rollupOptions: {
        input: { index: r('targets/desktop/electron/index.js') },
        output: { format: 'es', entryFileNames: '[name].js' },
      },
    },
  },
  preload: {
    build: {
      outDir: r('out/preload'),
      rollupOptions: {
        input: { index: r('targets/desktop/preload.js') },
        // Sandboxed preload scripts must be CommonJS.
        output: { format: 'cjs', entryFileNames: '[name].cjs' },
      },
    },
  },
  renderer: {
    root: r('targets/desktop'),
    publicDir: r('public'),
    base: './',
    build: {
      outDir: r('out/renderer'),
      rollupOptions: { input: { index: r('targets/desktop/index.html') } },
    },
    worker: { format: 'es' },
    server: { fs: { allow: [r('.')] } },
    plugins: [csp(basePolicy)],
  },
});
