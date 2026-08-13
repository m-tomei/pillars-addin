import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ResultRenderer } from '../../js/ui/ResultRenderer.js';
import { TimeCorrectionService } from '../../js/core/TimeCorrectionService.js';
import { SHI_MODE, SHI_MODE_LABEL } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const master = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/prefecture_longitude.json'), 'utf8')
);
const service = new TimeCorrectionService(master);

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
  day: { tsuuhen: '劫財' },
  month: { tsuuhen: '食神' },
  year: { tsuuhen: '傷官' },
};

function createElement(display = 'none') {
  return {
    innerHTML: '',
    style: { display },
    addEventListener() {},
  };
}

function createMockDocument() {
  const elements = {
    'result-section': createElement('none'),
    'fortune-result': createElement(),
    'great-fortune-result': createElement(),
    'save-png-btn': createElement(),
    'time-correction-summary': createElement('none'),
  };
  return {
    getElementById(id) {
      return elements[id] || null;
    },
    _elements: elements,
  };
}

function createRenderer() {
  const doc = createMockDocument();
  const renderer = new ResultRenderer(doc);
  return { renderer, doc };
}

function show(renderer, meta, displayYear = 1990, cycles = []) {
  renderer.showResults(
    SAMPLE_FORTUNE,
    SAMPLE_JUUNIUN,
    SAMPLE_TSUUHEN,
    cycles,
    displayYear,
    meta
  );
}

test('P6-T1 / UI-04 applied summary shows 時刻補正: 適用 and breakdown', async () => {
  const { renderer, doc } = createRenderer();
  const correction = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 8,
    minute: 30,
    prefectureCode: '13',
    offsetMinutes: 0,
  });
  show(renderer, { correction, shiMode: SHI_MODE.SWITCH_23 });

  const html = doc._elements['time-correction-summary'].innerHTML;
  assert.ok(html.includes('<h3>時刻補正</h3>'));
  assert.ok(html.includes('時刻補正: 適用'));
  assert.ok(html.includes('入力時刻: 1990-05-01 08:30'));
  assert.ok(html.includes('時差: +00:00（0分）'));
  assert.ok(html.includes('地方平均時補正: +19分（東京都 / 東経139.6917°）'));
  assert.ok(html.includes('補正後時刻: 1990-05-01 08:49'));
  assert.ok(html.includes(`子時モード: ${SHI_MODE_LABEL[SHI_MODE.SWITCH_23]}`));
  assert.ok(!html.includes('日柱は翌日扱い'));
  assert.strictEqual(doc._elements['time-correction-summary'].style.display, 'block');
  assert.strictEqual(doc._elements['result-section'].style.display, 'block');
});

test('P6-T1 / UI-05 no_time summary is a single line', async () => {
  const { renderer, doc } = createRenderer();
  show(renderer, { correction: { applied: false, reason: 'no_time' }, shiMode: SHI_MODE.SWITCH_23 });

  const html = doc._elements['time-correction-summary'].innerHTML;
  assert.strictEqual(html, '<p>時刻補正: 時刻未入力のため補正・時柱なし</p>');
  assert.ok(!html.includes('<ul>'));
  assert.ok(!html.includes('<h3>'));
  assert.strictEqual(doc._elements['time-correction-summary'].style.display, 'block');
});

test('P6-T1 switch23 at hour 23 adds next-day day-pillar note', async () => {
  const { renderer, doc } = createRenderer();
  const correction = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 22,
    minute: 50,
    prefectureCode: null,
    offsetMinutes: 20,
  });
  assert.strictEqual(correction.corrected.hour, 23);
  show(renderer, { correction, shiMode: SHI_MODE.SWITCH_23 });

  const html = doc._elements['time-correction-summary'].innerHTML;
  assert.ok(html.includes('注: 23時切替のため日柱は翌日扱い（1990-05-02）'));
  assert.ok(html.includes('correction-note'));
});

test('P6-T1 switch00 at hour 23 does not add day-pillar note', async () => {
  const { renderer, doc } = createRenderer();
  const correction = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 23,
    minute: 10,
    prefectureCode: null,
    offsetMinutes: 0,
  });
  show(renderer, { correction, shiMode: SHI_MODE.SWITCH_00 });

  const html = doc._elements['time-correction-summary'].innerHTML;
  assert.ok(html.includes(`子時モード: ${SHI_MODE_LABEL[SHI_MODE.SWITCH_00]}`));
  assert.ok(!html.includes('日柱は翌日扱い'));
});

test('P6-T1 year-end switch23 note rolls to next year', async () => {
  const { renderer, doc } = createRenderer();
  const correction = service.correct({
    year: 2023,
    month: 12,
    day: 31,
    hour: 23,
    minute: 0,
    prefectureCode: null,
    offsetMinutes: 0,
  });
  show(renderer, { correction, shiMode: SHI_MODE.SWITCH_23 }, 2023);

  const html = doc._elements['time-correction-summary'].innerHTML;
  assert.ok(html.includes('注: 23時切替のため日柱は翌日扱い（2024-01-01）'));
});

test('P6-T1 clear empties summary and hides it with fortune/great fortune', async () => {
  const { renderer, doc } = createRenderer();
  const correction = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 8,
    minute: 30,
    prefectureCode: '13',
    offsetMinutes: 0,
  });
  show(renderer, { correction, shiMode: SHI_MODE.SWITCH_23 }, 1990, [
    { ageStart: 0, ageEnd: 9, stem: '甲', branch: '子' },
  ]);

  renderer.clear();

  assert.strictEqual(doc._elements['time-correction-summary'].innerHTML, '');
  assert.strictEqual(doc._elements['time-correction-summary'].style.display, 'none');
  assert.strictEqual(doc._elements['fortune-result'].innerHTML, '');
  assert.strictEqual(doc._elements['great-fortune-result'].innerHTML, '');
  assert.strictEqual(doc._elements['result-section'].style.display, 'none');
});
