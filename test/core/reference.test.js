import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createResolver, parseAliases, parseReferences, parseStoryRange } from '../../app/core/reference.js';
import { category, readJson } from '../helpers.js';

const books = {
  1: { name: 'Piancilna', shortname: 'Pia', abbr: ['Pian'] },
  40: { name: 'Matthai', shortname: 'Mat', abbr: [] },
  57: { name: 'Filemon', shortname: 'Fil', abbr: [] },
};
const resolver = createResolver({ category, books, aliases: { Siam: 3, Mang: null } });
const refs = (text, opts) => parseReferences(text, resolver, opts);

test('layers: translation, category, alias overlay', () => {
  assert.equal(resolver.resolve('Pian'), 1);
  assert.equal(resolver.resolve('Isa'), 23);
  assert.equal(resolver.resolve('Siam'), 3);
  assert.equal(resolver.resolve('Nope'), null);
});

test('continuation parts inherit the previous book', () => {
  const parts = refs('Mat 4:23; 9:35');
  assert.deepEqual(parts.map((p) => p.refs[0]), [{ book: 40, chapter: 4, verse: 23 }, { book: 40, chapter: 9, verse: 35 }]);
});

test('ranges, comma lists, chapter ranges, trailing note word', () => {
  assert.deepEqual(refs('Mat 7:28-29')[0].refs, [{ book: 40, chapter: 7, verse: 28, endVerse: 29 }]);
  assert.deepEqual(refs('Mat 6:11-8:32')[0].refs, [{ book: 40, chapter: 6, verse: 11, endChapter: 8, endVerse: 32 }]);
  assert.deepEqual(refs('Mat 3:17,19-20')[0].refs.map((r) => [r.verse, r.endVerse]), [[17, undefined], [19, 20]]);
  assert.deepEqual(refs('Mat 5-7')[0].refs, [{ book: 40, chapter: 5, endChapter: 7 }]);
  assert.equal(refs('Mat 5 Thulu')[0].note, 'Thulu');
});

test('Mizo dot separator: "Lk 1.27"', () => {
  assert.deepEqual(refs('Isa 7.14')[0].refs, [{ book: 23, chapter: 7, verse: 14 }]);
});

test('single-chapter books cite verses only: "Filemon 10-12"', () => {
  assert.deepEqual(refs('Filemon 10-12')[0].refs, [{ book: 57, chapter: 1, verse: 10, endVerse: 12 }]);
});

test('cross-book range: "1Sam 16:1-1Kings 2:11"', () => {
  assert.deepEqual(refs('1Sam 16:1-1Kings 2:11')[0].refs, [{ book: 9, chapter: 16, verse: 1, endBook: 11, endChapter: 2, endVerse: 11 }]);
});

test('Myanmar digits, section-mark separators and zero-width spaces (Judson)', () => {
  const judson = createResolver({ category, books: { 58: { name: 'ဟေဗြဲ', shortname: 'ဟေဗြဲ', abbr: [] }, 18: { name: 'ယောဘ', shortname: 'ယောဘ', abbr: [] } } });
  const digit = ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'];
  const parts = parseReferences('ယော​ဘ၊ ၁:၆၊ ဟေဗြဲ၊ ၁၁:၄', judson, { digit });
  assert.deepEqual(parts.map((p) => p.refs[0]), [{ book: 18, chapter: 1, verse: 6 }, { book: 58, chapter: 11, verse: 4 }]);
});

test('unresolved parts are returned with a reason, never dropped', () => {
  const parts = refs('Zzz 1:2; 3:4; Mang 2:7');
  assert.deepEqual(parts.map((p) => p.unresolved), ['unknown book "Zzz"', 'unknown book "Zzz"', 'pending alias']);
});

test('story range (OSIS-like)', () => {
  assert.deepEqual(parseStoryRange('Gen.1.1,Gen.2.25', resolver), { start: { book: 1, chapter: 1, verse: 1 }, end: { book: 1, chapter: 2, verse: 25 } });
  assert.throws(() => parseStoryRange('Gen 1:1', resolver), SyntaxError);
});

test('alias overlay validation', () => {
  assert.throws(() => parseAliases({ X: 99 }, { source: 'a.json', category }), /a\.json: \$\.X: expected a category book id or null/);
  const overlay = readJson('app/core/aliases/tedim1932.json');
  assert.equal(parseAliases(overlay, { source: 'tedim1932.json', category }).Siam, 3);
});
