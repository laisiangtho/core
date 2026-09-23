/**
 * Loads app-owned alias overlays (app/core/aliases/{identify}.json) on demand.
 * Each overlay is a separate chunk; translations without an overlay get {}.
 * Maintained with scripts/aliases.mjs.
 */

import { parseAliases } from '../core/reference.js';

const overlays = import.meta.glob('../core/aliases/*.json', { import: 'default' });

export async function loadAliases(identify, category) {
  const key = `../core/aliases/${identify}.json`;
  const load = overlays[key];
  if (!load) return {};
  return parseAliases(await load(), { source: `aliases/${identify}.json`, category });
}
