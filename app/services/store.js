/**
 * IndexedDB storage for offline translations and the fetched catalog.
 *
 * Object stores
 *   translations  key: identify                  value: parsed meta + install info
 *   chapters      key: [identify, book, chapter] value: { identify, book, chapter, verses }
 *   catalog       key: 'current'                 value: { id, raw, fetchedAt }
 *   settings      key: 'current'                 value: { id, ...settings }
 *   records       key: feature key               value: { id, value } — feature-owned
 *                                                documents (plan progress, board, ink)
 *   notes         key: id                        value: note (keyed on the passage, not a translation)
 *   marks         key: "book.chapter.verse"      value: bookmark
 *
 * Works in the main thread and in workers. Install and remove are single
 * transactions: a failed install leaves the previous copy untouched.
 */

const DB_NAME = 'lai-siangtho';
const DB_VERSION = 4;

export async function openStore({ name = DB_NAME } = {}) {
  if (typeof indexedDB === 'undefined') throw new Error('IndexedDB is not available in this environment');
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open(name, DB_VERSION);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains('translations')) d.createObjectStore('translations', { keyPath: 'identify' });
      if (!d.objectStoreNames.contains('chapters')) d.createObjectStore('chapters', { keyPath: ['identify', 'book', 'chapter'] });
      if (!d.objectStoreNames.contains('catalog')) d.createObjectStore('catalog', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('settings')) d.createObjectStore('settings', { keyPath: 'id' }); // added in v2
      if (!d.objectStoreNames.contains('notes')) d.createObjectStore('notes', { keyPath: 'id' }); // added in v3
      if (!d.objectStoreNames.contains('marks')) d.createObjectStore('marks', { keyPath: 'id' }); // added in v3
      if (!d.objectStoreNames.contains('records')) d.createObjectStore('records', { keyPath: 'id' }); // added in v4
    };
    req.onblocked = () => reject(new Error('IndexedDB upgrade blocked: close other open windows of this app and reload'));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.onversionchange = () => db.close();
  return new TranslationStore(db);
}

class TranslationStore {
  #db;

  constructor(db) {
    this.#db = db;
  }

  /** Installed translations: [{ identify, version, info, bytes, installedAt }] */
  async list() {
    const all = await request(this.#tx('translations').objectStore('translations').getAll());
    return all.map(({ identify, version, info, bytes, installedAt }) => ({ identify, version, info, bytes, installedAt }));
  }

  async getMeta(identify) {
    const meta = await request(this.#tx('translations').objectStore('translations').get(identify));
    if (!meta) throw new Error(`translation ${identify} is not installed`);
    return meta;
  }

  /** @returns {Promise<Record<string, object> | null>} verses, or null when the translation lacks the chapter */
  async getChapter(identify, book, chapter) {
    const rec = await request(this.#tx('chapters').objectStore('chapters').get([identify, book, chapter]));
    return rec ? rec.verses : null;
  }

  /**
   * Replace (or create) a translation atomically.
   * @param {{ meta: object, chapters: {book:number,chapter:number,verses:object}[] }} parsed
   * @param {{ bytes: number }} info
   */
  async install(parsed, { bytes }) {
    const { identify } = parsed.meta;
    const tx = this.#tx(['translations', 'chapters'], 'readwrite');
    const chapters = tx.objectStore('chapters');
    // Array keys sort after numbers, so [identify, []] is greater than every
    // [identify, book, chapter]; the range covers exactly this translation.
    chapters.delete(IDBKeyRange.bound([identify], [identify, []]));
    for (const c of parsed.chapters) chapters.put({ identify, book: c.book, chapter: c.chapter, verses: c.verses });
    tx.objectStore('translations').put({ ...parsed.meta, bytes, installedAt: new Date().toISOString() });
    await done(tx);
  }

  async remove(identify) {
    const tx = this.#tx(['translations', 'chapters'], 'readwrite');
    tx.objectStore('chapters').delete(IDBKeyRange.bound([identify], [identify, []]));
    tx.objectStore('translations').delete(identify);
    await done(tx);
  }

  /** @returns {Promise<{ raw: unknown, fetchedAt: string } | null>} */
  async getCatalog() {
    const rec = await request(this.#tx('catalog').objectStore('catalog').get('current'));
    return rec ? { raw: rec.raw, fetchedAt: rec.fetchedAt } : null;
  }

  async putCatalog(raw, fetchedAt = new Date().toISOString()) {
    const tx = this.#tx('catalog', 'readwrite');
    tx.objectStore('catalog').put({ id: 'current', raw, fetchedAt });
    await done(tx);
  }

  /**
   * Walk every chapter of a translation. Used by search, which reads far more
   * than it keeps: a cursor avoids holding the whole translation in memory.
   * @param {(record: {book:number,chapter:number,verses:object}) => void} visit
   */
  scanChapters(identify, visit) {
    return new Promise((resolve, reject) => {
      const tx = this.#tx('chapters');
      const request = tx.objectStore('chapters').openCursor(IDBKeyRange.bound([identify], [identify, []]));
      request.onsuccess = () => {
        const cursor = request.result;
        if (!cursor) { resolve(); return; }
        visit(cursor.value);
        cursor.continue();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /** Notes and bookmarks: small records, read whole and filtered by the caller. */
  async annotations() {
    const [notes, marks] = await Promise.all([
      request(this.#tx('notes').objectStore('notes').getAll()),
      request(this.#tx('marks').objectStore('marks').getAll()),
    ]);
    return { notes, marks };
  }

  async putAnnotation(kind, record) {
    const tx = this.#tx(kind, 'readwrite');
    tx.objectStore(kind).put(record);
    await done(tx);
  }

  async deleteAnnotation(kind, id) {
    const tx = this.#tx(kind, 'readwrite');
    tx.objectStore(kind).delete(id);
    await done(tx);
  }

  /** Bulk replace used by import; existing records with the same id are overwritten. */
  async mergeAnnotations({ notes = [], marks = [] }) {
    const tx = this.#tx(['notes', 'marks'], 'readwrite');
    for (const note of notes) tx.objectStore('notes').put(note);
    for (const mark of marks) tx.objectStore('marks').put(mark);
    await done(tx);
  }

  /** @returns {Promise<object|null>} raw settings; validation belongs to the caller */
  async getSettings() {
    const rec = await request(this.#tx('settings').objectStore('settings').get('current'));
    if (!rec) return null;
    const { id, ...settings } = rec;
    return settings;
  }

  async putSettings(settings) {
    const tx = this.#tx('settings', 'readwrite');
    tx.objectStore('settings').put({ id: 'current', ...settings });
    await done(tx);
  }

  /**
   * Feature records: whatever a feature keeps that is too large or too much its
   * own shape for settings — plan progress, board cards, ink strokes.
   * @returns {Promise<Record<string, unknown>>} every record, by key
   */
  async records() {
    const all = await request(this.#tx('records').objectStore('records').getAll());
    return Object.fromEntries(all.map(({ id, value }) => [id, value]));
  }

  async putRecord(id, value) {
    const tx = this.#tx('records', 'readwrite');
    tx.objectStore('records').put({ id, value });
    await done(tx);
  }

  async deleteRecord(id) {
    const tx = this.#tx('records', 'readwrite');
    tx.objectStore('records').delete(id);
    await done(tx);
  }

  #tx(names, mode = 'readonly') {
    return this.#db.transaction(names, mode);
  }
}

/** Storage usage and persistence state for the whole origin. */
export async function storageStatus() {
  if (!navigator.storage?.estimate) return { usage: null, quota: null, persisted: null };
  const [{ usage, quota }, persisted] = await Promise.all([
    navigator.storage.estimate(),
    navigator.storage.persisted ? navigator.storage.persisted() : Promise.resolve(null),
  ]);
  return { usage, quota, persisted };
}

/**
 * Ask the browser not to evict stored data under pressure. Browsers may grant
 * silently, prompt, or refuse; the result is reported, never assumed.
 */
export async function requestPersistence() {
  if (!navigator.storage?.persist) return false;
  return navigator.storage.persist();
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function done(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}
