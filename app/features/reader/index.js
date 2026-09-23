/**
 * Reader: one translation, one chapter at a time.
 */

import { h } from '../../shell/dom.js';
import { passagePicker, registerStepCommands } from '../../shell/passage.js';
import { bookName, openTranslation, renderVerse } from '../../shell/verse.js';

export default {
  id: 'reader',
  setup(ctx) {
    const { registry, state, store, shell } = ctx;
    registerStepCommands(ctx);

    registry.view({
      id: 'reader',
      title: 'Read',
      mount(el) {
        let disposed = false;
        let token = 0;

        async function render() {
          const run = ++token;
          const installed = await store.list();
          if (disposed || run !== token) return;

          if (installed.length === 0) {
            el.replaceChildren(h('section', { class: 'view empty' },
              h('p', {}, 'No translation is available offline yet.'),
              ctx.registry.getView('library') ? h('button', { class: 'btn', onclick: () => shell.show('library') }, 'Open Library') : null));
            return;
          }

          let { translation, book, chapter } = state.get();
          if (!installed.some((t) => t.identify === translation)) {
            translation = installed[0].identify;
            state.set({ translation });
            return; // state change re-renders
          }

          const { meta, resolver } = await openTranslation(ctx, translation);
          const verses = await store.getChapter(translation, book, chapter);
          if (disposed || run !== token) return;

          const picker = h('select', { 'aria-label': 'Translation', onchange: (e) => state.set({ translation: e.target.value }) },
            installed.map((t) => h('option', { value: t.identify, selected: t.identify === translation }, `${t.info.shortname} · ${t.info.name}`)));

          const body = verses
            ? Object.keys(verses).map(Number).sort((a, b) => a - b).flatMap((key) => renderVerse({
              key, verse: verses[key], meta, resolver, book, chapter,
              onRef: (ref) => state.set({ book: ref.book, chapter: ref.chapter }),
            }))
            : [h('p', { class: 'muted' }, `${meta.info.shortname} does not contain this chapter.`)];

          el.replaceChildren(h('section', { class: 'view reader' },
            h('header', { class: 'view-toolbar' }, picker, passagePicker(ctx, (id) => bookName(ctx, meta, id))),
            h('article', { class: 'reading', dir: meta.info.language.textdirection, lang: meta.info.language.name },
              h('h1', {}, `${bookName(ctx, meta, book)} ${chapter}`),
              body)));
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
