/**
 * The verse bar: a small popover under a verse number, holding whatever
 * actions features registered. The shell owns the bar; features own the
 * actions, so a build without bookmarks simply has fewer buttons.
 */

import { h } from './dom.js';
import { icon } from './icons.js';

export function createVerseBar(ctx) {
  const bar = h('div', { class: 'popover vbar', hidden: true });
  let open = null; // { book, chapter, verse }

  document.addEventListener('pointerdown', (e) => {
    if (!bar.hidden && !bar.contains(e.target) && !e.target.closest('.vnum')) close();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', close);

  function close() {
    bar.hidden = true;
    open = null;
    for (const el of document.querySelectorAll('.verse.is-selected')) el.classList.remove('is-selected');
  }

  function show(anchor, passage) {
    if (open && open.verse === passage.verse && open.book === passage.book && open.chapter === passage.chapter && !bar.hidden) {
      close();
      return;
    }
    open = passage;
    const actions = ctx.registry.verseActions();
    bar.replaceChildren(...actions.map((action) => {
      const label = typeof action.title === 'function' ? action.title(passage) : action.title;
      return h('button', {
        'aria-pressed': action.isOn ? String(Boolean(action.isOn(passage))) : null,
        title: label, 'aria-label': label,
        onclick: async () => {
          close();
          await action.run(passage);
        },
      }, icon(typeof action.icon === 'function' ? action.icon(passage) : action.icon));
    }));

    bar.hidden = false;
    const rect = anchor.getBoundingClientRect();
    const width = bar.offsetWidth;
    const left = Math.min(Math.max(rect.left - 6, 8), window.innerWidth - width - 8);
    const below = rect.bottom + 6;
    const above = rect.top - bar.offsetHeight - 6;
    const fitsBelow = below + bar.offsetHeight < window.innerHeight - 8;
    bar.style.left = `${left}px`;
    bar.style.top = `${fitsBelow ? below : Math.max(above, 8)}px`;
    anchor.closest('.verse')?.classList.add('is-selected');
  }

  return { element: bar, show, close };
}
