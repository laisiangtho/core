import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseTranslation, localizeNumber } from '../../app/core/translation.js';
import { category, clone, readJson } from '../helpers.js';

const sample = readJson('test/fixtures/tedim1932.sample.json');
const parse = (raw, identify = 'tedim1932') => parseTranslation(raw, { identify, category });

test('Tedim sample parses; merge 17→18 kept, 18 absent', () => {
  const { meta, chapters, stats } = parse(sample);
  assert.equal(meta.version, 3);
  const gen1 = chapters.find((c) => c.book === 1 && c.chapter === 1).verses;
  assert.equal(gen1[17].merge, 18);
  assert.equal(gen1[18], undefined);
  assert.equal(gen1[1].title, 'Leitung le Mihing Piansakna');
  assert.ok(stats.merges >= 1);
  assert.equal(meta.story[1][1][1].ref, 'Gen.1.1,Gen.2.25');
});

test('identify mismatch is rejected', () => {
  assert.throws(() => parse(sample, 'niv2011'), /expected niv2011, file declares tedim1932/);
});

test('empty optional strings normalise to absent (jwmynwt publishes "title": "")', () => {
  const raw = clone(sample);
  raw.book['1'].chapter['1'].verse['2'] = { text: 'x', title: '', ref: '', merge: '' };
  const v = parse(raw).chapters.find((c) => c.book === 1 && c.chapter === 1).verses[2];
  assert.deepEqual(v, { text: 'x' });
});

test('unknown verse key is a structural error', () => {
  const raw = clone(sample);
  raw.book['1'].chapter['1'].verse['2'].note = 'x';
  assert.throws(() => parse(raw), /\$\.book\.1\.chapter\.1\.verse\.2\.note: unknown verse key/);
});

test('merge must point forward, and covered verses must be absent', () => {
  const back = clone(sample);
  back.book['1'].chapter['1'].verse['3'].merge = '2';
  assert.throws(() => parse(back), /verse number greater than 3/);

  const overlap = clone(sample);
  overlap.book['1'].chapter['1'].verse['18'] = { text: 'dup' };
  assert.throws(() => parse(overlap), /verse 18 is also covered by the merge on verse 17/);
});

test('string info.version accepted (bbe1949 publishes "1")', () => {
  const raw = clone(sample);
  raw.info.version = '1';
  assert.equal(parse(raw).meta.version, 1);
});

test('versification differences are diagnostics, not errors', () => {
  const raw = clone(sample);
  delete raw.book['1'].chapter['1'].verse['31'];
  const { diagnostics } = parse(raw);
  assert.ok(diagnostics.some((d) => d.type === 'versification' && d.book === 1 && d.chapter === 1 && d.actual === 30));
});

test('localizeNumber uses the digit table', () => {
  assert.equal(localizeNumber(17, ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉']), '၁၇');
  assert.equal(localizeNumber(17, []), '17');
});
