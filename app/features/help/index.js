/**
 * Help, Shortcuts and About, as three documents.
 *
 * The shortcut table is generated from the command registry, so it cannot
 * describe a key this build does not bind, and About reports what is actually
 * installed and stored rather than what the app was shipped with.
 */

import { storageStatus } from '../../services/store.js';
import { h } from '../../shell/dom.js';
import { icon } from '../../shell/icons.js';
import { L } from '../../shell/i18n.js';
import { BUILT_AT, VERSION } from '../../version.js';

const APPLE = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform ?? '');

/** "Mod+p" as this device writes it. */
export function keyLabel(keys) {
  return keys
    .replace('Mod', APPLE ? '⌘' : 'Ctrl')
    .replace('Alt', APPLE ? '⌥' : 'Alt')
    .replace('Shift', '⇧')
    .replace('ArrowRight', '→')
    .replace('ArrowLeft', '←')
    .replace('ArrowUp', '↑')
    .replace('ArrowDown', '↓')
    .split('+');
}

const kbd = (keys) => keyLabel(keys).map((key) => h('span', { class: 'kbd' }, key));

export default {
  id: 'help',
  setup(ctx) {
    const { annotations, platform, registry, shell, store } = ctx;

    const task = (iconName, title, description, keys, run) => h('button', {
      class: 'task', dataset: { go: '1' }, onclick: run,
    },
      h('span', { class: 'task-t' }, icon(iconName), title),
      h('span', { class: 'd' }, description),
      keys ? h('span', { class: 'k' }, kbd(keys)) : null);

    const keysOf = (id) => registry.commands().find((c) => c.id === id)?.keys ?? '';
    const run = (id) => () => shell.run(id);

    registry.command({ id: 'help.open', title: L('doc.help'), icon: 'help', run: () => shell.openDoc('help') });
    registry.command({ id: 'help.shortcuts', title: L('doc.shortcuts'), icon: 'cmd', run: () => shell.openDoc('shortcuts') });
    registry.command({ id: 'help.about', title: L('doc.about'), icon: 'info', run: () => shell.openDoc('about') });

    // --- Help ---------------------------------------------------------------

    registry.doc({
      id: 'help',
      title: L('doc.help'),
      icon: 'help',
      mount(el) {
        const has = (id) => registry.commands().some((c) => c.id === id);
        const cards = [
          task('book-open', L('cmd.switcher'), L('doc.t.switcher'), keysOf('shell.switcher'), run('shell.switcher')),
          task('cmd', L('cmd.palette'), L('doc.t.palette'), keysOf('shell.palette'), run('shell.palette')),
          task('add-pane', L('cmd.parallel'), L('doc.t.parallel'), '', run('reading.add-pane')),
          has('search.open') ? task('search', L('pane.search'), L('doc.t.search'), keysOf('search.open'), run('search.open')) : null,
          has('composer.open') ? task('note', L('cmd.composer'), L('doc.t.composer'), keysOf('composer.open'), run('composer.open')) : null,
          has('graph.open') ? task('graph', L('doc.graph'), L('doc.t.graph'), '', run('graph.open')) : null,
          has('plan.open') ? task('calendar', L('pane.plan'), L('doc.t.plan'), '', run('plan.open')) : null,
          has('speech.toggle') ? task('audio', L('cmd.read'), L('doc.t.read'), '', run('speech.toggle')) : null,
        ].filter(Boolean);

        el.append(h('div', { class: 'leaf' }, h('div', { class: 'leaf-scroll scroll' },
          h('div', { class: 'note doc' },
            h('h1', { class: 'inline-title' }, L('doc.help')),
            h('p', { class: 'doc-lede' }, L('doc.help.lede')),
            h('div', { class: 'task-grid' }, cards),
            h('div', { class: 'doc-h' }, L('doc.help.more')),
            h('div', { class: 'task-grid' },
              task('cmd', L('doc.shortcuts'), L('doc.t.shortcuts'), '', () => shell.openDoc('shortcuts')),
              task('info', L('doc.about'), L('doc.t.about'), '', () => shell.openDoc('about')),
              task('settings', L('cmd.settings'), L('doc.t.settings'), '', () => shell.openDoc('settings')))))));
      },
    });

    // --- Shortcuts ----------------------------------------------------------

    registry.doc({
      id: 'shortcuts',
      title: L('doc.shortcuts'),
      icon: 'cmd',
      mount(el) {
        const bound = registry.commands().filter((c) => c.keys).map((c) => ({ keys: c.keys, what: c.title }));
        const seen = new Set(bound.map((r) => r.keys));
        // Gestures and modal keys are not commands, so they are listed by hand;
        // a line that repeats a bound key is dropped rather than shown twice.
        const extras = [
          { keys: 'Mod+1…9', what: L('cmd.goToTab') },
          { keys: 'Esc', what: L('doc.keys.esc') },
          { keys: 'ArrowUp+ArrowDown', what: L('doc.keys.arrows') },
          { keys: 'Enter', what: L('doc.keys.enter') },
        ].filter((r) => !seen.has(r.keys));
        const rows = [...bound, ...extras];

        const filter = h('input', { spellcheck: 'false', placeholder: L('ph.filter'), 'aria-label': L('ph.filter') });
        const list = h('div', { class: 'key-list' },
          rows.map((row) => h('div', {
            class: 'key-row',
            dataset: { t: `${row.keys} ${row.what}`.toLowerCase() },
          }, h('span', { class: 'k' }, kbd(row.keys)), h('span', { class: 'a' }, row.what))));
        const empty = h('div', { class: 'key-empty', hidden: true }, L('empty.noHits', { query: '' }));

        filter.addEventListener('input', () => {
          const q = filter.value.trim().toLowerCase();
          let shown = 0;
          for (const row of list.children) {
            const on = !q || row.dataset.t.includes(q);
            row.hidden = !on;
            if (on) shown++;
          }
          empty.hidden = shown > 0;
        });

        el.append(h('div', { class: 'leaf' }, h('div', { class: 'leaf-scroll scroll' },
          h('div', { class: 'note doc' },
            h('h1', { class: 'inline-title' }, L('doc.shortcuts')),
            h('div', { class: 'note-sub' }, L('doc.keys.sub', { n: rows.length })),
            h('p', { class: 'doc-lede' }, L('doc.keys.lede')),
            h('div', { class: 'field doc-filter' }, icon('search'), filter),
            list,
            empty))));
      },
    });

    // --- About --------------------------------------------------------------

    registry.doc({
      id: 'about',
      title: L('doc.about'),
      icon: 'info',
      mount(el) {
        const facts = h('dl', { class: 'settings-list' });
        const body = h('div', { class: 'note doc' },
          h('h1', { class: 'inline-title' }, L('app.name')),
          h('div', { class: 'note-sub' }, `${VERSION} · ${L('lbl.built', { date: new Date(BUILT_AT).toLocaleDateString() })}`),
          h('p', { class: 'doc-lede' }, L('doc.about.lede')),
          facts,
          h('p', { class: 'muted' }, L('doc.about.sources')));
        el.append(h('div', { class: 'leaf' }, h('div', { class: 'leaf-scroll scroll' }, body)));

        async function paint() {
          const [installed, { usage, quota, persisted }, native] = await Promise.all([
            store.list(),
            storageStatus(),
            platform.capabilities.appInfo ? platform.capabilities.appInfo() : Promise.resolve(null),
          ]);
          const size = installed.reduce((n, t) => n + (t.bytes ?? 0), 0);
          const row = (term, value) => [h('dt', {}, term), h('dd', {}, value)];
          facts.replaceChildren(
            ...row(L('lbl.version'), VERSION),
            ...row(L('lbl.runtime'), native ? `${native.runtime} · ${native.platform}` : platform.id),
            ...row(L('lbl.translationsHeld'), installed.length ? `${installed.length} · ${bytes(size)}` : L('val.none')),
            ...row(L('pane.notes'), String(annotations.allNotes().length)),
            ...row(L('pane.marks'), String(annotations.allMarks().length)),
            ...row(L('lbl.storage'), usage === null
              ? L('val.unknown')
              : `${bytes(usage)}${quota ? ` ${L('lbl.ofQuota', { size: bytes(quota), pct: Math.max(1, Math.round(usage / quota * 100)) })}` : ''}`),
            ...row(L('lbl.eviction'), persisted === true ? L('lbl.persisted') : persisted === false ? L('lbl.notPersisted') : L('val.unknown')));
        }

        paint().catch((err) => shell.notify(err.message, 'error'));
        const off = annotations.on('change', () => paint().catch(() => {}));
        return off;
      },
    });
  },
};

function bytes(n) {
  if (!n) return '0 B';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = n / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) { value /= 1024; unit++; }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}
