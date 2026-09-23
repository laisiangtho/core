/**
 * Relative times in the reader's own language, from Intl rather than strings of
 * this app's own. Where Intl has no relative formatter, the date itself is
 * shown, which is never wrong — only less friendly.
 */

let formatter = null;
try {
  formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto', style: 'short' });
} catch {
  formatter = null;
}

/**
 * @param {string|number|Date|null} when ISO date, epoch millis, or Date
 * @param {number} [now] epoch millis to measure from
 * @returns {string} "3 min. ago", "yesterday", or a date for anything older
 */
export function relativeTime(when, now = Date.now()) {
  if (!when) return '—';
  const at = when instanceof Date ? when.getTime() : typeof when === 'number' ? when : Date.parse(when);
  if (Number.isNaN(at)) return '—';
  const seconds = Math.round((at - now) / 1000);
  if (!formatter) return new Date(at).toLocaleString();
  if (Math.abs(seconds) < 45) return formatter.format(0, 'second');
  if (Math.abs(seconds) < 3600) return formatter.format(Math.round(seconds / 60), 'minute');
  if (Math.abs(seconds) < 86400) return formatter.format(Math.round(seconds / 3600), 'hour');
  if (Math.abs(seconds) < 604800) return formatter.format(Math.round(seconds / 86400), 'day');
  return new Date(at).toLocaleDateString();
}
