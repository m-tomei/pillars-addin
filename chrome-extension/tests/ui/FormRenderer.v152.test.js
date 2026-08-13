import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FormRenderer } from '../../js/ui/FormRenderer.js';
import { MANUAL_PREFECTURE_VALUE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const master = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/prefecture_longitude.json'), 'utf8')
);
const html = fs.readFileSync(path.resolve(__dirname, '../../sidepanel.html'), 'utf8');
const css = fs.readFileSync(path.resolve(__dirname, '../../sidepanel.css'), 'utf8');

function createRadio(value, checked = false) {
  return { value, checked, addEventListener() {} };
}

function createSelect(value = '') {
  return {
    value,
    innerHTML: '',
    options: [],
    addEventListener() {},
    appendChild(child) {
      this.options.push(child);
    },
  };
}

function createMockDocument() {
  const prefecture = createSelect('');
  const hour = { value: '17', disabled: false };
  const minute = { value: '55', disabled: false };
  const timeUnknown = { checked: false, addEventListener() {} };
  const tzGroup = { style: { display: 'none' } };
  const elements = {
    'fortune-form': { reset() {}, addEventListener() {} },
    year: { value: '1966' },
    month: { value: '2' },
    day: { value: '8' },
    hour,
    minute,
    'time-unknown': timeUnknown,
    prefecture,
    'tz-group': tzGroup,
    'tz-sign': { value: '+' },
    'tz-hour': { value: '0' },
    'tz-minute': { value: '0' },
    'shi-mode-help': { textContent: '' },
    'tz-help': { textContent: '' },
    'calculate-btn': {},
    'clear-btn': { addEventListener() {} },
    'paste-btn': { addEventListener() {} },
    'error-message': { textContent: '', style: { display: 'none' } },
  };
  return {
    getElementById(id) { return elements[id]; },
    getElementsByName(name) {
      if (name === 'gender') return [createRadio('男性', true), createRadio('女性')];
      if (name === 'shi-mode') return [createRadio('switch23', true), createRadio('switch00')];
      return [];
    },
    createElement() { return { value: '', textContent: '' }; },
    _hour: hour,
    _minute: minute,
    _timeUnknown: timeUnknown,
    _tzGroup: tzGroup,
    _prefecture: prefecture,
    _elements: elements,
  };
}

test('V1.5.2 date and time stay on one row in CSS', async () => {
  assert.ok(css.includes('flex-wrap: nowrap'));
  assert.ok(html.includes('class="date-inputs"'));
  assert.ok(html.includes('class="time-inputs"'));
  assert.ok(html.includes('時刻不明'));
  assert.ok(!html.includes('placeholder="年"'));
  assert.ok(!html.includes('placeholder="月"'));
  assert.ok(!html.includes('placeholder="日"'));
  assert.ok(!html.includes('placeholder="時"'));
  assert.ok(!html.includes('placeholder="分"'));
});

test('V1.5.2 time-unknown disables hour and minute and clears them', async () => {
  const doc = createMockDocument();
  const renderer = new FormRenderer(doc);
  doc._timeUnknown.checked = true;
  renderer.updateTimeUnknownState();
  assert.strictEqual(doc._hour.disabled, true);
  assert.strictEqual(doc._minute.disabled, true);
  assert.strictEqual(doc._hour.value, '');
  assert.strictEqual(doc._minute.value, '');
  assert.strictEqual(renderer.getValues().timeUnknown, true);
  assert.strictEqual(renderer.getValues().hour, '');
});

test('V1.5.2 timezone group shows only when 手動 is selected', async () => {
  const doc = createMockDocument();
  const renderer = new FormRenderer(doc);
  renderer.populatePrefectures(master);
  assert.strictEqual(doc._tzGroup.style.display, 'none');

  doc._prefecture.value = MANUAL_PREFECTURE_VALUE;
  renderer.updateTimezoneVisibility();
  assert.strictEqual(doc._tzGroup.style.display, 'block');
  assert.strictEqual(renderer.getValues().prefectureCode, MANUAL_PREFECTURE_VALUE);

  doc._prefecture.value = '13';
  doc._elements['tz-hour'].value = '5';
  renderer.updateTimezoneVisibility();
  assert.strictEqual(doc._tzGroup.style.display, 'none');
  assert.strictEqual(doc._elements['tz-hour'].value, '0');
});

test('V1.5.2 paste with time unchecks 時刻不明; paste without time checks it', async () => {
  const doc = createMockDocument();
  const renderer = new FormRenderer(doc);
  renderer.setValues({ year: 1990, month: 5, day: 1, hour: 8, minute: 30, gender: '男性' });
  assert.strictEqual(doc._timeUnknown.checked, false);
  assert.strictEqual(doc._hour.disabled, false);
  assert.strictEqual(String(doc._hour.value), '8');

  renderer.setValues({ year: 1990, month: 5, day: 1, hour: null, minute: null, gender: '男性' });
  assert.strictEqual(doc._timeUnknown.checked, true);
  assert.strictEqual(doc._hour.disabled, true);
});
