import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ResultRenderer } from '../../js/ui/ResultRenderer.js';
import { SHI_MODE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const html = fs.readFileSync(path.resolve(__dirname, '../../sidepanel.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../../sidepanel.css'), 'utf8');

const SAMPLE_FORTUNE = {
  hourPillar: { stem: '甲', branch: '子', hiddenStems: [] },
  dayPillar: { stem: '乙', branch: '丑', hiddenStems: [] },
  monthPillar: { stem: '丙', branch: '寅', hiddenStems: [] },
  yearPillar: { stem: '丁', branch: '卯', hiddenStems: [] },
};
const SAMPLE_JUUNIUN = {
  hour: { juuniun: '長生' },
  day: { juuniun: '沐浴' },
  month: { juuniun: '冠帯' },
  year: { juuniun: '建禄' },
};
const SAMPLE_TSUUHEN = {
  hour: { tsuuhen: '比肩' },
  day: { tsuuhen: '食神' },
  month: { tsuuhen: '傷官' },
  year: { tsuuhen: '偏財' },
};

function createElement(display = 'none') {
  return {
    innerHTML: '',
    style: { display },
    addEventListener() {},
  };
}

test('P6-T3 / UI-07 summary sits under #result-section before the fortune table (PNG capture root)', async () => {
  const resultIdx = html.indexOf('id="result-section"');
  const summaryIdx = html.indexOf('id="time-correction-summary"');
  const fortuneIdx = html.indexOf('id="fortune-result"');
  const greatIdx = html.indexOf('id="great-fortune-result"');

  assert.ok(resultIdx >= 0, 'result-section must exist');
  assert.ok(summaryIdx > resultIdx, 'summary must be after result-section open');
  assert.ok(fortuneIdx > summaryIdx, 'summary must be immediately before fortune table');
  assert.ok(greatIdx > fortuneIdx, 'great fortune follows fortune table');
  assert.ok(html.includes('class="correction-summary"'));
  assert.ok(css.includes('.correction-summary'), 'P6-3 CSS for summary must exist');
});

test('P6-T4 / UI-09 displayYear is used for great-fortune year cards', async () => {
  const greatFortuneResult = createElement();
  const doc = {
    getElementById(id) {
      const map = {
        'result-section': createElement('none'),
        'fortune-result': createElement(),
        'great-fortune-result': greatFortuneResult,
        'save-png-btn': createElement(),
        'time-correction-summary': createElement('none'),
      };
      return map[id];
    },
  };
  const renderer = new ResultRenderer(doc);
  renderer.showResults(
    SAMPLE_FORTUNE,
    SAMPLE_JUUNIUN,
    SAMPLE_TSUUHEN,
    [{ ageStart: 0, ageEnd: 9, stem: '甲', branch: '子' }],
    2024,
    {
      correction: { applied: true, corrected: { year: 2024, month: 1, day: 1, hour: 0, minute: 10 }, display: { statusText: '適用' } },
      shiMode: SHI_MODE.SWITCH_23,
    }
  );

  assert.ok(greatFortuneResult.innerHTML.includes('2024年 - 2033年'));
  assert.ok(!greatFortuneResult.innerHTML.includes('2023年 - 2032年'));
});
