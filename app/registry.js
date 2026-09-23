/**
 * Feature registry. Pure (no DOM) so it can be tested under node:test.
 *
 * A feature contributes three kinds of thing to the shell:
 *   doc      a workspace tab (Library, Settings, …); chapters are built in
 *   pane     a sidebar pane (Books, Details, …)
 *   command  an entry in the command palette, optionally with a hotkey
 *
 *   export default {
 *     id: 'export-chapter',
 *     requires: ['saveFile'],   // platform capabilities, checked at boot
 *     setup(ctx) { ctx.registry.command({...}); },
 *   };
 */

/**
 * Fail at startup — before any feature runs — when a target lists a feature
 * its platform cannot support.
 */
export function checkFeatures(features, platform) {
  if (!Array.isArray(features) || features.length === 0) throw new Error('boot: features must be a non-empty array');
  if (!platform || typeof platform.id !== 'string' || typeof platform.capabilities !== 'object') {
    throw new Error('boot: platform must be { id, capabilities }');
  }
  const ids = new Set();
  for (const [i, f] of features.entries()) {
    if (!f || typeof f.id !== 'string' || typeof f.setup !== 'function') {
      throw new Error(`boot: features[${i}] is not a feature module (expected { id, setup })`);
    }
    if (ids.has(f.id)) throw new Error(`boot: feature "${f.id}" is listed twice`);
    ids.add(f.id);
    for (const cap of f.requires ?? []) {
      if (typeof platform.capabilities[cap] !== 'function') {
        throw new Error(`boot: feature "${f.id}" requires platform capability "${cap}", which platform "${platform.id}" does not provide`);
      }
    }
  }
}

const SIDES = new Set(['left', 'right']);

export function createRegistry() {
  const docs = new Map();
  const panes = new Map();
  const commands = new Map();
  const verseActions = new Map();

  return {
    /**
     * A workspace tab.
     * @param {{ id: string, title: string, icon?: string, mount(el: HTMLElement): (void | (() => void)) }} d
     */
    doc(d) {
      if (!d?.id || !d.title || typeof d.mount !== 'function') throw new Error('registry.doc: expected { id, title, mount }');
      if (docs.has(d.id)) throw new Error(`registry.doc: duplicate doc id "${d.id}"`);
      docs.set(d.id, Object.freeze({ icon: 'book', ...d }));
    },
    /**
     * A sidebar pane.
     * @param {{ id: string, side: 'left'|'right', title: string, icon?: string, order?: number,
     *           mount(el: HTMLElement): (void | (() => void)) }} p
     *        `order` sorts the strip (lower first); features register before the
     *        shell does, so without it the Books pane would land last.
     */
    pane(p) {
      if (!p?.id || !p.title || typeof p.mount !== 'function') throw new Error('registry.pane: expected { id, title, mount }');
      if (!SIDES.has(p.side)) throw new Error(`registry.pane: side must be left or right, got ${JSON.stringify(p.side)}`);
      if (panes.has(p.id)) throw new Error(`registry.pane: duplicate pane id "${p.id}"`);
      panes.set(p.id, Object.freeze({ icon: 'info', order: 100, ...p }));
    },
    /**
     * @param {{ id: string, title: string, run(): unknown, keys?: string, icon?: string,
     *           ribbon?: boolean, needsChapter?: boolean }} c
     *        `needsChapter` marks a command that only means something with a
     *        chapter open; the shell shows its button but does not let it be
     *        pressed while a document tab is active.
     */
    command(c) {
      if (!c?.id || !c.title || typeof c.run !== 'function') throw new Error('registry.command: expected { id, title, run }');
      if (commands.has(c.id)) throw new Error(`registry.command: duplicate command id "${c.id}"`);
      commands.set(c.id, Object.freeze({ ...c }));
    },
    /**
     * A button in the verse bar.
     * @param {{ id: string, title: string|((p: object) => string), icon: string|((p: object) => string),
     *           isOn?: (p: object) => boolean, run(p: {book:number,chapter:number,verse:number}): unknown }} a
     */
    verseAction(a) {
      if (!a?.id || !a.title || !a.icon || typeof a.run !== 'function') throw new Error('registry.verseAction: expected { id, title, icon, run }');
      if (verseActions.has(a.id)) throw new Error(`registry.verseAction: duplicate id "${a.id}"`);
      verseActions.set(a.id, Object.freeze({ ...a }));
    },
    verseActions: () => [...verseActions.values()],
    hasCommand: (id) => commands.has(id),
    docs: () => [...docs.values()],
    getDoc: (id) => docs.get(id),
    panes: (side) => [...panes.values()].filter((p) => !side || p.side === side).sort((a, b) => a.order - b.order),
    commands: () => [...commands.values()],
  };
}

/** Minimal observable state shared by the shell and features. */
export function createState(initial) {
  let value = Object.freeze({ ...initial });
  const subscribers = new Set();
  return {
    get: () => value,
    set(patch) {
      value = Object.freeze({ ...value, ...patch });
      for (const fn of subscribers) fn(value);
    },
    subscribe(fn) {
      subscribers.add(fn);
      return () => subscribers.delete(fn);
    },
  };
}
