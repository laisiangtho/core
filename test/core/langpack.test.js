import test from 'node:test';
import assert from 'node:assert/strict';
import { packCode, parseLangPack } from '../../app/core/langpack.js';

const pack = {
  digit: ['၀', '၁', '၂', '၃', '၄', '၅', '၆', '၇', '၈', '၉'],
  section: { 1: 'ပညတ်ကျမ်း' },
  testament: { 1: { info: { name: 'ဓမ္မဟောင်းကျမ်း', shortname: 'OT' } }, 2: { info: { name: '' } } },
  book: { 1: { info: { name: 'ကမ္ဘာဦးကျမ်း', shortname: 'ကမ္ဘာဦး', abbr: ['က'] } }, 67: { info: { name: 'Tobit' } } },
  locale: { book: 'ကျမ်း', ignored: 7 },
};

test('a language pack is parsed by id, deuterocanon included', () => {
  const out = parseLangPack(pack, { code: 'mya', source: 'test' });
  assert.equal(out.books[1].name, 'ကမ္ဘာဦးကျမ်း');
  assert.deepEqual([...out.books[1].abbr], ['က']);
  assert.equal(out.books[67].name, 'Tobit');
  assert.equal(out.testaments[1].name, 'ဓမ္မဟောင်းကျမ်း');
  assert.equal(out.sections[1], 'ပညတ်ကျမ်း');
  assert.equal(out.digit.length, 10);
  assert.equal(out.locale.book, 'ကျမ်း');
  assert.equal(out.locale.ignored, undefined);
});

test('an entry with no name is left to the next source', () => {
  const out = parseLangPack(pack, { code: 'mya', source: 'test' });
  assert.equal(out.testaments[2], undefined);
});

test('a digit table is all ten digits or none', () => {
  assert.throws(() => parseLangPack({ ...pack, digit: ['0', '1'] }, { code: 'x', source: 'test' }), /expected 0 or 10 digits/);
});

test('the pack code is the three-letter one the translation carries', () => {
  assert.equal(packCode({ name: 'mya', iso: { '639-1': 'my', '639-3': 'mya' } }), 'mya');
  assert.equal(packCode({ name: 'ctd' }), 'ctd');
  assert.equal(packCode({ name: 'da' }), '', 'a catalog two-letter code names no pack');
  assert.equal(packCode(undefined), '');
});
