/**
 * Application entry shared by every target.
 *
 * A target composes its build and calls start():
 *   start({ root, createPlatform, features: [library, settings, ...], config: {...} })
 *
 * Shared code never asks which target it runs in; everything that varies
 * arrives here as the platform, the feature list, the config, or the target's
 * theme stylesheet.
 *
 * Reading — tabs, panes, the chapter surface — is the shell itself. Features
 * add documents (Library, Settings), sidebar panes and commands around it.
 */

import { resolveConfig } from './config.js';
import { parseCategory } from './core/category.js';
import { defaultSettings } from './core/settings.js';
import { checkFeatures, createRegistry, createState } from './registry.js';
import { loadAliases } from './services/aliases.js';
import { createAnnotations } from './services/annotations.js';
import { createLibrary, fetchJson } from './services/library.js';
import { createRecords } from './services/records.js';
import { createSearch } from './services/search.js';
import { createSettings } from './services/settings.js';
import { openStore } from './services/store.js';
import { createShell } from './shell/shell.js';
import { h } from './shell/dom.js';

import './styles/shell.css';
import './styles/views.css';

export async function start({ root, createPlatform, features, config }) {
  try {
    if (!(root instanceof HTMLElement)) throw new Error('boot: root element not found');
    const platform = createPlatform();
    await boot({ root, platform, features, config });
  } catch (err) {
    renderFatal(root, err);
    throw err;
  }
}

async function boot({ root, platform, features, config: overrides }) {
  const config = resolveConfig(overrides);
  checkFeatures(features, platform);

  const categoryRaw = await fetchJson(config.categoryUrl, 'category.json');
  const category = parseCategory(categoryRaw);
  const store = await openStore();
  const library = createLibrary({ store, categoryRaw, config });
  await library.load();

  const settings = await createSettings({ store, category });
  const annotations = await createAnnotations({ store, category });
  const records = await createRecords({ store });
  const registry = createRegistry();
  // Persisted settings seed the session; later changes flow back into them.
  const state = createState({ ...settings.get() });
  const aliasCache = new Map();

  // The shell needs the context, and features reach the shell through it, so
  // the object is built first and the shell added before anything runs.
  const ctx = {
    platform,
    config,
    category,
    store,
    library,
    settings,
    annotations,
    records,
    search: createSearch(),
    state,
    registry,
    /** Alias overlay for a translation (cached). */
    aliases(identify) {
      if (!aliasCache.has(identify)) aliasCache.set(identify, loadAliases(identify, category));
      return aliasCache.get(identify);
    },
  };
  ctx.shell = createShell(root, ctx);
  Object.freeze(ctx);

  for (const feature of features) feature.setup(ctx);

  settings.onError((err) => ctx.shell.notify(`Settings not saved: ${err.message}`, 'error'));
  // Only the persisted subset travels back into settings; the shell may keep
  // other state (selections, filters) that is not worth remembering.
  const persisted = Object.keys(defaultSettings);
  state.subscribe((value) => {
    try {
      settings.set(Object.fromEntries(persisted.map((k) => [k, value[k]])));
    } catch (err) {
      ctx.shell.notify(`Settings not saved: ${err.message}`, 'error');
    }
  });

  ctx.shell.start();
  for (const note of settings.notes) ctx.shell.notify(note);

  library.checkForUpdates().then(
    ({ changed }) => { if (changed) ctx.shell.notify('Catalog updated'); },
    (err) => ctx.shell.notify(`Catalog check failed: ${err.message}`, 'error'),
  );
}

function renderFatal(root, err) {
  const target = root instanceof HTMLElement ? root : document.body;
  target.replaceChildren(h('div', { class: 'fatal', role: 'alert' },
    h('h1', {}, 'Lai Siangtho could not start'),
    h('pre', {}, err?.message ?? String(err))));
}
