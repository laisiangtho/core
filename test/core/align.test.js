import assert from 'node:assert/strict';
import { test } from 'node:test';

import { alignChapter, verseLabel } from '../../app/core/align.js';

const plain = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => [i + 1, { text: `v${i + 1}` }]));

test('one merge widens the row for every column', () => {
  const a = plain(20); a[17] = { text: 'x', merge: 18 }; delete a[18];
  const rows = alignChapter([{ id: 'a', verses: a }, { id: 'b', verses: plain(20) }]);
  assert.equal(rows.length, 19);
  assert.deepEqual(rows.find((r) => r.start === 17), { start: 17, end: 18, cells: { a: [17], b: [17, 18] } });
});

test('overlapping merges in different columns chain into one row', () => {
  const a = plain(10); a[3] = { text: 'x', merge: 4 }; delete a[4];
  const b = plain(10); b[4] = { text: 'y', merge: 6 }; delete b[5]; delete b[6];
  const row = alignChapter([{ id: 'a', verses: a }, { id: 'b', verses: b }]).find((r) => r.start === 3);
  assert.deepEqual(row, { start: 3, end: 6, cells: { a: [3, 5, 6], b: [3, 4] } });
});

test('missing verse and missing chapter leave empty cells', () => {
  const a = plain(53);
  const b = plain(53); delete b[53]; // e.g. John 7:53 absent
  const rows = alignChapter([{ id: 'a', verses: a }, { id: 'b', verses: b }, { id: 'c', verses: null }]);
  assert.deepEqual(rows.at(-1).cells, { a: [53], b: [], c: [] });
});

test('verseLabel', () => {
  assert.equal(verseLabel(17, { merge: 18 }), '17–18');
  assert.equal(verseLabel(3, {}), '3');
});
