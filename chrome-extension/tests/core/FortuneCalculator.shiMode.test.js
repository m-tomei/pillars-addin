import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';
import { DateUtils } from '../../js/utils/dateUtils.js';
import { SHI_MODE, DEFAULT_SHI_MODE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

class MockDataLoader {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async loadJSON(filename) {
    const filePath = path.join(this.basePath, filename);
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  async loadSolarTerms() {
    return this.loadJSON('solar_terms.json');
  }

  async loadStemBranchMaster() {
    return this.loadJSON('stem_branch_master.json');
  }
}

const BASE = { year: 2023, month: 6, day: 15 };
let calculator;

test('FortuneCalculator.shiMode initialize', async () => {
  calculator = new FortuneCalculator(new MockDataLoader(DATA_DIR));
  await calculator.initialize();
  assert.ok(calculator.solarTermsData);
});

function pillar(result, key) {
  return `${result[key].stem}${result[key].branch}`;
}

test('SM-01 12:00 switch23 is 午 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 12, 0, { shiMode: SHI_MODE.SWITCH_23 });
  assert.strictEqual(result.hourPillar.branch, '午');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '庚午');
});

test('SM-02 23:30 switch23 is 子, next-day pillar, and hour stem from next day', async () => {
  // V1.5 仕様変更: V1.0 は 23時台でも日柱を進めない。switch23 では翌日の日柱・時干を使う。
  const sameDay = calculator.calculateDayPillar(2023, 6, 15);
  const nextDay = calculator.calculateDayPillar(2023, 6, 16);
  assert.strictEqual(`${sameDay.stem}${sameDay.branch}`, '甲辰');
  assert.strictEqual(`${nextDay.stem}${nextDay.branch}`, '乙巳');

  const result = calculator.calculateFortune(2023, 6, 15, 23, 30, { shiMode: SHI_MODE.SWITCH_23 });
  assert.strictEqual(result.hourPillar.branch, '子');
  assert.strictEqual(pillar(result, 'dayPillar'), '乙巳', 'day pillar must be next calendar day');
  assert.strictEqual(pillar(result, 'hourPillar'), '丙子', 'hour stem uses next-day 乙巳');
  assert.strictEqual(pillar(result, 'yearPillar'), '癸卯', 'year pillar must stay on t_corrected day');
  assert.strictEqual(pillar(result, 'monthPillar'), '戊午', 'month pillar must stay on t_corrected day');
});

test('SM-03 00:30 switch23 is 子 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 0, 30, { shiMode: SHI_MODE.SWITCH_23 });
  assert.strictEqual(result.hourPillar.branch, '子');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '甲子');
});

test('SM-04 23:30 switch00 is 亥 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 23, 30, { shiMode: SHI_MODE.SWITCH_00 });
  assert.strictEqual(result.hourPillar.branch, '亥');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '乙亥');
});

test('SM-05 00:30 switch00 is 子 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 0, 30, { shiMode: SHI_MODE.SWITCH_00 });
  assert.strictEqual(result.hourPillar.branch, '子');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
});

test('SM-06 22:30 switch00 is 亥 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 22, 30, { shiMode: SHI_MODE.SWITCH_00 });
  assert.strictEqual(result.hourPillar.branch, '亥');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '乙亥');
});

test('SM-07 01:30 switch23 is 丑 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 1, 30, { shiMode: SHI_MODE.SWITCH_23 });
  assert.strictEqual(result.hourPillar.branch, '丑');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '乙丑');
});

test('SM-08 01:30 switch00 is 子 and same-day pillar', async () => {
  const result = calculator.calculateFortune(2023, 6, 15, 1, 30, { shiMode: SHI_MODE.SWITCH_00 });
  assert.strictEqual(result.hourPillar.branch, '子');
  assert.strictEqual(pillar(result, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result, 'hourPillar'), '甲子');
});

test('ST-02 no correction, non-23h matches V1.0 pillars', async () => {
  const noon = calculator.calculateFortune(2023, 6, 15, 12, 0);
  assert.strictEqual(pillar(noon, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(noon, 'monthPillar'), '戊午');
  assert.strictEqual(pillar(noon, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(noon, 'hourPillar'), '庚午');

  const morning = calculator.calculateFortune(2023, 6, 15, 8, 30, { shiMode: DEFAULT_SHI_MODE });
  assert.strictEqual(pillar(morning, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(morning, 'monthPillar'), '戊午');
  assert.strictEqual(pillar(morning, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(morning, 'hourPillar'), '戊辰');
});

test('resolveDayPillarDate boundaries 22/23/0/1 x both modes', async () => {
  const cases = [
    { hour: 22, mode: SHI_MODE.SWITCH_23, expected: BASE },
    { hour: 23, mode: SHI_MODE.SWITCH_23, expected: { year: 2023, month: 6, day: 16 } },
    { hour: 0, mode: SHI_MODE.SWITCH_23, expected: BASE },
    { hour: 1, mode: SHI_MODE.SWITCH_23, expected: BASE },
    { hour: 22, mode: SHI_MODE.SWITCH_00, expected: BASE },
    { hour: 23, mode: SHI_MODE.SWITCH_00, expected: BASE },
    { hour: 0, mode: SHI_MODE.SWITCH_00, expected: BASE },
    { hour: 1, mode: SHI_MODE.SWITCH_00, expected: BASE },
  ];

  for (const c of cases) {
    const actual = calculator.resolveDayPillarDate(BASE.year, BASE.month, BASE.day, c.hour, c.mode);
    assert.deepStrictEqual(actual, c.expected, `${c.mode} hour=${c.hour}`);
  }

  const yearWrap = calculator.resolveDayPillarDate(2023, 12, 31, 23, SHI_MODE.SWITCH_23);
  assert.deepStrictEqual(yearWrap, { year: 2024, month: 1, day: 1 });
});

test('ST-03 year/month pillars at solar-term boundary use JST epoch, not OS TZ', async () => {
  const mangzhongIso = '2023-06-07T03:00:00+09:00';
  const risshunIso = '2023-02-05T11:00:00+09:00';
  const mangzhongEpoch = DateUtils.parseISOString(mangzhongIso).getTime();
  const risshunEpoch = DateUtils.parseISOString(risshunIso).getTime();

  const beforeMangzhong = DateUtils.toJstEpochMillis(2023, 6, 7, 2, 59);
  const atMangzhong = DateUtils.toJstEpochMillis(2023, 6, 7, 3, 0);
  assert.ok(beforeMangzhong < mangzhongEpoch, '02:59 must be before 芒種 epoch');
  assert.strictEqual(atMangzhong, mangzhongEpoch, '03:00 must equal 芒種 ISO epoch');

  const beforeMangzhongFortune = calculator.calculateFortune(2023, 6, 7, 2, 59);
  const atMangzhongFortune = calculator.calculateFortune(2023, 6, 7, 3, 0);
  assert.strictEqual(beforeMangzhongFortune.monthPillar.branch, '巳');
  assert.strictEqual(pillar(beforeMangzhongFortune, 'monthPillar'), '丁巳');
  assert.strictEqual(atMangzhongFortune.monthPillar.branch, '午');
  assert.strictEqual(pillar(atMangzhongFortune, 'monthPillar'), '戊午');

  const beforeRisshun = DateUtils.toJstEpochMillis(2023, 2, 5, 10, 59);
  const atRisshun = DateUtils.toJstEpochMillis(2023, 2, 5, 11, 0);
  assert.ok(beforeRisshun < risshunEpoch);
  assert.strictEqual(atRisshun, risshunEpoch);

  const beforeRisshunFortune = calculator.calculateFortune(2023, 2, 5, 10, 59);
  const atRisshunFortune = calculator.calculateFortune(2023, 2, 5, 11, 0);
  assert.strictEqual(pillar(beforeRisshunFortune, 'yearPillar'), '壬寅');
  assert.strictEqual(pillar(atRisshunFortune, 'yearPillar'), '癸卯');
  assert.strictEqual(beforeRisshunFortune.monthPillar.branch, '丑');
  assert.strictEqual(atRisshunFortune.monthPillar.branch, '寅');
});
