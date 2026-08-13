import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AppController } from '../../js/app/AppController.js';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';
import { GreatFortuneCalculator } from '../../js/core/GreatFortuneCalculator.js';
import { JuuniunCalculator } from '../../js/core/JuuniunCalculator.js';
import { TsuuhenCalculator } from '../../js/core/TsuuhenCalculator.js';
import { TimeCorrectionService } from '../../js/core/TimeCorrectionService.js';
import { SHI_MODE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const master = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'prefecture_longitude.json'), 'utf8'));

class MockDataLoader {
  constructor(basePath) {
    this.basePath = basePath;
  }

  async loadJSON(filename) {
    return JSON.parse(fs.readFileSync(path.join(this.basePath, filename), 'utf8'));
  }

  async loadSolarTerms() { return this.loadJSON('solar_terms.json'); }
  async loadStemBranchMaster() { return this.loadJSON('stem_branch_master.json'); }
  async loadJuuniunMaster() { return this.loadJSON('juuniin_master.json'); }
  async loadPrefectureLongitude() { return JSON.parse(JSON.stringify(master)); }
}

function pillar(result, key) {
  return `${result[key].stem}${result[key].branch}`;
}

async function createController() {
  const loader = new MockDataLoader(DATA_DIR);
  const fortuneCalculator = new FortuneCalculator(loader);
  await fortuneCalculator.initialize();
  const greatFortuneCalculator = new GreatFortuneCalculator(fortuneCalculator);
  await greatFortuneCalculator.initialize();
  const juuniunCalculator = new JuuniunCalculator(loader);
  await juuniunCalculator.initialize();

  return new AppController({
    fortuneCalculator,
    greatFortuneCalculator,
    juuniunCalculator,
    tsuuhenCalculator: new TsuuhenCalculator(),
    timeCorrectionService: new TimeCorrectionService(master),
  });
}

const BASE_INPUT = {
  year: 2023,
  month: 6,
  day: 15,
  hour: 12,
  minute: 0,
  gender: '男性',
  prefectureCode: null,
  offsetMinutes: 0,
  shiMode: SHI_MODE.SWITCH_23,
};

let controller;

test('P5 controller initialize wiring', async () => {
  controller = await createController();
  assert.ok(controller.timeCorrectionService);
});

test('IX-01 22:50 plus 20min switch23 is 子 and next-day pillar; year/month stay on 23h', async () => {
  const result = controller.runCalculation({
    ...BASE_INPUT,
    hour: 22,
    minute: 50,
    offsetMinutes: 20,
    shiMode: SHI_MODE.SWITCH_23,
  });
  assert.deepStrictEqual(result.correction.corrected, {
    year: 2023, month: 6, day: 15, hour: 23, minute: 10,
  });
  assert.strictEqual(result.fortune.hourPillar.branch, '子');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '乙巳');
  assert.strictEqual(pillar(result.fortune, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
  assert.strictEqual(result.displayYear, 2023);
});

test('IX-02 23:50 plus 20min switch23 rolls to next day 00h without extra +1', async () => {
  const result = controller.runCalculation({
    ...BASE_INPUT,
    hour: 23,
    minute: 50,
    offsetMinutes: 20,
    shiMode: SHI_MODE.SWITCH_23,
  });
  assert.deepStrictEqual(result.correction.corrected, {
    year: 2023, month: 6, day: 16, hour: 0, minute: 10,
  });
  assert.strictEqual(result.fortune.hourPillar.branch, '子');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '乙巳');
  assert.strictEqual(pillar(result.fortune, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
});

test('IX-03 22:50 plus 20min switch00 is 亥 and same-day pillar', async () => {
  const result = controller.runCalculation({
    ...BASE_INPUT,
    hour: 22,
    minute: 50,
    offsetMinutes: 20,
    shiMode: SHI_MODE.SWITCH_00,
  });
  assert.strictEqual(result.fortune.hourPillar.branch, '亥');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
});

test('IX-04 23:50 plus 20min switch00 is 子 on the corrected calendar day', async () => {
  const result = controller.runCalculation({
    ...BASE_INPUT,
    hour: 23,
    minute: 50,
    offsetMinutes: 20,
    shiMode: SHI_MODE.SWITCH_00,
  });
  assert.strictEqual(result.fortune.hourPillar.branch, '子');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '乙巳');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
});

test('P5-T2 no-time path skips correction, hour pillar, and uses 12:00 for 大運', async () => {
  const calls = [];
  const original = controller.greatFortuneCalculator.calculateCycles.bind(controller.greatFortuneCalculator);
  controller.greatFortuneCalculator.calculateCycles = (...args) => {
    calls.push(args);
    return original(...args);
  };

  const result = controller.runCalculation({
    ...BASE_INPUT,
    hour: null,
    minute: null,
  });

  controller.greatFortuneCalculator.calculateCycles = original;

  assert.strictEqual(result.correction.applied, false);
  assert.strictEqual(result.correction.reason, 'no_time');
  assert.strictEqual(result.fortune.hourPillar, null);
  assert.strictEqual(result.displayYear, 2023);
  assert.strictEqual(calls[0][0], 2023);
  assert.strictEqual(calls[0][1], 6);
  assert.strictEqual(calls[0][2], 15);
  assert.strictEqual(calls[0][3], 12);
  assert.strictEqual(calls[0][4], 0);
});

test('P5-T3 fortune and great fortune receive the same t_corrected', async () => {
  const fortuneArgs = [];
  const cycleArgs = [];
  const origFortune = controller.fortuneCalculator.calculateFortune.bind(controller.fortuneCalculator);
  const origCycles = controller.greatFortuneCalculator.calculateCycles.bind(controller.greatFortuneCalculator);
  controller.fortuneCalculator.calculateFortune = (...args) => {
    fortuneArgs.push(args);
    return origFortune(...args);
  };
  controller.greatFortuneCalculator.calculateCycles = (...args) => {
    cycleArgs.push(args);
    return origCycles(...args);
  };

  const result = controller.runCalculation({
    ...BASE_INPUT,
    prefectureCode: '13',
    offsetMinutes: 60,
  });

  controller.fortuneCalculator.calculateFortune = origFortune;
  controller.greatFortuneCalculator.calculateCycles = origCycles;

  const t = result.correction.corrected;
  assert.strictEqual(result.correction.applied, true);
  assert.deepStrictEqual(fortuneArgs[0].slice(0, 5), [t.year, t.month, t.day, t.hour, t.minute]);
  assert.deepStrictEqual(cycleArgs[0].slice(0, 5), [t.year, t.month, t.day, t.hour, t.minute]);
});

test('ST-01 correction across 芒種 changes the month pillar', async () => {
  const before = controller.runCalculation({
    ...BASE_INPUT,
    month: 6,
    day: 7,
    hour: 2,
    minute: 50,
    offsetMinutes: 0,
  });
  const after = controller.runCalculation({
    ...BASE_INPUT,
    month: 6,
    day: 7,
    hour: 2,
    minute: 50,
    offsetMinutes: 20,
  });
  assert.strictEqual(before.fortune.monthPillar.branch, '巳');
  assert.strictEqual(after.correction.corrected.hour, 3);
  assert.strictEqual(after.fortune.monthPillar.branch, '午');
});

test('P5-T5 solar-term out of range surfaces as calculation error', async () => {
  await assert.throws(
    async () => {
      controller.runCalculation({
        ...BASE_INPUT,
        year: 2101,
        hour: 12,
        minute: 0,
      });
    },
    '見つかりません',
    'missing solar term data should throw'
  );

  const errors = [];
  controller.formRenderer = { hideError() {}, showError(message) { errors.push(message); } };
  controller.inputManager = {
    getFormInput: () => ({ ...BASE_INPUT, year: 2101, hour: 12, minute: 0 }),
  };
  controller.resultRenderer = { showResults() {} };
  await controller.handleCalculate();
  assert.ok(errors[0].includes('見つかりません'));
});

test('P5-T4 displayYear uses t_corrected year when crossing the year', async () => {
  const result = controller.runCalculation({
    ...BASE_INPUT,
    year: 2023,
    month: 12,
    day: 31,
    hour: 23,
    minute: 50,
    offsetMinutes: 20,
  });
  assert.strictEqual(result.correction.corrected.year, 2024);
  assert.strictEqual(result.displayYear, 2024);
});

test('handleCalculate passes displayYear and meta to showResults', async () => {
  const shown = [];
  const errors = [];
  controller.formRenderer = { hideError() {}, showError(message) { errors.push(message); } };
  controller.inputManager = {
    getFormInput: () => ({ ...BASE_INPUT, hour: 8, minute: 30, prefectureCode: '13' }),
  };
  controller.resultRenderer = {
    showResults(...args) { shown.push(args); },
  };

  await controller.handleCalculate();
  assert.strictEqual(errors.length, 0);
  assert.strictEqual(shown.length, 1);
  const meta = shown[0][5];
  assert.strictEqual(shown[0][4], meta.correction.corrected.year);
  assert.strictEqual(meta.correction.applied, true);
  assert.strictEqual(meta.shiMode, SHI_MODE.SWITCH_23);
});

test('P5-T6 missing longitude master fails initialization', async () => {
  const errors = [];
  const app = new AppController({
    formRenderer: {
      showError(message) { errors.push(message); },
      populatePrefectures() {},
      onSubmit() {},
      onClear() {},
      onPaste() {},
    },
    resultRenderer: { onSavePNG() {} },
    inputManager: { setLongitudeMaster() {} },
    dataLoader: {
      async loadPrefectureLongitude() {
        throw new Error('経度マスタを読み込めません');
      },
    },
  });
  await app.initialize();
  assert.strictEqual(app.initialized, false);
  assert.ok(errors[0].includes('初期化'));
  assert.ok(errors[0].includes('経度マスタ'));
});

test('P5-T6 malformed longitude master fails initialization', async () => {
  const errors = [];
  const app = new AppController({
    formRenderer: {
      showError(message) { errors.push(message); },
      populatePrefectures() {},
      onSubmit() {},
      onClear() {},
      onPaste() {},
    },
    resultRenderer: { onSavePNG() {} },
    inputManager: { setLongitudeMaster() {} },
    dataLoader: {
      async loadPrefectureLongitude() {
        return { referenceMeridianEast: 135, prefectures: [] };
      },
    },
  });
  await app.initialize();
  assert.strictEqual(app.initialized, false);
  assert.ok(errors[0].includes('初期化'));
});
