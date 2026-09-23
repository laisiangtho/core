/**
 * Default configuration shared by every target. A target passes overrides to
 * boot(); keys not listed here are rejected so typos fail at startup.
 */

export const defaults = Object.freeze({
  /** Bundled skeleton, relative to the served index.html. */
  categoryUrl: './category.json',
  /** Bundled catalog seed (first run / offline first run). */
  bundledCatalogUrl: './book.json',
  /** Authoritative catalog. */
  catalogUrl: 'https://raw.githubusercontent.com/laisiangtho/bible/refs/heads/master/book.json',
  /** Translation file; {identify} is substituted. */
  translationUrl: 'https://raw.githubusercontent.com/laisiangtho/bible/refs/heads/master/json/{identify}.json',
  /** Minimum hours between automatic catalog checks; 0 disables automatic checks. */
  updateCheckHours: 24,
});

export function resolveConfig(overrides = {}) {
  for (const key of Object.keys(overrides)) {
    if (!(key in defaults)) throw new Error(`config: unknown key "${key}"`);
  }
  const config = { ...defaults, ...overrides };
  if (!config.translationUrl.includes('{identify}')) throw new Error('config: translationUrl must contain {identify}');
  if (!Number.isFinite(config.updateCheckHours) || config.updateCheckHours < 0) {
    throw new Error('config: updateCheckHours must be a non-negative number');
  }
  return Object.freeze(config);
}
