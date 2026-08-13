import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { TimeCorrectionService } from '../../js/core/TimeCorrectionService.js';
import { DateUtils } from '../../js/utils/dateUtils.js';
import { JST_REFERENCE_LONGITUDE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER_PATH = path.resolve(__dirname, '../../data/prefecture_longitude.json');
const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
const service = new TimeCorrectionService(master);

const BASE = { year: 1990, month: 5, day: 1, hour: 8, minute: 30 };

function expectedLongitudeOffset(longitudeEast) {
  return Math.round(4 * (longitudeEast - JST_REFERENCE_LONGITUDE));
}

test('TC-01 offset 0 and no prefecture keeps input and applied true', async () => {
  const result = service.correct({ ...BASE, prefectureCode: null, offsetMinutes: 0 });
  assert.strictEqual(result.applied, true);
  assert.deepStrictEqual(result.corrected, BASE);
  assert.strictEqual(result.offsetMinutes, 0);
  assert.strictEqual(result.longitudeOffsetMinutes, 0);
  assert.strictEqual(result.totalOffsetMinutes, 0);
  assert.strictEqual(result.prefecture, null);
  assert.strictEqual(result.display.statusText, '適用');
  assert.strictEqual(result.display.inputText, '1990-05-01 08:30');
  assert.strictEqual(result.display.correctedText, '1990-05-01 08:30');
  assert.strictEqual(result.display.offsetText, '+00:00（0分）');
});

test('TC-02 Tokyo only adds +19 minutes and display includes +19分 / 東京都', async () => {
  const tokyo = master.prefectures.find((p) => p.code === '13');
  const lonOffset = expectedLongitudeOffset(tokyo.longitudeEast);
  assert.strictEqual(lonOffset, 19, 'Tokyo longitude must round to +19');

  const result = service.correct({ ...BASE, prefectureCode: '13', offsetMinutes: 0 });
  assert.strictEqual(result.applied, true);
  assert.strictEqual(result.longitudeOffsetMinutes, 19);
  assert.strictEqual(result.totalOffsetMinutes, 19);
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 5, day: 1, hour: 8, minute: 49 });
  assert.strictEqual(result.prefecture.name, '東京都');
  assert.ok(result.display.longitudeText.includes('+19分'), result.display.longitudeText);
  assert.ok(result.display.longitudeText.includes('東京都'), result.display.longitudeText);
  assert.strictEqual(result.display.correctedText, '1990-05-01 08:49');
});

test('TC-03 Hyogo near Akashi is nearly 0 minutes', async () => {
  const hyogo = master.prefectures.find((p) => p.code === '28');
  const lonOffset = expectedLongitudeOffset(hyogo.longitudeEast);
  const result = service.correct({ ...BASE, prefectureCode: '28', offsetMinutes: 0 });
  assert.strictEqual(result.longitudeOffsetMinutes, lonOffset);
  assert.ok(Math.abs(result.longitudeOffsetMinutes) <= 1, 'Hyogo offset should be nearly 0');
  assert.strictEqual(result.prefecture.name, '兵庫県');
  assert.deepStrictEqual(
    result.corrected,
    DateUtils.addMinutes(BASE.year, BASE.month, BASE.day, BASE.hour, BASE.minute, lonOffset)
  );
});

test('TC-04 timezone offset +60 adds one hour', async () => {
  assert.strictEqual(TimeCorrectionService.parseOffset('+', 1, 0), 60);
  assert.strictEqual(TimeCorrectionService.formatOffset(60), '+01:00');
  const result = service.correct({ ...BASE, prefectureCode: null, offsetMinutes: 60 });
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 5, day: 1, hour: 9, minute: 30 });
  assert.strictEqual(result.offsetMinutes, 60);
  assert.strictEqual(result.longitudeOffsetMinutes, 0);
  assert.strictEqual(result.totalOffsetMinutes, 60);
  assert.strictEqual(result.display.offsetText, '+01:00（60分）');
});

test('TC-05 timezone and longitude offsets are summed', async () => {
  const result = service.correct({ ...BASE, prefectureCode: '13', offsetMinutes: 60 });
  assert.strictEqual(result.totalOffsetMinutes, 79);
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 5, day: 1, hour: 9, minute: 49 });
  assert.strictEqual(result.display.correctedText, '1990-05-01 09:49');
});

test('TC-06 23:50 plus 20 minutes rolls to next day 00:10', async () => {
  const result = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 23,
    minute: 50,
    prefectureCode: null,
    offsetMinutes: 20,
  });
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 5, day: 2, hour: 0, minute: 10 });
  assert.strictEqual(result.display.correctedText, '1990-05-02 00:10');
});

test('TC-07 00:10 minus 20 minutes rolls to previous day 23:50', async () => {
  const result = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 0,
    minute: 10,
    prefectureCode: null,
    offsetMinutes: -20,
  });
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 4, day: 30, hour: 23, minute: 50 });
  assert.strictEqual(result.display.correctedText, '1990-04-30 23:50');
});

test('TC-08 offset ±23:59 is accepted by the service', async () => {
  assert.strictEqual(TimeCorrectionService.parseOffset('+', 23, 59), 1439);
  assert.strictEqual(TimeCorrectionService.parseOffset('-', 23, 59), -1439);
  assert.strictEqual(TimeCorrectionService.formatOffset(1439), '+23:59');
  assert.strictEqual(TimeCorrectionService.formatOffset(-1439), '-23:59');

  const plus = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 12,
    minute: 0,
    prefectureCode: null,
    offsetMinutes: 1439,
  });
  assert.deepStrictEqual(plus.corrected, { year: 1990, month: 5, day: 2, hour: 11, minute: 59 });
  assert.strictEqual(plus.applied, true);

  const minus = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 12,
    minute: 0,
    prefectureCode: null,
    offsetMinutes: -1439,
  });
  assert.deepStrictEqual(minus.corrected, { year: 1990, month: 4, day: 30, hour: 12, minute: 1 });
});

test('TC-10 unknown prefecture throws an internal error', async () => {
  await assert.throws(
    async () => {
      service.correct({ ...BASE, prefectureCode: '99', offsetMinutes: 0 });
    },
    '都道府県',
    'unknown prefecture code should throw'
  );
});

test('TC-10 malformed longitude master throws during initialization', async () => {
  const missingReference = { ...master, referenceMeridianEast: undefined };
  await assert.throws(
    async () => {
      new TimeCorrectionService(missingReference);
    },
    '経度マスタが不正',
    'missing reference meridian should be rejected'
  );

  const missingLongitude = {
    ...master,
    prefectures: master.prefectures.map((prefecture, index) =>
      index === 0 ? { ...prefecture, longitudeEast: undefined } : prefecture
    ),
  };
  await assert.throws(
    async () => {
      new TimeCorrectionService(missingLongitude);
    },
    '経度マスタが不正',
    'missing longitude should be rejected'
  );
});

test('TC-11 January 31 plus one day of minutes becomes February 1', async () => {
  const result = service.correct({
    year: 2023,
    month: 1,
    day: 31,
    hour: 12,
    minute: 0,
    prefectureCode: null,
    offsetMinutes: 1440,
  });
  assert.deepStrictEqual(result.corrected, { year: 2023, month: 2, day: 1, hour: 12, minute: 0 });
});

test('TC-12 December 31 23:50 plus 20 minutes becomes next year 00:10', async () => {
  const result = service.correct({
    year: 2023,
    month: 12,
    day: 31,
    hour: 23,
    minute: 50,
    prefectureCode: null,
    offsetMinutes: 20,
  });
  assert.deepStrictEqual(result.corrected, { year: 2024, month: 1, day: 1, hour: 0, minute: 10 });
});

test('TC-13 leap day: Feb 28 plus 20 minutes becomes Feb 29', async () => {
  const result = service.correct({
    year: 2024,
    month: 2,
    day: 28,
    hour: 23,
    minute: 50,
    prefectureCode: null,
    offsetMinutes: 20,
  });
  assert.deepStrictEqual(result.corrected, { year: 2024, month: 2, day: 29, hour: 0, minute: 10 });
});

test('TC-14 multi-day offset +3000 minutes matches day and time', async () => {
  const result = service.correct({ ...BASE, prefectureCode: null, offsetMinutes: 3000 });
  assert.deepStrictEqual(result.corrected, { year: 1990, month: 5, day: 3, hour: 10, minute: 30 });
  assert.deepStrictEqual(
    result.corrected,
    DateUtils.addMinutes(BASE.year, BASE.month, BASE.day, BASE.hour, BASE.minute, 3000)
  );
});
