/**
 * Settings: what is kept between sessions, and moving it between installs.
 *
 * Export writes a small JSON file: reading position, parallel selection, and
 * the list of offline translations with their versions. Translation data is not
 * included (megabytes each) — after import, the missing ones can be downloaded
 * again in one step.
 */

import { buildExport, parseExport } from '../../core/settings.js';
import { applyAccent } from '../../shell/theme.js';
import { L } from '../../shell/i18n.js';

/** A short palette; the colour input covers everything else. */
const ACCENTS = Object.freeze(['#7c3aed', '#2563eb', '#0ea5e9', '#14b8a6', '#e9973f', '#e11d48']);
import { BUILT_AT, VERSION } from '../../version.js';
import { formatBytes, h } from '../../shell/dom.js';
import { downloadJson, pickJson } from '../../services/transfer.js';

export default {
  id: 'settings',
  setup(ctx) {
    const { annotations, category, library, records, registry, settings, shell, state, store } = ctx;
    /** Translations named by the last import that are not installed here. */
    let missing = [];
    let importedFrom = null;
    let busy = null;
    const listeners = new Set();
    const refresh = () => { for (const fn of listeners) fn(); };

    /** The accent is applied at once and remembered; null restores the theme's own. */
    function setAccent(colour) {
      state.set({ accent: colour });
      applyAccent(colour);
      refresh();
    }

    async function exportSettings() {
      await settings.save();
      const data = buildExport({
        settings: settings.get(),
        translations: await store.list(),
        catalog: library.catalog,
        annotations: annotations.toJSON(),
        records: records.toJSON(),
        appVersion: VERSION,
      });
      const stamp = new Date().toISOString().slice(0, 10);
      downloadJson(`lai-siangtho-settings-${stamp}.json`, data);
      shell.notify(L('msg.exported', {
        notes: L('lbl.notesCount', { n: data.data.notes.length }),
        marks: L('lbl.marks', { n: data.data.marks.length }),
        n: data.library.translations.length,
      }));
    }

    async function importSettings() {
      const file = await pickJson();
      if (!file) return;
      const parsed = parseExport(file.data, { source: file.name, category });
      settings.set(parsed.settings);
      await settings.save();
      state.set(parsed.settings);
      const merged = await annotations.merge(parsed.annotations);
      await records.merge(parsed.records);
      const installed = new Set((await store.list()).map((t) => t.identify));
      missing = parsed.translations.filter((t) => !installed.has(t.identify));
      importedFrom = { name: file.name, exportedAt: parsed.exportedAt, count: parsed.translations.length, merged };
      shell.notify(L(missing.length ? 'msg.importedMissing' : 'msg.imported', {
        file: file.name,
        notes: L('lbl.notesCount', { n: merged.notes }),
        marks: L('lbl.marks', { n: merged.marks }),
        n: missing.length,
      }));
      refresh();
    }

    async function installMissing() {
      const queue = [...missing];
      for (const [i, t] of queue.entries()) {
        busy = L('set.installing', { name: t.identify, i: i + 1, n: queue.length });
        refresh();
        try {
          await library.install(t.identify);
          missing = missing.filter((m) => m.identify !== t.identify);
        } catch (err) {
          shell.notify(`${t.identify}: ${err.message}`, 'error');
        }
      }
      busy = null;
      refresh();
      shell.notify(missing.length
        ? L('msg.installedSome', { n: missing.length })
        : L('msg.installedAll'), missing.length ? 'error' : 'ok');
    }

    const guard = (fn) => () => fn().catch((err) => shell.notify(err.message, 'error'));
    registry.command({ id: 'settings.export', title: L('cmd.exportSettings'), icon: 'download', run: guard(exportSettings) });
    registry.command({ id: 'settings.import', title: L('cmd.importSettings'), icon: 'enter', run: guard(importSettings) });

    registry.command({ id: 'settings.open', title: L('doc.settings'), icon: 'settings', ribbon: true, run: () => ctx.shell.openDoc('settings') });

    registry.doc({
      id: 'settings',
      title: L('doc.settings'),
      icon: 'settings',
      mount(el) {
        async function render() {
          const current = settings.get();
          const installed = await store.list();
          const bytes = installed.reduce((n, t) => n + (t.bytes ?? 0), 0);
          const bookName = category.book(current.book).name;

          el.replaceChildren(h('section', { class: 'doc settings' },
            h('header', { class: 'doc-head' },
              h('h1', { class: 'inline-title' }, L('doc.settings')),
              h('p', { class: 'muted' }, L('set.lede'))),

            h('dl', { class: 'settings-list' },
              h('dt', {}, L('set.lastRead')), h('dd', {}, `${current.translation ?? '–'} · ${bookName} ${current.chapter}`),
              h('dt', {}, L('set.parallel')), h('dd', {}, current.parallel.length ? current.parallel.join(', ') : '–'),
              h('dt', {}, L('set.installed')), h('dd', {}, installed.length ? `${installed.length} · ${formatBytes(bytes)}` : L('val.none')),
              h('dt', {}, L('pane.notes')), h('dd', {}, String(annotations.allNotes().length)),
              h('dt', {}, L('pane.marks')), h('dd', {}, String(annotations.allMarks().length)),
              h('dt', {}, L('lbl.version')), h('dd', {}, `${VERSION} · ${L('lbl.built', { date: new Date(BUILT_AT).toLocaleDateString() })}`)),

            h('h2', { class: 'settings-h' }, L('set.appearance')),
            h('div', { class: 'settings-actions' },
              ...ACCENTS.map((colour) => h('button', {
                class: `accent-swatch${current.accent === colour ? ' is-on' : ''}`,
                title: colour, 'aria-label': colour, 'aria-pressed': String(current.accent === colour),
                style: { background: colour },
                onclick: () => setAccent(colour),
              })),
              // The picker holds whatever the reader chooses, so the palette is
              // a shortcut rather than the whole choice.
              h('label', { class: 'accent-pick', title: L('set.accent') },
                h('input', {
                  type: 'color', value: current.accent ?? '#7c3aed',
                  oninput: (e) => setAccent(e.currentTarget.value),
                }),
                L('set.accentCustom')),
              h('button', { class: 'btn', onclick: () => setAccent(null) }, L('set.accentDefault'))),

            h('h2', { class: 'settings-h' }, L('set.material')),
            h('div', { class: 'settings-actions' },
              h('button', { class: 'btn primary', onclick: guard(exportSettings) }, L('set.export')),
              h('button', { class: 'btn', onclick: guard(importSettings) }, L('set.import'))),
            h('p', { class: 'muted' }, L('set.exportNote')),

            importedFrom ? h('div', { class: 'settings-import' },
              h('h2', {}, L('set.lastImport')),
              h('p', { class: 'muted' }, L('set.importSummary', {
                name: importedFrom.name, notes: importedFrom.merged.notes,
                marks: importedFrom.merged.marks, count: importedFrom.count,
              }) + (importedFrom.exportedAt ? ` · ${L('set.exportedAt', { when: new Date(importedFrom.exportedAt).toLocaleString() })}` : '')),
              missing.length
                ? [h('ul', {}, missing.map((t) => h('li', {}, `${t.identify}${t.version ? ` (v${t.version})` : ''}`))),
                  busy ? h('span', { class: 'muted' }, busy)
                    : h('button', { class: 'btn primary', onclick: guard(installMissing) }, L('set.installMissing', { n: missing.length }))]
                : h('p', { class: 'muted' }, L('set.allInstalled'))) : null));
        }

        const run = () => render().catch((err) => shell.notify(err.message, 'error'));
        listeners.add(run);
        const offChange = library.on('change', run);
        const offAnnotations = annotations.on('change', run);
        const unsubscribe = state.subscribe(run);
        run();
        return () => { listeners.delete(run); offChange(); offAnnotations(); unsubscribe(); };
      },
    });
  },
};
