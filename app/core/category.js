/**
 * category.json — the canonical skeleton: testaments, sections, 66 books,
 * chapter counts and verse counts. Structure is frozen (shared with other
 * applications); this module only reads it.
 */

import {
  expectArray, expectObject, expectPositiveInt, expectString, fail, numericKey, optionalString,
} from './errors.js';

const SOURCE = 'category.json';

/**
 * @typedef {object} CategoryBook
 * @property {number} id
 * @property {string} name        English name
 * @property {string} shortname
 * @property {string[]} abbr
 * @property {number} testament
 * @property {number} section
 * @property {number} chapters
 * @property {number[]} verses    verses[chapter - 1] = verse count
 */

/**
 * @param {unknown} raw parsed JSON
 * @returns {Readonly<{
 *   testaments: {id:number,name:string,shortname:string}[],
 *   sections: {id:number,name:string}[],
 *   books: CategoryBook[],
 *   book(id:number): CategoryBook,
 *   hasBook(id:number): boolean,
 *   verseCount(book:number, chapter:number): number,
 *   guide: Record<string, Record<string, number[]>>,
 * }>}
 */
export function parseCategory(raw) {
  expectObject(raw, SOURCE, '$');

  const testaments = expectArray(raw.testament, SOURCE, '$.testament').map((t, i) => {
    const p = `$.testament[${i}]`;
    expectObject(t, SOURCE, p);
    return Object.freeze({
      id: expectPositiveInt(t.id, SOURCE, `${p}.id`),
      name: expectString(t.name, SOURCE, `${p}.name`),
      shortname: expectString(t.shortname, SOURCE, `${p}.shortname`),
    });
  });

  const sections = expectArray(raw.section, SOURCE, '$.section').map((s, i) => {
    const p = `$.section[${i}]`;
    expectObject(s, SOURCE, p);
    return Object.freeze({
      id: expectPositiveInt(s.id, SOURCE, `${p}.id`),
      name: expectString(s.name, SOURCE, `${p}.name`),
    });
  });

  const testamentIds = new Set(testaments.map((t) => t.id));
  const sectionIds = new Set(sections.map((s) => s.id));
  const byId = new Map();

  const books = expectArray(raw.book, SOURCE, '$.book').map((b, i) => {
    const p = `$.book[${i}]`;
    expectObject(b, SOURCE, p);
    const id = expectPositiveInt(b.id, SOURCE, `${p}.id`);
    if (byId.has(id)) fail(SOURCE, `${p}.id`, `duplicate book id ${id}`);

    const info = expectObject(b.info, SOURCE, `${p}.info`);
    const clue = expectObject(b.clue, SOURCE, `${p}.clue`);
    const chapters = expectPositiveInt(clue.c, SOURCE, `${p}.clue.c`);
    const verses = expectArray(clue.v, SOURCE, `${p}.clue.v`)
      .map((n, j) => expectPositiveInt(n, SOURCE, `${p}.clue.v[${j}]`));
    if (verses.length !== chapters) {
      fail(SOURCE, `${p}.clue.v`, `has ${verses.length} entries but clue.c is ${chapters}`);
    }

    const testament = expectPositiveInt(clue.t, SOURCE, `${p}.clue.t`);
    const section = expectPositiveInt(clue.s, SOURCE, `${p}.clue.s`);
    if (!testamentIds.has(testament)) fail(SOURCE, `${p}.clue.t`, `unknown testament ${testament}`);
    if (!sectionIds.has(section)) fail(SOURCE, `${p}.clue.s`, `unknown section ${section}`);

    const book = Object.freeze({
      id,
      name: expectString(info.name, SOURCE, `${p}.info.name`),
      shortname: expectString(info.shortname, SOURCE, `${p}.info.shortname`),
      abbr: Object.freeze(expectArray(info.abbr, SOURCE, `${p}.info.abbr`)
        .map((a, j) => expectString(a, SOURCE, `${p}.info.abbr[${j}]`))),
      desc: optionalString(info.desc, SOURCE, `${p}.info.desc`) ?? '',
      testament,
      section,
      chapters,
      verses: Object.freeze(verses),
    });
    byId.set(id, book);
    return book;
  });

  const guide = expectObject(raw.guide, SOURCE, '$.guide');
  for (const [t, secs] of Object.entries(guide)) {
    numericKey(t, SOURCE, `$.guide.${t}`);
    expectObject(secs, SOURCE, `$.guide.${t}`);
    for (const [s, ids] of Object.entries(secs)) {
      numericKey(s, SOURCE, `$.guide.${t}.${s}`);
      expectArray(ids, SOURCE, `$.guide.${t}.${s}`).forEach((id, j) => {
        if (!byId.has(id)) fail(SOURCE, `$.guide.${t}.${s}[${j}]`, `unknown book id ${id}`);
      });
    }
  }

  const book = (id) => {
    const found = byId.get(id);
    if (!found) throw new RangeError(`category.json: unknown book id ${id}`);
    return found;
  };

  return Object.freeze({
    testaments: Object.freeze(testaments),
    sections: Object.freeze(sections),
    books: Object.freeze(books),
    guide,
    book,
    hasBook: (id) => byId.has(id),
    verseCount(bookId, chapter) {
      const b = book(bookId);
      if (!Number.isInteger(chapter) || chapter < 1 || chapter > b.chapters) {
        throw new RangeError(`category.json: ${b.shortname} has no chapter ${chapter}`);
      }
      return b.verses[chapter - 1];
    },
  });
}
