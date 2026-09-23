/**
 * Query matching for scripture text.
 *
 * Plain words are ANDed; "a phrase" in quotes matches as written. Matching is
 * case- and accent-insensitive: text and query are folded to NFD with combining
 * marks removed, and offsets are mapped back to the original string so
 * highlighting lands on the right characters. Scripts whose marks carry meaning
 * (Myanmar, Arabic, Hebrew) keep theirs — only Latin-range marks are folded.
 */

const LATIN_MARKS = /[̀-ͯ]/g;

/** Fold for comparison, and record where each folded character came from. */
function fold(text) {
  const out = [];
  const map = [];
  for (let i = 0; i < text.length; i += 1) {
    const decomposed = text[i].normalize('NFD').replace(LATIN_MARKS, '').toLowerCase();
    for (const ch of decomposed) { out.push(ch); map.push(i); }
  }
  map.push(text.length);
  return { folded: out.join(''), map };
}

export function normalize(text) {
  return fold(text).folded;
}

/**
 * @param {string} query
 * @returns {{ terms: string[], test(text: string): {start:number,end:number}[] | null } | null}
 *          null when the query has nothing to match
 */
export function createMatcher(query) {
  const terms = parseQuery(query);
  if (!terms.length) return null;
  return {
    terms,
    /** @returns ranges in the ORIGINAL string, or null when a term is missing */
    test(text) {
      const { folded, map } = fold(text);
      const ranges = [];
      for (const term of terms) {
        let from = 0;
        let found = false;
        for (;;) {
          const at = folded.indexOf(term, from);
          if (at === -1) break;
          ranges.push({ start: map[at], end: map[at + term.length] });
          from = at + term.length;
          found = true;
        }
        if (!found) return null;
      }
      return ranges.sort((a, b) => a.start - b.start);
    },
  };
}

/** `love "the world" god` → ['love', 'the world', 'god'] */
export function parseQuery(query) {
  const terms = [];
  for (const [, quoted, bare] of query.matchAll(/"([^"]+)"|(\S+)/g)) {
    const term = normalize(quoted ?? bare).trim();
    if (term) terms.push(term);
  }
  return terms;
}

/**
 * A single-line excerpt around the first match.
 * @returns {{ before: string, hit: string, after: string }}
 */
export function snippet(text, ranges, { context = 42 } = {}) {
  const first = ranges[0] ?? { start: 0, end: 0 };
  const from = Math.max(0, first.start - context);
  const to = Math.min(text.length, first.end + context * 2);
  return {
    before: (from > 0 ? '…' : '') + text.slice(from, first.start),
    hit: text.slice(first.start, first.end),
    after: text.slice(first.end, to) + (to < text.length ? '…' : ''),
  };
}
