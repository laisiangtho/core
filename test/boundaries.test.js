/**
 * Architecture rules, enforced:
 *   - app/ never imports from targets/ and never names a target or Electron.
 *   - app/core/ is pure: no DOM, no browser storage, no Vite-only APIs.
 */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';

import { root } from './helpers.js';

const files = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? files(p) : p.endsWith('.js') ? [p] : [];
});
const rel = (p) => relative(root('.'), p);

test('app/ is target-agnostic', () => {
  const banned = [/from\s+['"][^'"]*targets\//, /\belectron\b/i, /window\.lai\b/, /import\.meta\.env\.MODE/, /(?<!typeof\s)platform\.id\s*[=!]==/];
  for (const f of files(root('app'))) {
    const src = readFileSync(f, 'utf8');
    for (const re of banned) assert.doesNotMatch(src, re, `${rel(f)} matches ${re}`);
  }
});

test('app/core/ is pure', () => {
  const banned = [/\bdocument\b/, /\bwindow\b/, /\bindexedDB\b/, /\blocalStorage\b/, /import\.meta\.glob/, /\bfetch\(/];
  for (const f of files(root('app/core'))) {
    const src = readFileSync(f, 'utf8');
    for (const re of banned) assert.doesNotMatch(src, re, `${rel(f)} matches ${re}`);
  }
});
