import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KeizenAnalyzer } from '../../js/core/KeizenAnalyzer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/kakkyoku_rules.json'), 'utf8')
);

let analyzer;

test('KeizenAnalyzer.setup', () => {
  analyzer = new KeizenAnalyzer(rules);
  assert.ok(analyzer);
});

test('KeizenAnalyzer - 正財格・身旺・比劫多 → 比劫奪財', () => {
  const kakkyokuResult = {
    kakkyoku: '正財格',
    category: 'regular',
    isEstablished: false,
    breakReason: '比劫奪財'
  };
  const strengthResult = { strength: 'strong', score: 8 };
  // 戊土日主、比肩2
  const fortuneResult = {
    yearPillar: { stem: '戊', branch: '戌', hiddenStems: ['戊', '辛', '丁'] },
    monthPillar: { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
    dayPillar: { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
    hourPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
  };
  const tsuuhenResult = {
    year: { tsuuhen: '比肩' },
    month: { tsuuhen: '劫財' },
    hour: { tsuuhen: '正財' }
  };

  const result = analyzer.analyze(kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult);
  assert.strictEqual(result.pillar.youshinCategory, 'wealth');
  assert.strictEqual(result.pillar.youshinLabel, '財');
  assert.ok(result.breaks.some(b => b.condition === '比劫多'), '比劫多の破がある');
  assert.ok(result.breaks.some(b => b.name === '比劫奪財'), '比劫奪財');
  assert.ok(result.summary.includes('比劫奪財'));
});

test('KeizenAnalyzer - KZ-01 正官格・傷官透出 → 傷官見官', () => {
  const kakkyokuResult = {
    kakkyoku: '正官格',
    category: 'regular',
    isEstablished: false,
    breakReason: '傷官見官'
  };
  const strengthResult = { strength: 'weak', score: 1 };
  const fortuneResult = {
    yearPillar: { stem: '丁', branch: '午', hiddenStems: ['丁', '己'] },
    monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
    dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    hourPillar: { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
  };
  const tsuuhenResult = {
    year: { tsuuhen: '傷官' },
    month: { tsuuhen: '正官' },
    hour: { tsuuhen: '食神' }
  };

  const result = analyzer.analyze(
    kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult
  );
  const breakItem = result.breaks.find(b => b.name === '傷官見官');
  assert.ok(breakItem, 'breaksに傷官見官がある');
  assert.strictEqual(breakItem.condition, '傷官透出');
  assert.strictEqual(breakItem.severityHint, 'severe');
});

test('KeizenAnalyzer - 印綬格・身弱・財多 → 貪財壊印', () => {
  const kakkyokuResult = {
    kakkyoku: '印綬格',
    category: 'regular',
    isEstablished: false,
    breakReason: '貪財壊印'
  };
  const strengthResult = { strength: 'weak', score: 1 };
  const fortuneResult = {
    yearPillar: { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
    monthPillar: { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
    dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    hourPillar: { stem: '己', branch: '巳', hiddenStems: ['丙', '戊', '庚'] }
  };
  const tsuuhenResult = {
    year: { tsuuhen: '偏財' },
    month: { tsuuhen: '正財' },
    hour: { tsuuhen: '正財' }
  };

  const result = analyzer.analyze(kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult);
  assert.strictEqual(result.pillar.youshinCategory, 'seal');
  assert.ok(result.breaks.some(b => b.name === '貪財壊印'));
  assert.strictEqual(result.breaks[0].severityHint, 'severe');
});

test('KeizenAnalyzer - 正官格・成格・損傷なし → breaks空', () => {
  const kakkyokuResult = {
    kakkyoku: '正官格',
    category: 'regular',
    isEstablished: true,
    breakReason: null
  };
  const strengthResult = { strength: 'strong', score: 5 };
  const fortuneResult = {
    yearPillar: { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
    monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
    dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
    hourPillar: { stem: '癸', branch: '酉', hiddenStems: ['辛'] }
  };
  const tsuuhenResult = {
    year: { tsuuhen: '偏財' },
    month: { tsuuhen: '正官' },
    hour: { tsuuhen: '正印' }
  };

  const result = analyzer.analyze(kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult);
  assert.strictEqual(result.pillar.youshinCategory, 'officer');
  assert.strictEqual(result.breaks.length, 0, '該当conditionなしならbreaks空');
  assert.ok(result.supports.some(s => s.name === '財生官'));
  assert.ok(result.supports.some(s => s.name === '印護身'));
  assert.ok(result.summary.includes('成格'));
});

test('KeizenAnalyzer - 中和はstrong→weakの順で試す', () => {
  const kakkyokuResult = {
    kakkyoku: '正財格',
    category: 'regular',
    isEstablished: true,
    breakReason: null
  };
  const strengthResult = { strength: 'neutral', score: 3 };
  const fortuneResult = {
    yearPillar: { stem: '戊', branch: '午', hiddenStems: ['丁', '己'] },
    monthPillar: { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
    dayPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
    hourPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
  };
  // 財多は weak 側の condition
  const tsuuhenResult = {
    year: { tsuuhen: '偏財' },
    month: { tsuuhen: '正財' },
    hour: { tsuuhen: '食神' }
  };

  const result = analyzer.analyze(kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult);
  assert.ok(
    result.breaks.some(b => b.condition === '財多' && b.strengthSide === 'weak'),
    'neutralでstrong不成立ならweak側を採用'
  );
});

test('KeizenAnalyzer - 必須データ不足はエラー', () => {
  assert.throws(
    () => analyzer.analyze(null, { strength: 'strong' }, {}, {}),
    '継善分析に必要なデータが不足しています'
  );
});
