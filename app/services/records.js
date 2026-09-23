/**
 * Feature records: the state a feature owns and settings has no schema for —
 * reading-plan progress, the study board, ink strokes.
 *
 * Loaded once at startup (the whole set is small) and written through on every
 * change, so a feature reads its record synchronously while it draws. Each
 * feature owns one key and is the only writer of it.
 */

export async function createRecords({ store }) {
  const records = new Map(Object.entries(await store.records()));
  const events = new EventTarget();

  return {
    /** @returns {unknown} the record, or `fallback` when the feature has none yet */
    get(key, fallback = null) {
      return records.has(key) ? records.get(key) : fallback;
    },

    /** Write the record through. Passing null removes it. */
    async save(key, value) {
      if (value === null) {
        records.delete(key);
        await store.deleteRecord(key);
      } else {
        records.set(key, value);
        await store.putRecord(key, value);
      }
      events.dispatchEvent(new CustomEvent('change', { detail: { key } }));
    },

    /** For the settings export. */
    toJSON: () => Object.fromEntries(records),

    /** Import: a key in the file replaces the one held, the rest are kept. */
    async merge(incoming) {
      if (incoming === null || typeof incoming !== 'object') return 0;
      const keys = Object.keys(incoming);
      for (const key of keys) {
        records.set(key, incoming[key]);
        await store.putRecord(key, incoming[key]);
      }
      events.dispatchEvent(new CustomEvent('change', { detail: { key: null } }));
      return keys.length;
    },

    on: (type, fn) => { events.addEventListener(type, fn); return () => events.removeEventListener(type, fn); },
  };
}
