import { DateUtils } from '../../js/utils/dateUtils.js';
import { JST_OFFSET_MS } from '../../js/utils/constants.js';

test('DateUtils.isValidDate checks valid dates', async () => {
    assert.strictEqual(DateUtils.isValidDate(2023, 1, 1), true, '2023-01-01 should be valid');
    assert.strictEqual(DateUtils.isValidDate(2024, 2, 29), true, '2024-02-29 (leap year) should be valid');
});

test('DateUtils.isValidDate checks invalid dates', async () => {
    assert.strictEqual(DateUtils.isValidDate(2023, 13, 1), false, 'Month 13 should be invalid');
    assert.strictEqual(DateUtils.isValidDate(2023, 1, 32), false, 'Day 32 should be invalid');
    assert.strictEqual(DateUtils.isValidDate(2023, 2, 30), false, 'Feb 30 should be invalid');
    assert.strictEqual(DateUtils.isValidDate(2023, 2, 29), false, '2023 Feb 29 (non-leap year) should be invalid');
});

test('DateUtils.getDaysDifference calculates correctly', async () => {
    const d1 = DateUtils.createDate(2023, 1, 1);
    const d2 = DateUtils.createDate(2023, 1, 2);
    const diff = DateUtils.getDaysDifference(d1, d2);
    assert.strictEqual(diff, 1, 'Difference between Jan 1 and Jan 2 should be 1 day');
});

test('DateUtils.getDaysDifference handles reverse order', async () => {
    const d1 = DateUtils.createDate(2023, 1, 2);
    const d2 = DateUtils.createDate(2023, 1, 1);
    const diff = DateUtils.getDaysDifference(d1, d2);
    assert.strictEqual(diff, -1, 'Difference should be negative if start > end');
});

test('DU-01 toJstEpochMillis matches Date.UTC minus 9h', async () => {
    const actual = DateUtils.toJstEpochMillis(1990, 5, 1, 8, 30);
    const expected = Date.UTC(1990, 4, 1, 8, 30) - JST_OFFSET_MS;
    assert.strictEqual(actual, expected, 'toJstEpochMillis should be UTC minus 9 hours');
});

test('DU-02 parseISOString keeps +09:00 offset', async () => {
    const parsed = DateUtils.parseISOString('1990-05-01T08:30:00+09:00');
    const expected = DateUtils.toJstEpochMillis(1990, 5, 1, 8, 30);
    assert.strictEqual(parsed.getTime(), expected, 'ISO +09:00 should match toJstEpochMillis');
});

test('DU-03 createDate getTime matches toJstEpochMillis', async () => {
    const date = DateUtils.createDate(1990, 5, 1, 8, 30);
    assert.strictEqual(
        date.getTime(),
        DateUtils.toJstEpochMillis(1990, 5, 1, 8, 30),
        'createDate instant should equal toJstEpochMillis'
    );
});

test('DU-04 getCalendarDaysDifference uses JST calendar days', async () => {
    const d1 = DateUtils.createDate(2023, 1, 1, 23, 0);
    const d2 = DateUtils.createDate(2023, 1, 2, 1, 0);
    assert.strictEqual(DateUtils.getCalendarDaysDifference(d1, d2), 1, 'same-calendar-next-day should be 1');
    assert.strictEqual(DateUtils.getCalendarDaysDifference(d1, d1), 0, 'same instant should be 0');
});

test('DU-05 getElapsedDays keeps fractional days', async () => {
    const d1 = DateUtils.createDate(2023, 1, 1, 0, 0);
    const d2 = DateUtils.createDate(2023, 1, 1, 12, 0);
    assert.strictEqual(DateUtils.getElapsedDays(d1, d2), 0.5, '12 hours should be 0.5 days');
});

test('addMinutes same-day adjustment', async () => {
    const result = DateUtils.addMinutes(1990, 5, 1, 8, 30, 19);
    assert.deepStrictEqual(result, { year: 1990, month: 5, day: 1, hour: 8, minute: 49 });
});

test('addMinutes crosses into next day', async () => {
    const result = DateUtils.addMinutes(1990, 5, 1, 23, 50, 20);
    assert.deepStrictEqual(result, { year: 1990, month: 5, day: 2, hour: 0, minute: 10 });
});

test('addMinutes crosses into previous day with negative remainder', async () => {
    const result = DateUtils.addMinutes(1990, 5, 1, 0, 10, -20);
    assert.deepStrictEqual(result, { year: 1990, month: 4, day: 30, hour: 23, minute: 50 });
});

test('addDays crosses month end', async () => {
    const result = DateUtils.addDays(1990, 1, 31, 1);
    assert.deepStrictEqual(result, { year: 1990, month: 2, day: 1 });
});

test('addMinutes crosses year end', async () => {
    const result = DateUtils.addMinutes(1990, 12, 31, 23, 50, 20);
    assert.deepStrictEqual(result, { year: 1991, month: 1, day: 1, hour: 0, minute: 10 });
});

test('addDays leap day', async () => {
    const leap = DateUtils.addDays(2024, 2, 28, 1);
    assert.deepStrictEqual(leap, { year: 2024, month: 2, day: 29 });
    const nonLeap = DateUtils.addDays(2023, 2, 28, 1);
    assert.deepStrictEqual(nonLeap, { year: 2023, month: 3, day: 1 });
});

test('addMinutes multi-day offset', async () => {
    const result = DateUtils.addMinutes(1990, 5, 1, 0, 0, 3000);
    assert.deepStrictEqual(result, { year: 1990, month: 5, day: 3, hour: 2, minute: 0 });
});
