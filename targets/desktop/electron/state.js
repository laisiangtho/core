/**
 * Where the window was, and how big.
 *
 * Kept in the application's own data directory as one small JSON file rather
 * than in the app's storage: it belongs to this installation on this machine,
 * not to the reader's library, and it has to be available before the window —
 * and therefore before the renderer — exists.
 *
 * Nothing here is essential, so every failure is swallowed: an unreadable or
 * absent file means a window of the default size, which is exactly what the
 * first run gets anyway.
 */
import { app, screen } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const FILE = () => join(app.getPath('userData'), 'window.json');
const DEFAULTS = { width: 1280, height: 820 };
const SAVE_DELAY = 400;

/** @returns {{ width: number, height: number, x?: number, y?: number, maximised?: boolean }} */
export function loadWindowState() {
  let held;
  try {
    held = JSON.parse(readFileSync(FILE(), 'utf8'));
  } catch {
    return { ...DEFAULTS };
  }
  const width = int(held.width, DEFAULTS.width);
  const height = int(held.height, DEFAULTS.height);
  const state = { width, height, maximised: held.maximised === true };
  // A display that was there last time may not be now: a window restored onto
  // a screen that no longer exists opens where nobody can reach it.
  if (Number.isInteger(held.x) && Number.isInteger(held.y) && onSomeScreen(held.x, held.y, width, height)) {
    state.x = held.x;
    state.y = held.y;
  }
  return state;
}

/** Record the window's shape as it changes, without writing on every pixel. */
export function watchWindowState(win) {
  let timer = null;
  const save = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      // A maximised or minimised window reports the screen's size, not the one
      // to go back to, so the last normal bounds are what is kept.
      if (win.isDestroyed()) return;
      const bounds = win.isMaximized() || win.isMinimized() ? win.getNormalBounds() : win.getBounds();
      write({ ...bounds, maximised: win.isMaximized() });
    }, SAVE_DELAY);
  };
  for (const event of ['resize', 'move', 'maximize', 'unmaximize']) win.on(event, save);
  win.once('close', () => { clearTimeout(timer); });
}

function write(state) {
  try {
    mkdirSync(dirname(FILE()), { recursive: true });
    writeFileSync(FILE(), JSON.stringify(state), 'utf8');
  } catch {
    /* a window that does not remember its size is not worth an error */
  }
}

function int(value, fallback) {
  return Number.isInteger(value) && value > 200 ? value : fallback;
}

function onSomeScreen(x, y, width, height) {
  return screen.getAllDisplays().some(({ workArea: a }) => (
    x + width > a.x && x < a.x + a.width && y + height > a.y && y < a.y + a.height));
}
