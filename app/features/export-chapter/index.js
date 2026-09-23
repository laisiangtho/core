/**
 * Export the current chapter as plain text through the platform's save dialog.
 *
 * Requires the `saveFile` capability. A target whose platform does not provide
 * it simply does not list this feature; boot() refuses to start if it does.
 */

import { verseLabel } from '../../core/align.js';
import { L } from '../../shell/i18n.js';

export default {
  id: 'export-chapter',
  requires: ['saveFile'],
  setup(ctx) {
    const { registry, state, store, shell, platform } = ctx;

    registry.command({
      id: 'export.chapter',
      icon: 'download',
      title: L('cmd.export'),
      needsChapter: true,
      async run() {
        const { translation, book, chapter } = state.get();
        if (!translation) { shell.notify(L('msg.noTranslations'), 'error'); return; }
        const meta = await store.getMeta(translation);
        const verses = await store.getChapter(translation, book, chapter);
        if (!verses) { shell.notify(L('ch.noText', { tr: meta.info.shortname }), 'error'); return; }

        const name = meta.books[book]?.name ?? ctx.category.book(book).name;
        const lines = [`${name} ${chapter} — ${meta.info.name}`, ''];
        for (const key of Object.keys(verses).map(Number).sort((a, b) => a - b)) {
          const v = verses[key];
          if (v.title) lines.push('', v.title);
          lines.push(`${verseLabel(key, v)} ${v.text}`);
        }

        try {
          const result = await platform.capabilities.saveFile({
            defaultName: `${translation}-${ctx.category.book(book).shortname}-${chapter}.txt`,
            content: lines.join('\n') + '\n',
          });
          shell.notify(result.saved ? `Saved ${result.path}` : 'Export cancelled');
        } catch (err) {
          shell.notify(`Export failed: ${err.message}`, 'error');
        }
      },
    });
  },
};
