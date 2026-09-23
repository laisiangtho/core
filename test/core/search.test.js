import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMatcher, normalize, parseQuery, snippet } from '../../app/core/search.js';

const hits = (query, text) => createMatcher(query)?.test(text);

test('words are ANDed, order does not matter', () => {
  assert.ok(hits('god light', 'God said, "Let there be light"'));
  assert.ok(hits('light god', 'God said, "Let there be light"'));
  assert.equal(hits('god darkness', 'God said, "Let there be light"'), null);
});

test('quoted terms match as a phrase', () => {
  assert.ok(hits('"let there be"', 'God said, "Let there be light"'));
  assert.equal(hits('"be there let"', 'God said, "Let there be light"'), null);
});

test('case and Latin accents fold; other scripts keep their marks', () => {
  assert.ok(hits('pasian', 'PASIAN in vantung le leitung a piangsak hi.'));
  assert.ok(hits('etait', 'Il était une lumière'));
  assert.equal(normalize('Ei­n'), normalize('Ei­n'));
  assert.ok(hits('ကမ္ဘာ', 'ကမ္ဘာဦးကျမ်း'));
});

test('ranges point into the original string', () => {
  const text = 'Élan and élan';
  const ranges = hits('élan', text);
  assert.equal(ranges.length, 2);
  assert.deepEqual(ranges.map((r) => text.slice(r.start, r.end)), ['Élan', 'élan']);
});

test('empty query has no matcher', () => {
  assert.equal(createMatcher('   '), null);
  assert.deepEqual(parseQuery('love "the world" god'), ['love', 'the world', 'god']);
});

test('snippet frames the first hit', () => {
  const text = 'A'.repeat(80) + 'light' + 'B'.repeat(200);
  const s = snippet(text, hits('light', text));
  assert.ok(s.before.startsWith('…'));
  assert.equal(s.hit, 'light');
  assert.ok(s.after.endsWith('…'));
});
