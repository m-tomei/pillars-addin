import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { FortuneCalculator } from '../../js/core/FortuneCalculator.js';
import { GreatFortuneCalculator } from '../../js/core/GreatFortuneCalculator.js';
import { JuuniunCalculator } from '../../js/core/JuuniunCalculator.js';
import { TsuuhenCalculator } from '../../js/core/TsuuhenCalculator.js';
import { DayMasterStrengthAssessor } from '../../js/core/DayMasterStrengthAssessor.js';
import { KakkyokuCalculator } from '../../js/core/KakkyokuCalculator.js';
import { ByoyakuCalculator } from '../../js/core/ByoyakuCalculator.js';
import { GouChuuCalculator } from '../../js/core/GouChuuCalculator.js';
import { KishouAssessor } from '../../js/core/KishouAssessor.js';
import { KeizenAnalyzer } from '../../js/core/KeizenAnalyzer.js';
import { DaiunHyoukaCalculator } from '../../js/core/DaiunHyoukaCalculator.js';
import { getByoyakuPipelinePlan, runOptionalDiagnostics } from '../../js/app/byoyakuPipeline.js';
import { ResultRenderer } from '../../js/ui/ResultRenderer.js';
import { STEM_ELEMENTS } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');
const FIXTURE_PATH = path.resolve(
    __dirname,
    '../../docs/design/病薬表示機能_詳細設計/fixtures/acceptance_scenarios.json'
);

class MockDataLoader {
    constructor(basePath) { this.basePath = basePath; }
    async loadJSON(filename) {
        return JSON.parse(fs.readFileSync(path.join(this.basePath, filename), 'utf8'));
    }
    async loadSolarTerms() { return this.loadJSON('solar_terms.json'); }
    async loadStemBranchMaster() { return this.loadJSON('stem_branch_master.json'); }
    async loadJuuniunMaster() { return this.loadJSON('juuniin_master.json'); }
    async loadNaonMaster() { return this.loadJSON('naon_master.json'); }
    async loadGokotongetsuketsu() { return this.loadJSON('gokotongetsuketsu.json'); }
    async loadKakkyokuRules() { return this.loadJSON('kakkyoku_rules.json'); }
}

function approxEqual(actual, expected, eps = 0.02) {
    return Math.abs(actual - expected) <= eps;
}

function createDomStub() {
    const nodes = new Map();
    const makeNode = () => ({
        style: { display: 'none' },
        innerHTML: '',
        checked: false,
        addEventListener() {},
        querySelectorAll() { return []; }
    });
    global.document = {
        getElementById(id) {
            if (!nodes.has(id)) nodes.set(id, makeNode());
            return nodes.get(id);
        }
    };
    return nodes;
}

function assertPillars(fortune, expected, scenarioId) {
    const pairs = [
        ['year', fortune.yearPillar],
        ['month', fortune.monthPillar],
        ['day', fortune.dayPillar],
        ['hour', fortune.hourPillar]
    ];
    for (const [key, pillar] of pairs) {
        assert.strictEqual(
            `${pillar.stem}${pillar.branch}`,
            `${expected[key].stem}${expected[key].branch}`,
            `${scenarioId} ${key}柱`
        );
    }
}

let engines;
let scenarios;

test('Acceptance.setup - エンジンとfixtureを初期化', async () => {
    const loader = new MockDataLoader(DATA_DIR);
    const stemBranchData = await loader.loadStemBranchMaster();
    const kakkyokuRules = await loader.loadKakkyokuRules();

    const fortuneCalculator = new FortuneCalculator(loader);
    await fortuneCalculator.initialize();
    const greatFortuneCalculator = new GreatFortuneCalculator(fortuneCalculator);
    await greatFortuneCalculator.initialize();
    const juuniunCalculator = new JuuniunCalculator(loader);
    await juuniunCalculator.initialize();
    const tsuuhenCalculator = new TsuuhenCalculator();

    engines = {
        fortuneCalculator,
        greatFortuneCalculator,
        juuniunCalculator,
        tsuuhenCalculator,
        deps: {
            kishouAssessor: new KishouAssessor(),
            gouChuuCalculator: new GouChuuCalculator(),
            strengthAssessor: new DayMasterStrengthAssessor(stemBranchData),
            kakkyokuCalculator: new KakkyokuCalculator(stemBranchData),
            keizenAnalyzer: new KeizenAnalyzer(kakkyokuRules),
            byoyakuCalculator: new ByoyakuCalculator(kakkyokuRules),
            daiunHyoukaCalculator: new DaiunHyoukaCalculator(
                tsuuhenCalculator, new GouChuuCalculator()
            )
        }
    };

    scenarios = JSON.parse(fs.readFileSync(FIXTURE_PATH, 'utf8')).scenarios;
    assert.strictEqual(scenarios.length, 7, 'S-01〜S-07');
});

async function runScenario(scenario) {
    const { year, month, day, hour, minute, gender } = scenario.input;
    const fortune = await engines.fortuneCalculator.calculateFortune(
        year, month, day, hour, minute
    );
    const juuniunResults = engines.juuniunCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.branch,
        fortune.monthPillar.branch,
        fortune.dayPillar.branch,
        fortune.hourPillar ? fortune.hourPillar.branch : null
    );
    const tsuuhenResults = engines.tsuuhenCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.stem,
        fortune.monthPillar.stem,
        fortune.hourPillar ? fortune.hourPillar.stem : null
    );
    const greatFortuneCycles = engines.greatFortuneCalculator.calculateCycles(
        year, month, day, hour, minute, gender
    );
    const optional = runOptionalDiagnostics(engines.deps, {
        byoyakuEnabled: scenario.byoyakuEnabled,
        fortune,
        juuniunResults,
        tsuuhenResults,
        greatFortuneCycles
    });
    return { fortune, juuniunResults, tsuuhenResults, greatFortuneCycles, optional };
}

test('Acceptance S-01 - OFFは四柱一致・optional非実行・病薬非表示', async () => {
    const scenario = scenarios.find(s => s.id === 'S-01');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-01');

    const plan = getByoyakuPipelinePlan(false);
    assert.strictEqual(plan.showByoyakuSection, false);
    assert.strictEqual(optional.byoyakuResult, null);
    assert.strictEqual(optional.kishouResult, null);
    assert.strictEqual(optional.kakkyokuResult, null);

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.showResults(
        fortune, {}, {}, [], scenario.input.year,
        null, null, null, null, null
    );
    assert.strictEqual(
        renderer.elements.kakkyokuByoyakuSection.style.display,
        'none'
    );
});

test('Acceptance S-02 - 複数診断・枯/生', async () => {
    const scenario = scenarios.find(s => s.id === 'S-02');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-02');

    const { strengthResult, kakkyokuResult, byoyakuResult } = optional;
    assert.strictEqual(strengthResult.strength, scenario.expectedCurrent.strength);
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);
    assert.strictEqual(kakkyokuResult.isEstablished, scenario.expectedCurrent.isEstablished);
    assert.strictEqual(byoyakuResult.fourDisease, scenario.expectedCurrent.fourDisease);
    assert.strictEqual(
        byoyakuResult.fourMedicine,
        scenario.expectedAfterR01?.fourMedicine || scenario.expectedCurrent.fourMedicine
    );

    for (const expected of scenario.expectedCurrent.diagnoses) {
        const hit = byoyakuResult.diagnoses.find(d => d.disease.name.includes(expected.disease));
        assert.ok(hit, `診断「${expected.disease}」がある`);
        assert.ok(hit.medicine.name.includes(expected.medicine), `薬「${expected.medicine}」`);
        if (expected.medicineExists === false) {
            assert.strictEqual(hit.medicine.exists, false, '官殺は薬なし');
        }
        if (expected.medicineExists === true) {
            assert.strictEqual(hit.medicine.exists, true, '財星は薬あり');
            if (expected.medicineLocationIncludes) {
                assert.ok(
                    String(hit.medicine.location || '').includes(expected.medicineLocationIncludes),
                    `薬所在に${expected.medicineLocationIncludes}`
                );
            }
        }
    }

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({ strengthResult, kakkyokuResult, byoyakuResult });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】枯'), '枯を明示');
    assert.ok(html.includes('→ 生'), '生を明示');
    assert.strictEqual((html.match(/data-block="diagnosis"/g) || []).length, 2, '用神損傷の2診断だけを表示');
    assert.strictEqual((html.match(/調候（温める）・火/g) || []).length, 1, '喜忌の調候薬を重複させない');
});

test('Acceptance S-03 - 丑月気象は寒・温める', async () => {
    const scenario = scenarios.find(s => s.id === 'S-03');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-03');

    const { kishouResult, byoyakuResult, kakkyokuResult } = optional;
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);
    assert.strictEqual(byoyakuResult.fourDisease, scenario.expectedCurrent.fourDisease);
    assert.strictEqual(byoyakuResult.fourMedicine, scenario.expectedCurrent.fourMedicine);
    assert.ok(byoyakuResult.disease.name.includes(scenario.expectedCurrent.disease));

    assert.strictEqual(
        kishouResult.scores?.baseTemp,
        scenario.expectedAfterKishou.baseTemp,
        '丑月baseTempは寒'
    );
    assert.strictEqual(
        kishouResult.temperature,
        scenario.expectedAfterKishou.temperature,
        'TH-4後の表示気温は涼'
    );
    assert.strictEqual(
        kishouResult.humidity,
        scenario.expectedAfterKishou.humidity,
        'TH-5で燥'
    );
    assert.strictEqual(
        kishouResult.choukou.direction,
        scenario.expectedAfterKishou.choukouDirection
    );
    for (const el of scenario.expectedAfterKishou.primaryElementsIncludes) {
        assert.ok(
            kishouResult.choukou.primaryElements.includes(el),
            `調候primaryに${el}`
        );
    }

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({
        strengthResult: optional.strengthResult,
        kakkyokuResult,
        byoyakuResult
    });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    const order = ['kishou', 'keizen', 'strength', 'four-disease', 'diagnosis', 'balance', 'kiki']
        .map(name => html.indexOf(`data-block="${name}"`));
    for (let i = 1; i < order.length; i++) {
        assert.ok(order[i] > order[i - 1], `S-03 表示順 ${i}`);
    }
    assert.ok(
        html.includes('【気象】寒') || html.includes('【気象】涼'),
        '気象寒側を表示'
    );
    assert.ok(html.includes('温める'), '調候温めるを表示');
    assert.strictEqual(
        (html.match(/data-block="diagnosis"/g) || []).length,
        1,
        '気象は上段ブロックと重複診断しない'
    );
});

test('Acceptance S-04 - 身弱十神病＋從重旺/長＋夏の調候', async () => {
    const scenario = scenarios.find(s => s.id === 'S-04');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-04');

    const { strengthResult, kakkyokuResult, byoyakuResult, kishouResult } = optional;
    assert.strictEqual(strengthResult.strength, scenario.expectedCurrent.strength);
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);

    // 十神病は身弱レイヤを維持
    for (const expected of scenario.expectedCurrent.diagnoses) {
        const hit = byoyakuResult.diagnoses.find(d => d.disease.name.includes(expected.disease));
        assert.ok(hit, `診断「${expected.disease}」`);
        assert.ok(hit.medicine.name.includes(expected.medicine), `薬「${expected.medicine}」`);
    }

    // 四病四薬は從重＋長養（R-01）を正とする
    const after = scenario.expectedAfterR01;
    assert.strictEqual(byoyakuResult.fourDisease, after.fourDisease);
    assert.strictEqual(byoyakuResult.fourMedicine, after.fourMedicine);
    assert.strictEqual(byoyakuResult.fourDiseaseElement, after.fourDiseaseElement);
    assert.strictEqual(byoyakuResult.fourMedicineElement, after.fourMedicineElement);
    assert.strictEqual(byoyakuResult.heaviestElement, after.heaviestElement);

    assert.strictEqual(kishouResult.temperature, scenario.expectedAfterKishou.temperature);
    assert.strictEqual(
        kishouResult.choukou.direction,
        scenario.expectedAfterKishou.choukouDirection
    );
    for (const el of scenario.expectedAfterKishou.primaryElementsIncludes) {
        assert.ok(kishouResult.choukou.primaryElements.includes(el), `調候に${el}`);
    }

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({ strengthResult, kakkyokuResult, byoyakuResult });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】旺（火） → 長（水）'), '從重の四病四薬を明示');
    assert.strictEqual((html.match(/data-block="diagnosis"/g) || []).length, 2, '用神損傷の2診断だけを表示');
});

test('Acceptance S-05 - 雕は四薬null・処置琢', async () => {
    const scenario = scenarios.find(s => s.id === 'S-05');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-05');

    const { strengthResult, kakkyokuResult, byoyakuResult } = optional;
    assert.strictEqual(strengthResult.strength, scenario.expectedCurrent.strength);
    assert.strictEqual(strengthResult.score, scenario.expectedCurrent.strengthScore);
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);

    const after = scenario.expectedAfterR01;
    assert.strictEqual(byoyakuResult.fourDisease, after.fourDisease);
    assert.strictEqual(byoyakuResult.fourMedicine, after.fourMedicine);
    assert.strictEqual(byoyakuResult.treatmentMode, after.treatmentMode);
    assert.strictEqual(byoyakuResult.fourDiseaseElement, after.fourDiseaseElement);
    assert.strictEqual(byoyakuResult.fourMedicineElement, after.fourMedicineElement);
    for (const el of after.treatmentElementsIncludes) {
        assert.ok(byoyakuResult.treatmentElements.includes(el), `treatmentElementsに${el}`);
    }

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({ strengthResult, kakkyokuResult, byoyakuResult });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】雕 → 処置 琢（木）'), '四薬nullと琢を分離表示');
    assert.ok(!html.includes('琢の薬'), '琢を四薬名にしない');

    const dist = scenario.expectedWeightedDistribution;
    assert.strictEqual(byoyakuResult.heaviestElement, dist.heaviestElement);
    assert.ok(
        approxEqual(byoyakuResult.heaviestRatio, dist.heaviestRatio),
        `從重比率 ${byoyakuResult.heaviestRatio} ≈ ${dist.heaviestRatio}`
    );
});

test('Acceptance S-06 - 卯月土旺は損維持・最終薬は官殺', async () => {
    const scenario = scenarios.find(s => s.id === 'S-06');
    // fixture入力 1970-03-15 10:00 を直接使う（手動入力と同一）
    assert.deepStrictEqual(scenario.input, {
        year: 1970, month: 3, day: 15, hour: 10, minute: 0, gender: '男性'
    });
    const { fortune, greatFortuneCycles, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-06');

    const { kakkyokuResult, byoyakuResult, daiunEvaluations } = optional;
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);
    const after = scenario.expectedAfterR01;
    assert.strictEqual(byoyakuResult.fourDisease, after.fourDisease);
    assert.strictEqual(byoyakuResult.fourDiseaseElement, after.fourDiseaseElement);
    assert.strictEqual(byoyakuResult.fourMedicine, after.fourMedicine);
    assert.strictEqual(byoyakuResult.fourMedicineElement, after.fourMedicineElement);

    const t03f = scenario.expectedAfterT03f;
    assert.ok(byoyakuResult.medicine.name.includes(t03f.finalMedicine), '最終薬は官殺');
    assert.strictEqual(byoyakuResult.medicine.element, t03f.finalMedicineElement);
    const primary = byoyakuResult.diagnoses.find(d => d.source === 'keizen');
    assert.ok(primary.medicineCaution?.name.includes(t03f.medicineCaution), '財星生殺を注意へ');
    assert.strictEqual(primary.medicineCaution.element, t03f.medicineCautionElement);
    for (const el of t03f.kikiKiExcludes) {
        assert.ok(!byoyakuResult.kiki.ki.some(item => item.element === el), `喜に${el}を入れない`);
    }
    for (const el of t03f.kikiKiIncludes) {
        assert.ok(byoyakuResult.kiki.ki.some(item => item.element === el), `喜に${el}`);
    }

    // fixture由来の実大運まで検証（T-03f: 金吉・降格土は非吉／理由矛盾なし）
    assert.ok(Array.isArray(daiunEvaluations) && daiunEvaluations.length > 0, '大運評価あり');
    assert.strictEqual(daiunEvaluations.length, greatFortuneCycles.length);
    const metalCycles = [];
    const earthStemCycles = [];
    for (let i = 0; i < greatFortuneCycles.length; i++) {
        const cycle = greatFortuneCycles[i];
        const evalResult = daiunEvaluations[i];
        const stemEl = STEM_ELEMENTS[cycle.stem];
        if (stemEl === '金') metalCycles.push(evalResult);
        if (stemEl === '土') earthStemCycles.push(evalResult);
    }
    assert.ok(metalCycles.length > 0, 'fixture大運に金干がある');
    assert.ok(earthStemCycles.length > 0, 'fixture大運に土干がある');
    assert.ok(
        metalCycles.every(e => ['大吉', '吉', '小吉'].includes(e.judgment)),
        '金干大運は吉寄り'
    );
    for (const earth of earthStemCycles) {
        assert.ok(
            !['大吉', '吉', '小吉'].includes(earth.judgment),
            `土干大運を吉にしない: ${earth.judgment}`
        );
        assert.ok(
            !String(earth.reason || '').includes('薬を生む'),
            `土干理由に薬を生むを出さない: ${earth.reason}`
        );
        assert.ok(
            !String(earth.reason || '').includes('薬の五行'),
            `土干理由に薬の五行を出さない: ${earth.reason}`
        );
    }
    for (const evalResult of daiunEvaluations) {
        assert.ok(
            !/（土）→[^。]*薬を生む/.test(String(evalResult.reason || '')),
            `降格土の役割表示に薬を生むを出さない: ${evalResult.reason}`
        );
    }

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({
        strengthResult: optional.strengthResult,
        kakkyokuResult,
        byoyakuResult
    });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】旺（土） → 損（木）'), '四病層の土旺を明示');
    assert.ok(html.includes('用神損傷: なし'), '成格と損傷なしを明示');
    assert.ok(html.includes('【主軸の病】身旺殺軽'), '主軸病を別ラベルで表示');
    assert.ok(html.includes('【主軸の薬】官殺'), '最終主軸薬は官殺');
    assert.ok(html.includes('【注意】財星生殺'), '降格薬を注意表示');
    assert.ok(html.includes('主軸の喜:') && html.includes('官殺・金'), '喜に官殺');
    assert.ok(!html.includes('主軸の喜: 財星生殺'), '喜に財星生殺を出さない');
    assert.strictEqual((html.match(/data-block="diagnosis"/g) || []).length, 1, '気象診断を重複表示しない');
});

test('Acceptance S-07 - 卯月木旺は長', async () => {
    const scenario = scenarios.find(s => s.id === 'S-07');
    const { fortune, optional } = await runScenario(scenario);
    assertPillars(fortune, scenario.expectedPillars, 'S-07');

    const { strengthResult, kakkyokuResult, byoyakuResult } = optional;
    assert.strictEqual(strengthResult.strength, scenario.expectedCurrent.strength);
    assert.strictEqual(kakkyokuResult.kakkyoku, scenario.expectedCurrent.kakkyoku);

    const after = scenario.expectedAfterR01;
    assert.strictEqual(byoyakuResult.fourDisease, after.fourDisease);
    assert.strictEqual(byoyakuResult.fourDiseaseElement, after.fourDiseaseElement);
    assert.strictEqual(byoyakuResult.fourMedicine, after.fourMedicine);
    assert.strictEqual(byoyakuResult.fourMedicineElement, after.fourMedicineElement);
    assert.ok(
        approxEqual(byoyakuResult.heaviestRatio, scenario.expectedWeightedDistribution.heaviestRatio),
        `從重 ${byoyakuResult.heaviestRatio}`
    );

    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection({ strengthResult, kakkyokuResult, byoyakuResult });
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】旺（木） → 長（金）'), '長の成立を明示');
});
