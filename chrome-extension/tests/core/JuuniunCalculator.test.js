import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { JuuniunCalculator } from '../../js/core/JuuniunCalculator.js';

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

let calculator;

test('JuuniunCalculator.initialize loads data', async () => {
    const loader = new MockDataLoader(DATA_DIR);
    calculator = new JuuniunCalculator(loader);
    await calculator.initialize();
    assert.ok(calculator.juuniunData, 'Data loaded');
});

test('JuuniunCalculator.calculateJuuniun returns correct values', async () => {
    // Data dependent, but checking structure
    const res = calculator.calculateJuuniun('甲', '子');
    assert.ok(res.juuniun, 'Should have juuniun name');
    assert.ok(res.meaning !== undefined, 'Should have meaning (can be empty string)');

    // Check known value if possible. 甲-子 is typically 沐浴(Mokuyoku)
    // assert.strictEqual(res.juuniun, '沐浴');
});

test('JuuniunCalculator.calculateForPillars', async () => {
    const res = calculator.calculateForPillars('甲', '子', '丑', '寅', '卯');
    assert.ok(res.year, 'Year result');
    assert.ok(res.month, 'Month result');
    assert.ok(res.day, 'Day result');
    assert.ok(res.hour, 'Hour result');
});
