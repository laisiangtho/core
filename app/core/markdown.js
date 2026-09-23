/**
 * The small Markdown a note is written in, plus the two things the app reads
 * back out of notes: wikilinks and tags.
 *
 * Deliberately small — headings, emphasis, code, quotes, lists, links,
 * `[[Genesis 1]]` wikilinks and `#tags`. The parser returns a token tree, so
 * the renderer can build DOM nodes (never HTML strings: note text is the
 * reader's, but verse text quoted into it is not).
 */

const TAG = /(^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}/_-]*)/gu;
const WIKILINK = /\[\[([^\]]+)\]\]/g;

/** @returns {{ type: string, ... }[]} block tokens */
export function parseBlocks(text) {
  const blocks = [];
  const lines = String(text ?? '').split('\n');
  let list = null;

  const flush = () => { if (list) { blocks.push(list); list = null; } };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    const numbered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    const quote = /^>\s?(.*)$/.exec(line);

    if (!line.trim()) { flush(); continue; }
    if (heading) { flush(); blocks.push({ type: 'heading', level: heading[1].length, text: heading[2] }); continue; }
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) { flush(); list = { type: 'list', ordered, items: [] }; }
      list.items.push((bullet ?? numbered)[bullet ? 1 : 2]);
      continue;
    }
    flush();
    if (quote) {
      const last = blocks.at(-1);
      if (last?.type === 'quote') last.text += `\n${quote[1]}`;
      else blocks.push({ type: 'quote', text: quote[1] });
      continue;
    }
    const last = blocks.at(-1);
    if (last?.type === 'paragraph') last.text += `\n${line}`;
    else blocks.push({ type: 'paragraph', text: line });
  }
  flush();
  return blocks;
}

/**
 * Inline tokens of one line.
 * @returns {{ type: 'text'|'strong'|'em'|'code'|'link'|'wikilink'|'tag', text: string, href?: string }[]}
 */
export function parseInline(text) {
  const out = [];
  const pattern = /\[\[([^\]]+)\]\]|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|(^|[\s(])#([\p{L}\p{N}][\p{L}\p{N}/_-]*)/gu;
  let last = 0;
  for (const m of String(text ?? '').matchAll(pattern)) {
    if (m.index > last) out.push({ type: 'text', text: text.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ type: 'wikilink', text: m[1] });
    else if (m[2] !== undefined) out.push({ type: 'link', text: m[2], href: m[3] });
    else if (m[4] !== undefined) out.push({ type: 'strong', text: m[4] });
    else if (m[5] !== undefined) out.push({ type: 'em', text: m[5] });
    else if (m[6] !== undefined) out.push({ type: 'code', text: m[6] });
    else {
      if (m[7]) out.push({ type: 'text', text: m[7] });
      out.push({ type: 'tag', text: m[8] });
    }
    last = m.index + m[0].length;
  }
  if (last < String(text ?? '').length) out.push({ type: 'text', text: text.slice(last) });
  return out;
}

/** Every tag in a note, lower-cased, without the "#". */
export function extractTags(text) {
  return [...new Set([...String(text ?? '').matchAll(TAG)].map((m) => m[2].toLowerCase()))];
}

/** Every `[[…]]` target in a note, as written. */
export function extractLinks(text) {
  return [...new Set([...String(text ?? '').matchAll(WIKILINK)].map((m) => m[1].trim()))];
}

/** First line of a note, used as its title in lists. */
export function noteTitle(text, fallback = '') {
  const line = String(text ?? '').split('\n').map((l) => l.replace(/^#{1,4}\s+/, '').trim()).find(Boolean);
  if (!line) return fallback;
  return line.length > 70 ? `${line.slice(0, 69)}…` : line;
}

export function wordCount(text) {
  return (String(text ?? '').match(/[\p{L}\p{N}]+/gu) ?? []).length;
}
