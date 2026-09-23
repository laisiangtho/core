import assert from 'node:assert/strict';
import { test } from 'node:test';

import { checkFeatures, createRegistry } from '../app/registry.js';

const web = { id: 'web', capabilities: { openExternal() {} } };
const feature = (id, requires) => ({ id, requires, setup() {} });

test('boot refuses a feature whose capability the platform lacks', () => {
  assert.throws(() => checkFeatures([feature('export-chapter', ['saveFile'])], web),
    /feature "export-chapter" requires platform capability "saveFile", which platform "web" does not provide/);
  assert.doesNotThrow(() => checkFeatures([feature('reader')], web));
});

test('duplicate features, views and commands are rejected', () => {
  assert.throws(() => checkFeatures([feature('a'), feature('a')], web), /listed twice/);
  const r = createRegistry();
  r.command({ id: 'x', title: 'X', run() {} });
  assert.throws(() => r.command({ id: 'x', title: 'X', run() {} }), /duplicate command id/);
});
