import { InputParser } from '../../js/utils/InputParser.js';
import { DEFAULT_SHI_MODE, SHI_MODE } from '../../js/utils/constants.js';

test('InputParser maps prefecture, offset, and shiMode', async () => {
  const parsed = InputParser.parseManualInput(1990, 5, 1, 8, 30, '男性', {
    prefectureCode: '13',
    tzSign: '+',
    tzHour: 5,
    tzMinute: 30,
    shiMode: SHI_MODE.SWITCH_00,
  });
  assert.strictEqual(parsed.prefectureCode, '13');
  assert.strictEqual(parsed.offsetMinutes, 330);
  assert.strictEqual(parsed.shiMode, SHI_MODE.SWITCH_00);
  assert.strictEqual(parsed.hour, 8);
  assert.strictEqual(parsed.minute, 30);
});

test('InputParser empty shiMode falls back to switch23', async () => {
  const parsed = InputParser.parseManualInput(1990, 5, 1, 8, 30, '女性', {
    prefectureCode: '',
    tzSign: '+',
    tzHour: '',
    tzMinute: '',
    shiMode: '',
  });
  assert.strictEqual(parsed.shiMode, DEFAULT_SHI_MODE);
  assert.strictEqual(parsed.prefectureCode, null);
  assert.strictEqual(parsed.offsetMinutes, 0);
});

test('InputParser keeps empty minute as null when hour is present', async () => {
  const parsed = InputParser.parseManualInput(1990, 5, 1, 8, '', '男性');
  assert.strictEqual(parsed.hour, 8);
  assert.strictEqual(parsed.minute, null);
});

test('InputParser clipboard does not set prefecture or shiMode', async () => {
  const parsed = InputParser.parseClipboardText('1990-05-01 08:30 男性 東京');
  assert.strictEqual(parsed.year, 1990);
  assert.strictEqual(parsed.hour, 8);
  assert.strictEqual(parsed.gender, '男性');
  assert.strictEqual(parsed.prefectureCode, undefined);
  assert.strictEqual(parsed.shiMode, undefined);
});
