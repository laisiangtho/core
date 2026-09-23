/**
 * Reading panel: text size, line height, line length and verse layout, applied
 * as CSS variables on the body and kept in settings.
 *
 * The panel is built once and only its values change, so choosing a layout
 * cannot move it under the pointer. It points at the control that opened it.
 */

import { READING } from '../core/settings.js';
import { h } from './dom.js';
import { L } from './i18n.js';

/**
 * The typography variables go on the root element, not on the body: the ramp
 * derives `--fs-text` from `--reading-size` at `:root`, and a custom property
 * is resolved where it is declared. Set on the body, the whole panel moved
 * numbers that the text never saw.
 */
export function applyReading({ readingSize, readingLeading, readingMeasure }) {
  const style = document.documentElement.style;
  style.setProperty('--reading-size', `${readingSize}px`);
  style.setProperty('--lh-text', String(readingLeading));
  style.setProperty('--measure-em', String(readingMeasure));
  document.body.dataset.measure = readingMeasure >= READING.measure.max ? 'full' : 'set';
}

export function createReadingPanel(ctx) {
  const rows = {
    size: numberRow('lbl.textSize', 'readingSize', READING.size, 'px', 0),
    leading: numberRow('lbl.lineHeight', 'readingLeading', READING.leading, '', 2),
    measure: numberRow('lbl.lineLength', 'readingMeasure', READING.measure, 'ch', 0),
  };
  const segment = h('div', { class: 'rp-seg' });
  const reset = h('button', { class: 'rp-reset', onclick: () => { resetAll(); paint(); } }, L('cmd.reset'));
  const panel = h('div', { class: 'popover rpanel has-arrow', hidden: true },
    rows.size.element, rows.leading.element, rows.measure.element,
    h('div', { class: 'rp-row' }, h('span', { class: 'rp-l' }, L('cmd.layout')), segment),
    h('div', { class: 'rp-foot' }, h('span', {}, L('lbl.readingHint')), reset));

  let anchor = null;

  document.addEventListener('pointerdown', (e) => {
    if (panel.hidden || panel.contains(e.target) || anchor?.contains(e.target)) return;
    close();
  });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', () => { if (!panel.hidden && anchor) place(anchor); });

  /**
   * A slider with a stepper and a readout, as Phase 1 had: drag for a sweep,
   * arrows for one step, and the number always visible.
   */
  function numberRow(labelKey, key, spec, unit, decimals) {
    const readout = h('input', {
      type: 'number', min: spec.min, max: spec.max, step: spec.step,
      'aria-label': L(labelKey),
      onchange: (e) => set(key, Number(e.target.value), spec),
    });
    const slider = h('input', {
      type: 'range', min: spec.min, max: spec.max, step: spec.step, 'aria-label': L(labelKey),
      oninput: (e) => set(key, Number(e.target.value), spec),
    });
    // The sprite has no minus glyph, so the steppers are set in type; the
    // letter sizes double as the hint for what they change.
    const stepper = (delta) => h('button', {
      class: `rp-step rp-a${delta > 0 ? '' : ' small'}`, 'aria-label': `${L(labelKey)} ${delta > 0 ? '+' : '−'}`,
      onclick: () => set(key, ctx.state.get()[key] + delta * spec.step, spec),
    }, delta > 0 ? 'A' : 'a');

    const element = h('div', { class: 'rp-row' },
      h('span', { class: 'rp-l' }, L(labelKey)),
      h('div', { class: 'rp-ctl' },
        stepper(-1), slider, stepper(1),
        h('span', { class: 'rp-num' }, readout, h('i', {}, unit))));

    return {
      element,
      update(value) {
        slider.value = String(value);
        readout.value = decimals ? value.toFixed(decimals) : String(Math.round(value));
      },
    };
  }

  function set(key, value, spec) {
    const next = Math.min(Math.max(Number(value.toFixed(3)), spec.min), spec.max);
    ctx.state.set({ [key]: next });
    paint();
  }

  function resetAll() {
    ctx.state.set({
      readingSize: READING.size.default,
      readingLeading: READING.leading.default,
      readingMeasure: READING.measure.default,
    });
  }

  /** Values only — never geometry, or the panel would jump under the pointer. */
  function paint() {
    const s = ctx.state.get();
    rows.size.update(s.readingSize);
    rows.leading.update(s.readingLeading);
    rows.measure.update(s.readingMeasure);
    segment.replaceChildren(...ctx.shell.workspace.layouts.map((id) => h('button', {
      'aria-pressed': String(id === s.layout),
      onclick: () => { ctx.state.set({ layout: id }); paint(); },
    }, L(`val.${id}`))));
  }

  function place(from) {
    const rect = from.getBoundingClientRect();
    const width = panel.offsetWidth;
    const above = rect.top > panel.offsetHeight + 20;
    const left = Math.min(Math.max(rect.left + rect.width / 2 - width / 2, 10), window.innerWidth - width - 10);
    panel.classList.toggle('is-above', above);
    panel.style.left = `${left}px`;
    panel.style.top = `${above ? rect.top - panel.offsetHeight - 10 : rect.bottom + 10}px`;
    panel.style.setProperty('--arrow-x', `${Math.min(Math.max(rect.left + rect.width / 2 - left, 16), width - 16)}px`);
  }

  function open(from) {
    anchor = from;
    paint();
    panel.hidden = false;
    place(from);
  }

  function close() { panel.hidden = true; }

  return { element: panel, open, close, paint, toggle: (from) => (panel.hidden ? open(from) : close()) };
}
