import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { InputManager } from '../../js/app/InputManager.js';
import { MANUAL_PREFECTURE_VALUE, SHI_MODE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const master = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/prefecture_longitude.json'), 'utf8')
);

function managerWith(raw) {
  const formRenderer = { getValues: () => raw };
  const inputManager = new InputManager(formRenderer);
  inputManager.setLongitudeMaster(master);
  return inputManager;
}

const BASE = {
  year: '1990',
  month: '5',
  day: '1',
  hour: '8',
  minute: '30',
  gender: '男性',
  prefectureCode: '13',
  tzSign: '+',
  tzHour: '0',
  tzMinute: '0',
  shiMode: SHI_MODE.SWITCH_23,
  timeUnknown: false,
};

test('UI-06 hour without minute normalizes minute to 0', async () => {
  const parsed = managerWith({ ...BASE, minute: '' }).getFormInput();
  assert.strictEqual(parsed.hour, 8);
  assert.strictEqual(parsed.minute, 0);
});

test('empty hour without 時刻不明 is a form error', async () => {
  await assert.throws(
    async () => managerWith({ ...BASE, hour: '', minute: '15' }).getFormInput(),
    '時刻不明',
    'empty hour without checkbox should be rejected'
  );
});

test('時刻不明 skips time even if hour fields had values', async () => {
  const parsed = managerWith({ ...BASE, hour: '8', minute: '15', timeUnknown: true }).getFormInput();
  assert.strictEqual(parsed.hour, null);
  assert.strictEqual(parsed.minute, null);
  assert.strictEqual(parsed.timeUnknown, true);
});

test('non-numeric hour or minute is a form error', async () => {
  await assert.throws(
    async () => managerWith({ ...BASE, hour: 'abc' }).getFormInput(),
    '時',
    'non-numeric hour should be rejected'
  );
  await assert.throws(
    async () => managerWith({ ...BASE, minute: 'abc' }).getFormInput(),
    '分',
    'non-numeric minute should be rejected'
  );
});

test('invalid timezone sign is a form error', async () => {
  await assert.throws(
    async () => managerWith({
      ...BASE,
      prefectureCode: MANUAL_PREFECTURE_VALUE,
      tzSign: '*',
    }).getFormInput(),
    '時差',
    'invalid timezone sign should be rejected'
  );
});

test('TC-09 offset ±24:00 is a form error', async () => {
  await assert.throws(
    async () => managerWith({
      ...BASE,
      prefectureCode: MANUAL_PREFECTURE_VALUE,
      tzHour: '24',
      tzMinute: '0',
    }).getFormInput(),
    '時差',
    '+24:00 should be rejected'
  );
  await assert.throws(
    async () => managerWith({
      ...BASE,
      prefectureCode: MANUAL_PREFECTURE_VALUE,
      tzSign: '-',
      tzHour: '24',
      tzMinute: '0',
    }).getFormInput(),
    '時差',
    '-24:00 should be rejected'
  );
});

test('offset ±23:59 is accepted', async () => {
  const plus = managerWith({
    ...BASE,
    prefectureCode: MANUAL_PREFECTURE_VALUE,
    tzHour: '23',
    tzMinute: '59',
  }).getFormInput();
  assert.strictEqual(plus.offsetMinutes, 1439);
  const minus = managerWith({
    ...BASE,
    prefectureCode: MANUAL_PREFECTURE_VALUE,
    tzSign: '-',
    tzHour: '23',
    tzMinute: '59',
  }).getFormInput();
  assert.strictEqual(minus.offsetMinutes, -1439);
});

test('empty shiMode falls back to switch23', async () => {
  const parsed = managerWith({ ...BASE, shiMode: '' }).getFormInput();
  assert.strictEqual(parsed.shiMode, SHI_MODE.SWITCH_23);
});

test('invalid shiMode is a form error', async () => {
  await assert.throws(
    async () => managerWith({ ...BASE, shiMode: 'switch24' }).getFormInput(),
    '子時',
    'undefined shi mode should be rejected'
  );
});

test('unknown prefecture code is a form error', async () => {
  await assert.throws(
    async () => managerWith({ ...BASE, prefectureCode: '99' }).getFormInput(),
    '都道府県',
    'unknown prefecture should be rejected'
  );
});

test('prefecture selection forces timezone offset to 0', async () => {
  const parsed = managerWith({
    ...BASE,
    prefectureCode: '13',
    tzHour: '5',
    tzMinute: '30',
  }).getFormInput();
  assert.strictEqual(parsed.prefectureCode, '13');
  assert.strictEqual(parsed.offsetMinutes, 0);
});

test('手動 uses timezone offset and clears prefecture code', async () => {
  const parsed = managerWith({
    ...BASE,
    prefectureCode: MANUAL_PREFECTURE_VALUE,
    tzHour: '5',
    tzMinute: '30',
  }).getFormInput();
  assert.strictEqual(parsed.prefectureCode, null);
  assert.strictEqual(parsed.offsetMinutes, 330);
});
