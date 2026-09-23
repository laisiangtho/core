/**
 * Search: full text across the translations that are available offline.
 *
 * The scan runs in a worker and results stream in, so the first hits appear
 * while the rest is still being read. Typing replaces the running query.
 */

import { h } from '../../shell/dom.js';
import { icon } from '../../shell/icons.js';
import { L } from '../../shell/i18n.js';

const DEBOUNCE_MS = 220;

export default {
  id: 'search',
  setup(ctx) {
    const { registry, search, shell, store } = ctx;
    let focusInput = null;

    registry.command({
      id: 'search.open',
      title: L('cmd.search'),
      icon: 'search',
      keys: 'Mod+f',
      ribbon: true,
      run: () => { shell.selectPane('left', 'search'); focusInput?.(); },
    });

    registry.pane({
      id: 'search',
      side: 'left',
      order: 20,
      icon: 'search',
      title: L('pane.search'),
      mount(el) {
        const input = h('input', { type: 'search', spellcheck: 'false', placeholder: L('ph.search') });
        const scope = h('select', { 'aria-label': L('lbl.scope') });
        const status = h('p', { class: 'empty-hint' }, L('empty.search'));
        const results = h('div', { class: 'search-results' });
        el.append(h('div', { class: 'search-pane' },
          h('div', { class: 'field' }, icon('search'), input),
          h('div', { class: 'search-scope' }, scope),
          status, results));

        focusInput = () => { input.focus(); input.select(); };
        let timer = null;
        let groups = new Map();

        async function fillScope() {
          const installed = await store.list();
          const current = scope.value;
          scope.replaceChildren(
            ...installed.map((t) => h('option', { value: t.identify }, `${t.info.shortname} · ${t.info.name}`)),
            installed.length > 1 ? h('option', { value: '*' }, L('lbl.allTranslations', { n: installed.length })) : null);
          const wanted = current || ctx.state.get().translation;
          if ([...scope.options].some((o) => o.value === wanted)) scope.value = wanted;
        }

        async function run() {
          const query = input.value.trim();
          results.replaceChildren();
          groups = new Map();
          if (!query) { status.textContent = L('empty.search'); return; }

          const installed = await store.list();
          const translations = scope.value === '*' ? installed.map((t) => t.identify) : [scope.value].filter(Boolean);
          if (!translations.length) { status.textContent = L('msg.noTranslations'); return; }

          status.textContent = L('msg.searching');
          try {
            const summary = await search.run({
              query, translations,
              onBatch: (rows) => { for (const row of rows) addRow(row); },
            });
            if (summary.cancelled) return;
            status.textContent = summary.total === 0
              ? L('empty.noHits', { query })
              : L('msg.hits', { n: summary.total }) + (summary.truncated ? ` · ${L('msg.truncated')}` : '')
                + ` · ${summary.ms} ms`;
          } catch (err) {
            status.textContent = err.message;
          }
        }

        function addRow(row) {
          const key = `${row.identify}.${row.book}.${row.chapter}`;
          let group = groups.get(key);
          if (!group) {
            const label = `${shell.workspace.bookName(row.book)} ${row.chapter}`;
            const count = h('span', { class: 'rh-count' }, '0');
            const body = h('div', {});
            group = { count, body, n: 0 };
            groups.set(key, group);
            results.append(h('div', { class: 'result-group' },
              h('button', { class: 'result-head', onclick: () => shell.openVerse(row.book, row.chapter, row.verse) },
                icon('book-open'), h('span', {}, label),
                scope.value === '*' ? h('span', { class: 'kbd' }, row.identify) : null, count),
              body));
          }
          group.n += 1;
          group.count.textContent = String(group.n);
          group.body.append(h('button', {
            class: 'result-line', onclick: () => shell.openVerse(row.book, row.chapter, row.verse),
          },
            h('span', { class: 'kbd' }, row.merge ? `${row.verse}–${row.merge}` : String(row.verse)), ' ',
            row.before, h('mark', {}, row.hit), row.after));
        }

        input.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => run().catch((err) => shell.notify(err.message, 'error')), DEBOUNCE_MS);
        });
        scope.addEventListener('change', () => run().catch((err) => shell.notify(err.message, 'error')));

        const offLibrary = ctx.library.on('change', () => fillScope());
        fillScope();
        return () => { clearTimeout(timer); search.cancel(); offLibrary(); focusInput = null; };
      },
    });
  },
};
