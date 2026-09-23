/**
 * Reading plans and the verse of the day.
 *
 * A plan is not a stored list of readings: it is a rule — which books, over how
 * many days — so the schedule is derived from the canon every time it is drawn.
 * Progress is the set of chapters read, which means reading ahead or catching
 * up needs no bookkeeping at all.
 *
 * Pure: the day comes in as an ISO date, the canon as the parsed category.
 */

/** A chapter, as a plan refers to it. */
export const chapterKey = (book, chapter) => `${book}.${chapter}`;

export function parseChapterKey(key) {
  const [book, chapter] = String(key).split('.').map(Number);
  return Number.isInteger(book) && Number.isInteger(chapter) ? { book, chapter } : null;
}

const GOSPELS = [40, 41, 42, 43];
const PSALMS = 19;
const NEW_TESTAMENT = 2;

export const PLANS = Object.freeze([
  { id: 'canon365', days: 365, keep: () => true },
  { id: 'nt90', days: 90, keep: (b) => b.testament === NEW_TESTAMENT },
  { id: 'gospels40', days: 40, keep: (b) => GOSPELS.includes(b.id) },
  { id: 'psalms30', days: 30, keep: (b) => b.id === PSALMS },
].map(Object.freeze));

export const planById = (id) => PLANS.find((p) => p.id === id) ?? null;

/** Every chapter a plan covers, in canonical order. */
export function planChapters(category, def) {
  return category.books.filter(def.keep).flatMap((b) => Array.from({ length: b.chapters }, (_, i) => chapterKey(b.id, i + 1)));
}

/** Today in the reader's own time zone: a day turns over at their midnight. */
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Days since the epoch, so two ISO dates can be subtracted. */
export function dayNumber(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 864e5);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {{ id: string, start: string, read: Record<string, number> }|null} record
 * @returns {null | { def: object, keys: string[], day: number, today: string[],
 *                    behind: string[], read: object, done: number, total: number, finished: boolean }}
 *          null when nothing is running, or the record names a plan this build has no rule for.
 */
export function planState(record, category, today = localDate()) {
  if (!record || typeof record !== 'object') return null;
  const def = planById(record.id);
  if (!def || !ISO_DATE.test(record.start ?? '')) return null;

  const keys = planChapters(category, def);
  const total = keys.length;
  const day = Math.max(0, dayNumber(today) - dayNumber(record.start)); // 0-based
  const upTo = (d) => Math.floor(Math.min(d, def.days) * total / def.days);
  const read = record.read && typeof record.read === 'object' ? record.read : {};
  const done = keys.filter((k) => read[k]).length;

  return {
    def,
    keys,
    day,
    today: day < def.days ? keys.slice(upTo(day), upTo(day + 1)) : [],
    behind: keys.slice(0, upTo(day)).filter((k) => !read[k]),
    read,
    done,
    total,
    finished: done === total,
  };
}

/** One verse a day, the same for everyone on the same date. */
const DAILY = Object.freeze([
  [43, 3, 16], [19, 23, 1], [45, 8, 28], [50, 4, 13], [23, 53, 5],
  [40, 5, 9], [46, 13, 4], [1, 1, 1], [43, 1, 1], [19, 1, 1],
  [20, 3, 5], [24, 29, 11], [6, 1, 9], [33, 6, 8], [25, 3, 22],
  [23, 40, 31], [40, 11, 28], [43, 14, 6], [45, 12, 2], [48, 5, 22],
  [49, 2, 8], [58, 11, 1], [59, 1, 5], [62, 4, 19], [19, 46, 1],
  [19, 119, 105], [55, 1, 7], [51, 3, 23], [66, 21, 4],
  [50, 4, 6], [45, 5, 8],
]);

/** @returns {{ book: number, chapter: number, verse: number }} */
export function dailyVerse(today = localDate()) {
  const [book, chapter, verse] = DAILY[((dayNumber(today) % DAILY.length) + DAILY.length) % DAILY.length];
  return { book, chapter, verse };
}
