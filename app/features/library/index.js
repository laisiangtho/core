/**
 * Library: browse the catalog, make translations available offline, update
 * and remove them, and check the remote catalog for changes.
 */

import { formatBytes, h } from '../../shell/dom.js';
import { L } from '../../shell/i18n.js';
import { storageStatus } from '../../services/store.js';

export default {
  id: 'library',
  setup(ctx) {
    const { library, registry, shell } = ctx;
    const progress = new Map(); // identify -> text

    async function check() {
      try {
        const { changed } = await library.checkForUpdates({ force: true });
        shell.notify(changed ? 'Catalog updated' : 'Catalog is up to date');
      } catch (err) {
        shell.notify(`Catalog check failed: ${err.message}`, 'error');
      }
    }

    async function act(identify, action) {
      progress.set(identify, action === 'remove' ? 'Removing…' : 'Starting…');
      try {
        if (action === 'remove') {
          await library.remove(identify);
          shell.notify(`${identify} removed`);
        } else {
          const result = await library.install(identify);
          const notes = [];
          if (result.diagnostics.length) notes.push(`${result.diagnostics.length} versification differences`);
          if (result.versionMismatch) notes.push(`catalog lists v${result.versionMismatch.catalog}, file is v${result.versionMismatch.file}`);
          shell.notify(`${identify} v${result.version} available offline${notes.length ? ` (${notes.join('; ')})` : ''}`);
        }
      } catch (err) {
        shell.notify(`${identify}: ${err.message}`, 'error');
      } finally {
        progress.delete(identify);
      }
    }

    registry.command({ id: 'library.check', title: L('cmd.checkUpdates'), icon: 'download', run: check });
    registry.command({ id: 'library.open', title: L('doc.library'), icon: 'download', ribbon: true, run: () => ctx.shell.openDoc('library') });

    registry.doc({
      id: 'library',
      title: L('doc.library'),
      icon: 'download',
      mount(el) {
        let disposed = false;

        async function render() {
          const [rows, storage] = await Promise.all([library.status(), storageStatus()]);
          if (disposed) return;
          const catalog = library.catalog;
          const header = library.origin === 'bundled'
            ? L('lib.bundled')
            : L('lib.catalog', {
              version: catalog.version,
              updated: new Date(catalog.updated).toLocaleDateString(),
              checked: new Date(library.fetchedAt).toLocaleString(),
            });

          const groups = new Map();
          for (const row of rows) {
            const lang = row.entry?.language.text ?? L('lib.unlistedGroup');
            if (!groups.has(lang)) groups.set(lang, []);
            groups.get(lang).push(row);
          }

          el.replaceChildren(
            h('section', { class: 'doc library' },
              h('header', { class: 'doc-head' },
                h('h1', { class: 'inline-title' }, L('doc.library')),
                h('p', { class: 'muted' }, header),
                h('p', { class: 'muted' }, L('lib.storageUsed', { size: formatBytes(storage.usage) })
                  + (storage.persisted === false ? ` · ${L('lib.notPersistent')}` : '')),
                h('button', { class: 'btn primary', onclick: check }, L('cmd.checkUpdates'))),
              [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([lang, list]) => h('div', { class: 'library-group' },
                h('h2', {}, lang),
                h('ul', { class: 'library-list' }, list.map((row) => item(row)))))));
        }

        function item(row) {
          const e = row.entry;
          const busy = progress.get(row.identify);
          const actions = {
            available: [[L('lib.install'), 'install']],
            installed: [[L('lib.remove'), 'remove']],
            update: [[L('lib.update'), 'install'], [L('lib.remove'), 'remove']],
            unlisted: [[L('lib.remove'), 'remove']],
          }[row.state];
          return h('li', { class: `library-item state-${row.state}`, dataset: { identify: row.identify } },
            h('div', { class: 'library-meta' },
              h('strong', {}, e ? `${e.shortname} · ${e.name}` : row.identify),
              h('span', { class: 'muted' }, e ? [e.year, e.publisher].filter(Boolean).join(' · ') : L('lib.unlisted')),
              row.state === 'update' ? h('span', { class: 'badge' }, `v${row.installedVersion} → v${e.version}`) : null,
              row.state === 'installed' ? h('span', { class: 'badge badge-ok' }, L('lib.offline')) : null),
            h('div', { class: 'library-actions' }, busy
              ? h('span', { class: 'muted' }, busy)
              : actions.map(([label, action]) => h('button', {
                class: action === 'remove' ? 'btn' : 'btn primary', onclick: () => act(row.identify, action),
              }, label))));
        }

        const offChange = library.on('change', render);
        const offProgress = library.on('progress', ({ detail }) => {
          const phase = { download: L('lib.downloading'), validate: L('lib.validating'), write: L('lib.saving') }[detail.phase];
          progress.set(detail.identify, detail.received ? `${phase} ${formatBytes(detail.received)}` : `${phase}…`);
          render();
        });
        render().catch((err) => shell.notify(err.message, 'error'));
        return () => { disposed = true; offChange(); offProgress(); };
      },
    });
  },
};
