/**
 * Search worker: scans installed translations chapter by chapter.
 *
 * No index is built at install time. A chapter cursor keeps memory flat, and
 * results stream back in batches so the first hits appear while the rest of the
 * translation is still being read. A newer query cancels an older one.
 *
 * Request   { id, type: 'search', query, translations: [identify], limit }
 * Progress  { id, type: 'batch', rows: [...] }
 * Result    { id, type: 'done', total, scanned, ms, truncated }
 */

import { createMatcher, snippet } from '../core/search.js';
import { openStore } from '../services/store.js';

const BATCH = 40;

let storePromise = null;
let current = 0;

self.addEventListener('message', async ({ data }) => {
  const { id, type } = data;
  const post = (msg) => self.postMessage({ id, ...msg });
  current = id;
  try {
    if (type !== 'search') throw new Error(`search worker: unknown request type ${type}`);
    storePromise ??= openStore();
    await search(data, post);
  } catch (err) {
    post({ type: 'error', message: err?.message ?? String(err) });
  }
});

async function search({ id, query, translations, limit = 500 }, post) {
  const matcher = createMatcher(query);
  if (!matcher) { post({ type: 'done', total: 0, scanned: 0, ms: 0, truncated: false }); return; }

  const store = await storePromise;
  const started = performance.now();
  let rows = [];
  let total = 0;
  let scanned = 0;
  let truncated = false;

  for (const identify of translations) {
    if (current !== id) return; // a newer query took over
    await store.scanChapters(identify, (record) => {
      if (current !== id || truncated) return;
      scanned += 1;
      for (const [key, verse] of Object.entries(record.verses)) {
        const ranges = matcher.test(verse.text);
        if (!ranges) continue;
        total += 1;
        if (total > limit) { truncated = true; return; }
        rows.push({
          identify, book: record.book, chapter: record.chapter, verse: Number(key),
          merge: verse.merge ?? null, ...snippet(verse.text, ranges),
        });
        if (rows.length >= BATCH) { post({ type: 'batch', rows }); rows = []; }
      }
    });
  }

  if (current !== id) return;
  if (rows.length) post({ type: 'batch', rows });
  post({ type: 'done', total: Math.min(total, limit), scanned, ms: Math.round(performance.now() - started), truncated });
}
