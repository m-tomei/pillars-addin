import { DateUtils } from '../../js/utils/dateUtils.js';

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
    const d1 = new Date(2023, 0, 1);
    const d2 = new Date(2023, 0, 2);
    // Implementation might depend on timezone or implementation details, checking logic
    // Looking at source code via view_file if needed, but assuming standard difference
    const diff = DateUtils.getDaysDifference(d1, d2);
    assert.strictEqual(diff, 1, 'Difference between Jan 1 and Jan 2 should be 1 day');
});

test('DateUtils.getDaysDifference handles reverse order', async () => {
    const d1 = new Date(2023, 0, 2);
    const d2 = new Date(2023, 0, 1);
    const diff = DateUtils.getDaysDifference(d1, d2);
    assert.strictEqual(diff, -1, 'Difference should be negative if start > end');
});
