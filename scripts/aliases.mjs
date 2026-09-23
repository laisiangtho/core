#!/usr/bin/env node
/**
 * Alias overlay maintenance: app/core/aliases/{identify}.json
 *
 * Lists book tokens used in a translation's cross-references that resolve
 * through neither the translation's own book info nor category.json, and
 * suggests a mapping for each.
 *
 * A suggestion is "confirmed" only when both hold:
 *   - name:  the token (ordinal stripped) is a prefix of exactly one book's
 *            localised or English name, among books whose category.json
 *            ordinal matches the token's ("1Joh" → 1Jn only), and
 *   - fit:   at least 95% of the chapter:verse locators cited with the token
 *            exist in that book (category.json counts, +2 verses of
 *            versification slack). Published refs contain occasional typos,
 *            so a strict 100% rule would reject correct mappings; misfits
 *            are printed for review.
 * Other tokens are written as null (known, unmapped) for manual review.
 *
 * Dry-run by default. --apply writes the overlay, preserving existing entries.
 *
 * Usage:
 *   node scripts/aliases.mjs <identify> [--file path/to/{identify}.json] [--apply]
 *
 * Node standard library only.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { parseCategory } from '../app/core/category.js';
import { parseTranslation } from '../app/core/translation.js';
import { createResolver, normalizeKey, parseAliases, parseReferences } from '../app/core/reference.js';
import { defaults } from '../app/config.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLACK = 2;
const FIT_RATIO = 0.95;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { file: { type: 'string' }, apply: { type: 'boolean', default: false } },
});
const identify = positionals[0];
if (!identify || positionals.length > 1) {
  console.error('usage: node scripts/aliases.mjs <identify> [--file PATH] [--apply]');
  process.exit(2);
}

const category = parseCategory(readJson(resolve(ROOT, 'public/category.json')));
const raw = values.file
  ? readJson(resolve(values.file))
  : await fetchJson(defaults.translationUrl.replace('{identify}', identify));
const { meta, chapters } = parseTranslation(raw, { identify, category });

const overlayPath = resolve(ROOT, `app/core/aliases/${identify}.json`);
const existingRaw = existsSync(overlayPath) ? readJson(overlayPath) : {};
const existing = parseAliases(existingRaw, { source: overlayPath, category });

// Resolve known tokens normally; give each unknown token a probe id (>= 1000)
// so parseReferences still yields its chapter:verse locators.
const real = createResolver({ category, books: meta.books, aliases: existing });
const probes = new Map(); // normalised key -> { token, id, locators: [], count }
const probing = {
  resolve(token) {
    const id = real.resolve(token);
    if (id !== null) return id;
    if (existing[token] === null) return null; // declared pending; skip re-suggesting
    const key = normalizeKey(token);
    if (!probes.has(key)) probes.set(key, { token, id: 1000 + probes.size, locators: [], samples: [] });
    return probes.get(key).id;
  },
  isPending: real.isPending,
  chapters: (id) => (id >= 1000 ? undefined : real.chapters(id)),
};
const byProbeId = () => new Map([...probes.values()].map((p) => [p.id, p]));

for (const ch of chapters) {
  for (const verse of Object.values(ch.verses)) {
    if (!verse.ref) continue;
    for (const part of parseReferences(verse.ref, probing, { digit: meta.digit })) {
      if (!part.refs) continue;
      const lookup = byProbeId();
      for (const ref of part.refs) {
        const probe = lookup.get(ref.book);
        if (!probe) continue;
        probe.locators.push(ref);
        if (probe.samples.length < 3) probe.samples.push(`${ch.book}.${ch.chapter}: ${part.text}`);
      }
    }
  }
}

const rows = [...probes.values()].sort((a, b) => b.locators.length - a.locators.length).map(suggest);
report(rows);

if (!values.apply) {
  console.log('\nDry run. Re-run with --apply to write', rel(overlayPath));
  process.exit(0);
}

const next = { ...existingRaw };
for (const row of rows) if (!(row.token in next)) next[row.token] = row.status === 'confirmed' ? row.book : null;
writeFileSync(overlayPath, JSON.stringify(sortKeys(next), null, 2) + '\n');
console.log(`\nWrote ${rel(overlayPath)} (${Object.keys(next).length} entries). Review the diff before committing.`);

// ---------------------------------------------------------------------------

function suggest(probe) {
  const misfitsOf = (b) => probe.locators.filter((r) => !fitsBook(r, b));
  const fits = category.books.filter((b) => misfitsOf(b).length <= probe.locators.length * (1 - FIT_RATIO));
  // The ordinal must agree with category.json ("1Joh" can only be 1Jn, never Jhn);
  // localised names rarely carry the digit ("Johan Masa"), so only the stem is matched.
  const { ordinal, stem } = splitToken(probe.token);
  const named = fits
    .filter((b) => splitToken(b.shortname).ordinal === ordinal)
    .filter((b) => names(b.id).some((n) => splitToken(n).stem.startsWith(stem)));

  let status = 'unknown';
  let book = null;
  if (named.length === 1) { status = 'confirmed'; book = named[0].id; }
  else if (named.length > 1) status = 'ambiguous';
  else if (fits.length === 1) { status = 'fit-only'; book = fits[0].id; }

  const misfits = book ? misfitsOf(category.book(book)).map(formatRef) : [];
  return { token: probe.token, uses: probe.locators.length, status, book, fits: fits.length, named: named.map((b) => b.id), samples: probe.samples, misfits };
}

function fitsBook(ref, book) {
  // Probe ids carry no chapter count, so single-chapter citations ("File 10-12")
  // arrive as chapter numbers; for a one-chapter candidate they are verses.
  if (book.chapters === 1 && ref.verse === undefined) {
    return [ref.chapter, ref.endChapter].every((v) => v === undefined || v <= book.verses[0] + SLACK);
  }
  const chapterFits = (c) => c >= 1 && c <= book.chapters;
  if (!chapterFits(ref.chapter)) return false;
  if (ref.verse !== undefined && ref.verse > book.verses[ref.chapter - 1] + SLACK) return false;
  if (ref.endChapter !== undefined && ref.endBook === undefined && !chapterFits(ref.endChapter)) return false;
  return true;
}

function formatRef(r) {
  return `${r.chapter}${r.verse === undefined ? '' : `:${r.verse}`}`;
}

function names(id) {
  const local = meta.books[id];
  const canon = category.book(id);
  return [local?.name, local?.shortname, ...(local?.abbr ?? []), canon.name, canon.shortname].filter(Boolean);
}

function splitToken(token) {
  const key = normalizeKey(token);
  const m = /^(\d?)(.*)$/u.exec(key);
  return { ordinal: m[1], stem: m[2] };
}

function report(list) {
  const label = (id) => (id ? `${id} ${category.book(id).shortname} (${meta.books[id]?.name ?? '-'})` : '-');
  console.log(`${identify}: ${list.length} unresolved book tokens\n`);
  for (const r of list) {
    console.log(`${r.token.padEnd(10)} uses=${String(r.uses).padStart(4)}  ${r.status.padEnd(9)}  ${label(r.book)}`
      + (r.status === 'ambiguous' ? `  candidates: ${r.named.map(label).join(', ')}` : '')
      + (r.status === 'unknown' ? `  (${r.fits} books fit the cited chapters)` : ''));
    for (const s of r.samples) console.log(`${' '.repeat(12)}${s}`);
    if (r.misfits.length) console.log(`${' '.repeat(12)}misfit locators: ${r.misfits.slice(0, 5).join(', ')}`);
  }
  const count = (s) => list.filter((r) => r.status === s).length;
  console.log(`\nconfirmed ${count('confirmed')}, fit-only ${count('fit-only')}, ambiguous ${count('ambiguous')}, unknown ${count('unknown')}`);
  console.log('Only "confirmed" rows are written with a book id; others are written as null.');
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    console.error(`cannot read ${path}: ${err.message}`);
    process.exit(1);
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`GET ${url}: HTTP ${res.status}`);
    process.exit(1);
  }
  return res.json();
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

function rel(path) {
  return path.startsWith(ROOT) ? path.slice(ROOT.length + 1) : path;
}
