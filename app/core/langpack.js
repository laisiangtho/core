/**
 * Language packs: `lang/iso-{code}.json` in the catalog repository, keyed by
 * the language's ISO 639-3 code.
 *
 * A pack names the testaments, the books, the sections and the digits of one
 * language. It is the middle of three sources for any name the reader sees:
 *
 *   the translation file  →  the language pack  →  category.json (the canon)
 *
 * The translation wins because it is the edition in front of the reader; the
 * pack fills in what that file leaves out (most files name their books but not
 * their testaments); the canon is the last resort and is always English.
 *
 * Packs carry more books than the canon does (84, including the
 * deuterocanonical ones), so entries are kept by id and looked up, never
 * indexed by position.
 */

import { expectObject, expectString, fail, isPlainObject, optionalString } from './errors.js';

/**
 * @param {unknown} raw
 * @param {{ code: string, source: string }} options
 * @returns {{ code: string, digit: string[], testaments: object, sections: object,
 *             books: object, locale: object }}
 */
export function parseLangPack(raw, { code, source }) {
  expectObject(raw, source, '$');

  const digit = raw.digit === undefined ? [] : asDigits(raw.digit, source);
  const testaments = named(raw.testament, source, '$.testament');
  const books = named(raw.book, source, '$.book');

  const sections = {};
  if (raw.section !== undefined) {
    const section = expectObject(raw.section, source, '$.section');
    for (const [key, value] of Object.entries(section)) {
      const id = Number(key);
      if (!Number.isInteger(id)) fail(source, `$.section.${key}`, 'expected a numeric key');
      sections[id] = expectString(value, source, `$.section.${key}`);
    }
  }

  const locale = {};
  if (raw.locale !== undefined) {
    const table = expectObject(raw.locale, source, '$.locale');
    for (const [key, value] of Object.entries(table)) {
      if (typeof value === 'string') locale[key] = value;
    }
  }

  return Object.freeze({
    code,
    digit: Object.freeze(digit),
    testaments: Object.freeze(testaments),
    sections: Object.freeze(sections),
    books: Object.freeze(books),
    locale: Object.freeze(locale),
  });
}

/** `{ "1": { info: { name, shortname, abbr } } }` → `{ 1: { name, shortname, abbr } }` */
function named(raw, source, path) {
  const out = {};
  if (raw === undefined) return out;
  const table = expectObject(raw, source, path);
  for (const [key, entry] of Object.entries(table)) {
    const id = Number(key);
    if (!Number.isInteger(id)) fail(source, `${path}.${key}`, 'expected a numeric key');
    if (!isPlainObject(entry)) fail(source, `${path}.${key}`, 'expected an object');
    const info = entry.info === undefined ? {} : expectObject(entry.info, source, `${path}.${key}.info`);
    const name = optionalString(info.name, source, `${path}.${key}.info.name`) ?? '';
    if (!name) continue; // an entry with no name says nothing; the next source answers
    out[id] = Object.freeze({
      name,
      shortname: optionalString(info.shortname, source, `${path}.${key}.info.shortname`) ?? name,
      abbr: Object.freeze(Array.isArray(info.abbr) ? info.abbr.filter((a) => typeof a === 'string') : []),
    });
  }
  return out;
}

function asDigits(raw, source) {
  if (!Array.isArray(raw)) fail(source, '$.digit', 'expected an array');
  const digit = raw.map((d, i) => expectString(d, source, `$.digit[${i}]`));
  if (digit.length !== 0 && digit.length !== 10) fail(source, '$.digit', `expected 0 or 10 digits, got ${digit.length}`);
  return digit;
}

/** The ISO 639-3 code a translation's own metadata gives, if it gives one. */
export function packCode(language) {
  const iso = isPlainObject(language?.iso) ? language.iso : {};
  const long = typeof iso['639-3'] === 'string' ? iso['639-3'].trim() : '';
  const name = typeof language?.name === 'string' ? language.name.trim() : '';
  // Translation files put the 639-3 code in `name`; the catalog uses 639-1,
  // which no pack is keyed by, so a two-letter code is not worth a request.
  const code = long || name;
  return /^[a-z]{3}$/i.test(code) ? code.toLowerCase() : '';
}
