/**
 * Reading aloud, through the device's own voices.
 *
 * Nothing is assumed: the command is offered whatever happens, but says plainly
 * why it cannot read — no speech engine, no language on the translation, or no
 * installed voice for that language. A voice is matched on the primary language
 * subtag, so "ar" serves ar-SA and ar-EG.
 *
 * One controller owns the state, so every entry point — ribbon, verse bar,
 * command palette — drives the same playback.
 */

import { L } from '../../shell/i18n.js';

const KEY = 'voices';
const RATE = 0.95;

export default {
  id: 'speech',
  setup(ctx) {
    const { records, registry, shell, state, store } = ctx;

    const speech = { mode: 'idle', book: null, chapter: null, verses: null, numbers: [], at: 0 };
    let voices = [];

    const available = () => typeof window !== 'undefined' && 'speechSynthesis' in window;
    const baseLang = (code) => String(code ?? '').toLowerCase().replace('_', '-').split('-')[0];

    function loadVoices() {
      try {
        voices = available() ? (window.speechSynthesis.getVoices() ?? []) : [];
      } catch {
        voices = [];
      }
    }

    async function language() {
      const { translation } = state.get();
      if (!translation) return '';
      const meta = await store.getMeta(translation);
      return meta.info.language.name ?? '';
    }

    const voicesFor = (lang) => (baseLang(lang) ? voices.filter((v) => baseLang(v.lang) === baseLang(lang)) : []);

    function voiceFor(lang) {
      const list = voicesFor(lang);
      if (!list.length) return null;
      const chosen = (records.get(KEY, null) ?? {})[baseLang(lang)];
      return list.find((v) => v.voiceURI === chosen) ?? list.find((v) => v.default) ?? list.find((v) => v.localService) ?? list[0];
    }

    /** Why reading aloud is unavailable, in words; empty when it is available. */
    async function blocker() {
      if (!available()) return L('err.noSpeech');
      const lang = await language();
      if (!lang) return L('hint.noLang');
      if (!voiceFor(lang)) return L('hint.noVoice', { lang });
      return '';
    }

    function markSpoken(verse) {
      for (const node of document.querySelectorAll('.verse.is-hit')) node.classList.remove('is-hit');
      if (verse === null) return;
      const leaf = document.querySelector('.leaf[data-role="primary"] .leaf-scroll');
      const node = leaf?.querySelector(`.vblock[data-verse="${verse}"]`);
      if (!node) return;
      node.classList.add('is-hit');
      try {
        node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        // Scrolling must never break the chain of utterances that calls this.
      }
    }

    async function speakFrom(book, chapter, verse) {
      const why = await blocker();
      if (why) { shell.notify(why, 'error'); return; }
      const { translation } = state.get();
      const verses = await store.getChapter(translation, book, chapter);
      if (!verses) { shell.notify(L('ch.noText', { tr: shell.workspace.primaryName() }), 'error'); return; }

      const numbers = Object.keys(verses).map(Number).sort((a, b) => a - b);
      const index = verse ? numbers.indexOf(verse) : 0;
      window.speechSynthesis.cancel();
      Object.assign(speech, { mode: 'playing', book, chapter, verses, numbers, at: index < 0 ? 0 : index, lang: await language() });
      speakCurrent();
    }

    function speakCurrent() {
      if (speech.mode !== 'playing') return;
      if (speech.at >= speech.numbers.length) { stop(); shell.notify(L('msg.ended')); return; }
      const number = speech.numbers[speech.at];
      markSpoken(number);

      const utterance = new SpeechSynthesisUtterance(speech.verses[number].text);
      utterance.rate = RATE;
      utterance.lang = speech.lang ?? '';
      const voice = voiceFor(speech.lang);
      // The language alone lets the engine choose; the voice refines it when accepted.
      if (voice) {
        try { utterance.voice = voice; } catch { /* rejected: the language default stands */ }
      }
      utterance.onend = () => {
        if (speech.mode !== 'playing') return;
        speech.at++;
        speakCurrent();
      };
      utterance.onerror = () => { stop(); shell.notify(L('err.speech'), 'error'); };
      window.speechSynthesis.speak(utterance);
    }

    function stop() {
      Object.assign(speech, { mode: 'idle', book: null, chapter: null, verses: null, numbers: [], at: 0 });
      if (available()) window.speechSynthesis.cancel();
      markSpoken(null);
    }

    async function toggle() {
      if (speech.mode === 'playing') { speech.mode = 'paused'; window.speechSynthesis.pause(); return; }
      if (speech.mode === 'paused') { speech.mode = 'playing'; window.speechSynthesis.resume(); return; }
      const { book, chapter } = state.get();
      await speakFrom(book, chapter, null);
    }

    async function pickVoice() {
      const lang = await language();
      const list = voicesFor(lang);
      if (!list.length) { shell.notify(await blocker() || L('err.noSpeech'), 'error'); return; }
      const current = voiceFor(lang);
      shell.pick({
        placeholder: L('cmd.voice'),
        items: list.map((v) => ({
          title: v.name,
          sub: `${v.lang}${v.localService ? '' : ` · ${L('val.online')}`}`,
          icon: v === current ? 'check' : 'audio',
          voice: v,
        })),
        onPick: async (item) => {
          await records.save(KEY, { ...(records.get(KEY, null) ?? {}), [baseLang(lang)]: item.voice.voiceURI });
          shell.notify(L('msg.state', { what: L('cmd.voice'), value: item.voice.name }));
        },
      });
    }

    registry.command({ id: 'speech.toggle', title: L('cmd.read'), icon: 'audio', ribbon: true, needsChapter: true, run: () => toggle().catch((err) => shell.notify(err.message, 'error')) });
    registry.command({ id: 'speech.stop', title: L('cmd.stopReading'), icon: 'stop', run: stop });
    registry.command({ id: 'speech.voice', title: L('cmd.voice'), icon: 'audio', run: () => pickVoice().catch((err) => shell.notify(err.message, 'error')) });

    registry.verseAction({
      id: 'speech.fromVerse',
      title: L('cmd.readFrom'),
      icon: 'audio',
      run: (p) => speakFrom(p.book, p.chapter, p.verse).catch((err) => shell.notify(err.message, 'error')),
    });

    if (available()) {
      loadVoices();
      // Voices arrive asynchronously and differ per device and browser.
      const refresh = () => loadVoices();
      try {
        window.speechSynthesis.addEventListener('voiceschanged', refresh);
      } catch {
        window.speechSynthesis.onvoiceschanged = refresh;
      }
    }

    // Reading stops when the passage under it changes.
    state.subscribe((value) => {
      if (speech.mode === 'idle') return;
      if (value.book !== speech.book || value.chapter !== speech.chapter) stop();
    });

    // Leaving the page mid-utterance would otherwise keep the engine talking.
    window.addEventListener('pagehide', () => { if (speech.mode !== 'idle') stop(); });
  },
};
