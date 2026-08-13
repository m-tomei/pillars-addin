import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FormRenderer } from '../../js/ui/FormRenderer.js';
import {
  DEFAULT_SHI_MODE,
  SHI_HELP_TEXT,
  SHI_MODE,
  TZ_HELP_TEXT,
} from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const master = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../../data/prefecture_longitude.json'), 'utf8')
);
const html = fs.readFileSync(path.resolve(__dirname, '../../sidepanel.html'), 'utf8');

function createRadio(value, checked = false) {
  return {
    value,
    checked,
    addEventListener(type, handler) {
      this._handler = handler;
    },
  };
}

function createSelect(value = '') {
  return {
    value,
    innerHTML: '',
    options: [],
    appendChild(child) {
      this.options.push(child);
      this.innerHTML += `<option value="${child.value}">${child.textContent}</option>`;
    },
  };
}

function createMockDocument() {
  const shi23 = createRadio(SHI_MODE.SWITCH_23, true);
  const shi00 = createRadio(SHI_MODE.SWITCH_00, false);
  const male = createRadio('男性', true);
  const female = createRadio('女性', false);
  const prefecture = createSelect('');
  const tzSign = createSelect('+');
  tzSign.value = '+';

  const elements = {
    'fortune-form': { reset() {}, addEventListener() {} },
    year: { value: '1990' },
    month: { value: '5' },
    day: { value: '1' },
    hour: { value: '' },
    minute: { value: '' },
    prefecture,
    'tz-sign': tzSign,
    'tz-hour': { value: '0' },
    'tz-minute': { value: '0' },
    'shi-mode-help': { textContent: SHI_HELP_TEXT[SHI_MODE.SWITCH_23] },
    'tz-help': { textContent: TZ_HELP_TEXT },
    'calculate-btn': {},
    'clear-btn': { addEventListener() {} },
    'paste-btn': { addEventListener() {} },
    'error-message': { textContent: '', style: { display: 'none' } },
  };

  return {
    getElementById(id) {
      return elements[id];
    },
    getElementsByName(name) {
      if (name === 'gender') return [male, female];
      if (name === 'shi-mode') return [shi23, shi00];
      return [];
    },
    createElement() {
      return { value: '', textContent: '' };
    },
    _elements: elements,
    _shi23: shi23,
    _shi00: shi00,
  };
}

test('UI-01 populatePrefectures adds 未選択 plus 47 prefectures', async () => {
  const renderer = new FormRenderer(createMockDocument());
  renderer.populatePrefectures(master);
  assert.strictEqual(renderer.elements.prefecture.options.length, 48);
  assert.strictEqual(renderer.elements.prefecture.options[0].textContent, '未選択');
  assert.strictEqual(master.prefectures.length, 47);
  const tokyo = renderer.elements.prefecture.options.find((o) => o.value === '13');
  assert.ok(tokyo);
  assert.strictEqual(tokyo.textContent, '東京都');
});

test('UI-02 and UI-03 default timezone 0 and shiMode switch23', async () => {
  const renderer = new FormRenderer(createMockDocument());
  const values = renderer.getValues();
  assert.strictEqual(values.tzSign, '+');
  assert.strictEqual(values.tzHour, '0');
  assert.strictEqual(values.tzMinute, '0');
  assert.strictEqual(values.shiMode, DEFAULT_SHI_MODE);
  renderer.reset();
  const afterReset = renderer.getValues();
  assert.strictEqual(afterReset.shiMode, SHI_MODE.SWITCH_23);
  assert.strictEqual(afterReset.tzSign, '+');
  assert.strictEqual(afterReset.tzHour, '0');
  assert.strictEqual(afterReset.tzMinute, '0');
  assert.strictEqual(afterReset.prefectureCode, '');
});

test('P4-T5 timezone and shi-mode help text exist and switch with mode', async () => {
  assert.ok(html.includes(TZ_HELP_TEXT));
  assert.ok(html.includes(SHI_HELP_TEXT[SHI_MODE.SWITCH_23]));
  assert.ok(html.includes('id="shi-mode-help"'));
  assert.ok(html.includes('id="tz-help"'));

  const doc = createMockDocument();
  const renderer = new FormRenderer(doc);
  assert.strictEqual(renderer.elements.shiModeHelp.textContent, SHI_HELP_TEXT[SHI_MODE.SWITCH_23]);

  doc._shi23.checked = false;
  doc._shi00.checked = true;
  renderer.updateShiHelp();
  assert.strictEqual(renderer.elements.shiModeHelp.textContent, SHI_HELP_TEXT[SHI_MODE.SWITCH_00]);
});
