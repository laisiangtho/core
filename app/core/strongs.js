/**
 * Strong's numbers embedded in verse text.
 *
 * None of the translations published in the catalog today carry them, so this
 * reads the notations used by the common public editions and leaves the text
 * untouched when there are none:
 *
 *   {H7225}  {G0026}      brace form (e-Sword, MySword)
 *   <S>430</S>            tag form (Bible SuperSearch)
 *   [H430]                bracket form
 *   H7225 / G26           bare, only when preceded by one of the above forms
 *
 * A code is attached to the word before it, which is how every one of those
 * editions writes it.
 */

// Built fresh per use: a shared /g regex carries lastIndex between calls, so
// a test() would move where the next matchAll() starts.
const TOKEN_SOURCE = String.raw`\{([HG]?\d{1,5})\}|<S>([HG]?\d{1,5})<\/S>|\[([HG]\d{1,5})\]`;
const tokens = () => new RegExp(TOKEN_SOURCE, 'g');

/**
 * @param {string} text
 * @returns {{ text: string, codes: {code: string, at: number}[] }}
 *          `text` without the markup, and each code with its offset into it
 */
export function extractStrongs(text) {
  if (!hasStrongs(text)) return { text, codes: [] };
  const codes = [];
  let out = '';
  let last = 0;
  for (const match of text.matchAll(tokens())) {
    out += text.slice(last, match.index);
    codes.push({ code: normalizeCode(match[1] ?? match[2] ?? match[3]), at: out.length });
    last = match.index + match[0].length;
  }
  out += text.slice(last);
  return { text: out.replace(/\s{2,}/g, ' ').trimEnd(), codes };
}

export function hasStrongs(text) {
  return tokens().test(text);
}

/** "26" → "G26" is unknowable; a bare number keeps its form, letters upper-case. */
export function normalizeCode(code) {
  return /^[hg]/i.test(code) ? code[0].toUpperCase() + String(Number(code.slice(1))) : String(Number(code));
}

/**
 * Split text into runs so each word that carries a code can be wrapped.
 * @returns {{ text: string, code: string|null }[]}
 */
export function strongsRuns(text) {
  const { text: clean, codes } = extractStrongs(text);
  if (!codes.length) return [{ text: clean, code: null }];

  const runs = [];
  let from = 0;
  for (const { code, at } of codes) {
    // The code belongs to the word ending at `at`.
    const wordStart = clean.lastIndexOf(' ', Math.max(at - 1, 0)) + 1;
    if (wordStart > from) runs.push({ text: clean.slice(from, wordStart), code: null });
    runs.push({ text: clean.slice(Math.max(wordStart, from), at), code });
    from = at;
  }
  if (from < clean.length) runs.push({ text: clean.slice(from), code: null });
  return runs.filter((run) => run.text !== '');
}
