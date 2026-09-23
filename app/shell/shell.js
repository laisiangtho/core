/**
 * The shell: chrome, workspace, modal, keyboard, status bar and the address
 * hash. Features contribute docs, panes and commands; the shell decides how
 * they appear.
 */

import { createChrome } from './chrome.js';
import { createModal } from './modal.js';
import { createNavPop } from './navpop.js';
import { createTree } from './tree.js';
import { createReadingPanel, applyReading } from './readingpanel.js';
import { createVerseBar } from './versebar.js';
import { createWorkspace } from './workspace.js';
import { h } from './dom.js';
import { icon } from './icons.js';
import { L } from './i18n.js';
import { MODES } from '../core/settings.js';
import { storageStatus } from '../services/store.js';
import { wordCount } from '../core/markdown.js';
import { BUILT_AT, VERSION } from '../version.js';
import { applyAccent, applyTheme, THEME_CYCLE } from './theme.js';

export function createShell(root, ctx) {
  const { store } = ctx;
  let chrome = null;
  let workspace = null;
  let tree = null;
  let verseBar = null;
  let readingPanel = null;
  let navPop = null;
  const modal = createModal();
  const strongsPopover = h('div', { class: 'popover', hidden: true });

  const shell = {
    notify(message, kind = 'info') {
      if (chrome) chrome.notify(message, kind);
      else console.error(`[${kind}] ${message}`);
    },
    openDoc: (id) => workspace.openDoc(id),
    openChapter: (book, chapter) => workspace.openChapter(book, chapter),
    openSwitcher,
    openPalette,
    openTranslationPicker,
    /** The one modal, for a feature that needs to offer a list of its own. */
    pick: (options) => modal.open(options),
    /** Run a registered command by id — how one feature reaches another. */
    run(id) {
      const command = ctx.registry.commands().find((c) => c.id === id);
      if (!command) throw new Error(`shell.run: no command "${id}"`);
      return command.run();
    },
    openVerse: (book, chapter, verse) => workspace.openVerse(book, chapter, verse),
    selectPane: (side, id) => chrome.selectPane(side, id),
    openStrongs,
    /** A breadcrumb was pressed: offer its siblings under it. */
    openCrumb: (anchor, mode, at) => navPop.open(anchor, mode, at, (book, chapter) => workspace.openChapter(book, chapter)),
    /** The primary translation finished loading: names may have changed. */
    refreshNames: () => { tree?.paint(); renderStatus(); },
    openVerseBar: (anchor, passage) => verseBar.show(anchor, passage),
    get workspace() { return workspace; },
    start,
  };

  function start() {
    registerShellCommands();
    registerBooksPane();
    chrome = createChrome(root, ctx);
    workspace = createWorkspace(ctx, chrome);
    verseBar = createVerseBar(ctx);
    readingPanel = createReadingPanel(ctx);
    navPop = createNavPop(ctx, { bookName: (id) => workspace.bookName(id), lang: () => workspace.lang() });
    document.body.append(modal.element, verseBar.element, readingPanel.element, navPop.element, strongsPopover);
    applyReading(ctx.state.get());
    chrome.start();
    wireKeys();

    ctx.state.subscribe(() => { refresh(); });
    ctx.library.on('change', () => { refresh(); measureStorage(); });
    measureStorage();
    ctx.annotations.on('change', () => workspace.render());

    applyHash();
    window.addEventListener('hashchange', applyHash);

    workspace.restore();
    refresh();
  }

  function refresh() {
    applyReading(ctx.state.get());
    chrome.applyChrome(ctx.state.get());
    chrome.setChapterMode(workspace.activeTab?.kind === 'chapter');
    tree?.paint();
    renderStatus();
    measureChapter().catch(() => { counts = { words: 0, verses: 0 }; });
    syncHash();
    workspace.render();
  }

  // --- commands -----------------------------------------------------------

  function registerShellCommands() {
    const { registry } = ctx;
    const command = (id, title, run, extra = {}) => registry.command({ id, title, run, ...extra });

    command('shell.palette', L('cmd.palette'), openPalette, { keys: 'Mod+p' });
    command('shell.switcher', L('cmd.switcher'), () => openSwitcher(), { keys: 'Mod+o' });
    command('passage.next-chapter', L('cmd.next'), () => workspace.step(1), { keys: 'Mod+ArrowRight', needsChapter: true });
    command('passage.prev-chapter', L('cmd.prev'), () => workspace.step(-1), { keys: 'Mod+ArrowLeft', needsChapter: true });
    command('reading.add-pane', L('cmd.parallel'), () => workspace.addPane(), { icon: 'add-pane', needsChapter: true });
    command('reading.translation', L('cmd.translation'), () => openTranslationPicker(0), { needsChapter: true });
    command('reading.copy', L('cmd.copyRef'), copyPassage, { needsChapter: true });
    command('reading.layout', L('cmd.layout'), cycleLayout, { needsChapter: true });
    command('reading.sync', L('cmd.sync'), () => toggleFlag('syncScroll', L('cmd.sync')));
    command('shell.theme', L('cmd.theme'), cycleTheme);
    command('shell.about', L('cmd.about'), showAbout);
    command('shell.left', L('side.left'), () => chrome.toggleSide('left'), { keys: 'Mod+b' });
    command('shell.right', L('side.right'), () => chrome.toggleSide('right'));
    command('shell.ribbon', L('cmd.ribbon'), () => toggleFlag('ribbon', L('cmd.ribbon')));
    command('shell.statusbar', L('cmd.statusBar'), () => toggleFlag('statusBar', L('cmd.statusBar')));
    command('reading.panel', L('cmd.reading'), () => readingPanel.toggle(document.querySelector('.statusbar .sb-reading') ?? document.body));
    command('reading.mode', L('cmd.mode'), toggleMode, { keys: 'Mod+e', needsChapter: true });
    command('reading.strongs', L('cmd.strongs'), toggleStrongs, { needsChapter: true });
    command('tab.detach', L('cmd.detach'), () => { const tab = workspace.activeTab; if (tab) workspace.detach(tab.id); });
    command('tab.close', L('cmd.closeTab'), () => { const tab = workspace.activeTab; if (tab) workspace.closeTab(tab.id); }, { keys: 'Mod+w' });
  }

  function registerBooksPane() {
    ctx.registry.pane({
      id: 'files',
      side: 'left',
      order: 10,
      icon: 'files',
      title: L('pane.files'),
      mount(el) {
        tree = createTree(ctx, { onOpen: (book, chapter) => workspace.openChapter(book, chapter) });
        tree.setBookName((id) => workspace.bookName(id));
        tree.setNames({ testament: (id) => workspace.testamentName(id), lang: () => workspace.lang() });
        el.append(tree.element);
        tree.paint();
      },
    });
  }

  async function copyPassage() {
    const { book, chapter, translation } = ctx.state.get();
    const label = `${workspace.bookName(book)} ${chapter}`;
    await navigator.clipboard.writeText(`${label} (${translation ?? ''})`.trim());
    shell.notify(L('msg.copied', { what: label }));
  }

  function cycleLayout() {
    const LAYOUTS = workspace.layouts;
    const next = LAYOUTS[(LAYOUTS.indexOf(ctx.state.get().layout) + 1) % LAYOUTS.length];
    ctx.state.set({ layout: next });
    shell.notify(L('msg.state', { what: L('cmd.layout'), value: L(`val.${next}`) }));
  }

  function toggleFlag(key, label) {
    const value = !ctx.state.get()[key];
    ctx.state.set({ [key]: value });
    shell.notify(L('msg.state', { what: label, value: L(value ? 'val.on' : 'val.off') }));
  }

  async function showAbout() {
    const native = ctx.platform.capabilities.appInfo ? await ctx.platform.capabilities.appInfo() : null;
    const built = new Date(BUILT_AT).toLocaleDateString();
    shell.notify(`${L('app.name')} ${VERSION} · ${L('lbl.built', { date: built })}`
      + (native ? ` · ${native.runtime} · ${native.platform}` : ` · ${ctx.platform.id}`));
  }

  function toggleMode() {
    const next = MODES[(MODES.indexOf(ctx.state.get().mode) + 1) % MODES.length];
    ctx.state.set({ mode: next });
    shell.notify(L('msg.state', { what: L('cmd.mode'), value: L(`val.${next}`) }));
  }

  /**
   * Strong's numbers show only where a translation carries the markup; none of
   * the published translations do today, so say that rather than toggling a
   * setting with no visible effect.
   */
  function toggleStrongs() {
    const next = !ctx.state.get().strongs;
    ctx.state.set({ strongs: next });
    const present = document.querySelector('.chapter .strongs');
    shell.notify(present
      ? L('msg.state', { what: L('cmd.strongs'), value: L(next ? 'val.on' : 'val.off') })
      : L('msg.noStrongs'));
  }

  function openStrongs(code, anchor) {
    strongsPopover.replaceChildren(
      h('div', { class: 'pv-code' }, code),
      h('div', { class: 'pv-tr' }, L('msg.strongsNoLexicon')));
    strongsPopover.hidden = false;
    const rect = anchor.getBoundingClientRect();
    strongsPopover.style.left = `${Math.min(rect.left, window.innerWidth - strongsPopover.offsetWidth - 12)}px`;
    strongsPopover.style.top = `${rect.bottom + 8}px`;
    const close = () => { strongsPopover.hidden = true; document.removeEventListener('pointerdown', close); };
    setTimeout(() => document.addEventListener('pointerdown', close), 0);
  }

  function cycleTheme() {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(ctx.state.get().theme) + 1) % THEME_CYCLE.length];
    ctx.state.set({ theme: next });
    applyTheme(next);
    chrome.refreshThemeIcon();
    shell.notify(L('msg.state', { what: L('cmd.theme'), value: L(`val.${next}`) }));
  }

  // --- modal users --------------------------------------------------------

  function openPalette() {
    modal.open({
      placeholder: L('ph.palette'),
      items: ctx.registry.commands().map((c) => ({ id: c.id, title: c.title, keys: c.keys?.replace('Mod', '⌘/Ctrl'), icon: c.icon ?? 'cmd', run: c.run })),
      onPick: (item) => item.run(),
    });
  }

  function openSwitcher(book) {
    const items = [];
    for (const b of ctx.category.books) {
      const name = bookName(b.id);
      for (let c = 1; c <= b.chapters; c += 1) {
        items.push({ id: `${b.id}.${c}`, title: `${name} ${c}`, sub: b.name === name ? undefined : `${b.name} ${c}`, icon: 'book-open', book: b.id, chapter: c });
      }
    }
    modal.open({
      placeholder: L('ph.switcher'),
      items,
      query: book ? `${bookName(book)} ` : '',
      onPick: (item) => workspace.openChapter(item.book, item.chapter),
    });
  }

  async function openTranslationPicker(index) {
    const installed = await ctx.store.list();
    const open = workspace.panes();
    modal.open({
      placeholder: L('ph.translation'),
      items: installed.map((t) => ({
        id: t.identify,
        title: `${t.info.shortname} · ${t.info.name}`,
        sub: [t.info.language.text, t.info.year].filter(Boolean).join(' · ') + (open.includes(t.identify) ? ' · open' : ''),
        icon: 'book',
      })),
      onPick: (item) => workspace.setPaneTranslation(index, item.id),
    });
  }

  function bookName(id) {
    return workspace.bookName(id);
  }

  // --- keyboard -----------------------------------------------------------

  function wireKeys() {
    window.addEventListener('keydown', (e) => {
      if (modal.isOpen || isTyping(e.target)) return;
      const mod = e.ctrlKey || e.metaKey;
      const combo = `${mod ? 'Mod+' : ''}${e.key.length === 1 ? e.key.toLowerCase() : e.key}`;
      const command = ctx.registry.commands().find((c) => c.keys === combo);
      if (command) { e.preventDefault(); command.run(); }
    });
  }

  function isTyping(target) {
    return target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
  }

  // --- status bar ---------------------------------------------------------

  /**
   * Status bar. The left group is what is being read — translation, passage,
   * how much text is in it; the right group is state the reader can click.
   * Counts come from the chapter actually on screen, so they say something
   * about what is in front of them rather than about the file.
   */
  function renderStatus() {
    const { book, chapter, layout, syncScroll, mode, strongs, readingSize } = ctx.state.get();
    const label = `${workspace.bookName(book)} ${chapter}`;
    const onChapter = workspace.activeTab?.kind === 'chapter';
    // A control that acts on the chapter is shown but not pressable while a
    // document tab is active, so the bar never claims to describe one.
    const chapterOnly = (button) => {
      button.disabled = !onChapter;
      button.setAttribute('aria-disabled', String(!onChapter));
      return button;
    };

    const left = [
      h('span', { class: 'sb sb-app hide-sm' },
        h('img', { class: 'sb-mark', src: './icons/icon.svg', alt: '', width: 14, height: 14 }),
        h('span', {}, L('app.name'))),
      h('button', { class: 'sb', title: L('cmd.translation'), onclick: () => openTranslationPicker(0) },
        icon('book'), h('span', {}, workspace.primaryName())),
      chapterOnly(h('button', { class: 'sb', title: L('cmd.switcher'), onclick: () => openSwitcher(book) },
        icon('book-open'), h('span', { lang: workspace.lang() }, label))),
      h('span', { class: 'sb hide-sm', title: L('lbl.wordsIn', { ref: label }) },
        icon('quote'), h('span', {}, L('lbl.words', { n: counts.words }))),
      h('span', { class: 'sb hide-sm', title: L('lbl.versesIn', { ref: label }) },
        icon('lay-list'), h('span', {}, L('lbl.verses', { n: counts.verses }))),
    ];
    const right = [
      h('button', { class: 'sb sb-reading', onclick: (e) => readingPanel.toggle(e.currentTarget) }, icon('type'), `${readingSize}px · ${L(`val.${layout}`)}`),
      chapterOnly(h('button', { class: 'sb', onclick: toggleMode }, icon(mode === 'source' ? 'edit' : 'eye'), L(`val.${mode}`))),
      chapterOnly(h('button', { class: 'sb', onclick: toggleStrongs },
        h('span', { class: `dot${strongs ? '' : ' off'}` }), L('cmd.strongs'))),
      chapterOnly(h('button', { class: 'sb', onclick: () => toggleFlag('syncScroll', L('cmd.sync')) },
        h('span', { class: `dot${syncScroll ? '' : ' off'}` }), L('cmd.sync'))),
      h('button', { class: 'sb', title: storage.title, onclick: () => workspace.openDoc('about') },
        icon('db'), h('span', {}, storage.text)),
    ];
    chrome.setStatus(left, right);
  }

  /** What the counts in the status bar last measured, and the storage readout. */
  let counts = { words: 0, verses: 0 };
  let storage = { text: '—', title: '' };
  let countToken = 0;

  /** Measure the chapter in view, then repaint the bar with what it found. */
  async function measureChapter() {
    const run = ++countToken;
    const { translation, book, chapter } = ctx.state.get();
    const verses = translation ? await store.getChapter(translation, book, chapter) : null;
    if (run !== countToken) return;
    const values = Object.values(verses ?? {});
    const next = { verses: values.length, words: values.reduce((n, v) => n + wordCount(v.text), 0) };
    if (next.words === counts.words && next.verses === counts.verses) return;
    counts = next;
    renderStatus();
  }

  /** How much of the device's storage this app is using, as the browser reports it. */
  async function measureStorage() {
    const { usage, quota, persisted } = await storageStatus();
    const next = usage === null
      ? { text: L('val.unknown'), title: L('lbl.storageUnknown') }
      : {
        text: bytes(usage),
        title: [
          L('lbl.stored', { size: bytes(usage) }),
          quota ? L('lbl.ofQuota', { size: bytes(quota), pct: Math.max(1, Math.round(usage / quota * 100)) }) : null,
          persisted === true ? L('lbl.persisted') : persisted === false ? L('lbl.notPersisted') : null,
        ].filter(Boolean).join(' · '),
      };
    if (next.text === storage.text && next.title === storage.title) return;
    storage = next;
    renderStatus();
  }

  function bytes(n) {
    if (n < 1024) return `${n} B`;
    const units = ['KB', 'MB', 'GB'];
    let value = n / 1024;
    let unit = 0;
    while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
    return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
  }

  // --- address hash -------------------------------------------------------

  function syncHash() {
    const { book, chapter } = ctx.state.get();
    const hash = `#/${book}/${chapter}`;
    if (location.hash !== hash) history.replaceState(null, '', hash);
  }

  function applyHash() {
    const m = /^#\/(\d+)\/(\d+)$/.exec(location.hash);
    if (!m) return;
    const book = Number(m[1]);
    if (!ctx.category.hasBook(book)) return;
    const chapter = Math.min(Math.max(Number(m[2]), 1), ctx.category.book(book).chapters);
    const current = ctx.state.get();
    if (current.book !== book || current.chapter !== chapter) ctx.state.set({ book, chapter });
  }

  return shell;
}
