/**
 * Notes: one per chapter plus any number per verse, kept against the passage
 * rather than a translation, so a note written in one shows up in all of them.
 */

import { h } from '../../shell/dom.js';
import { icon } from '../../shell/icons.js';
import { L } from '../../shell/i18n.js';

const SAVE_DELAY_MS = 600;

export default {
  id: 'notes',
  setup(ctx) {
    const { annotations, registry, shell, state } = ctx;

    registry.verseAction({
      id: 'notes.add',
      title: L('cmd.note'),
      icon: 'note',
      isOn: (p) => annotations.forChapter(p.book, p.chapter).notes.some((n) => n.verse === p.verse),
      run: (p) => {
        shell.selectPane('right', 'notes');
        state.set({ noteFor: p.verse });
      },
    });

    registry.command({
      id: 'notes.chapter',
      title: L('cmd.chapterNote'),
      icon: 'edit',
      run: () => { shell.selectPane('right', 'notes'); state.set({ noteFor: null }); },
    });

    registry.pane({
      id: 'notes',
      side: 'right',
      order: 10,
      icon: 'edit',
      title: L('pane.notes'),
      mount(el) {
        const editor = h('textarea', { class: 'note-editor', dir: 'auto', placeholder: L('ph.note') });
        const target = h('div', { class: 'note-target' });
        const list = h('div', { class: 'stack' });
        el.append(h('div', { class: 'notes-pane stack' }, target, editor, list));

        let editing = null; // the note being edited, or null for a new one
        let timer = null;
        let lastKey = '';

        function passage() {
          const { book, chapter, noteFor = null } = state.get();
          return { book, chapter, verse: noteFor };
        }

        function label(p) {
          const book = shell.workspace.bookName(p.book);
          return p.verse === null ? `${book} ${p.chapter}` : `${book} ${p.chapter}:${p.verse}`;
        }

        async function save() {
          const p = passage();
          const text = editor.value.trim();
          if (!text) {
            if (editing) await annotations.deleteNote(editing.id);
            editing = null;
            return;
          }
          editing = await annotations.saveNote({ id: editing?.id, ...p, text });
        }

        function paint() {
          const p = passage();
          const key = `${p.book}.${p.chapter}.${p.verse}`;
          const { notes } = annotations.forChapter(p.book, p.chapter);
          const mine = notes.find((n) => n.verse === p.verse && (!editing || n.id === editing.id));

          target.replaceChildren(
            h('span', { class: 'plan-label' }, L('lbl.noteFor')),
            h('div', { class: 'note-target-row' },
              h('strong', {}, label(p)),
              p.verse !== null
                ? h('button', { class: 'btn', onclick: () => state.set({ noteFor: null }) }, L('cmd.chapterNote'))
                : null));

          // Only reset the text when the target changed; typing must survive repaints.
          if (key !== lastKey) {
            editing = mine ?? null;
            editor.value = mine?.text ?? '';
            lastKey = key;
          }

          list.replaceChildren(...notes.filter((n) => n.id !== editing?.id).map((note) => h('div', { class: 'card' },
            h('h4', {}, note.verse === null ? L('lbl.chapterNote') : `${L('lbl.verse')} ${note.verse}`),
            h('p', { class: 'note-text' }, note.text),
            h('div', { class: 'note-actions' },
              h('button', { class: 'btn', onclick: () => { state.set({ noteFor: note.verse }); } }, L('cmd.edit')),
              h('button', { class: 'btn', onclick: () => annotations.deleteNote(note.id) }, L('cmd.delete'))))));
        }

        editor.addEventListener('input', () => {
          clearTimeout(timer);
          timer = setTimeout(() => save().catch((err) => shell.notify(err.message, 'error')), SAVE_DELAY_MS);
        });
        editor.addEventListener('blur', () => { clearTimeout(timer); save().catch((err) => shell.notify(err.message, 'error')); });

        const offState = state.subscribe(paint);
        const offNotes = annotations.on('change', paint);
        paint();
        return () => { clearTimeout(timer); offState(); offNotes(); };
      },
    });
  },
};
