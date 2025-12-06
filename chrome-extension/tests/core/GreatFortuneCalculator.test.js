import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';
import { GreatFortuneCalculator } from '../../js/core/GreatFortuneCalculator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

class MockDataLoader {
    constructor(basePath) { this.basePath = basePath; }
    async loadJSON(filename) {
        const filePath = path.join(this.basePath, filename);
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    async loadSolarTerms() { return this.loadJSON('solar_terms.json'); }
    async loadStemBranchMaster() { return this.loadJSON('stem_branch_master.json'); }
    async loadJuuniunMaster() { return this.loadJSON('juuniin_master.json'); }
    async loadNaonMaster() { return this.loadJSON('naon_master.json'); }
    async loadGokotongetsuketsu() { return this.loadJSON('gokotongetsuketsu.json'); }
}

let fortuneCalc;
let greatFortuneCalc;

test('GreatFortuneCalculator.initialize', async () => {
    const loader = new MockDataLoader(DATA_DIR);
    fortuneCalc = new FortuneCalculator(loader);
    await fortuneCalc.initialize();

    greatFortuneCalc = new GreatFortuneCalculator(fortuneCalc);
    await greatFortuneCalc.initialize();

    assert.ok(greatFortuneCalc.jiaziMap, 'JiaziMap initialized');
});

test('GreatFortuneCalculator.calculateStartAge', async () => {
    // 2023-06-15, Male
    const age = greatFortuneCalc.calculateStartAge(2023, 6, 15, '男性');

    // Debug info
    const isForward = greatFortuneCalc.isForwardProgression(2023, '男性');
    // We can't easily access private method _getPreviousSolarTerm directly unless we modify visibility or use reflection, 
    // but in JS valid to call private methods if not enforced by private fields #.
    // However, methods are likely accessible.
    const term = isForward ?
        greatFortuneCalc._getNextSolarTerm(2023, 6, 15) :
        greatFortuneCalc._getPreviousSolarTerm(2023, 6, 15);

    const birthDate = new Date(2023, 5, 15, 12, 0);
    const diff = (birthDate - term) / (1000 * 60 * 60 * 24);

    console.log(`    DEBUG: 2023-06-15 Male. IsForward: ${isForward}`);
    console.log(`    DEBUG: Term Date: ${term.toISOString()}`);
    console.log(`    DEBUG: Day Diff: ${diff}`);
    console.log(`    DEBUG: Calculated Age: ${age}`);

    assert.strictEqual(age, 3);
});

test('GreatFortuneCalculator.calculateCycles', async () => {
    // 2023-06-15 12:00, Male (Reverse)
    // Month Pillar: 戊午 (Earth Yang, Horse)
    // Reverse -> prev pillar is 丁巳 (Fire Yin, Snake)
    const cycles = greatFortuneCalc.calculateCycles(2023, 6, 15, 12, 0, '男性');

    assert.strictEqual(cycles.length, 10);
    assert.strictEqual(cycles[0].cycleNumber, 1);

    // First cycle should be 丁巳
    assert.strictEqual(cycles[0].stem, '丁');
    assert.strictEqual(cycles[0].branch, '巳');
});
