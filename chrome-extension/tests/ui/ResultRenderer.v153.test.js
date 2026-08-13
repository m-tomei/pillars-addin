import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ResultRenderer } from '../../js/ui/ResultRenderer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = path.resolve(__dirname, '../..');
const css = fs.readFileSync(path.join(EXT_ROOT, 'sidepanel.css'), 'utf8');

function createElement() {
  return { innerHTML: '', style: { display: 'none' }, addEventListener() {} };
}

function createMockDocument() {
  const elements = {
    'result-section': createElement(),
    'fortune-result': createElement(),
    'great-fortune-result': createElement(),
    'save-png-btn': createElement(),
    'time-correction-summary': createElement(),
  };
  return {
    getElementById(id) {
      return elements[id] || null;
    },
    _elements: elements,
  };
}

test('V1.5.3 fortune table CSS uses fixed equal-width columns', async () => {
  assert.ok(css.includes('.fortune-table'));
  assert.ok(css.includes('table-layout: fixed'));
  assert.ok(css.includes('width: 25%'));
});

test('V1.5.3 fortune table HTML keeps four 25% columns regardless of hidden stems', async () => {
  const doc = createMockDocument();
  const renderer = new ResultRenderer(doc);
  renderer.showResults(
    {
      hourPillar: { stem: '乙', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
      dayPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
      monthPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
      yearPillar: { stem: '戊', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
    },
    {
      hour: { juuniun: '冠帯' },
      day: { juuniun: '建禄' },
      month: { juuniun: '沐浴' },
      year: { juuniun: '絶' },
    },
    {
      hour: { tsuuhen: '劫財' },
      day: { tsuuhen: '-' },
      month: { tsuuhen: '比肩' },
      year: { tsuuhen: '偏財' },
    },
    [],
    1968,
    { correction: { applied: false } }
  );

  const html = doc._elements['fortune-result'].innerHTML;
  assert.ok(html.includes('class="fortune-table"'));
  assert.ok(html.includes('table-layout: fixed'));
  assert.ok((html.match(/width: 25%/g) || []).length >= 4);
  assert.ok(html.includes('class="hidden-stems-row"'));
  assert.ok(html.includes('己 癸 辛'));
  assert.ok(html.includes('癸'));
});
