/**
 * Measurements at the edges, against full-size data.
 *
 * Not a test: it asserts nothing and fails nothing. It prints what the app
 * costs where cost is most likely — installing a whole Bible, the longest
 * chapter there is, four of them side by side, and a search across everything
 * held — so a change that makes one of them worse can be seen.
 *
 *   node test/e2e/perf.mjs
 *
 * The fixtures carry the canon's real chapter and verse counts, so the sizes
 * are the sizes a reader would have; only the verse text is invented.
 */

import { available, fixtures, launch } from './harness.mjs';

const ready = await available();
if (!ready.ok) {
  console.error(`skipped: ${ready.why}`);
  process.exit(0);
}

const app = await launch({ fixtures: fixtures({ books: 'all' }) });
const { page } = app;

const time = async (label, fn) => {
  const started = Date.now();
  const extra = await fn();
  const ms = Date.now() - started;
  console.log(`${String(ms).padStart(6)} ms  ${label}${extra ? `  (${extra})` : ''}`);
  return ms;
};

await time('start with nothing installed', async () => {
  await app.open();
  await page.waitForSelector('.library-item');
});

for (const identify of ['kjv1611', 'judson1835', 'ddb1931']) {
  await time(`install ${identify}`, async () => {
    await page.locator(`[data-identify="${identify}"] button`, { hasText: 'Make available offline' }).click();
    await page.locator(`[data-identify="${identify}"] .badge-ok`).waitFor({ timeout: 300000 });
    return page.locator(`[data-identify="${identify}"] .lib-held`).innerText();
  });
}

await page.locator('.tabstrip .tab[data-kind="chapter"]').first().click();
await page.waitForSelector('.verse');

const open = async (reference, verses) => time(`open ${reference}`, async () => {
  await page.keyboard.press('Control+o');
  await page.locator('.modal-input').fill(reference);
  await page.waitForTimeout(150);
  await page.keyboard.press('Enter');
  await page.waitForFunction((n) => document.querySelectorAll('.verse').length >= n, verses, { timeout: 60000 });
  return `${await page.locator('.verse').count()} verses`;
});

await open('Psalm 119', 176);
await time('next chapter', async () => {
  await page.keyboard.press('Control+ArrowRight');
  await page.waitForFunction(() => document.querySelector('.ch-num')?.textContent?.trim().endsWith('120'), null, { timeout: 30000 });
});
await open('Psalm 119', 176);

for (const panes of [2, 3]) {
  await time(`${panes} panes over Psalm 119`, async () => {
    await page.keyboard.press('Control+p');
    await page.locator('.modal-input').fill('parallel');
    await page.keyboard.press('Enter');
    await page.waitForFunction((n) => document.querySelectorAll('.leaf[data-pane]').length === n, panes, { timeout: 60000 });
  });
}

await time('scroll a 3-pane Psalm 119 to the end', async () => {
  await page.locator('.leaf[data-pane="0"] .leaf-scroll').evaluate((n) => { n.scrollTop = n.scrollHeight; });
  await page.waitForTimeout(300);
});

await time('search the held translations', async () => {
  await page.locator('.leaf[data-pane="0"]').click({ position: { x: 5, y: 5 } });
  await page.keyboard.press('Control+p');
  await page.locator('.modal-input').fill('Search');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(400);
  const field = page.locator('.sidebar .pane-view.is-active input[type="search"], .sidebar .pane-view.is-active .field input').first();
  await field.fill('Genesis 3');
  await page.waitForFunction(() => document.querySelectorAll('.result-line').length > 0, null, { timeout: 120000 });
  return `${await page.locator('.result-line').count()} hits`;
});

// The expensive one: every verse of every held translation, read from storage.
await time('search every held translation for a word', async () => {
  await page.locator('.sidebar .pane-view.is-active select').selectOption('*');
  const field = page.locator('.sidebar .pane-view.is-active input[type="search"]').first();
  await field.fill('whole of the land');
  await page.waitForFunction(() => document.querySelectorAll('.result-line').length > 0, null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  return `${await page.locator('.result-line').count()} hits`;
});

await time('reload with everything open', async () => {
  await page.reload();
  await page.waitForSelector('.verse', { timeout: 60000 });
});

const usage = await page.evaluate(async () => {
  const { usage: bytes } = await navigator.storage.estimate();
  const heap = performance.memory ? performance.memory.usedJSHeapSize : null;
  return { bytes, heap };
});
console.log(`\nstored: ${(usage.bytes / 1048576).toFixed(1)} MB`
  + (usage.heap ? ` · heap: ${(usage.heap / 1048576).toFixed(1)} MB` : ''));
if (app.problems.length) console.log('problems:', app.problems);
await app.close();
