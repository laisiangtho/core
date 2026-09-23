/**
 * Detached windows: a tab pulled out of the strip into a floating frame over
 * the workspace. The frame holds the same leaf the workspace builds, so there
 * is one renderer for reading, docked or floating.
 *
 * In-app rather than a second OS window: the web build has no second window,
 * and a shared renderer keeps the two from drifting apart.
 */

import { h } from './dom.js';
import { icon } from './icons.js';
import { L } from './i18n.js';

const MIN = { width: 340, height: 220 };
const KEY = 'floats';

export function createFloats(ctx, { render, dockTarget }) {
  // The size and position a detached window was last left at. A reader who
  // sizes a window once should not have to size the next one, or the same one
  // after a reload.
  const remembered = () => {
    const held = ctx.records?.get(KEY, null);
    return held && typeof held === 'object' ? held : null;
  };
  const remember = (rect) => ctx.records?.save(KEY, {
    width: Math.round(rect.width), height: Math.round(rect.height),
    x: Math.round(rect.x), y: Math.round(rect.y),
  }).catch(() => { /* geometry is a convenience; a failed write is not worth a toast */ });
  const hint = h('div', { class: 'win-hint tab', hidden: true });
  const preview = h('div', { class: 'win-hint', hidden: true });
  document.body.append(hint, preview);
  const floats = new Map(); // id -> { id, tab, element, body, rect, maximised }
  let seq = 1;
  let front = null;

  function open(tab, rect) {
    const id = `f${seq++}`;
    const box = rect ?? defaultRect(floats.size);
    remember(box);
    const body = h('div', { class: 'float-body' });
    const element = h('div', {
      class: 'float-win', dataset: { float: id },
      style: { left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` },
      onpointerdown: () => raise(id),
    },
      h('div', { class: 'float-bar' },
        h('span', { class: 'float-name' }, icon('book-open'), h('span', { class: 'fn-text' }, '')),
        h('button', { class: 'tb-btn', title: L('cmd.dock'), 'aria-label': L('cmd.dock'), onclick: () => dock(id) }, icon('enter')),
        h('button', { class: 'tb-btn', title: L('cmd.maximise'), 'aria-label': L('cmd.maximise'), onclick: () => toggleMax(id) }, icon('max')),
        h('button', { class: 'tb-btn', title: L('cmd.closeTab'), 'aria-label': L('cmd.closeTab'), onclick: () => close(id) }, icon('x'))),
      body,
      h('span', { class: 'float-size' }, `${box.width} × ${box.height}`),
      ...['e', 's', 'se'].map((dir) => h('div', { class: 'cw-resize', dataset: { dir } })));

    const float = { id, tab, element, body, rect: box, maximised: false };
    floats.set(id, float);
    document.body.append(element);
    wireDrag(float);
    wireResize(float);
    raise(id);
    render();
    return id;
  }

  function close(id) {
    const float = floats.get(id);
    float?.dispose?.();
    float?.element.remove();
    floats.delete(id);
    render();
  }

  /** Put the tab back in the workspace strip. */
  function dock(id) {
    const float = floats.get(id);
    if (!float) return;
    float.dispose?.();
    floats.delete(id);
    float.element.remove();
    ctx.shell.workspace.adopt(float.tab);
  }

  function raise(id) {
    front = id;
    for (const float of floats.values()) float.element.classList.toggle('is-front', float.id === id);
  }

  function toggleMax(id) {
    const float = floats.get(id);
    if (!float) return;
    float.maximised = !float.maximised;
    float.element.classList.toggle('is-max', float.maximised);
    const style = float.element.style;
    if (float.maximised) {
      Object.assign(style, { left: '12px', top: '12px', width: `${window.innerWidth - 24}px`, height: `${window.innerHeight - 24}px` });
    } else {
      Object.assign(style, { left: `${float.rect.x}px`, top: `${float.rect.y}px`, width: `${float.rect.width}px`, height: `${float.rect.height}px` });
    }
  }

  function wireDrag(float) {
    const bar = float.element.querySelector('.float-bar');
    bar.addEventListener('pointerdown', (e) => {
      if (e.target.closest('button') || float.maximised) return;
      e.preventDefault();
      const from = { pointerX: e.clientX, pointerY: e.clientY, x: float.rect.x, y: float.rect.y };
      bar.classList.add('is-dragging');
      document.body.classList.add('is-dragging-ui');

      let overStrip = false;
      const move = (ev) => {
        float.rect.x = clamp(from.x + ev.clientX - from.pointerX, 0, window.innerWidth - 80);
        float.rect.y = clamp(from.y + ev.clientY - from.pointerY, 0, window.innerHeight - 60);
        float.element.style.left = `${float.rect.x}px`;
        float.element.style.top = `${float.rect.y}px`;

        // Dragged back over the tab strip: show where it would land and dock on release.
        const strip = dockTarget?.();
        const box = strip?.getBoundingClientRect();
        overStrip = Boolean(box && ev.clientY < box.bottom + 12 && ev.clientX > box.left - 40 && ev.clientX < box.right + 40);
        hint.hidden = !overStrip;
        if (overStrip) {
          Object.assign(hint.style, {
            left: `${box.right - 170}px`, top: `${box.top}px`, width: '160px', height: `${box.height}px`,
          });
        }
      };
      const up = () => {
        bar.classList.remove('is-dragging');
        document.body.classList.remove('is-dragging-ui');
        hint.hidden = true;
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        if (overStrip) dock(float.id);
        else remember(float.rect);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  function wireResize(float) {
    for (const handle of float.element.querySelectorAll('.cw-resize')) {
      handle.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const dir = handle.dataset.dir;
        e.preventDefault();
        const start = { x: e.clientX, y: e.clientY, width: float.rect.width, height: float.rect.height };
        float.element.classList.add('is-sizing');
        const readout = float.element.querySelector('.float-size');
        const move = (ev) => {
          if (dir.includes('e')) float.rect.width = Math.max(MIN.width, start.width + ev.clientX - start.x);
          if (dir.includes('s')) float.rect.height = Math.max(MIN.height, start.height + ev.clientY - start.y);
          float.element.style.width = `${float.rect.width}px`;
          float.element.style.height = `${float.rect.height}px`;
          if (readout) readout.textContent = `${Math.round(float.rect.width)} × ${Math.round(float.rect.height)}`;
        };
        const up = () => {
          float.element.classList.remove('is-sizing');
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          window.removeEventListener('pointercancel', up);
          remember(float.rect);
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
        window.addEventListener('pointercancel', up);
      });
    }
  }

  /**
   * Where a new window opens: what the last one was left at, offset so a second
   * window does not hide the first, and clamped into the window as it is now.
   */
  function defaultRect(n) {
    const held = remembered();
    const width = clamp(held?.width ?? Math.min(720, Math.round(window.innerWidth * 0.55)), MIN.width, window.innerWidth - 24);
    const height = clamp(held?.height ?? Math.min(560, Math.round(window.innerHeight * 0.7)), MIN.height, window.innerHeight - 24);
    const offset = 28 * (n % 6);
    const x = clamp((held?.x ?? Math.round(window.innerWidth - width - 60)) + offset, 8, Math.max(8, window.innerWidth - width - 8));
    const y = clamp((held?.y ?? 80) + offset, 8, Math.max(8, window.innerHeight - height - 8));
    return { x, y, width, height };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  return {
    open,
    close,
    dock,
    /**
     * The preview a tab being pulled out of the strip follows: the same
     * measurement `open` will use, so what is shown cannot lie about what
     * detaching gives.
     */
    hint: {
      show(x, y) {
        const box = defaultRect(floats.size);
        preview.hidden = false;
        Object.assign(preview.style, {
          left: `${clamp(Math.round(x - box.width / 2), 8, Math.max(8, window.innerWidth - box.width - 8))}px`,
          top: `${clamp(Math.round(y - 18), 8, Math.max(8, window.innerHeight - box.height - 8))}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
        });
      },
      hide() { preview.hidden = true; },
    },
    list: () => [...floats.values()],
    get front() { return front; },
    setName(id, text) {
      const el = floats.get(id)?.element.querySelector('.fn-text');
      if (el) el.textContent = text;
    },
    bodyOf: (id) => floats.get(id)?.body,
  };
}
