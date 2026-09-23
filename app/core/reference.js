/**
 * Cross-reference resolution.
 *
 * Verse refs use localised book abbreviations: "Pian 22:2; La 2:7; Mat 3:17; 12:18".
 * Story refs use an OSIS-like form: "Gen.1.1,Gen.2.25".
 *
 * Book tokens resolve through three layers, first match wins:
 *   1. alias overlay     app/core/aliases/{identify}.json (app-owned)
 *   2. translation       book[].info name / shortname / abbr
 *   3. category.json     book[].info name / shortname / abbr (English)
 * Neither data file is modified; the overlay closes the gap between them.
 */

import { expectObject, fail } from './errors.js';

// Zero-width characters occur inside published book tokens ("ဟေ\u200Bဗြဲ").
const INVISIBLE = /[\u200B-\u200D\uFEFF]/g;

export function normalizeKey(token) {
  return token.normalize('NFC').replace(INVISIBLE, '').toLowerCase().replace(/[\s.'’]/g, '');
}

/**
 * @param {unknown} raw  { "Siam": 3, "Thu": null, ... } — null declares a
 *                       known token that has no confirmed mapping yet.
 */
export function parseAliases(raw, { source, category }) {
  expectObject(raw, source, '$');
  const out = {};
  for (const [token, id] of Object.entries(raw)) {
    const p = `$.${token}`;
    if (token.startsWith('$')) continue; // "$comment" and similar metadata keys
    if (normalizeKey(token) === '') fail(source, p, 'empty alias token');
    if (id !== null && !(Number.isInteger(id) && category.hasBook(id))) {
      fail(source, p, `expected a category book id or null, got ${JSON.stringify(id)}`);
    }
    out[token] = id;
  }
  return out;
}

/**
 * @param {{ category: any, books?: Record<number, { name: string, shortname: string, abbr: string[] }>,
 *           aliases?: Record<string, number|null> }} layers
 */
export function createResolver({ category, books = {}, aliases = {} }) {
  const aliasLayer = new Map();
  const pending = new Set();
  for (const [token, id] of Object.entries(aliases)) {
    if (id === null) pending.add(normalizeKey(token));
    else aliasLayer.set(normalizeKey(token), id);
  }

  const translationLayer = buildLayer(Object.entries(books).map(([id, b]) => [Number(id), [b.name, b.shortname], b.abbr]));
  const categoryLayer = buildLayer(category.books.map((b) => [b.id, [b.name, b.shortname], b.abbr]));

  return {
    /** @returns {number|null} */
    resolve(token) {
      const key = normalizeKey(token);
      for (const layer of [aliasLayer, translationLayer, categoryLayer]) {
        const id = layer.get(key);
        if (id !== undefined) return id === AMBIGUOUS ? null : id;
      }
      return null;
    },
    /** Chapter count from category.json; single-chapter books cite verses only ("File 10-12"). */
    chapters: (id) => category.book(id).chapters,
    /** Tokens declared in the overlay with null (known, unmapped). */
    isPending: (token) => pending.has(normalizeKey(token)),
  };
}

const AMBIGUOUS = 0;

/**
 * Within one layer, a primary name (name, shortname) outranks an abbreviation
 * variant: category.json lists "I Sa" for 1 Samuel, which normalises to "isa",
 * the shortname of Isaiah. Equal-rank collisions resolve to nothing.
 */
function buildLayer(entries) {
  const rank = new Map(); // key -> { id, primary }
  const add = (key, id, primary) => {
    const cur = rank.get(key);
    if (!cur || (primary && !cur.primary)) rank.set(key, { id, primary });
    else if (cur.id !== id && cur.primary === primary) rank.set(key, { id: AMBIGUOUS, primary });
  };
  for (const [id, primary, variants] of entries) {
    for (const name of primary) if (name) add(normalizeKey(name), id, true);
    for (const name of variants) if (name) add(normalizeKey(name), id, false);
  }
  return new Map([...rank].map(([key, { id }]) => [key, id]));
}

// Book token: optional single-digit ordinal + a word of letters/marks (any
// script), optionally closed by "." or the Myanmar section mark "၊" (U+104A):
// "၂ကော၊ ၄:၆". Judson numbers the history books up to 6 ("၆ ရာ၊ ၃:၁").
const BOOK = /^((?:[1-9]\s?)?[\p{L}\p{M}][\p{L}\p{M}'’]*)[.\u104A]?\s*(?=\d)/u;
// chapter[(:|.)verse][-(chapter:verse|verse|chapter)][, verse[-verse]]*
// Published separators: "24:14" (Tedim), "24.14" (Mizo), "38း2" and "6: 26" (Judson).
const LOCATOR = /^(\d+)(?:[:.\u1038]\s*(\d+))?(?:\s*[-–—]\s*(\d+)(?:[:.\u1038]\s*(\d+))?)?((?:\s*,\s*\d+(?:\s*[-–—]\s*\d+)?)*)/;
const NOTE = /^[\p{L}\p{M}]+\.?$/u; // trailing word such as "Thulu"
// Cross-book range: "1Sam 16:1-1Kum 2:11" (rest after the first book token).
const CROSS = /^(\d+)[:.](\d+)\s*[-–—]\s*((?:[1-9]\s?)?[\p{L}\p{M}][\p{L}\p{M}'’]*)[.\u104A]?\s*(\d+)[:.](\d+)$/u;
// Part separators: ";" everywhere; the Myanmar section mark after a number
// ("ယောဘ၊ 1:6၊ ဟေရှာ၊ 6:1") — after a book token it is punctuation, not a separator.
const SEPARATOR = /;|(?<=\d)\s*\u104A\s*/u;

/**
 * @typedef {{ book: number, chapter: number, verse?: number, endBook?: number, endChapter?: number, endVerse?: number }} Ref
 * @typedef {{ text: string, refs: Ref[], note?: string } | { text: string, unresolved: string }} RefPart
 */

/**
 * @param {string} text
 * @param {ReturnType<typeof createResolver>} resolver
 * @param {{ digit?: string[] }} [options] translation digit table for native numerals
 * @returns {RefPart[]}
 */
export function parseReferences(text, resolver, { digit } = {}) {
  const source = toAsciiDigits(text, digit).replace(INVISIBLE, '');
  const parts = [];
  let book = null;
  let bookToken = null;

  for (const raw of source.split(SEPARATOR)) {
    const part = raw.trim().replace(/[.,]$/, '');
    if (!part) continue;

    let rest = part;
    const bm = BOOK.exec(rest);
    if (bm) {
      bookToken = bm[1];
      book = resolver.resolve(bookToken);
      rest = rest.slice(bm[0].length);
    }
    if (bookToken === null) { parts.push({ text: part, unresolved: 'no book' }); continue; }
    if (book === null) {
      parts.push({ text: part, unresolved: resolver.isPending(bookToken) ? 'pending alias' : `unknown book "${bookToken}"` });
      continue;
    }

    const cm = CROSS.exec(rest);
    if (cm) {
      const endBook = resolver.resolve(cm[3]);
      if (endBook === null) { parts.push({ text: part, unresolved: `unknown book "${cm[3]}"` }); continue; }
      parts.push({ text: part, refs: [{ book, chapter: Number(cm[1]), verse: Number(cm[2]), endBook, endChapter: Number(cm[4]), endVerse: Number(cm[5]) }] });
      continue;
    }

    const lm = LOCATOR.exec(rest);
    if (!lm) { parts.push({ text: part, unresolved: 'no chapter' }); continue; }
    const tail = rest.slice(lm[0].length).trim();
    if (tail && !NOTE.test(tail)) { parts.push({ text: part, unresolved: `unparsed "${tail}"` }); continue; }

    let [, c1, v1, x, y, commas] = lm;
    // Single-chapter books (Obadiah, Philemon, 2–3 John, Jude) cite verses only:
    // "File 10-12" is Philemon 1:10-12, not chapters 10–12.
    if (!v1 && !y && resolver.chapters?.(book) === 1) { v1 = c1; c1 = '1'; }
    const first = { book, chapter: Number(c1) };
    let lastChapter = first.chapter;
    if (v1) first.verse = Number(v1);
    if (x && y) { first.endChapter = Number(x); first.endVerse = Number(y); lastChapter = first.endChapter; }
    else if (x && v1) first.endVerse = Number(x);
    else if (x) first.endChapter = Number(x);

    const refs = [first];
    for (const item of commas.split(',').map((s) => s.trim()).filter(Boolean)) {
      const [a, b] = item.split(/\s*[-–—]\s*/).map(Number);
      const ref = { book, chapter: lastChapter, verse: a };
      if (b) ref.endVerse = b;
      refs.push(ref);
    }
    const entry = { text: part, refs };
    if (tail) entry.note = tail;
    parts.push(entry);
  }
  return parts;
}

/**
 * "Gen.1.1" or "Gen.1.1,Gen.2.25"
 * @returns {{ start: Ref, end: Ref } | null} null when a book token does not resolve
 */
export function parseStoryRange(text, resolver) {
  const points = text.split(',').map((p) => p.trim()).filter(Boolean).map((p) => {
    const m = /^([1-3]?[\p{L}]+)\.(\d+)\.(\d+)$/u.exec(p);
    if (!m) return undefined;
    const book = resolver.resolve(m[1]);
    return book === null ? null : { book, chapter: Number(m[2]), verse: Number(m[3]) };
  });
  if (points.length === 0 || points.length > 2 || points.includes(undefined)) {
    throw new SyntaxError(`story ref: unrecognised format ${JSON.stringify(text)}`);
  }
  if (points.includes(null)) return null;
  return { start: points[0], end: points[1] ?? points[0] };
}

function toAsciiDigits(text, digit) {
  if (!digit || digit.length !== 10 || digit[0] === '0') return text;
  const map = new Map(digit.map((d, i) => [d, String(i)]));
  return [...text].map((ch) => map.get(ch) ?? ch).join('');
}

