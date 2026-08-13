import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';
import { GreatFortuneCalculator } from '../../js/core/GreatFortuneCalculator.js';
import { DateUtils } from '../../js/utils/dateUtils.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

class MockDataLoader {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async loadJSON(filename) {
    return JSON.parse(fs.readFileSync(path.join(this.basePath, filename), 'utf8'));
  }

  async loadSolarTerms() {
    return this.loadJSON('solar_terms.json');
  }

  async loadStemBranchMaster() {
    return this.loadJSON('stem_branch_master.json');
  }
}

let calc;

test('GreatFortune time-correction tests initialize', async () => {
  const fortuneCalc = new FortuneCalculator(new MockDataLoader(DATA_DIR));
  await fortuneCalc.initialize();
  calc = new GreatFortuneCalculator(fortuneCalc);
  await calc.initialize();
  assert.strictEqual(calc.isForwardProgression(2023, '男性'), false, '2023 male is reverse');
});

test('GF-02 calculateStartAge receives hour/minute and is not noon-fixed', async () => {
  const beforeMangzhong = calc._getPreviousSolarTerm(2023, 6, 7, 0, 0);
  const afterMangzhong = calc._getPreviousSolarTerm(2023, 6, 7, 12, 0);
  const mangzhong = DateUtils.parseISOString('2023-06-07T03:00:00+09:00');
  const lixia = DateUtils.parseISOString('2023-05-07T09:00:00+09:00');

  assert.strictEqual(beforeMangzhong.getTime(), lixia.getTime(), '00:00 is before 芒種 so previous is 立夏');
  assert.strictEqual(afterMangzhong.getTime(), mangzhong.getTime(), '12:00 is after 芒種 so previous is 芒種');

  const ageMidnight = calc.calculateStartAge(2023, 6, 7, 0, 0, '男性');
  const ageNoon = calc.calculateStartAge(2023, 6, 7, 12, 0, '男性');
  assert.ok(ageMidnight !== ageNoon, 'start age must change when hour/minute change on the same calendar day');
});

test('GF-01 same solar term, time-of-day crosses elapsedDays/3 rounding boundary', async () => {
  const term = calc._getPreviousSolarTerm(2023, 6, 14, 12, 0);
  const noonBirth = DateUtils.createDate(2023, 6, 14, 12, 0);
  const afternoonBirth = DateUtils.createDate(2023, 6, 14, 15, 0);

  assert.strictEqual(
    calc._getPreviousSolarTerm(2023, 6, 14, 15, 0).getTime(),
    term.getTime(),
    'both times share the same previous term'
  );

  const noonElapsed = Math.abs(DateUtils.getElapsedDays(noonBirth, term));
  const afternoonElapsed = Math.abs(DateUtils.getElapsedDays(afternoonBirth, term));
  assert.strictEqual(Math.round(noonElapsed / 3), 2);
  assert.strictEqual(Math.round(afternoonElapsed / 3), 3);

  const calendarDaysNoon = Math.abs(DateUtils.getCalendarDaysDifference(noonBirth, term));
  const calendarDaysAfternoon = Math.abs(DateUtils.getCalendarDaysDifference(afternoonBirth, term));
  assert.strictEqual(calendarDaysNoon, calendarDaysAfternoon, 'calendar-day distance is unchanged');
  assert.strictEqual(
    Math.round(calendarDaysNoon / 3),
    Math.round(calendarDaysAfternoon / 3),
    'calendar-day rounding would not change the start age'
  );

  const ageNoon = calc.calculateStartAge(2023, 6, 14, 12, 0, '男性');
  const ageAfternoon = calc.calculateStartAge(2023, 6, 14, 15, 0, '男性');
  assert.strictEqual(ageNoon, 2);
  assert.strictEqual(ageAfternoon, 3);
});

test('GF-03 23:00 uses the given calendar day, not shi-mode next day', async () => {
  const ageAt23 = calc.calculateStartAge(2023, 6, 13, 23, 0, '男性');
  const ageIfNextDay = calc.calculateStartAge(2023, 6, 14, 23, 0, '男性');
  assert.strictEqual(ageAt23, 2);
  assert.strictEqual(ageIfNextDay, 3);
  assert.ok(ageAt23 !== ageIfNextDay, 'using next day would change start age');

  const term = calc._getPreviousSolarTerm(2023, 6, 13, 23, 0);
  const birth = DateUtils.createDate(2023, 6, 13, 23, 0);
  const elapsed = Math.abs(DateUtils.getElapsedDays(birth, term));
  assert.strictEqual(Math.round(elapsed / 3), 2);
});

test('GF-04 elapsed days are TZ-independent fractional days, not calendar integers', async () => {
  const birth = DateUtils.createDate(2023, 6, 15, 12, 0);
  const term = calc._getPreviousSolarTerm(2023, 6, 15, 12, 0);
  const elapsed = DateUtils.getElapsedDays(birth, term);
  const calendar = DateUtils.getCalendarDaysDifference(birth, term);
  const epochElapsed = (term.getTime() - birth.getTime()) / 86400000;

  assert.strictEqual(elapsed, epochElapsed);
  assert.ok(elapsed !== Math.trunc(elapsed), 'fractional days must be kept');
  assert.ok(Math.abs(elapsed) !== Math.abs(calendar), 'must not equal calendar-day integer difference');

  const age = calc.calculateStartAge(2023, 6, 15, 12, 0, '男性');
  assert.strictEqual(age, Math.max(0, Math.min(10, Math.round(Math.abs(elapsed) / 3))));
});
