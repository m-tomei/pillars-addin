import { KishouAssessor } from '../../js/core/KishouAssessor.js';

let assessor;

test('KishouAssessor.setup', () => {
  assessor = new KishouAssessor();
  assert.ok(assessor);
});

test('KishouAssessor - 丑月は寒ベース（S-03系）', () => {
  const fortune = {
    yearPillar: { stem: '己', branch: '巳' },
    monthPillar: { stem: '丁', branch: '丑' },
    dayPillar: { stem: '庚', branch: '辰' },
    hourPillar: { stem: '辛', branch: '巳' }
  };
  const result = assessor.assess(fortune);
  assert.strictEqual(result.scores.baseTemp, '寒', '丑月の月令ベースは寒');
  // 巳火が多い命式では熱側へ1段シフトし涼になりうる
  assert.ok(['寒', '涼'].includes(result.temperature), '冬月は寒〜涼');
  assert.strictEqual(result.clarity, '不明', 'D-08: 清濁は不明');
  assert.strictEqual(result.choukou.direction, '温める');
  assert.ok(result.choukou.primaryElements.includes('火'));
  assert.ok(result.deficientElements.includes('火'));
});

test('KishouAssessor - 水金優勢の冬月は寒のまま', () => {
  const fortune = {
    yearPillar: { stem: '壬', branch: '子' },
    monthPillar: { stem: '癸', branch: '丑' },
    dayPillar: { stem: '庚', branch: '子' },
    hourPillar: { stem: '辛', branch: '亥' }
  };
  const result = assessor.assess(fortune);
  assert.strictEqual(result.temperature, '寒');
  assert.strictEqual(result.choukou.direction, '温める');
});

test('KishouAssessor - 午月は熱ベース（S-04系）', () => {
  const fortune = {
    yearPillar: { stem: '丁', branch: '卯' },
    monthPillar: { stem: '丙', branch: '午' },
    dayPillar: { stem: '壬', branch: '辰' },
    hourPillar: { stem: '乙', branch: '巳' }
  };
  const result = assessor.assess(fortune);
  assert.strictEqual(result.temperature, '熱', '午月ベースは熱');
  assert.strictEqual(result.choukou.direction, '冷ます');
  assert.ok(result.choukou.primaryElements.includes('水'));
});

test('KishouAssessor - 卯月は温ベース（S-06系）', () => {
  const fortune = {
    yearPillar: { stem: '庚', branch: '戌' },
    monthPillar: { stem: '己', branch: '卯' },
    dayPillar: { stem: '甲', branch: '午' },
    hourPillar: { stem: '己', branch: '巳' }
  };
  const result = assessor.assess(fortune);
  assert.ok(['温', '熱', '中和'].includes(result.temperature), '春月は温寄り');
  assert.strictEqual(result.clarity, '不明');
});

test('KishouAssessor - 寒暖シフト境界 TH-4', () => {
  // 寅月=温。heat-cold=2.0 で熱側へ1段 → 熱
  const fortune = {
    yearPillar: { stem: '甲', branch: '寅' },
    monthPillar: { stem: '丙', branch: '寅' },
    dayPillar: { stem: '戊', branch: '午' },
    hourPillar: { stem: '丙', branch: '午' }
  };
  const hot = assessor.assess(fortune, {
    elementDist: { 木: 0, 火: 3, 土: 0, 金: 0, 水: 1 }
  });
  // heat=3, cold=1, diff=2 → 温→熱
  assert.strictEqual(hot.temperature, '熱');

  const noShift = assessor.assess(fortune, {
    elementDist: { 木: 0, 火: 2.9, 土: 0, 金: 0, 水: 1 }
  });
  // diff=1.9 < 2.0 → シフトなし
  assert.strictEqual(noShift.temperature, '温');
});

test('KishouAssessor - 燥湿境界 TH-5', () => {
  const fortune = {
    yearPillar: { stem: '戊', branch: '戌' },
    monthPillar: { stem: '戊', branch: '午' },
    dayPillar: { stem: '甲', branch: '辰' },
    hourPillar: { stem: '己', branch: '未' }
  };
  const dry = assessor.assess(fortune, {
    elementDist: { 木: 0, 火: 1, 土: 2, 金: 0, 水: 0.5 }
  });
  // dry=0.5+2=2.5, wet=0.5, diff=2.0 >= 1.5 → 燥
  assert.strictEqual(dry.humidity, '燥');

  const mid = assessor.assess(fortune, {
    elementDist: { 木: 0, 火: 0, 土: 1, 金: 0, 水: 0.6 }
  });
  // dry=1, wet=0.6, diff=0.4 → 中
  assert.strictEqual(mid.humidity, '中');
});

test('KishouAssessor - 必須データ不足はエラー', () => {
  assert.throws(
    () => assessor.assess({}),
    '気象判定に必要な命式データが不足しています'
  );
});
