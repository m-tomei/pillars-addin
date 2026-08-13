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

const V10_NOON = {
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

test('P8-T3 controller initialize', async () => {
  controller = await createController();
  assert.ok(controller.timeCorrectionService);
});

test('P8-T3 no correction, non-23h AppController path matches V1.0 pillars and 大運', async () => {
  const result = controller.runCalculation(V10_NOON);

  assert.strictEqual(result.correction.applied, true);
  assert.deepStrictEqual(result.correction.corrected, {
    year: 2023,
    month: 6,
    day: 15,
    hour: 12,
    minute: 0,
  });
  assert.strictEqual(pillar(result.fortune, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result.fortune, 'hourPillar'), '庚午');
  assert.strictEqual(result.displayYear, 2023);
  assert.strictEqual(result.cycles[0].stem, '丁');
  assert.strictEqual(result.cycles[0].branch, '巳');
  assert.strictEqual(result.cycles[0].ageStart, 3);
});

test('P8-T3 morning 08:30 without longitude/offset keeps V1.0 hour pillar', async () => {
  const result = controller.runCalculation({ ...V10_NOON, hour: 8, minute: 30 });
  assert.strictEqual(pillar(result.fortune, 'yearPillar'), '癸卯');
  assert.strictEqual(pillar(result.fortune, 'monthPillar'), '戊午');
  assert.strictEqual(pillar(result.fortune, 'dayPillar'), '甲辰');
  assert.strictEqual(pillar(result.fortune, 'hourPillar'), '戊辰');
});

test('P8 no-time 大運 matches explicit noon of the same calendar day', async () => {
  const noTime = controller.runCalculation({ ...V10_NOON, hour: null, minute: null });
  const noon = controller.runCalculation(V10_NOON);

  assert.strictEqual(noTime.correction.applied, false);
  assert.strictEqual(noTime.fortune.hourPillar, null);
  assert.strictEqual(noTime.cycles[0].ageStart, noon.cycles[0].ageStart);
  assert.strictEqual(`${noTime.cycles[0].stem}${noTime.cycles[0].branch}`, `${noon.cycles[0].stem}${noon.cycles[0].branch}`);
});
