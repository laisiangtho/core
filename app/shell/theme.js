/**
 * Theme and accent, carried over from Phase 1: the ramp swaps at :root, no
 * component rule is theme aware.
 *
 * The preference lives in settings (and therefore in an export); the resolved
 * theme is written to html[data-theme] so CSS alone does the rest.
 */

export const THEME_CYCLE = ['system', 'dark', 'light'];
export const THEME_ICON = { system: 'monitor', dark: 'moon', light: 'sun' };

export const ACCENTS = [
  { id: 'violet', value: '#7c3aed' },
  { id: 'blue', value: '#2563eb' },
  { id: 'cyan', value: '#0891b2' },
  { id: 'green', value: '#16a34a' },
  { id: 'amber', value: '#d97706' },
  { id: 'rose', value: '#e11d48' },
];

const media = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

export function resolveTheme(pref) {
  if (pref === 'dark' || pref === 'light') return pref;
  return media?.matches ? 'dark' : 'light';
}

export function applyTheme(pref) {
  document.documentElement.dataset.theme = resolveTheme(pref);
}

export function applyAccent(value) {
  const root = document.documentElement.style;
  if (!value) { root.removeProperty('--accent'); return; }
  root.setProperty('--accent', value);
  root.setProperty('--accent-1', mix(value, '#ffffff', 0.18));
  root.setProperty('--accent-2', mix(value, '#ffffff', 0.34));
  root.setProperty('--accent-fade', rgba(value, 0.14));
  root.setProperty('--accent-line', rgba(value, 0.42));
}

/** Follow the system while the preference is "system". */
export function watchSystemTheme(getPref) {
  media?.addEventListener('change', () => { if (getPref() === 'system') applyTheme('system'); });
}

function channels(hex) {
  const v = hex.replace('#', '');
  const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

function mix(hex, other, amount) {
  const a = channels(hex);
  const b = channels(other);
  return `#${a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, '0')).join('')}`;
}

function rgba(hex, alpha) {
  return `rgba(${channels(hex).join(',')},${alpha})`;
}
