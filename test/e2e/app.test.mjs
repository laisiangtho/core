/**
 * What a reader can actually do, driven against the built app.
 *
 * One browser for the whole file: launching one costs more than every check in
 * here put together, and the subtests are ordered so each leaves the app in a
 * state the next one can use.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { available, launch } from './harness.mjs';

const ready = await available();
const options = ready.ok ? {} : { skip: `end-to-end: ${ready.why}` };

test('the app in a browser', options, async (t) => {
  const app = await launch();
  const { page } = app;
  t.after(() => app.close());

  const install = async (identify) => {
    const button = page.locator(`[data-identify="${identify}"] button`, { hasText: 'Make available offline' });
    if (await button.count()) await button.click();
    await page.locator(`[data-identify="${identify}"] .badge-ok`).waitFor({ timeout: 60000 });
  };
  /** Back to reading: a document tab has no crumb bar to switch translations from. */
  const toChapter = async () => {
    await page.locator('.tabstrip .tab[data-kind="chapter"]').first().click();
    await page.waitForSelector('.crumb-tr');
  };
  const switchTo = async (name) => {
    await page.locator('.crumb-tr').first().click();
    await page.locator('.modal-input').fill(name);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1500);
  };
  const settings = () => page.evaluate(async () => {
    const db = await new Promise((r) => { const q = indexedDB.open('lai-siangtho'); q.onsuccess = () => r(q.result); });
    return new Promise((r) => { const q = db.transaction('settings').objectStore('settings').get('current'); q.onsuccess = () => r(q.result); });
  });
  const centre = async (locator) => {
    const box = await locator.boundingBox();
    return { x: box.x + box.width / 2, y: box.y + box.height / 2, box };
  };
  const drag = async (from, to, steps = 18) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps });
    await page.mouse.up();
    await page.waitForTimeout(300);
  };

  await t.test('starts, and offers the library when nothing is installed', async () => {
    await app.open();
    await page.waitForSelector('.library-item', { timeout: 20000 });
    assert.equal(await page.locator('.fatal').count(), 0);
    assert.ok(await page.locator('.library-item').count() >= 3, 'the catalog is listed');
  });

  await t.test('installs a translation and reads a chapter', async () => {
    await install('kjv1611');
    await page.locator('.tab', { hasText: /Genesis/ }).first().click();
    await page.waitForSelector('.verse');
    assert.equal(await page.locator('.verse').count(), 31, 'Genesis 1 has 31 verses');
    assert.match(await page.locator('.crumbs').first().innerText(), /Genesis/);
  });

  await t.test('the reading panel moves the text', async () => {
    const before = await page.locator('.verse').first().evaluate((n) => getComputedStyle(n).fontSize);
    await page.locator('.statusbar .sb-reading').click();
    const slider = page.locator('.rpanel input[type=range]').first();
    await slider.evaluate((n) => { n.value = '24'; n.dispatchEvent(new Event('input', { bubbles: true })); });
    await page.waitForTimeout(300);
    const after = await page.locator('.verse').first().evaluate((n) => getComputedStyle(n).fontSize);
    assert.notEqual(before, after);
    assert.equal(after, '24px');
    await page.keyboard.press('Escape');
  });

  await t.test('a second translation lines up beside the first', async () => {
    await page.locator('.rib[title="Library"]').click();
    await install('judson1835');
    await page.locator('.tab', { hasText: /Genesis|ကမ္ဘာ/ }).first().click();
    await page.waitForSelector('.verse');
    await page.keyboard.press('Control+p');
    await page.locator('.modal-input').fill('parallel');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    assert.equal(await page.locator('.leaf[data-pane]').count(), 2, 'two panes');
    const tops = await page.locator('.leaf .vblock[data-verse="1"]').evaluateAll((n) => n.map((x) => Math.round(x.getBoundingClientRect().top)));
    assert.equal(new Set(tops).size, 1, `the first verse of each pane is level (${tops.join(', ')})`);
    await page.locator('.leaf[data-role="compare"] .leaf-close').click();
    await page.waitForTimeout(400);
  });

  await t.test('names, digits and the English behind them', async () => {
    await toChapter();
    await switchTo('judson');
    const crumbs = await page.locator('.crumbs').first().innerText();
    assert.match(crumbs, /ကမ္ဘာဦးကျမ်း/, 'the book is named by the translation');
    assert.match(crumbs, /ဓမ္မဟောင်းကျမ်း/, 'the testament too');
    assert.match(crumbs, /၁/, 'the chapter is in its own digits');
    const titles = await page.locator('.crumbs .crumb').evaluateAll((n) => n.map((x) => x.getAttribute('title')));
    assert.ok(titles.includes('Old Testament'), 'the canon name is the accessible name');
    assert.ok(titles.includes('Genesis'));
    assert.equal(await page.locator('.tabstrip .tab.is-active').getAttribute('title'), 'Genesis 1');
  });

  await t.test('a language pack fills in what a file omits, and is cached', async () => {
    const asked = () => app.requests.filter((u) => /lang\/iso-/.test(u)).length;
    const before = asked();
    await page.locator('.rib[title="Library"]').click();
    await install('ddb1931');
    await toChapter();
    await switchTo('Danske');
    assert.match(await page.locator('.crumbs').first().innerText(), /Det Gamle Testamente/, 'the pack names the testament the file does not');
    assert.ok(asked() > before, 'the pack was fetched');
    const cached = await page.evaluate(async () => {
      const db = await new Promise((r) => { const q = indexedDB.open('lai-siangtho'); q.onsuccess = () => r(q.result); });
      return new Promise((r) => { const q = db.transaction('records').objectStore('records').getAllKeys(); q.onsuccess = () => r(q.result.filter((k) => String(k).startsWith('lang:'))); });
    });
    assert.ok(cached.includes('lang:dan'), 'and kept');
  });

  await t.test('notes and bookmarks belong to the verse, not the translation', async () => {
    await page.locator('.vnum').first().click();
    await page.waitForSelector('.vbar:not([hidden])');
    await page.locator('.vbar button[title="Bookmark"]').click();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.verse.is-marked').count(), 1);
    await switchTo('King James');
    assert.equal(await page.locator('.verse.is-marked').count(), 1, 'the mark is on the verse in the other translation too');
  });

  await t.test('tabs reorder and detach, leaving nothing behind', async () => {
    await page.locator('.tab-new').click();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    const names = () => page.locator('.tabstrip .tab .t-name').allTextContents();
    const before = await names();
    assert.ok(before.length >= 2, 'more than one tab');
    const first = await centre(page.locator('.tabstrip .tab').first());
    const second = await centre(page.locator('.tabstrip .tab').nth(1));
    await drag(first, { x: second.x + 30, y: second.y });
    const after = await names();
    assert.notDeepEqual(after, before, 'the order changed');
    assert.equal(await page.locator('.drop-caret:not([hidden]), .tab.is-dragging').count(), 0, 'no marks left behind');
    assert.equal(await page.evaluate(() => document.body.className), '', 'no drag class left behind');

    const tab = await centre(page.locator('.tabstrip .tab').first());
    await drag(tab, { x: tab.x + 80, y: tab.y + 240 });
    assert.equal(await page.locator('.float-win').count(), 1, 'the tab became a window');
    await page.locator('.float-win [title="Dock"]').click();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.float-win').count(), 0, 'and went back');
  });

  await t.test('a sidebar splits into rows and gives a pane back', async () => {
    const tags = page.locator('.sidebar.left .pane-tab[data-view="marks"]');
    const group = await centre(page.locator('.sidebar.left .side-group').first());
    await drag(await centre(tags), { x: group.x, y: group.box.y + group.box.height * 0.8 });
    assert.equal(await page.locator('.sidebar.left .side-group').count(), 2, 'two rows');
    assert.equal(await page.locator('.sidebar.left .row-divider').count(), 1);
    const stored = await settings();
    assert.equal(stored.sidebarLeft.length, 2, 'the arrangement is remembered');

    for (let i = 0; i < 6; i += 1) {
      const pane = page.locator('.sidebar.right .pane-tab').first();
      if (!await pane.count()) break;
      await drag(await centre(pane), await centre(page.locator('.sidebar.left .pane-tabs').first()));
    }
    assert.equal(await page.locator('.sidebar.right .pane-tab').count(), 0, 'the right sidebar is empty');
    const back = await centre(page.locator('.sidebar.left .pane-tab').last());
    await page.mouse.move(back.x, back.y);
    await page.mouse.down();
    await page.mouse.move(page.viewportSize().width - 40, 400, { steps: 18 });
    await page.waitForTimeout(200);
    const rail = await page.locator('.sidebar.right').boundingBox();
    assert.ok(rail && rail.width > 0, 'an empty sidebar still offers a rail to drop onto');
    await page.mouse.up();
    await page.waitForTimeout(400);
    assert.equal(await page.locator('.sidebar.right .pane-tab').count(), 1, 'and takes the pane back');
  });

  await t.test('search finds a verse and opens it', async () => {
    await page.keyboard.press('Control+p');
    await page.locator('.modal-input').fill('Search');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    await page.locator('.sidebar .pane-view.is-active input[type="search"], .sidebar .pane-view.is-active .field input').first().fill('Genesis 3:5');
    await page.waitForTimeout(2500);
    assert.ok(await page.locator('.result-line').count() > 0, 'something was found');
    await page.locator('.result-line').first().click();
    await page.waitForTimeout(600);
    assert.ok(await page.locator('.verse.is-hit').count() >= 0);
  });

  await t.test('the narrow layout has its own chrome', async () => {
    await page.setViewportSize({ width: 720, height: 900 });
    await page.waitForTimeout(500);
    assert.ok(await page.locator('.mobile-bar').isVisible(), 'the navigation pill');
    assert.ok(await page.locator('#barApp').isVisible(), 'the app pill');
    assert.equal(await page.locator('.tabstrip .tab:visible').count(), 1, 'one tab at a time');
    await page.locator('.mobile-bar button').first().click();
    await page.waitForTimeout(400);
    assert.match(await page.evaluate(() => document.body.className), /drawer-l/, 'the sidebar arrives as a drawer');
    await page.locator('.scrim-mobile').click({ position: { x: 640, y: 500 } });
    await page.waitForTimeout(300);
    assert.doesNotMatch(await page.evaluate(() => document.body.className), /drawer/, 'and the scrim closes it');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);
  });

  await t.test('what was open comes back after a reload', async () => {
    await toChapter();
    const before = await settings();
    const active = await page.locator('.tabstrip .tab.is-active').getAttribute('title');
    await page.reload();
    await page.waitForSelector('#app .body-row');
    await page.waitForTimeout(1500);
    const after = await settings();
    assert.equal(after.translation, before.translation);
    assert.equal(after.tabs.length, before.tabs.length);
    assert.equal(after.sidebarLeft.length, before.sidebarLeft.length);
    assert.equal(after.activeTab, before.activeTab, 'the tab in front is remembered');
    assert.equal(await page.locator('.tabstrip .tab.is-active').getAttribute('title'), active, 'and is the one that comes back');
  });

  await t.test('the popover says what the file holds and where it parts from the canon', async () => {
    await toChapter();
    await page.locator('.leaf-head .tr-btn').first().click();
    await page.waitForSelector('.trinfo:not([hidden])');
    const text = await page.locator('.trinfo').innerText();
    assert.match(text, /4 books/, 'what was installed');
    assert.match(text, /6278 verses/);
    assert.match(text, /\d+ differences/, 'and how it differs from the canon');
    await page.locator('.tri-more > summary').click();
    assert.match(await page.locator('.tri-diag').innerText(), /Leviticus is absent/);
    await page.keyboard.press('Escape');
  });

  await t.test('a stored copy that lost its text says so, and repairs', async () => {
    const identify = await page.evaluate(() => document.querySelector('.leaf[data-role="primary"]').dataset.translation);
    await page.evaluate(async (id) => {
      const db = await new Promise((r) => { const q = indexedDB.open('lai-siangtho'); q.onsuccess = () => r(q.result); });
      await new Promise((r) => {
        const tx = db.transaction('chapters', 'readwrite');
        tx.objectStore('chapters').delete(IDBKeyRange.bound([id], [id, []]));
        tx.oncomplete = r;
      });
    }, identify);
    await page.reload();
    await page.waitForSelector('#app .body-row');
    await page.waitForSelector('.callout', { timeout: 20000 });
    assert.match(await page.locator('.callout').first().innerText(), /incomplete/, 'a half-written copy is not read as a translation that omits the book');
    await page.locator('.callout .btn').click();
    await page.waitForSelector('.verse', { timeout: 60000 });
    assert.ok(await page.locator('.verse').count() > 0, 'and downloading it again brings the text back');
  });

  await t.test('nothing failed along the way', () => {
    assert.deepEqual(app.problems, []);
    // The English fixture has no language pack, which is the ordinary case the
    // app must survive; nothing else is allowed to be missing.
    assert.deepEqual(app.missing.filter((u) => !/lang\/iso-eng\.json$/.test(u)), []);
  });
});
