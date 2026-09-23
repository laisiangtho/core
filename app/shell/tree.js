/**
 * Books pane: testaments, books, and a grid of chapter chips under the open
 * book. Where the reader is, is traced by the branch line, not a filled row.
 */

import { h } from './dom.js';
import { icon } from './icons.js';
import { L } from './i18n.js';

export function createTree(ctx, { onOpen }) {
  const open = new Set();
  const title = h('span', { class: 'ph-title' });
  const filterInput = h('input', { id: 'filterBooks', spellcheck: 'false', placeholder: L('ph.filter') });
  const tree = h('div', { class: 'tree' });
  let bookName = (id) => ctx.category.book(id).name;
  // Names in the translation's own language, and the tag its script needs.
  let names = {
    testament: (id) => ctx.category.testaments.find((t) => t.id === id)?.name ?? '',
    lang: () => '',
  };

  const element = h('div', { class: 'files-pane' },
    h('div', { class: 'field' }, icon('search'), filterInput),
    tree);

  filterInput.addEventListener('input', paint);

  function paint() {
    const query = filterInput.value.trim().toLowerCase();
    const { book: currentBook, chapter: currentChapter } = ctx.state.get();
    const matches = (b) => !query || bookName(b.id).toLowerCase().includes(query) || b.name.toLowerCase().includes(query)
      || b.abbr.some((a) => a.toLowerCase().startsWith(query));

    const groups = ctx.category.testaments.map((t) => ({ t, books: ctx.category.books.filter((b) => b.testament === t.id && matches(b)) }))
      .filter((g) => g.books.length);

    title.textContent = `${L('lbl.books', { n: groups.reduce((n, g) => n + g.books.length, 0) })}`;
    tree.replaceChildren(...groups.map(({ t, books }) => {
      const key = `t${t.id}`;
      const isOpen = open.has(key) || query !== '' || books.some((b) => b.id === currentBook);
      return h('div', { class: `tree-item${isOpen ? ' is-open' : ''}` },
        h('div', {
          class: 'tree-row', role: 'button', tabindex: '0',
          onclick: () => { toggle(key); paint(); },
        },
          h('span', { class: 'twisty' }, icon('chev')),
          h('span', { class: 'tree-label', lang: names.lang() }, names.testament(t.id)),
          h('span', { class: 'tree-aux' }, String(books.length))),
        h('div', { class: 'tree-children' }, books.map((b) => bookRow(b, currentBook, currentChapter, query))));
    }));
  }

  function bookRow(b, currentBook, currentChapter, query) {
    const key = `b${b.id}`;
    const isCurrent = b.id === currentBook;
    const isOpen = open.has(key) || (isCurrent && !query);
    return h('div', { class: `tree-item is-book${isOpen ? ' is-open' : ''}${isCurrent ? ' is-current' : ''}` },
      h('div', {
        class: 'tree-row', role: 'button', tabindex: '0',
        onclick: () => { toggle(key); paint(); },
      },
        h('span', { class: 'twisty' }, icon('chev')),
        h('span', { class: 'tree-label', lang: names.lang() }, bookName(b.id)),
        h('span', { class: 'tree-aux' }, isCurrent ? `${currentChapter}/${b.chapters}` : String(b.chapters))),
      h('div', { class: 'tree-children grid' }, Array.from({ length: b.chapters }, (_, i) => h('button', {
        class: `ch-chip${isCurrent && i + 1 === currentChapter ? ' is-active' : ''}`,
        onclick: () => onOpen(b.id, i + 1),
      }, String(i + 1)))));
  }

  function toggle(key) {
    if (open.has(key)) open.delete(key); else open.add(key);
  }

  return {
    element,
    title,
    paint,
    /** Localised book names come from the translation being read. */
    setBookName(fn) { bookName = fn; paint(); },
    /** Where the localised testament name and the script tag come from. */
    setNames(next) { names = next; paint(); },
    collapseAll() { open.clear(); paint(); },
  };
}
