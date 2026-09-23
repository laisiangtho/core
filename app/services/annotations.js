/**
 * Notes and bookmarks, held in memory and written through to IndexedDB.
 *
 * The set is small (hundreds of records), so it is loaded once at startup and
 * kept in maps: the reading surface asks "does this verse carry anything?" for
 * every verse it draws, and that has to be free.
 */

import { comparePassage, newNoteId, parseBookmark, parseNote, passageId } from '../core/annotations.js';

export async function createAnnotations({ store, category }) {
  const notes = new Map();
  const marks = new Map();
  const events = new EventTarget();

  const loaded = await store.annotations();
  for (const raw of loaded.notes) {
    const note = parseNote(raw, { source: 'stored note', category });
    notes.set(note.id, note);
  }
  for (const raw of loaded.marks) {
    const mark = parseBookmark(raw, { source: 'stored bookmark', category });
    marks.set(mark.id, mark);
  }

  const emit = () => events.dispatchEvent(new CustomEvent('change'));

  return {
    /** Everything for one chapter, in canonical order. */
    forChapter(book, chapter) {
      const here = (list) => list.filter((a) => a.book === book && a.chapter === chapter).sort(comparePassage);
      return { notes: here([...notes.values()]), marks: here([...marks.values()]) };
    },
    /** Quick lookups while a chapter is drawn. */
    chapterIndex(book, chapter) {
      const index = { notes: new Map(), marks: new Map() };
      for (const note of notes.values()) {
        if (note.book !== book || note.chapter !== chapter) continue;
        const key = note.verse ?? 0;
        index.notes.set(key, (index.notes.get(key) ?? 0) + 1);
      }
      for (const mark of marks.values()) {
        if (mark.book === book && mark.chapter === chapter) index.marks.set(mark.verse, mark);
      }
      return index;
    },
    allNotes: () => [...notes.values()].sort(comparePassage),
    allMarks: () => [...marks.values()].sort(comparePassage),
    getNote: (id) => notes.get(id),
    isMarked: (book, chapter, verse) => marks.has(passageId(book, chapter, verse)),

    async saveNote({ id, book, chapter, verse = null, text }) {
      const existing = id ? notes.get(id) : null;
      const note = parseNote({
        id: id ?? newNoteId(),
        book, chapter, verse, text,
        created: existing?.created,
        updated: new Date().toISOString(),
      }, { source: 'note', category });
      notes.set(note.id, note);
      await store.putAnnotation('notes', note);
      emit();
      return note;
    },

    async deleteNote(id) {
      if (!notes.delete(id)) return;
      await store.deleteAnnotation('notes', id);
      emit();
    },

    /** @returns {boolean} whether the verse is bookmarked afterwards */
    async toggleMark(book, chapter, verse, colour = null) {
      const id = passageId(book, chapter, verse);
      if (marks.has(id)) {
        marks.delete(id);
        await store.deleteAnnotation('marks', id);
        emit();
        return false;
      }
      const mark = parseBookmark({ book, chapter, verse, colour }, { source: 'bookmark', category });
      marks.set(mark.id, mark);
      await store.putAnnotation('marks', mark);
      emit();
      return true;
    },

    /**
     * Replace every note of one chapter — what source mode saves. Notes that
     * vanished from the text are deleted, the rest are written as given.
     */
    async replaceChapterNotes(book, chapter, incoming) {
      const existing = [...notes.values()].filter((n) => n.book === book && n.chapter === chapter);
      for (const note of existing) {
        notes.delete(note.id);
        await store.deleteAnnotation('notes', note.id);
      }
      for (const { verse, text } of incoming) {
        if (!text.trim()) continue;
        const keep = existing.find((n) => n.verse === (verse ?? null));
        const note = parseNote({
          id: keep?.id ?? newNoteId(), book, chapter, verse: verse ?? null, text,
          created: keep?.created, updated: new Date().toISOString(),
        }, { source: 'source mode', category });
        notes.set(note.id, note);
        await store.putAnnotation('notes', note);
      }
      emit();
    },

    /** For the settings export. */
    toJSON: () => ({ notes: [...notes.values()], marks: [...marks.values()] }),

    /** Import: records replace those with the same id, nothing is dropped. */
    async merge({ notes: incomingNotes = [], marks: incomingMarks = [] }) {
      const checkedNotes = incomingNotes.map((raw) => parseNote(raw, { source: 'imported note', category }));
      const checkedMarks = incomingMarks.map((raw) => parseBookmark(raw, { source: 'imported bookmark', category }));
      for (const note of checkedNotes) notes.set(note.id, note);
      for (const mark of checkedMarks) marks.set(mark.id, mark);
      await store.mergeAnnotations({ notes: checkedNotes, marks: checkedMarks });
      emit();
      return { notes: checkedNotes.length, marks: checkedMarks.length };
    },

    on: (type, fn) => { events.addEventListener(type, fn); return () => events.removeEventListener(type, fn); },
  };
}
