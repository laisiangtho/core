/**
 * Parallel: several translations side by side, aligned by merged-verse rows.
 *
 * One CSS grid holds every row; row n in each column covers the same verses,
 * so columns stay aligned without scroll synchronisation.
 */

import { alignChapter } from '../../core/align.js';
import { h } from '../../shell/dom.js';
import { passagePicker, registerStepCommands } from '../../shell/passage.js';
import { bookName, openTranslation, renderVerse } from '../../shell/verse.js';

export default {
  id: 'parallel',
  setup(ctx) {
    const { registry, state, store, shell } = ctx;
    registerStepCommands(ctx);

    registry.view({
      id: 'parallel',
      title: 'Parallel',
      mount(el) {
        let disposed = false;
        let token = 0;

        async function render() {
          const run = ++token;
          const installed = await store.list();
          const { book, chapter } = state.get();
          const selected = state.get().parallel.filter((id) => installed.some((t) => t.identify === id));
          const columns = await Promise.all(selected.map(async (id) => ({
            id, ...(await openTranslation(ctx, id)), verses: await store.getChapter(id, book, chapter),
          })));
          if (disposed || run !== token) return;

          const toggles = h('fieldset', { class: 'parallel-picker' }, h('legend', {}, 'Translations'),
            installed.map((t) => h('label', {},
              h('input', {
                type: 'checkbox', checked: selected.includes(t.identify),
                onchange: (e) => state.set({ parallel: e.target.checked ? [...selected, t.identify] : selected.filter((x) => x !== t.identify) }),
              }), ` ${t.info.shortname}`)));

          const onRef = (ref) => state.set({ book: ref.book, chapter: ref.chapter });
          let grid;
          if (columns.length < 2) {
            grid = h('p', { class: 'muted' }, installed.length < 2
              ? 'Make at least two translations available offline to compare them.'
              : 'Select two or more translations.');
          } else {
            const rows = alignChapter(columns.map((c) => ({ id: c.id, verses: c.verses })));
            grid = h('div', { class: 'parallel-grid', style: { gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` } },
              columns.map((c) => h('div', { class: 'parallel-head' },
                h('strong', {}, c.meta.info.shortname), ' ', bookName(ctx, c.meta, book), ` ${chapter}`,
                c.verses ? null : h('span', { class: 'muted' }, ' — not in this translation'))),
              rows.flatMap((row) => columns.map((c) => h('div', {
                class: 'parallel-cell', dir: c.meta.info.language.textdirection, lang: c.meta.info.language.name,
                dataset: { row: `${row.start}-${row.end}` },
              }, row.cells[c.id].length
                ? row.cells[c.id].flatMap((key) => renderVerse({ key, verse: c.verses[key], meta: c.meta, resolver: c.resolver, book, chapter, onRef }))
                : h('span', { class: 'missing', title: 'Not present in this translation' }, '—')))));
          }

          el.replaceChildren(h('section', { class: 'view parallel' },
            h('header', { class: 'view-toolbar' }, passagePicker(ctx), toggles),
            grid));
        }

        const fail = (err) => shell.notify(err.message, 'error');
        const unsubscribe = state.subscribe(() => render().catch(fail));
        const offLibrary = ctx.library.on('change', () => render().catch(fail));
        render().catch(fail);
        return () => { disposed = true; unsubscribe(); offLibrary(); };
      },
    });
  },
};
