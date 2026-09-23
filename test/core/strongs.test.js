import assert from 'node:assert/strict';
import { test } from 'node:test';

import { extractStrongs, hasStrongs, normalizeCode, strongsRuns } from '../../app/core/strongs.js';

test('text without markup is returned untouched', () => {
  const plain = 'In the beginning God created the heavens and the earth.';
  assert.equal(hasStrongs(plain), false);
  assert.deepEqual(extractStrongs(plain), { text: plain, codes: [] });
  assert.deepEqual(strongsRuns(plain), [{ text: plain, code: null }]);
});

test('brace, tag and bracket notations all read', () => {
  for (const marked of ['In the beginning{H7225} God{H430} created', 'In the beginning<S>7225</S> God<S>430</S> created', 'In the beginning[H7225] God[H430] created']) {
    const { text, codes } = extractStrongs(marked);
    assert.equal(text, 'In the beginning God created');
    assert.deepEqual(codes.map((c) => c.code), ['H7225', 'H430'].map((c) => (marked.includes('<S>') ? c.replace('H', '') : c)));
  }
});

test('a code attaches to the word before it', () => {
  const runs = strongsRuns('In the beginning{H7225} God{H430} created');
  assert.deepEqual(runs, [
    { text: 'In the ', code: null },
    { text: 'beginning', code: 'H7225' },
    { text: ' ', code: null },
    { text: 'God', code: 'H430' },
    { text: ' created', code: null },
  ]);
});

test('codes normalise', () => {
  assert.equal(normalizeCode('h0430'), 'H430');
  assert.equal(normalizeCode('G0026'), 'G26');
  assert.equal(normalizeCode('0026'), '26');
});
