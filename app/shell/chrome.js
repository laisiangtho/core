/**
 * Shell chrome: ribbon, sidebars, top band, status bar, toasts.
 *
 * The markup and class names are Phase 1's, so app/styles/shell.css applies
 * unchanged. What the shell shows comes from the registry: ribbon buttons and
 * the palette from commands, sidebar strips from panes, tabs from docs.
 */

import { applyStrings, L } from './i18n.js';
import { h } from './dom.js';
import { createPaneDrag, wireResizer, wireRowDivider } from './dragdrop.js';
import { icon, mountIcons } from './icons.js';
import { wireFades } from './fade.js';
import { applyAccent, applyTheme, THEME_ICON, watchSystemTheme } from './theme.js';
import { MAX_ROWS } from '../core/settings.js';

/** The shortest a sidebar row may be dragged. */
const MIN_ROW_PX = 96;

/**
 * Below this width there is no room for a column beside the text, so a sidebar
 * arrives as a drawer over it. The stylesheet switches at the same number.
 */
const DRAWER_WIDTH = 900;

export function createChrome(root, ctx) {
  const { registry, settings } = ctx;

  mountIcons();
  const prefs = settings.get();
  applyTheme(prefs.theme);
  applyAccent(prefs.accent);
  watchSystemTheme(() => settings.get().theme);

  const ribRail = h('div', { class: 'rib-rail' });
  const tabStrip = h('div', { class: 'tabstrip', id: 'tabStrip', role: 'tablist' });
  const panes = h('div', { class: 'panes', id: 'panes', role: 'tabpanel' });
  const statusLeft = h('div', { class: 'sb-group' });
  const statusRight = h('div', { class: 'sb-group' });
  const toasts = h('div', { class: 'toasts', 'aria-live': 'polite' });

  const sides = { left: buildSidebar('left'), right: buildSidebar('right') };

  const navPrev = barButton('chev', 'cmd.prev', 'flip');
  const navNext = barButton('chev', 'cmd.next');
  const addPane = barButton('add-pane', 'cmd.parallel', '', () => run('reading.add-pane'));
  for (const button of [navPrev, navNext, addPane]) button.dataset.needsChapter = '1';
  const toggles = {
    left: barButton('panel-l', 'side.left'),
    right: barButton('panel-r', 'side.right'),
  };

  // Shown only in the narrow layout, where the ribbon is not: the app's mark,
  // and the way back to the command palette.
  const barApp = h('button', { class: 'app-pill', id: 'barApp', 'data-l': 'cmd.palette', onclick: () => run('shell.palette') },
    h('span', { class: 'app-mark' }, h('img', { src: './icons/icon.svg', alt: '', width: 18, height: 18 })),
    h('span', {}, L('app.name')));

  const scrim = h('div', { class: 'scrim-mobile', onclick: () => closeDrawers() });
  const mobileBar = h('nav', { class: 'mobile-bar', role: 'toolbar' },
    mobileButton('library', 'side.left', () => toggleSide('left')),
    mobileButton('chev', 'cmd.prev', () => run('passage.prev-chapter'), 'flip'),
    mobileButton('chev', 'cmd.next', () => run('passage.next-chapter')),
    mobileButton('inspector', 'side.right', () => toggleSide('right')),
    mobileButton('more', 'cmd.palette', () => run('shell.palette')));

  const app = h('div', { id: 'app' },
    h('div', { class: 'body-row' },
      h('nav', { class: 'ribbon' },
        h('div', { class: 'rib-head band-drag' },
          h('button', { class: 'rib-app', 'data-l': 'app.name', onclick: () => run('shell.palette') },
            h('span', { class: 'app-mark' }, h('img', { src: './icons/icon.svg', alt: '', width: 20, height: 20 })))),
        ribRail),
      sides.left.element,
      h('main', { class: 'workspace' },
        h('div', { class: 'tabbar band-drag' },
          h('div', { class: 'nav-group' }, navPrev, navNext),
          barApp,
          tabStrip,
          h('div', { class: 'tb-actions' },
            addPane,
            barButton('more', 'cmd.palette', '', () => run('shell.palette'))),
          h('span', { class: 'bar-sep' }),
          h('div', { class: 'win-ctl' }, toggles.left, toggles.right)),
        panes),
      sides.right.element),
    h('div', { class: 'statusbar' }, statusLeft, h('span', { class: 'spacer' }), statusRight),
    scrim,
    mobileBar,
    toasts);

  root.replaceChildren(app);
  applyWindowFrame();
  applyChrome(settings.get());

  navPrev.addEventListener('click', () => run('passage.prev-chapter'));
  navNext.addEventListener('click', () => run('passage.next-chapter'));
  for (const side of ['left', 'right']) {
    toggles[side].addEventListener('click', () => toggleSide(side));
  }

  function run(id) {
    const command = registry.commands().find((c) => c.id === id);
    if (command) command.run();
  }

  /**
   * A sidebar is a column of rows. Each row has its own tab strip and shows one
   * of its panes; the rows share the height in the proportions the reader set.
   *
   * Pane views are built and mounted once and parked in a holder when they are
   * not on show, so rearranging the sidebar never remounts a pane — a search
   * with results in it survives being dragged into another row.
   */
  function buildSidebar(side) {
    const body = h('div', { class: 'side-body' });
    const holder = h('div', { class: 'pane-holder' });
    const hint = h('div', { class: 'drop-hint', hidden: true });
    const caret = h('div', { class: 'drop-caret', hidden: true });
    const element = h('aside', { class: `sidebar ${side}`, id: `side-${side}` }, body, holder, hint, caret,
      h('div', { class: 'resizer', 'data-side': side }));

    /** @type {{ views: string[], active: string|null, size: number }[]} */
    let rows = [];
    const views = new Map(); // pane id → { pane, element }

    function build(list) {
      for (const pane of list) {
        const view = h('section', { class: 'pane-view', 'data-view': pane.id },
          h('div', { class: 'pane-head' }, h('span', { class: 'ph-title' }, pane.title)),
          h('div', { class: 'pane-body scroll' }));
        holder.append(view);
        views.set(pane.id, { pane, element: view });
      }
    }

    /** Rebuild the rows from `rows`, moving the parked views into place. */
    function render() {
      for (const { element: view } of views.values()) holder.append(view);
      body.replaceChildren(...rows.flatMap((row, index) => {
        const strip = h('div', { class: `pane-tabs${index === 0 ? ' band-drag' : ''}`, role: 'tablist' });
        const group = h('div', { class: 'side-group', dataset: { side, group: String(index) }, style: { flexGrow: String(row.size), flexBasis: '0%' } }, strip);

        for (const id of row.views) {
          const entry = views.get(id);
          if (!entry) continue;
          const on = id === row.active;
          const tab = h('button', {
            class: `pane-tab${on ? ' is-active' : ''}`,
            'data-view': id, role: 'tab', 'aria-selected': String(on),
            title: entry.pane.title, 'aria-label': entry.pane.title,
          }, icon(entry.pane.icon));
          wireTab(tab, index, id);
          strip.append(tab);
          entry.element.classList.toggle('is-active', on);
          group.append(entry.element);
        }
        return index === 0 ? [group] : [rowDivider(index), group];
      }));
      wireFades(element);
    }

    /** The divider between two rows: drag it to change how they share the height. */
    function rowDivider(index) {
      const divider = h('div', { class: 'row-divider', title: L('hint.resizeRows') });
      wireRowDivider(divider, {
        rows: () => [...body.querySelectorAll('.side-group')],
        index,
        min: MIN_ROW_PX,
        // Freeze every row at its measured height first, so the ones not being
        // dragged keep the height they had.
        onStart: (heights) => heights.forEach((px, i) => { rows[i].size = px || 1; }),
        onMove: (above, below) => { rows[index - 1].size = above; rows[index].size = below; },
        onEnd: persist,
      });
      return divider;
    }

    function wireTab(tab, index, id) {
      tab.addEventListener('click', () => select(id));
      dragPaneTab(tab, { side, group: index, view: id });
    }

    function select(id) {
      const row = rows.find((r) => r.views.includes(id));
      if (!row || row.active === id) return;
      row.active = id;
      render();
      persist();
    }

    function persist() {
      const key = side === 'left' ? 'sidebarLeft' : 'sidebarRight';
      ctx.state.set({ [key]: rows.map((r) => ({ views: [...r.views], active: r.active, size: r.size })) });
    }

    return {
      element, select, render, persist,
      get rows() { return rows; },
      set rows(next) { rows = next; },
      has: (id) => views.has(id),
      adopt(id) {
        // A pane dragged in from the other sidebar brings its mounted view with it.
        const entry = sides[side === 'left' ? 'right' : 'left'].release(id);
        if (entry) views.set(id, entry);
        return Boolean(entry);
      },
      release(id) {
        const entry = views.get(id);
        if (entry) views.delete(id);
        return entry ?? null;
      },
      build,
      mount() {
        // A pane that cannot build itself says so inside its own body; the
        // other panes, and the text, are unaffected.
        for (const { pane, element: view } of views.values()) {
          const body = view.querySelector('.pane-body');
          try {
            pane.mount(body);
          } catch (err) {
            body.replaceChildren(h('div', { class: 'pane-broken' },
              h('p', {}, L('msg.paneBroken', { name: pane.title })),
              h('pre', {}, err.message)));
          }
        }
      },
      get empty() { return views.size === 0; },
      ids: () => rows.flatMap((r) => r.views),
    };
  }

  /**
   * The saved arrangement, checked against the panes this build actually has: a
   * pane the settings never heard of joins the first row of the side it
   * registered for, and an id no feature provides is dropped.
   */
  function arrange() {
    const saved = { left: settings.get().sidebarLeft, right: settings.get().sidebarRight };
    const placed = new Set([...saved.left, ...saved.right].flatMap((row) => row.views));
    for (const side of ['left', 'right']) {
      const known = new Set(registry.panes().map((p) => p.id));
      const rows = saved[side]
        .map((row) => ({ views: row.views.filter((id) => known.has(id)), active: row.active, size: row.size }))
        .filter((row) => row.views.length);
      const fresh = registry.panes(side).filter((p) => !placed.has(p.id)).map((p) => p.id);
      if (rows.length) rows[0].views.push(...fresh);
      else if (fresh.length) rows.push({ views: fresh, active: fresh[0], size: 1 });
      for (const row of rows) if (!row.views.includes(row.active)) row.active = row.views[0];
      sides[side].rows = rows;
      sides[side].build(rows.flatMap((row) => row.views).map((id) => registry.panes().find((p) => p.id === id)).filter(Boolean));
    }
  }

  /** Where a dragged pane tab would land, and what happens when it is dropped. */
  const dragPaneTab = createPaneDrag({
    host: (side) => sides[side].element,
    title: (id) => registry.panes().find((p) => p.id === id)?.title ?? id,
    iconOf: (id) => registry.panes().find((p) => p.id === id)?.icon ?? 'info',
    rows: (side) => sides[side].rows,
    maxRows: MAX_ROWS,
    onFull: () => notify(L('msg.limitRows', { n: MAX_ROWS }), 'error'),
    drop(view, target) {
      const from = ['left', 'right'].find((side) => sides[side].ids().includes(view));
      if (!from) return;
      if (from !== target.side) {
        sides[target.side].adopt(view);
        // A pane dropped into a sidebar that was empty opens that sidebar.
        const key = target.side === 'left' ? 'leftSidebar' : 'rightSidebar';
        if (!ctx.state.get()[key]) ctx.state.set({ [key]: true });
      }

      const source = sides[from].rows;
      const destination = sides[target.side].rows;
      const before = destination.length;
      const home = source.find((row) => row.views.includes(view));
      const at = home.views.indexOf(view);

      if (target.type === 'strip') {
        // Dropping into a sidebar that holds nothing yet gives it its first row.
        if (!destination.length) destination.push({ views: [], active: null, size: 1 });
        const row = destination[target.group] ?? destination[0];
        home.views = home.views.filter((id) => id !== view);
        let index = target.index;
        if (row === home && at > -1 && at < index) index--; // the removal shifts the gap
        row.views.splice(Math.max(0, Math.min(index, row.views.length)), 0, view);
        row.active = view;
      } else {
        home.views = home.views.filter((id) => id !== view);
        destination.splice(target.type === 'below' ? target.group + 1 : target.group, 0, { views: [view], active: view, size: 1 });
      }

      for (const side of new Set([from, target.side])) {
        const list = sides[side].rows;
        for (let i = list.length - 1; i >= 0; i--) {
          if (!list[i].views.length) list.splice(i, 1);
          else if (!list[i].views.includes(list[i].active)) list[i].active = list[i].views[0];
        }
        // Heights the reader set are discarded only when the row count changes.
        if (side === target.side && list.length !== before) for (const row of list) row.size = 1;
        sides[side].render();
        sides[side].persist();
      }
      applyChrome(ctx.state.get());
    },
  });

  /**
   * A window with no system title bar of its own puts the system's buttons over
   * this app's top band, and the band has to leave room for them: a strip at
   * the top on macOS, where the traffic lights sit, and the end of the row
   * elsewhere. A target with an ordinary title bar sets nothing and the layout
   * is untouched.
   */
  function applyWindowFrame() {
    const frame = ctx.platform.frame ?? null;
    if (frame === 'inset') document.body.dataset.platform = 'darwin';
    else if (frame === 'overlay') document.body.dataset.shell = 'on';
  }

  /** Chrome the reader can hide, and the widths they can drag. */
  function applyChrome(s) {
    const body = document.body;
    body.dataset.ribbon = s.ribbon ? 'on' : 'off';
    body.dataset.status = s.statusBar ? 'on' : 'off';
    for (const side of ['left', 'right']) {
      const open = side === 'left' ? s.leftSidebar : s.rightSidebar;
      const empty = sides[side].empty;
      body.dataset[side] = open && !empty ? 'open' : 'shut';
      // A sidebar with nothing in it is out of the way, but it stays in the
      // document: while a pane is being dragged it shows a rail to drop onto,
      // or the last pane moved out of a sidebar could never be moved back.
      sides[side].element.dataset.empty = String(empty);
      sides[side].element.hidden = !open && !empty;
      toggles[side].setAttribute('aria-pressed', String(open && !empty));
    }
    body.style.setProperty('--sidebar-l', `${s.leftWidth}px`);
    body.style.setProperty('--sidebar-r', `${s.rightWidth}px`);
    // A drawer belongs to the narrow layout only; a window growing back to a
    // column layout must not leave one open over the text.
    if (!isDrawerLayout() && body.classList.contains('has-drawer')) closeDrawers();
    paintMobileBar();
  }

  /**
   * A sidebar as a drawer over the text — the same sheets, a different way in.
   * One drawer at a time, and the scrim closes whichever is open.
   */
  function isDrawerLayout() {
    return window.innerWidth <= DRAWER_WIDTH;
  }

  function closeDrawers() {
    document.body.classList.remove('drawer-l', 'drawer-r', 'has-drawer');
    paintMobileBar();
  }

  function toggleSide(side) {
    if (isDrawerLayout()) {
      const cls = side === 'left' ? 'drawer-l' : 'drawer-r';
      const open = document.body.classList.contains(cls);
      closeDrawers();
      if (!open && !sides[side].empty) {
        document.body.classList.add(cls, 'has-drawer');
      }
      paintMobileBar();
      return;
    }
    const key = side === 'left' ? 'leftSidebar' : 'rightSidebar';
    ctx.state.set({ [key]: !ctx.state.get()[key] });
  }

  function mobileButton(name, labelKey, onclick, extra = '') {
    return h('button', { class: extra, 'data-l': labelKey, 'data-mb': labelKey, onclick }, icon(name));
  }

  /** The bottom bar reports the same state the band does. */
  function paintMobileBar() {
    const body = document.body;
    const [left, , , right] = mobileBar.children;
    left.setAttribute('aria-pressed', String(body.classList.contains('drawer-l')));
    right.setAttribute('aria-pressed', String(body.classList.contains('drawer-r')));
    for (const button of mobileBar.querySelectorAll('[data-mb="cmd.prev"], [data-mb="cmd.next"]')) {
      button.disabled = body.dataset.tab !== 'chapter';
    }
  }

  function wireResizers() {
    for (const side of ['left', 'right']) {
      const handle = sides[side].element.querySelector('.resizer');
      const key = side === 'left' ? 'leftWidth' : 'rightWidth';
      const variable = side === 'left' ? '--sidebar-l' : '--sidebar-r';
      let live = ctx.state.get()[key];
      wireResizer(handle, {
        side,
        min: side === 'left' ? 180 : 200,
        max: side === 'left' ? 520 : 560,
        width: () => live,
        onMove: (px) => { live = px; document.body.style.setProperty(variable, `${px}px`); },
        onEnd: (px) => ctx.state.set({ [key]: px }),
      });
    }
  }

  function barButton(name, labelKey, extra = '', onclick) {
    return h('button', { class: `tb-btn ${extra}`.trim(), 'data-l': labelKey, onclick }, icon(name));
  }

  /**
   * Commands that only mean something with a chapter open are shown but not
   * pressable while a document tab is active, rather than failing when pressed.
   */
  function setChapterMode(on) {
    document.body.dataset.tab = on ? 'chapter' : 'doc';
    paintMobileBar();
    for (const button of app.querySelectorAll('[data-needs-chapter]')) {
      button.disabled = !on;
      button.setAttribute('aria-disabled', String(!on));
    }
  }

  /** Ribbon buttons for commands that asked for one, plus the fixed pair. */
  function buildRibbon() {
    ribRail.replaceChildren(
      ribButton('book-open', 'cmd.switcher', () => run('shell.switcher')),
      ribButton('cmd', 'cmd.palette', () => run('shell.palette')),
      h('span', { class: 'rib-sep' }),
      ...registry.commands().filter((c) => c.ribbon).map((c) => {
        const button = ribButton(c.icon ?? 'book', c.title, c.run, true);
        if (c.needsChapter) button.dataset.needsChapter = '1';
        return button;
      }),
      h('span', { class: 'grow' }),
      registry.commands().some((c) => c.id === 'help.open')
        ? ribButton('help', 'doc.help', () => run('help.open'))
        : null,
      ribButton(THEME_ICON[settings.get().theme] ?? 'monitor', 'cmd.theme', () => run('shell.theme'), false, 'themeBtn'));
  }

  function ribButton(name, label, onclick, literal = false, id) {
    const text = literal ? label : L(label);
    return h('button', { class: 'rib', id, title: text, 'aria-label': text, onclick }, icon(name));
  }

  /**
   * A passing message. One that carries an action — "a new version is ready",
   * and the button that takes it — stays long enough to be read and acted on,
   * and can be dismissed by hand.
   * @param {{ action?: { label: string, run: () => void } }} [options]
   */
  function notify(message, kind = 'info', { action = null } = {}) {
    const cls = kind === 'error' ? 'toast err' : kind === 'ok' ? 'toast ok' : 'toast';
    const toast = h('div', { class: cls, role: kind === 'error' ? 'alert' : 'status' },
      icon(kind === 'error' ? 'alert' : 'info'), h('span', {}, message));
    if (action) {
      toast.append(
        h('button', { class: 'toast-act', onclick: () => { toast.remove(); action.run(); } }, action.label),
        h('button', { class: 'toast-x', title: L('cmd.close'), 'aria-label': L('cmd.close'), onclick: () => toast.remove() }, icon('x')));
    }
    toasts.append(toast);
    setTimeout(() => toast.remove(), action ? 30000 : kind === 'error' ? 9000 : 3500);
  }

  /** Status bar: left is context, right is state the reader can click. */
  function setStatus(left, right) {
    statusLeft.replaceChildren(...left);
    statusRight.replaceChildren(...right);
  }

  function refreshThemeIcon() {
    const button = app.querySelector('#themeBtn');
    if (button) button.replaceChildren(icon(THEME_ICON[settings.get().theme] ?? 'monitor'));
  }

  function start() {
    buildRibbon();
    arrange();
    for (const side of ['left', 'right']) {
      sides[side].render();
      sides[side].mount();
    }
    wireResizers();
    applyChrome(ctx.state.get());
    applyStrings(app);
    window.addEventListener('resize', () => applyChrome(ctx.state.get()));
  }

  return {
    element: app, tabStrip, panes, start, notify, setStatus, refreshThemeIcon, toggleSide, applyChrome, setChapterMode,
    closeDrawers, isDrawerLayout,
    selectPane: (side, id) => {
      // A pane the reader moved to the other sidebar is selected where it is.
      const where = sides[side].has(id) ? side : side === 'left' ? 'right' : 'left';
      sides[where].select(id);
    },
  };
}
