/**
 * Shared passage navigation: book / chapter pickers and chapter stepping over
 * book boundaries, bound to ctx.state { book, chapter }.
 */

import { h } from './dom.js';

/**
 * @param {object} ctx
 * @param {(id: number) => string} bookName localised name when available
 */
export function passagePicker(ctx, bookName = (id) => ctx.category.book(id).name) {
  const { category, state } = ctx;
  const { book, chapter } = state.get();

  const books = h('select', { 'aria-label': 'Book', onchange: (e) => state.set({ book: Number(e.target.value), chapter: 1 }) },
    category.books.map((b) => h('option', { value: b.id, selected: b.id === book }, bookName(b.id))));
  const chapters = h('select', { 'aria-label': 'Chapter', onchange: (e) => state.set({ chapter: Number(e.target.value) }) },
    Array.from({ length: category.book(book).chapters }, (_, i) => h('option', { value: i + 1, selected: i + 1 === chapter }, i + 1)));

  return h('div', { class: 'passage' },
    h('button', { class: 'btn btn-ghost', onclick: () => step(ctx, -1), title: 'Previous chapter' }, '‹'),
    books, chapters,
    h('button', { class: 'btn btn-ghost', onclick: () => step(ctx, 1), title: 'Next chapter' }, '›'));
}

export function step(ctx, delta) {
  const { category, state } = ctx;
  let { book, chapter } = state.get();
  chapter += delta;
  if (chapter < 1) {
    if (!category.hasBook(book - 1)) return;
    book -= 1;
    chapter = category.book(book).chapters;
  } else if (chapter > category.book(book).chapters) {
    if (!category.hasBook(book + 1)) return;
    book += 1;
    chapter = 1;
  }
  state.set({ book, chapter });
}

/** Chapter stepping commands; shared by every passage view, registered once. */
export function registerStepCommands(ctx) {
  if (ctx.registry.hasCommand('passage.next-chapter')) return;
  ctx.registry.command({ id: 'passage.next-chapter', title: 'Next chapter', keys: 'Mod+ArrowRight', run: () => step(ctx, 1) });
  ctx.registry.command({ id: 'passage.prev-chapter', title: 'Previous chapter', keys: 'Mod+ArrowLeft', run: () => step(ctx, -1) });
}
