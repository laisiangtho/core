import assert from 'node:assert/strict';
import { test } from 'node:test';

import { comparePassage, parseBookmark, parseNote, passageId } from '../../app/core/annotations.js';
import { category } from '../helpers.js';

const opts = { source: 'note.json', category };

test('a note keys on the passage, not a translation', () => {
  const note = parseNote({ book: 43, chapter: 3, verse: 16, text: 'the turn of the gospel' }, opts);
  assert.equal(note.book, 43);
  assert.equal(note.verse, 16);
  assert.ok(note.id.startsWith('n'));
  assert.ok(Date.parse(note.updated));
});

test('a chapter note has no verse; a bookmark must have one', () => {
  assert.equal(parseNote({ book: 1, chapter: 1, text: 'x' }, opts).verse, null);
  assert.throws(() => parseBookmark({ book: 1, chapter: 1 }, opts), /a bookmark needs a verse/);
});

test('bookmark ids are derived, so one verse holds one bookmark', () => {
  const a = parseBookmark({ book: 19, chapter: 23, verse: 1 }, opts);
  const b = parseBookmark({ book: 19, chapter: 23, verse: 1, colour: 'green' }, opts);
  assert.equal(a.id, b.id);
  assert.equal(a.id, passageId(19, 23, 1));
  assert.equal(b.colour, 'green');
});

test('passages outside the canon are refused', () => {
  assert.throws(() => parseNote({ book: 99, chapter: 1, text: 'x' }, opts), /unknown book 99/);
  assert.throws(() => parseNote({ book: 1, chapter: 51, text: 'x' }, opts), /outside Gen \(1–50\)/);
  assert.throws(() => parseBookmark({ book: 1, chapter: 1, verse: 1, colour: 'teal' }, opts), /\$\.colour: expected one of/);
});

test('sorting follows canonical order', () => {
  const rows = [
    { book: 43, chapter: 3, verse: 16 },
    { book: 1, chapter: 1, verse: 2 },
    { book: 1, chapter: 1, verse: null },
  ].sort(comparePassage);
  assert.deepEqual(rows.map((r) => r.book + '.' + r.chapter + '.' + r.verse), ['1.1.null', '1.1.2', '43.3.16']);
});
