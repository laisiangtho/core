/**
 * Notes and bookmarks.
 *
 * Both key on the passage, never on a translation: a note written while reading
 * one translation belongs to that verse, so it is there in every other one too.
 *
 *   note      { id, book, chapter, verse|null, text, created, updated }
 *   bookmark  { id, book, chapter, verse, colour|null, created }
 *
 * `id` is derived from the passage for bookmarks (one per verse) and random for
 * notes (a verse may carry several).
 */

import { expectObject, expectString, fail } from './errors.js';

export const COLOURS = Object.freeze(['yellow', 'green', 'blue', 'purple', 'red']);

export function passageId(book, chapter, verse) {
  return verse === null || verse === undefined ? `${book}.${chapter}` : `${book}.${chapter}.${verse}`;
}

export function newNoteId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

/** Sort key: canonical order, chapter notes before verse notes. */
export function comparePassage(a, b) {
  return a.book - b.book || a.chapter - b.chapter || (a.verse ?? 0) - (b.verse ?? 0);
}

export function parseNote(raw, { source, category }) {
  expectObject(raw, source, '$');
  const { book, chapter, verse } = parsePassage(raw, { source, category, verseOptional: true });
  const text = expectString(raw.text, source, '$.text');
  const created = timestamp(raw.created, source, '$.created');
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : newNoteId(),
    book, chapter, verse, text,
    created,
    updated: timestamp(raw.updated, source, '$.updated', created),
  };
}

export function parseBookmark(raw, { source, category }) {
  expectObject(raw, source, '$');
  const { book, chapter, verse } = parsePassage(raw, { source, category, verseOptional: false });
  const colour = raw.colour === undefined || raw.colour === null ? null : expectString(raw.colour, source, '$.colour');
  if (colour !== null && !COLOURS.includes(colour)) fail(source, '$.colour', `expected one of ${COLOURS.join(', ')}`);
  return { id: passageId(book, chapter, verse), book, chapter, verse, colour, created: timestamp(raw.created, source, '$.created') };
}

function parsePassage(raw, { source, category, verseOptional }) {
  const book = raw.book;
  if (!Number.isInteger(book) || !category.hasBook(book)) fail(source, '$.book', `unknown book ${JSON.stringify(book)}`);
  const chapters = category.book(book).chapters;
  const chapter = raw.chapter;
  if (!Number.isInteger(chapter) || chapter < 1 || chapter > chapters) {
    fail(source, '$.chapter', `chapter ${JSON.stringify(chapter)} is outside ${category.book(book).shortname} (1–${chapters})`);
  }
  const verse = raw.verse === undefined || raw.verse === null ? null : raw.verse;
  if (verse !== null && (!Number.isInteger(verse) || verse < 1)) fail(source, '$.verse', `expected a verse number, got ${JSON.stringify(verse)}`);
  if (verse === null && !verseOptional) fail(source, '$.verse', 'a bookmark needs a verse');
  return { book, chapter, verse };
}

function timestamp(value, source, path, fallback) {
  if (value === undefined || value === null) return fallback ?? new Date().toISOString();
  const text = expectString(value, source, path);
  if (Number.isNaN(Date.parse(text))) fail(source, path, `not an ISO date: ${text}`);
  return text;
}
