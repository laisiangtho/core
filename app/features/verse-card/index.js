/**
 * Verse cards: one verse drawn as an image to keep or share.
 *
 * The card follows the text rather than the interface — its script's fonts, its
 * direction, and its own word breaks, since Burmese does not put spaces between
 * words. Colours come from the running theme, so a card made in the light theme
 * is light.
 */

import { h } from '../../shell/dom.js';
import { L } from '../../shell/i18n.js';

const SIZE = Object.freeze({ width: 1080, height: 1350, margin: 96 });

/** Faces that carry each script, ahead of the reading face's fallbacks. */
const SCRIPT_FONTS = Object.freeze({
  my: '"Myanmar Text", Georgia, serif',
  ar: '"Noto Naskh Arabic", "Amiri", "Geeza Pro", "Traditional Arabic", serif',
});

export default {
  id: 'verse-card',
  setup(ctx) {
    const { registry, shell, state, store } = ctx;

    const baseLang = (code) => String(code ?? '').toLowerCase().replace('_', '-').split('-')[0];
    const scriptFont = (lang) => SCRIPT_FONTS[baseLang(lang)] ?? 'Georgia, "Times New Roman", serif';
    const tone = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

    /** Word breaks the language's own way, with a plain split where Intl has none. */
    function segments(text, lang) {
      try {
        return [...new Intl.Segmenter(lang || undefined, { granularity: 'word' }).segment(text)].map((s) => s.segment);
      } catch {
        return text.split(/(\s+)/);
      }
    }

    async function draw(book, chapter, verse) {
      const { translation } = state.get();
      if (!translation) { shell.notify(L('msg.noTranslations'), 'error'); return; }
      const meta = await store.getMeta(translation);
      const verses = await store.getChapter(translation, book, chapter);
      const text = verses?.[verse]?.text;
      if (!text) { shell.notify(L('ch.noVerse', { ref: `${shell.workspace.bookName(book)} ${chapter}:${verse}` }), 'error'); return; }

      const { width, height, margin } = SIZE;
      const canvas = h('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) { shell.notify(L('err.noCanvas', { what: L('cmd.verseCard') }), 'error'); return; }

      const gradient = context.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, tone('--export-from'));
      gradient.addColorStop(1, tone('--export-to'));
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
      context.strokeStyle = tone('--accent-line');
      context.lineWidth = 2;
      context.strokeRect(48, 48, width - 96, height - 96);

      const lang = meta.info.language.name;
      const rtl = meta.info.language.textdirection === 'rtl';
      const edge = rtl ? width - margin : margin;
      context.direction = rtl ? 'rtl' : 'ltr';
      context.textAlign = rtl ? 'right' : 'left';
      context.fillStyle = tone('--accent');
      context.fillRect(rtl ? width - margin - 70 : margin, 150, 70, 4);

      context.fillStyle = tone('--text-normal');
      const size = text.length > 240 ? 38 : text.length > 140 ? 46 : 54;
      context.font = `${size}px ${scriptFont(lang)}`;
      const measure = width - margin * 2;
      const lines = [];
      let line = '';
      for (const part of segments(text, lang)) {
        const next = line + part;
        if (context.measureText(next.trim()).width > measure && line.trim()) { lines.push(line.trim()); line = part.trimStart(); } else line = next;
      }
      if (line.trim()) lines.push(line.trim());

      const leading = size * (baseLang(lang) === 'my' ? 1.9 : 1.5);
      let y = Math.max(260, (height - lines.length * leading) / 2 - 40);
      for (const each of lines) { context.fillText(each, edge, y); y += leading; }

      context.fillStyle = tone('--accent-2');
      context.font = '600 30px Inter, system-ui, sans-serif';
      context.fillText(`${shell.workspace.bookName(book)} ${chapter}:${verse}`, edge, y + 50);
      context.fillStyle = tone('--text-faint');
      context.font = '24px Inter, system-ui, sans-serif';
      context.fillText(`${meta.info.shortname} · ${L('app.name')}`, edge, y + 90);

      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) { shell.notify(L('err.card'), 'error'); return; }
      const name = `${shell.workspace.bookName(book).replace(/\s+/g, '-')}-${chapter}-${verse}-${meta.identify}.png`;
      const url = URL.createObjectURL(blob);
      const link = h('a', { href: url, download: name });
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      shell.notify(L('msg.saved', { name }));
    }

    registry.verseAction({
      id: 'card.verse',
      title: L('cmd.card'),
      icon: 'card',
      run: (p) => draw(p.book, p.chapter, p.verse).catch((err) => shell.notify(err.message, 'error')),
    });

    registry.command({
      id: 'card.first',
      title: L('cmd.verseCard'),
      icon: 'card',
      needsChapter: true,
      run: () => {
        const { book, chapter } = state.get();
        return draw(book, chapter, 1).catch((err) => shell.notify(err.message, 'error'));
      },
    });
  },
};
