/**
 * Workspace: tabs, reading panes (leaves), detached windows and what keeps
 * them in step.
 *
 * A tab is a chapter or a registered doc (Library, Settings). Each chapter tab
 * carries its own passage; the active one mirrors into the shared state, which
 * is what the tree, the status bar and the panes read. A chapter tab renders
 * one leaf per parallel translation, and leaves share the passage, so row
 * alignment and synchronised scrolling work off verse spans rather than pixel
 * offsets — a translation that merges 17–18 still lines up.
 */

import { alignChapter } from '../core/align.js';
import { createResolver } from '../core/reference.js';
import { fromMarkdown, toMarkdown } from '../core/source.js';
import { h } from './dom.js';
import { wirePaneDrag, wireTabDrag } from './dragdrop.js';
import { createFloats } from './floats.js';
import { wireFades } from './fade.js';
import { icon } from './icons.js';
import { L } from './i18n.js';
import { chapterNote, LAYOUTS } from './reading.js';

const MAX_PANES = 4;

export function createWorkspace(ctx, chrome) {
  const { category, registry, state, store } = ctx;
  const tabs = [];
  let activeId = null;
  let seq = 1;
  let disposeDoc = null;
  let pendingReveal = null;
  let revealTimer = null;
  const openTranslations = new Map(); // identify -> { meta, resolver }
  let primaryMeta = null;             // meta of pane 0, for localised book names
  let primaryResolver = null;         // its reference resolver, for wikilinks in notes

  const floats = createFloats(ctx, { render: () => render(), dockTarget: () => chrome.tabStrip });

  wireTabDrag(chrome.tabStrip, {
    // One splice on release; the strip is never rebuilt mid-drag.
    commit: (from, to) => {
      if (from === to) return;
      const [tab] = tabs.splice(from, 1);
      tabs.splice(to, 0, tab);
      activate(tab.id);
      persistTabs();
    },
    detach: (id) => detach(id),
    activate: (id) => activate(id),
    hint: floats.hint,
  });
  wirePaneDrag(chrome.panes, { move: movePane });

  async function openTranslation(identify) {
    const meta = await store.getMeta(identify);
    const key = `${identify}@${meta.version}@${meta.installedAt}`;
    const cached = openTranslations.get(identify);
    if (cached?.key === key) return cached;
    const entry = { key, meta, resolver: createResolver({ category, books: meta.books, aliases: await ctx.aliases(identify) }) };
    openTranslations.set(identify, entry);
    return entry;
  }

  // --- tabs ---------------------------------------------------------------

  function newTab(kind, book, chapter) {
    const tab = { id: `t${seq++}`, kind, book, chapter };
    tabs.push(tab);
    return tab;
  }

  function activeTab() {
    return tabs.find((t) => t.id === activeId) ?? null;
  }

  function activate(id) {
    activeId = id;
    const tab = activeTab();
    if (tab?.kind === 'chapter') {
      const { book, chapter } = state.get();
      if (tab.book !== book || tab.chapter !== chapter) { state.set({ book: tab.book, chapter: tab.chapter }); return; }
    }
    render();
    persistTabs();
  }

  function openChapter(book, chapter, { newTab: wantsNew = false } = {}) {
    const current = activeTab();
    if (wantsNew || current?.kind !== 'chapter') {
      activeId = newTab('chapter', book, chapter).id;
    }
    const here = state.get();
    if (here.book !== book || here.chapter !== chapter) { state.set({ book, chapter }); return Promise.resolve(); }
    return render();
  }

  function openDoc(id) {
    if (!registry.getDoc(id)) throw new Error(`workspace: no doc "${id}" is registered`);
    const existing = tabs.find((t) => t.kind === id);
    activeId = existing ? existing.id : newTab(id).id;
    persistTabs();
    return render();
  }

  function closeTab(id) {
    const i = tabs.findIndex((t) => t.id === id);
    if (i === -1) return;
    tabs.splice(i, 1);
    if (activeId === id) activeId = tabs[Math.min(i, tabs.length - 1)]?.id ?? null;
    persistTabs();
    return activate(activeId ?? '');
  }

  /** Pull a tab out of the strip into a detached window. */
  function detach(id) {
    const i = tabs.findIndex((t) => t.id === id);
    if (i === -1) return;
    const [tab] = tabs.splice(i, 1);
    if (activeId === id) activeId = tabs[Math.min(i, tabs.length - 1)]?.id ?? null;
    floats.open(tab);
    persistTabs();
  }

  /** Put a detached tab back in the strip. */
  function adopt(tab) {
    tabs.push(tab);
    activeId = tab.id;
    persistTabs();
    render();
  }

  /** The active chapter tab follows the shared passage. */
  function syncActiveTab() {
    const tab = activeTab();
    if (tab?.kind !== 'chapter') return;
    const { book, chapter } = state.get();
    if (tab.book === book && tab.chapter === chapter) return;
    tab.book = book;
    tab.chapter = chapter;
    persistTabs();
  }

  function persistTabs() {
    const snapshot = tabs.map((t) => (t.kind === 'chapter' ? { kind: 'chapter', book: t.book, chapter: t.chapter } : { kind: t.kind }));
    const index = Math.max(tabs.findIndex((t) => t.id === activeId), 0);
    const stored = state.get();
    const same = stored.tabs.length === snapshot.length
      && stored.activeTab === index
      && stored.tabs.every((t, i) => t.kind === snapshot[i].kind && t.book === snapshot[i].book && t.chapter === snapshot[i].chapter);
    if (!same) state.set({ tabs: snapshot, activeTab: index });
  }

  /**
   * Reopen tabs: the ones passed in (a chrome rebuild) or the ones from the
   * last session. Falls back to the last passage.
   */
  function restore(fromTabs, fromIndex) {
    const stored = state.get();
    const saved = fromTabs ?? stored.tabs;
    const index = fromIndex ?? stored.activeTab;
    const { book, chapter } = stored;
    for (const entry of saved) {
      if (entry.kind === 'chapter') newTab('chapter', entry.book, entry.chapter);
      else if (registry.getDoc(entry.kind)) newTab(entry.kind);
    }
    if (!tabs.length) newTab('chapter', book, chapter);
    activeId = (tabs[index] ?? tabs[0]).id;
    const tab = activeTab();
    if (tab.kind === 'chapter' && (tab.book !== book || tab.chapter !== chapter)) state.set({ book: tab.book, chapter: tab.chapter });
  }

  // --- panes --------------------------------------------------------------

  async function addPane() {
    if (activeTab()?.kind !== 'chapter') { chrome.notify(L('msg.paneNeedsChapter')); return; }
    const installed = (await store.list()).map((t) => t.identify);
    const open = panesOf(state.get());
    if (open.length >= MAX_PANES) { chrome.notify(L('msg.limitPanes', { n: MAX_PANES })); return; }
    const free = installed.filter((id) => !open.includes(id));
    if (!free.length) { chrome.notify(L('msg.allOpen')); return; }
    state.set({ parallel: [...open.slice(1), free[0]] });
  }

  function closePane(index) {
    const open = panesOf(state.get());
    if (index === 0 || index >= open.length) return;
    state.set({ parallel: open.slice(1).filter((_, i) => i !== index - 1) });
  }

  function setPaneTranslation(index, identify) {
    const open = panesOf(state.get());
    if (index === 0) { state.set({ translation: identify }); return; }
    const rest = open.slice(1);
    rest[index - 1] = identify;
    state.set({ parallel: rest });
  }

  /** Reorder the panes; pane 0 is the primary translation. */
  function movePane(from, to) {
    const open = panesOf(state.get());
    if (from === to || from >= open.length || to >= open.length) return;
    const next = [...open];
    next.splice(to, 0, ...next.splice(from, 1));
    state.set({ translation: next[0], parallel: next.slice(1) });
  }

  function panesOf({ translation, parallel }) {
    return [translation, ...(parallel ?? [])].filter(Boolean);
  }

  function step(delta) {
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

  // --- rendering ----------------------------------------------------------

  function renderTabs() {
    chrome.tabStrip.replaceChildren(...tabs.map((tab) => {
      const doc = tab.kind === 'chapter' ? null : registry.getDoc(tab.kind);
      const title = doc ? doc.title : `${bookLabel(tab.book)} ${tab.chapter}`;
      return h('div', {
        // Activation comes from the tab drag: a press that never travels is a
        // click, so a drag never costs the reader an activation.
        class: `tab${tab.id === activeId ? ' is-active' : ''}`, role: 'tab', dataset: { tab: tab.id },
        ondblclick: () => detach(tab.id),
      },
        icon(doc ? doc.icon : 'book-open'),
        h('span', { class: 't-name', lang: doc ? '' : primaryLang() }, title),
        h('button', {
          class: 't-close', title: L('cmd.closeTab'), 'aria-label': L('cmd.closeTab'),
          onclick: (e) => { e.stopPropagation(); closeTab(tab.id); },
        }, icon('x')));
    }),
    h('button', {
      class: 'tab-new', title: L('cmd.newTab'), 'aria-label': L('cmd.newTab'), onclick: () => newChapterTab(),
    }, icon('plus')));
  }

  /** A second tab on the passage in view, then the switcher to send it somewhere. */
  function newChapterTab() {
    const { book, chapter } = state.get();
    activeId = newTab('chapter', book, chapter).id;
    renderTabs();
    persistTabs();
    render();
    ctx.shell.openSwitcher(book);
  }

  function bookLabel(book) {
    return primaryMeta?.books[book]?.name ?? category.book(book).name;
  }

  /** The tag for whatever script the primary translation is written in. */
  function primaryLang() {
    return primaryMeta?.info.language.code ?? '';
  }

  /** The testament as the translation names it, or the canon's own name. */
  function testamentLabel(id) {
    return primaryMeta?.testament?.[id]?.info?.name ?? category.testaments.find((t) => t.id === id)?.name ?? '';
  }

  async function ensurePrimaryMeta() {
    const { translation } = state.get();
    if (primaryMeta?.identify === translation || !translation) return;
    const installed = await store.list();
    if (!installed.some((t) => t.identify === translation)) return;
    const primary = await openTranslation(translation);
    primaryMeta = primary.meta;
    primaryResolver = primary.resolver;
    renderTabs();
    ctx.shell.refreshNames?.();
    state.set({ names: (state.get().names ?? 0) + 1 });
  }

  function crumbs(book, chapter) {
    const canon = category.book(book);
    const sep = () => h('span', { class: 'crumb-sep' }, '/');
    return h('div', { class: 'crumbs' },
      h('button', {
        class: 'crumb', dataset: { crumb: 'testament' }, 'aria-expanded': 'false', 'aria-haspopup': 'dialog',
        onclick: (e) => ctx.shell.openCrumb(e.currentTarget, 'books', { book, chapter }),
      }, h('span', { lang: primaryLang() }, testamentLabel(canon.testament))),
      sep(),
      h('button', {
        class: 'crumb', dataset: { crumb: 'book' }, 'aria-expanded': 'false', 'aria-haspopup': 'dialog',
        onclick: (e) => ctx.shell.openCrumb(e.currentTarget, 'books', { book, chapter }),
      }, h('span', { class: 'cb-full', lang: primaryLang() }, bookLabel(book)), h('span', { class: 'cb-short' }, canon.shortname)),
      sep(),
      h('button', {
        class: 'crumb is-current', 'aria-expanded': 'false', 'aria-haspopup': 'dialog',
        onclick: (e) => ctx.shell.openCrumb(e.currentTarget, 'chapters', { book, chapter }),
      }, String(chapter)));
  }

  async function renderPanes() {
    if (typeof disposeDoc === 'function') { disposeDoc(); disposeDoc = null; }
    const tab = activeTab();

    if (!tab) {
      chrome.panes.replaceChildren(emptyLeaf(L('empty.workspace'), L('empty.workspaceAct'),
        () => openChapter(state.get().book, state.get().chapter, { newTab: true })));
      return;
    }

    if (tab.kind !== 'chapter') {
      const doc = registry.getDoc(tab.kind);
      const body = h('div', { class: 'leaf-scroll scroll' });
      chrome.panes.replaceChildren(h('div', { class: 'leaf', dataset: { doc: doc.id } }, body));
      disposeDoc = doc.mount(body) ?? null;
      // Book names come from the primary translation; load it even when no
      // chapter is on screen, or the tree and the switcher show canon names.
      await ensurePrimaryMeta();
      return;
    }

    const installed = await store.list();
    if (!installed.length) {
      chrome.panes.replaceChildren(emptyLeaf(L('msg.noTranslations'), L('msg.openLibrary'), () => openDoc('library')));
      return;
    }

    const order = panesOf(state.get()).filter((id) => installed.some((t) => t.identify === id));
    if (!order.length) { state.set({ translation: installed[0].identify, parallel: [] }); return; }

    const { book, chapter } = state.get();
    const loaded = await Promise.all(order.map(async (identify, index) => {
      const { meta, resolver } = await openTranslation(identify);
      return { identify, index, meta, resolver, verses: await store.getChapter(identify, book, chapter) };
    }));

    // The translation carries its own book names, and it loads after the first
    // paint. When the primary one changes, everything that shows a book name —
    // tabs, tree, status bar, and any pane that labels a passage — is stale, so
    // bump a counter the whole app is already subscribed to.
    const primaryBefore = primaryMeta?.identify ?? null;
    primaryMeta = loaded[0].meta;
    primaryResolver = loaded[0].resolver;
    if (primaryMeta.identify !== primaryBefore) {
      renderTabs();
      ctx.shell.refreshNames?.();
      state.set({ names: (state.get().names ?? 0) + 1 });
    }

    const leaves = loaded.map((pane) => buildLeaf(pane, loaded, { book, chapter }));
    const children = [];
    leaves.forEach((leaf, i) => {
      if (i > 0) children.push(h('div', { class: 'leaf-divider' }));
      children.push(leaf);
    });
    chrome.panes.replaceChildren(...children);

    alignRows(loaded, leaves);
    wireSync(leaves);
    wireFades(chrome.panes);
    if (pendingReveal !== null) reveal(pendingReveal);
  }

  /**
   * Detached windows render the same leaf (or the same doc), with their own
   * passage. A doc mounted in a float is a second, independent mount.
   */
  async function renderFloats() {
    for (const float of floats.list()) {
      const { tab } = float;
      const doc = tab.kind === 'chapter' ? null : registry.getDoc(tab.kind);
      floats.setName(float.id, doc ? doc.title : `${bookLabel(tab.book)} ${tab.chapter}`);

      if (doc) {
        if (float.mountedDoc === doc.id) continue; // already mounted; it repaints itself
        float.dispose?.();
        const body = h('div', { class: 'leaf-scroll scroll' });
        float.body.replaceChildren(h('div', { class: 'leaf', dataset: { doc: doc.id } }, body));
        float.dispose = doc.mount(body) ?? null;
        float.mountedDoc = doc.id;
        continue;
      }

      const identify = state.get().translation;
      if (!identify) continue;
      const { meta, resolver } = await openTranslation(identify);
      const verses = await store.getChapter(identify, tab.book, tab.chapter);
      const pane = { identify, index: 0, meta, resolver, verses };
      float.body.replaceChildren(buildLeaf(pane, [pane], { book: tab.book, chapter: tab.chapter }, { float: float.id }));
    }
  }

  function buildLeaf(pane, all, { book, chapter }, { float = null } = {}) {
    const { mode, layout, strongs } = state.get();
    const annotations = ctx.annotations.chapterIndex(book, chapter);
    const compare = pane.index > 0;

    const body = mode === 'source' && !compare
      ? sourceView(pane, { book, chapter })
      : chapterNote({
        ctx, meta: pane.meta, resolver: pane.resolver, verses: pane.verses, book, chapter,
        compare, layout, annotations, strongs,
        primaryVerses: compare ? all[0].verses : null,
        onRef: (ref) => state.set({ book: ref.book, chapter: ref.chapter }),
        onVerse: (verse, anchor) => ctx.shell.openVerseBar(anchor, { book, chapter, verse }),
        onStrongs: (code, anchor) => ctx.shell.openStrongs(code, anchor),
      });

    const dataset = { pane: pane.index, translation: pane.identify, role: compare ? 'compare' : 'primary' };
    if (float) dataset.float = float;
    return h('div', { class: 'leaf', dataset },
      h('div', { class: 'leaf-head' },
        compare ? h('div', { class: 'crumbs' }, h('span', { class: 'crumb is-current' }, pane.meta.info.name)) : crumbs(book, chapter),
        h('button', {
          class: 'tr-btn', title: L('cmd.translation'), 'aria-label': L('cmd.translation'),
          onclick: () => ctx.shell.openTranslationPicker(pane.index),
        }, pane.meta.info.shortname, icon('chev')),
        !float && compare ? h('button', {
          class: 'leaf-close', title: L('cmd.closeParallel'), 'aria-label': L('cmd.closeParallel'),
          onclick: () => closePane(pane.index),
        }, icon('x')) : null),
      h('div', { class: 'leaf-scroll scroll' }, body));
  }

  /** Source mode: the chapter as Markdown; only the notes may be edited. */
  function sourceView(pane, { book, chapter }) {
    const notes = ctx.annotations.forChapter(book, chapter).notes;
    const original = toMarkdown({
      meta: pane.meta, verses: pane.verses, book, chapter, bookName: bookLabel(book), notes,
    });
    const area = h('textarea', { class: 'source scroll', spellcheck: 'false', dir: 'auto' });
    area.value = original;
    area.addEventListener('blur', async () => {
      if (area.value === original) return;
      try {
        const { notes: edited } = fromMarkdown(area.value, original);
        await ctx.annotations.replaceChapterNotes(book, chapter, edited);
        chrome.notify(L('msg.sourceSaved'));
      } catch (err) {
        chrome.notify(err.message, 'error');
        area.value = original;
      }
    });
    return area;
  }

  function emptyLeaf(message, action, run) {
    return h('div', { class: 'leaf' }, h('div', { class: 'leaf-scroll scroll' },
      h('div', { class: 'state' },
        icon('book-open'),
        h('p', {}, message),
        h('button', { class: 'btn primary', onclick: run }, action))));
  }

  /**
   * Give every verse group the same height in each pane, so the columns stay
   * level however the translations merge verses.
   */
  function alignRows(loaded, leaves) {
    if (leaves.length < 2 || !state.get().alignRows || state.get().mode === 'source') return;
    const rows = alignChapter(loaded.map((p) => ({ id: p.identify, verses: p.verses })));
    const measure = () => {
      for (const leaf of leaves) {
        for (const el of leaf.querySelectorAll('.vblock')) el.style.minHeight = '';
        const chapter = leaf.querySelector('.chapter');
        if (chapter) chapter.style.paddingTop = '';
      }
      // The heads differ in height (a parallel pane names the translation, not
      // the chapter), so the first verse of each column is levelled first.
      const firsts = leaves.map((leaf) => leaf.querySelector('.vblock'));
      if (firsts.every(Boolean)) {
        const tops = firsts.map((b) => b.getBoundingClientRect().top - b.closest('.leaf-scroll').getBoundingClientRect().top);
        const lowest = Math.max(...tops);
        leaves.forEach((leaf, i) => {
          const chapter = leaf.querySelector('.chapter');
          if (chapter && tops[i] < lowest) chapter.style.paddingTop = `${lowest - tops[i]}px`;
        });
      }
      for (const row of rows) {
        const blocks = loaded.map((p, i) => row.cells[p.identify].map((key) => leaves[i].querySelector(`.vblock[data-verse="${key}"]`)).filter(Boolean));
        const heights = blocks.map((group) => group.reduce((sum, el) => sum + el.getBoundingClientRect().height, 0));
        const tallest = Math.max(...heights);
        blocks.forEach((group, i) => {
          const last = group.at(-1);
          if (last && heights[i] < tallest) last.style.minHeight = `${last.getBoundingClientRect().height + (tallest - heights[i])}px`;
        });
      }
    };
    requestAnimationFrame(measure);
  }

  /** Scrolling one pane moves the others to the same verse, not the same pixel. */
  function wireSync(leaves) {
    if (leaves.length < 2) return;
    const scrolls = leaves.map((leaf) => leaf.querySelector('.leaf-scroll'));
    let leader = null;
    for (const [i, scroller] of scrolls.entries()) {
      scroller.addEventListener('scroll', () => {
        if (!state.get().syncScroll || (leader !== null && leader !== i)) return;
        leader = i;
        const top = topVerse(scroller);
        for (const [j, other] of scrolls.entries()) {
          if (j === i || !top) continue;
          const twin = other.querySelector(`.vblock[data-verse="${top.verse}"]`) ?? coveringVerse(other, top.verse);
          if (twin) other.scrollTop += twin.getBoundingClientRect().top - top.offset;
        }
        clearTimeout(scroller.dataset.timer);
        scroller.dataset.timer = setTimeout(() => { leader = null; }, 120);
      }, { passive: true });
    }
  }

  function topVerse(scroller) {
    const edge = scroller.getBoundingClientRect().top + 8;
    for (const el of scroller.querySelectorAll('.vblock')) {
      const rect = el.getBoundingClientRect();
      if (rect.bottom >= edge) return { verse: Number(el.dataset.verse), offset: rect.top };
    }
    return null;
  }

  function coveringVerse(scroller, verse) {
    if (!scroller) return null;
    for (const el of scroller.querySelectorAll('.vblock')) {
      if (Number(el.dataset.verse) <= verse && Number(el.dataset.span) >= verse) return el;
    }
    return null;
  }

  function render() {
    syncActiveTab();
    renderTabs();
    // Detached windows are painted whatever the docked tab shows.
    return renderPanes()
      .then(renderFloats)
      .catch((err) => chrome.notify(err.message, 'error'));
  }

  /** Scroll a verse into view in the primary pane and flash it. */
  function reveal(verse) {
    const leaf = chrome.panes.querySelector('.leaf[data-pane="0"]');
    const block = leaf?.querySelector(`.vblock[data-verse="${verse}"]`) ?? coveringVerse(leaf?.querySelector('.leaf-scroll'), verse);
    if (!block) return;
    block.scrollIntoView({ block: 'center' });
    const line = block.querySelector('.verse');
    line?.classList.add('is-hit');
    setTimeout(() => line?.classList.remove('is-hit'), 1600);
  }

  /** Open a passage and flash the verse once the chapter is on screen. */
  function openVerse(book, chapter, verse) {
    pendingReveal = verse;
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => { pendingReveal = null; }, 800);
    const current = state.get();
    if (current.book === book && current.chapter === chapter && activeTab()?.kind === 'chapter') return render();
    return openChapter(book, chapter);
  }

  return {
    openChapter, openDoc, closeTab, addPane, closePane, setPaneTranslation, movePane, step, render, openVerse, reveal,
    newChapterTab,
    detach, adopt, restore, activate,
    floats,
    panes: () => panesOf(state.get()),
    bookName: bookLabel,
    testamentName: testamentLabel,
    lang: primaryLang,
    primaryName: () => primaryMeta?.info.shortname ?? state.get().translation ?? '–',
    /** Reference resolver of the primary translation, for wikilinks in notes. */
    resolver: () => primaryResolver,
    layouts: LAYOUTS,
    get activeTab() { return activeTab(); },
    get tabs() { return tabs.map((t) => ({ ...t })); },
  };
}
