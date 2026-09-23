import assert from 'node:assert/strict';
import { test } from 'node:test';

import { compareCatalogs, parseCatalog, translationStatus } from '../../app/core/catalog.js';
import { readJson } from '../helpers.js';

const legacy = readJson('public/book.json');
const entries = legacy.slice(0, 3);
const remote = (version, updated = '2024-11-18T15:04:44.891Z', book = entries) => ({ name: 'Lai Siangtho', updated, version, book, collection: {} });

test('legacy bundled array parses with no catalog version', () => {
  const c = parseCatalog(legacy, { source: 'book.json' });
  assert.equal(c.shape, 'legacy');
  assert.equal(c.version, null);
  assert.equal(c.get('tedim1932').version, 1); // "1" normalised
});

test('remote object shape parses; legacy array rejected where remote is required', () => {
  assert.equal(parseCatalog(remote(260), { source: 'r' }).version, 260);
  assert.throws(() => parseCatalog(legacy, { source: 'r', requireRemoteShape: true }), /got legacy array/);
});

test('non-numeric version is a structural error', () => {
  const bad = structuredClone(entries);
  bad[0].version = 'v2';
  assert.throws(() => parseCatalog(bad, { source: 'book.json' }), /\$\[0\]\.version: expected version/);
});

test('duplicate identify is rejected', () => {
  assert.throws(() => parseCatalog([entries[0], entries[0]], { source: 'b' }), /duplicate identify/);
});

test('compareCatalogs orders by version, then updated', () => {
  const a = parseCatalog(remote(260), { source: 'a' });
  assert.equal(compareCatalogs(null, a), 'newer');
  assert.equal(compareCatalogs(a, parseCatalog(remote(261), { source: 'b' })), 'newer');
  assert.equal(compareCatalogs(a, parseCatalog(remote(259), { source: 'b' })), 'older');
  assert.equal(compareCatalogs(a, parseCatalog(remote(260), { source: 'b' })), 'same');
  assert.equal(compareCatalogs(a, parseCatalog(remote(260, '2025-01-01T00:00:00Z'), { source: 'b' })), 'newer');
});

test('translationStatus: available, installed, update, unlisted', () => {
  const c = parseCatalog(remote(260, undefined, entries.map((e, i) => ({ ...e, version: i + 1 }))), { source: 'r' });
  const [a, b, c3] = entries.map((e) => e.identify);
  const rows = translationStatus(c, [{ identify: b, version: 2 }, { identify: c3, version: 1 }, { identify: 'gone', version: 1 }]);
  const state = Object.fromEntries(rows.map((r) => [r.identify, r.state]));
  assert.deepEqual(state, { [a]: 'available', [b]: 'installed', [c3]: 'update', gone: 'unlisted' });
});
