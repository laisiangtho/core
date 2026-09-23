/**
 * Verse rendering shared by reader and parallel views: story headings,
 * section titles, merged-verse labels, localised digits and cross-references.
 */

import { verseLabel } from '../core/align.js';
import { createResolver, parseReferences } from '../core/reference.js';
import { localizeNumber } from '../core/translation.js';
import { h } from './dom.js';

const cache = new Map();

/** Meta + reference resolver for an installed translation (cached per version). */
export async function openTranslation(ctx, identify) {
  const meta = await ctx.store.getMeta(identify);
  const key = `${identify}@${meta.version}@${meta.installedAt}`;
  if (!cache.has(key)) {
    const aliases = await ctx.aliases(identify);
    cache.set(key, { meta, resolver: createResolver({ category: ctx.category, books: meta.books, aliases }) });
  }
  return cache.get(key);
}

export function bookName(ctx, meta, id) {
  return meta?.books[id]?.name ?? ctx.category.book(id).name;
}

/**
 * @param {{ key: number|string, verse: object, meta: object, resolver: object,
 *           book: number, chapter: number, onRef: (ref: object) => void }} p
 * @returns {HTMLElement[]}
 */
export function renderVerse({ key, verse, meta, resolver, book, chapter, onRef }) {
  const out = [];
  const story = meta.story?.[book]?.[chapter]?.[key];
  if (story) out.push(h('h2', { class: 'story' }, story.text));
  if (verse.title) out.push(h('h3', { class: 'verse-title' }, verse.title));

  const label = verseLabel(key, verse).replace(/\d+/g, (n) => localizeNumber(n, meta.digit));
  out.push(h('p', { class: 'verse', id: `v${key}`, dataset: { verse: key } },
    h('sup', { class: 'verse-num' }, label), ' ', verse.text));

  if (verse.ref) out.push(renderRefs(verse.ref, meta, resolver, onRef));
  return out;
}

function renderRefs(text, meta, resolver, onRef) {
  const parts = parseReferences(text, resolver, { digit: meta.digit });
  return h('p', { class: 'refs' }, parts.map((part, i) => [
    i > 0 ? '; ' : null,
    part.refs
      ? h('button', { class: 'ref', onclick: () => onRef(part.refs[0]) }, part.text)
      : h('span', { class: 'ref-unresolved', title: `Unresolved reference: ${part.unresolved}` }, part.text),
  ]));
}
