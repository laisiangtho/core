/**
 * Language packs, fetched once and kept.
 *
 * A pack is small (tens of kilobytes) and changes rarely, so it is cached in
 * the records store and read from there on every later run: the names a reader
 * sees must not depend on being online. A cached pack older than the refresh
 * window is used immediately and re-fetched in the background, so a correction
 * upstream arrives without anyone waiting for it.
 */

import { packCode, parseLangPack } from '../core/langpack.js';
import { fetchJson } from './library.js';

const REFRESH_DAYS = 30;
const key = (code) => `lang:${code}`;

export function createLangPacks({ records, config }) {
  const loaded = new Map();   // code → parsed pack
  const pending = new Map();  // code → in-flight promise
  const events = new EventTarget();

  /** The pack for a translation's language, if this build can name one. */
  function codeFor(meta) {
    return packCode(meta?.info?.language);
  }

  /** What is already in hand, without waiting: null until a pack is loaded. */
  function get(code) {
    if (!code) return null;
    if (loaded.has(code)) return loaded.get(code);
    const held = records.get(key(code), null);
    if (!held?.raw) return null;
    try {
      const pack = parseLangPack(held.raw, { code, source: `cached ${code} language pack` });
      loaded.set(code, pack);
      return pack;
    } catch {
      // A cached pack that no longer parses is not worth keeping or reporting:
      // the fetch below replaces it.
      records.save(key(code), null).catch(() => {});
      return null;
    }
  }

  /**
   * Make sure a pack is in hand. Resolves to it, or to null when the language
   * has no pack — a missing pack is normal, not a failure: the canon answers.
   */
  async function ensure(code) {
    if (!code) return null;
    const held = records.get(key(code), null);
    const stale = !held?.fetchedAt || Date.now() - Date.parse(held.fetchedAt) > REFRESH_DAYS * 864e5;
    const inHand = get(code);
    if (inHand && !stale) return inHand;
    if (pending.has(code)) return inHand ?? pending.get(code);

    const url = config.langPackUrl.replace('{code}', code);
    const request = fetchJson(url, `${code} language pack`)
      .then(async (raw) => {
        const pack = parseLangPack(raw, { code, source: `${code} language pack` });
        loaded.set(code, pack);
        await records.save(key(code), { raw, fetchedAt: new Date().toISOString() });
        events.dispatchEvent(new CustomEvent('change', { detail: { code } }));
        return pack;
      })
      .catch(() => {
        // No pack for this language, or no network. Either way the canon names
        // the books; remember the miss so the next chapter does not ask again.
        loaded.set(code, null);
        return null;
      })
      .finally(() => pending.delete(code));

    pending.set(code, request);
    return inHand ?? request;
  }

  return {
    codeFor,
    get,
    ensure,
    /** For a translation's meta, in one call. */
    forMeta: (meta) => get(codeFor(meta)),
    ensureFor: (meta) => ensure(codeFor(meta)),
    on: (type, fn) => { events.addEventListener(type, fn); return () => events.removeEventListener(type, fn); },
  };
}
