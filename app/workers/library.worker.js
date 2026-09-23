/**
 * Library worker: download → validate → split → write, off the main thread.
 *
 * Request   { id, type: 'install', identify, url, category }   (category = raw category.json)
 * Progress  { id, type: 'progress', phase: 'download'|'validate'|'write', received? }
 * Result    { id, type: 'done', identify, version, stats, diagnostics }
 * Failure   { id, type: 'error', message }
 */

import { parseCategory } from '../core/category.js';
import { parseTranslation } from '../core/translation.js';
import { openStore } from '../services/store.js';

let storePromise = null;
let category = null;

self.addEventListener('message', async ({ data }) => {
  const { id, type } = data;
  const post = (msg) => self.postMessage({ id, ...msg });
  try {
    if (type !== 'install') throw new Error(`library worker: unknown request type ${type}`);
    storePromise ??= openStore();
    category ??= parseCategory(data.category);
    const result = await install(data, post);
    post({ type: 'done', ...result });
  } catch (err) {
    post({ type: 'error', message: err?.message ?? String(err) });
  }
});

async function install({ identify, url }, post) {
  post({ type: 'progress', phase: 'download', received: 0 });
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`GET ${url}: HTTP ${res.status}`);

  const bytes = await readAll(res, (received) => post({ type: 'progress', phase: 'download', received }));
  post({ type: 'progress', phase: 'validate' });
  let raw;
  try {
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch (err) {
    throw new Error(`${identify}.json: invalid JSON (${err.message})`);
  }
  const parsed = parseTranslation(raw, { identify, category });

  post({ type: 'progress', phase: 'write' });
  const store = await storePromise;
  await store.install(parsed, { bytes: bytes.byteLength });
  return { identify, version: parsed.meta.version, stats: parsed.stats, diagnostics: parsed.diagnostics };
}

async function readAll(res, onProgress) {
  if (!res.body) return new Uint8Array(await res.arrayBuffer());
  const reader = res.body.getReader();
  const chunks = [];
  let received = 0;
  let lastReport = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.byteLength;
    if (received - lastReport > 256 * 1024) { onProgress(received); lastReport = received; }
  }
  const out = new Uint8Array(received);
  let offset = 0;
  for (const c of chunks) { out.set(c, offset); offset += c.byteLength; }
  return out;
}
