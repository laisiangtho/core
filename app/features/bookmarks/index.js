/**
 * Bookmarks: one per verse, kept against the passage. A bookmarked verse is
 * tinted in every translation, since the mark belongs to the verse.
 */

import { h } from '../../shell/dom.js';
import { icon } from '../../shell/icons.js';
import { L } from '../../shell/i18n.js';

export default {
  id: 'bookmarks',
  setup(ctx) {
    const { annotations, registry, shell, store, state } = ctx;

    registry.verseAction({
      id: 'bookmarks.toggle',
      title: (p) => (annotations.isMarked(p.book, p.chapter, p.verse) ? L('cmd.unbookmark') : L('cmd.bookmark')),
      icon: 'bookmark',
      isOn: (p) => annotations.isMarked(p.book, p.chapter, p.verse),
      run: async (p) => {
        const marked = await annotations.toggleMark(p.book, p.chapter, p.verse);
        shell.notify(marked ? L('msg.bookmarked') : L('msg.unbookmarked'));
      },
    });

    registry.verseAction({
      id: 'bookmarks.copy',
      title: L('cmd.copyVerse'),
      icon: 'copy',
      run: async (p) => {
        const { translation } = state.get();
        const verses = translation ? await store.getChapter(translation, p.book, p.chapter) : null;
        const verse = verses?.[p.verse];
        const ref = `${shell.workspace.bookName(p.book)} ${p.chapter}:${p.verse}`;
        await navigator.clipboard.writeText(verse ? `${verse.text}\n— ${ref}` : ref);
        shell.notify(L('msg.copied', { what: ref }));
      },
    });

    registry.command({
      id: 'bookmarks.open',
      title: L('pane.marks'),
      icon: 'bookmark',
      run: () => shell.selectPane('left', 'marks'),
    });

    registry.pane({
      id: 'marks',
      side: 'left',
      order: 30,
      icon: 'bookmark',
      title: L('pane.marks'),
      mount(el) {
        const body = h('div', { class: 'stack' });
        el.append(body);

        async function paint() {
          const marks = annotations.allMarks();
          if (!marks.length) {
            body.replaceChildren(h('p', { class: 'empty-hint' }, L('empty.marks')));
            return;
          }
          const { translation } = state.get();
          const rows = await Promise.all(marks.map(async (mark) => {
            const verses = translation ? await store.getChapter(translation, mark.book, mark.chapter) : null;
            return { mark, text: verses?.[mark.verse]?.text ?? null };
          }));
          body.replaceChildren(...rows.map(({ mark, text }) => h('div', { class: 'mark-row' },
            h('button', {
              class: 'mark-open',
              onclick: () => shell.openVerse(mark.book, mark.chapter, mark.verse),
            },
              h('span', { class: 'mark-ref' }, `${shell.workspace.bookName(mark.book)} ${mark.chapter}:${mark.verse}`),
              text ? h('span', { class: 'mark-text' }, text) : null),
            h('button', {
              class: 'mark-remove', title: L('cmd.unbookmark'), 'aria-label': L('cmd.unbookmark'),
              onclick: () => annotations.toggleMark(mark.book, mark.chapter, mark.verse),
            }, icon('x')))));
        }

        const run = () => paint().catch((err) => shell.notify(err.message, 'error'));
        const offMarks = annotations.on('change', run);
        const offState = state.subscribe(run);
        run();
        return () => { offMarks(); offState(); };
      },
    });
  },
};
