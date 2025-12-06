import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

class MockDataLoader {
    constructor(basePath) {
        this.basePath = basePath;
    }

    async loadJSON(filename) {
        const filePath = path.join(this.basePath, filename);
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    }

    async loadSolarTerms() { return this.loadJSON('solar_terms.json'); }
    async loadStemBranchMaster() { return this.loadJSON('stem_branch_master.json'); }
    async loadJuuniunMaster() { return this.loadJSON('juuniin_master.json'); }
    async loadNaonMaster() { return this.loadJSON('naon_master.json'); }
    async loadGokotongetsuketsu() { return this.loadJSON('gokotongetsuketsu.json'); }
}

let calculator;

test('FortuneCalculator.initialize loads data', async () => {
    const loader = new MockDataLoader(DATA_DIR);
    calculator = new FortuneCalculator(loader);
    await calculator.initialize();
    // Check that solarTermsData is loaded (NOT solarTerms)
    assert.ok(calculator.solarTermsData, 'Solar terms data should be loaded');
});

test('FortuneCalculator.calculateFortune returns correct structure', async () => {
    // 2024-01-01 12:00
    const result = await calculator.calculateFortune(2024, 1, 1, 12, 0);

    // console.log output removed to avoid encoding issues

    assert.ok(result.yearPillar, 'Should have year pillar');
    assert.ok(result.monthPillar, 'Should have month pillar');
    assert.ok(result.dayPillar, 'Should have day pillar');
    assert.ok(result.hourPillar, 'Should have hour pillar');

    // Basic validation of types
    assert.strictEqual(typeof result.yearPillar.stem, 'string', 'Stem should be string');
    assert.strictEqual(typeof result.yearPillar.branch, 'string', 'Branch should be string');
});

test('FortuneCalculator.calculateFortune handles standard date (2023-06-15)', async () => {
    // 2023-06-15 12:00
    // 2023 (癸卯), 6月 (芒種後 -> 戊午), 15日
    const result = await calculator.calculateFortune(2023, 6, 15, 12, 0);

    // 年柱: 癸卯
    assert.strictEqual(result.yearPillar.stem, '癸', 'Year Stem 2023');
    assert.strictEqual(result.yearPillar.branch, '卯', 'Year Branch 2023');

    // 月柱: 戊午 (2023年の芒種は6/6, 小暑は7/7なので6/15は午月)
    assert.strictEqual(result.monthPillar.stem, '戊', 'Month Stem June 2023');
    assert.strictEqual(result.monthPillar.branch, '午', 'Month Branch June 2023');
});
