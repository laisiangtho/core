import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fromMarkdown, toMarkdown, NOTES_HEADING } from '../../app/core/source.js';

const meta = {
  info: { name: 'Lai Siangtho', shortname: 'Tedim', language: { text: 'Tedim, Zolai, Chin' } },
  story: { 1: { 1: { 1: { text: 'Van leh lei' } } } },
};
const verses = {
  1: { text: 'A kipat cil-in…', title: 'Leitung le Mihing' },
  17: { text: 'Leitungah khua…', merge: 18, ref: '2Kor 4:6' },
  19: { text: 'Nitak hong bei-in…' },
};
const build = (notes) => toMarkdown({ meta, verses, book: 1, chapter: 1, bookName: 'Piancilna', notes });

test('the chapter renders as Markdown, merged verses keep their label', () => {
  const md = build([]);
  assert.match(md, /^# Piancilna 1/);
  assert.match(md, /## Van leh lei/);
  assert.match(md, /### Leitung le Mihing/);
  assert.match(md, /\*\*17–18\*\* Leitungah khua…/);
  assert.match(md, /> 2Kor 4:6/);
  assert.ok(md.includes(NOTES_HEADING));
});

test('notes round-trip', () => {
  const original = build([{ verse: null, text: 'Chapter thought' }, { verse: 17, text: 'On the lights' }]);
  const { notes } = fromMarkdown(original, original);
  assert.deepEqual(notes, [{ verse: null, text: 'Chapter thought' }, { verse: 17, text: 'On the lights' }]);
});

test('an added note is read back; a removed one disappears', () => {
  const original = build([]);
  const edited = `${original.trimEnd()}\n- **19** the fourth day\n`;
  assert.deepEqual(fromMarkdown(edited, original).notes, [{ verse: 19, text: 'the fourth day' }]);

  const withNote = build([{ verse: 19, text: 'the fourth day' }]);
  assert.deepEqual(fromMarkdown(build([]), withNote).notes, []);
});

test('editing scripture is refused, not silently dropped', () => {
  const original = build([]);
  const tampered = original.replace('A kipat cil-in…', 'Something else');
  assert.throws(() => fromMarkdown(tampered, original), /scripture above "## Notes" belongs to the translation file/);
});
