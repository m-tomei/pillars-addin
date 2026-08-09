import { DaiunHyoukaCalculator } from '../../js/core/DaiunHyoukaCalculator.js';
import { TsuuhenCalculator } from '../../js/core/TsuuhenCalculator.js';

let tsuuhenCalc;
let calculator;

test('DaiunHyoukaCalculator.setup', () => {
    tsuuhenCalc = new TsuuhenCalculator();
    calculator = new DaiunHyoukaCalculator(tsuuhenCalc);
    assert.ok(calculator, 'Calculator instantiated');
});

test('DaiunHyoukaCalculator - 薬五行が天干に来る → 吉判定', () => {
    // 甲木日主（身弱）、薬=印星(水)
    // 大運天干=壬(水) → 薬の五行が来る → 吉以上
    const cycles = [
        { cycleNumber: 1, ageStart: 5, ageEnd: 14, stem: '壬', branch: '子', jiaziIndex: 48 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '身弱', element: '木', tenGod: '比肩', severity: 'moderate' },
                medicine: { name: '印星扶身', element: '水', tenGod: '正印', exists: false, location: null },
                reason: '身が弱い。印星で日主を助けるのが薬。'
            }
        ],
        fourDisease: '弱',
        fourMedicine: '益'
    };
    const strengthResult = { strength: 'weak', score: -1 };

    const results = calculator.evaluate(cycles, byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results.length, 1, '1件の結果');
    // 天干=壬(水)は薬(水)→+3、地支=子(水)は薬(水)→+3 → 非常に高スコア
    assert.ok(results[0].score >= 1.0, `吉以上のスコア: ${results[0].score}`);
    assert.ok(['大吉', '吉'].includes(results[0].judgment), `判定が吉以上: ${results[0].judgment}`);
    assert.strictEqual(results[0].stemTsuuhen, '偏印', '天干の通変星が偏印');
});

test('DaiunHyoukaCalculator - 病五行が天干に来る → 凶判定', () => {
    // 甲木日主（身旺）、病=比劫(木)
    // 大運天干=甲(木) → 病の五行が来る → 凶以下
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '甲', branch: '寅', jiaziIndex: 0 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '比劫旺', element: '木', tenGod: '比肩', severity: 'moderate' },
                medicine: { name: '官殺', element: '金', tenGod: '正官', exists: false, location: null },
                reason: '比劫が旺盛。官殺で制す。'
            }
        ],
        fourDisease: '旺',
        fourMedicine: '損'
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const results = calculator.evaluate(cycles, byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results.length, 1, '1件の結果');
    // 天干=甲(木)は病(木)→-3、地支=寅(木)は病(木)→-3 → 非常に低スコア
    assert.ok(results[0].score <= -1.0, `凶以下のスコア: ${results[0].score}`);
    assert.ok(['凶', '大凶'].includes(results[0].judgment), `判定が凶以下: ${results[0].judgment}`);
});

test('DaiunHyoukaCalculator - 蓋頭テスト（干が吉で支が凶、干が支を剋す → 吉寄り）', () => {
    // 甲木日主、薬=水、病=木
    // 大運: 壬午（天干=壬/水=薬、地支=午/火）
    // 壬(水)は薬(水)→+3、午(火)は病(木)を生まない/薬(水)を剋さない
    // 水剋火 → 蓋頭: 干が支を剋す → 干の重み増加
    const cycles = [
        { cycleNumber: 1, ageStart: 5, ageEnd: 14, stem: '壬', branch: '午', jiaziIndex: 18 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '身弱', element: '木', tenGod: '比肩', severity: 'moderate' },
                medicine: { name: '印星', element: '水', tenGod: '正印', exists: false, location: null },
                reason: '身が弱い。印星で助ける。'
            }
        ],
        fourDisease: '弱',
        fourMedicine: '益'
    };
    const strengthResult = { strength: 'weak', score: -1 };

    const results = calculator.evaluate(cycles, byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results[0].gaitouType, '蓋頭', '蓋頭と判定される');
    // 蓋頭: stemWeight=0.7 → 天干の吉効果が強い
    assert.ok(results[0].score > 0, `吉寄りのスコア: ${results[0].score}`);
});

test('DaiunHyoukaCalculator - 截脚テスト（干が吉で支が凶、支が干を剋す → 凶寄り）', () => {
    // 甲木日主、薬=金(官殺)、病=木(比劫)
    // 大運: 庚午（天干=庚/金=薬、地支=午/火）
    // 庚(金)は薬(金)→+3、午(火)は薬(金)を剋す→-1
    // 火剋金 → 截脚: 支が干を剋す → 支の重み増加
    const cycles = [
        { cycleNumber: 1, ageStart: 5, ageEnd: 14, stem: '庚', branch: '午', jiaziIndex: 6 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '比劫旺', element: '木', tenGod: '比肩', severity: 'moderate' },
                medicine: { name: '官殺', element: '金', tenGod: '正官', exists: false, location: null },
                reason: '比劫が旺盛。官殺で制す。'
            }
        ],
        fourDisease: '旺',
        fourMedicine: '損'
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const results = calculator.evaluate(cycles, byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results[0].gaitouType, '截脚', '截脚と判定される');
    // 截脚では天干のweight=0.4に減り、地支のweight=0.6に増える
    // 同じ蓋頭のケースと比較するとスコアが下がるはず
    // 庚(金)→薬+3、午(火)→火は金を剋す(CONTROL_CYCLE[火]=金)なので薬を剋す→-1
    // score = 3*0.4 + (-1)*0.6 = 1.2 - 0.6 = 0.6
    assert.ok(results[0].score > 0, `正のスコアだが蓋頭より低い: ${results[0].score}`);
});

test('DaiunHyoukaCalculator - evaluations配列の構造検証', () => {
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '丙', branch: '寅', jiaziIndex: 2 },
        { cycleNumber: 2, ageStart: 13, ageEnd: 22, stem: '丁', branch: '卯', jiaziIndex: 3 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '身弱', element: '木', tenGod: null, severity: 'mild' },
                medicine: { name: '印星', element: '水', tenGod: '正印', exists: false, location: null },
                reason: 'テスト'
            }
        ],
        fourDisease: '弱',
        fourMedicine: '益'
    };
    const strengthResult = { strength: 'weak', score: -1 };

    const results = calculator.evaluate(cycles, byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results.length, 2, '2件の結果');

    for (const r of results) {
        assert.ok(typeof r.cycleNumber === 'number', 'cycleNumberがnumber');
        assert.ok(typeof r.judgment === 'string', 'judgmentがstring');
        assert.ok(['大吉', '吉', '小吉', '平', '小凶', '凶', '大凶'].includes(r.judgment),
            `判定が有効な値: ${r.judgment}`);
        assert.ok(typeof r.score === 'number', 'scoreがnumber');
        assert.ok(typeof r.stemTsuuhen === 'string', 'stemTsuuhenがstring');
        assert.ok(typeof r.stemElement === 'string', 'stemElementがstring');
        assert.ok(typeof r.branchElement === 'string', 'branchElementがstring');
        assert.ok(typeof r.reason === 'string', 'reasonがstring');
    }
});

test('DaiunHyoukaCalculator - 空サイクルで空配列', () => {
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const byoyakuResult = {
        diagnoses: [
            {
                disease: { name: '身弱', element: '木', tenGod: null, severity: 'mild' },
                medicine: { name: '印星', element: '水', tenGod: '正印', exists: false, location: null },
                reason: 'テスト'
            }
        ],
        fourDisease: '弱',
        fourMedicine: '益'
    };
    const strengthResult = { strength: 'weak', score: -1 };

    const results = calculator.evaluate([], byoyakuResult, fortuneResult, strengthResult);
    assert.strictEqual(results.length, 0, '空配列');
});

test('AC-05 表示先頭が気象診断でも代表病薬を評価する', () => {
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '甲', branch: '寅', jiaziIndex: 0 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const representativeDisease = { name: '比劫旺', element: '木', tenGod: '比肩', severity: 'moderate' };
    const representativeMedicine = { name: '官殺', element: '金', tenGod: '正官', exists: false, location: null };
    const byoyakuResult = {
        disease: representativeDisease,
        medicine: representativeMedicine,
        diagnoses: [
            {
                role: 'secondary', source: 'kishou',
                disease: { name: '気象偏枯', element: null, tenGod: null, severity: 'severe' },
                medicine: { name: '調候', element: '火', tenGod: null, exists: false, location: null }
            },
            {
                role: 'primary', source: 'keizen',
                disease: representativeDisease,
                medicine: representativeMedicine
            }
        ]
    };

    const results = calculator.evaluate(
        cycles, byoyakuResult, fortuneResult, { strength: 'strong', score: 5 }
    );
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].score < 0, '代表病の木を凶として評価');
});

test('AC-05 代表病または代表薬がnullなら非null側だけ評価する', () => {
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '壬', branch: '子', jiaziIndex: 48 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const byoyakuResult = {
        disease: { name: '気象偏枯', element: null },
        medicine: { name: '調候', element: '水' },
        diagnoses: []
    };

    const results = calculator.evaluate(
        cycles, byoyakuResult, fortuneResult, { strength: 'weak', score: 0 }
    );
    assert.strictEqual(results.length, 1);
    assert.ok(results[0].score > 0, '薬の水だけで評価');
});

test('AC-05 代表病薬の五行が両方nullなら大運評価をスキップする', () => {
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '壬', branch: '子', jiaziIndex: 48 }
    ];
    const byoyakuResult = {
        disease: { name: '未確定', element: null },
        medicine: { name: '未確定', element: null },
        diagnoses: []
    };
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };

    const results = calculator.evaluate(
        cycles, byoyakuResult, fortuneResult, { strength: 'neutral', score: 2 }
    );
    assert.deepStrictEqual(results, []);
});

test('T-03f/S-06 最終薬の金運は吉、降格した土運は吉にしない', () => {
    // T-03f後の代表形: 最終薬=官殺(金)、降格=財星生殺(土)
    const cycles = [
        { cycleNumber: 1, ageStart: 3, ageEnd: 12, stem: '庚', branch: '申', jiaziIndex: 6 },
        // 金干＋土支: 支の「薬を生む」も理由から除外されること
        { cycleNumber: 2, ageStart: 13, ageEnd: 22, stem: '庚', branch: '辰', jiaziIndex: 16 },
        { cycleNumber: 3, ageStart: 23, ageEnd: 32, stem: '戊', branch: '辰', jiaziIndex: 4 }
    ];
    const fortuneResult = {
        dayPillar: { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const byoyakuResult = {
        disease: { name: '身旺殺軽', element: '木', tenGod: '比肩', severity: 'moderate' },
        medicine: { name: '官殺', element: '金', tenGod: '正官', exists: true, location: '年干' },
        fourDisease: '旺',
        fourMedicine: '損',
        fourDiseaseElement: '土',
        heaviestElement: '土',
        diagnoses: [
            {
                role: 'primary',
                source: 'keizen',
                disease: { name: '身旺殺軽', element: '木', tenGod: '比肩', severity: 'moderate' },
                medicine: { name: '官殺', element: '金', tenGod: '正官', exists: true, location: '年干' },
                medicineCaution: {
                    name: '財星生殺',
                    element: '土',
                    tenGod: '正財',
                    exists: true,
                    location: '月干',
                    reason: '五行偏重（土）と同気のため喜から除外'
                }
            }
        ]
    };

    const results = calculator.evaluate(
        cycles, byoyakuResult, fortuneResult, { strength: 'strong', score: 4 }
    );
    assert.strictEqual(results.length, 3);

    const metal = results[0];
    const metalEarthBranch = results[1];
    const earth = results[2];
    assert.ok(metal.score > 0, `金運は正スコア: ${metal.score}`);
    assert.ok(['大吉', '吉', '小吉'].includes(metal.judgment), `金運は吉寄り: ${metal.judgment}`);
    assert.ok(
        ['大吉', '吉', '小吉'].includes(metalEarthBranch.judgment),
        `金干大運は吉寄り: ${metalEarthBranch.judgment}`
    );
    assert.ok(
        !String(metalEarthBranch.reason || '').includes('薬を生む'),
        `降格土支の理由に薬を生むを出さない: ${metalEarthBranch.reason}`
    );

    // 土は降格薬。生薬加点も抑止し、吉判定にしない
    assert.ok(earth.score < metal.score, `土運(${earth.score}) < 金運(${metal.score})`);
    assert.ok(
        !['大吉', '吉', '小吉'].includes(earth.judgment),
        `降格土運を吉にしない: ${earth.judgment}`
    );
    assert.ok(earth.score <= 0.3, `土運は平以下: ${earth.score}`);
    assert.ok(
        !String(earth.reason || '').includes('薬を生む'),
        `降格土の理由に薬を生むを出さない: ${earth.reason}`
    );
    assert.ok(
        !String(earth.reason || '').includes('薬の五行'),
        `降格土の理由に薬の五行を出さない: ${earth.reason}`
    );
});

test('T-03f/S-06 fixture生年月日時から大運評価まで金吉・降格土非吉', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { FortuneCalculator } = await import('../../js/core/FortuneCalculator.js');
    const { GreatFortuneCalculator } = await import('../../js/core/GreatFortuneCalculator.js');
    const { JuuniunCalculator } = await import('../../js/core/JuuniunCalculator.js');
    const { DayMasterStrengthAssessor } = await import('../../js/core/DayMasterStrengthAssessor.js');
    const { KakkyokuCalculator } = await import('../../js/core/KakkyokuCalculator.js');
    const { ByoyakuCalculator } = await import('../../js/core/ByoyakuCalculator.js');
    const { GouChuuCalculator } = await import('../../js/core/GouChuuCalculator.js');
    const { KishouAssessor } = await import('../../js/core/KishouAssessor.js');
    const { KeizenAnalyzer } = await import('../../js/core/KeizenAnalyzer.js');
    const { runOptionalDiagnostics } = await import('../../js/app/byoyakuPipeline.js');
    const { STEM_ELEMENTS } = await import('../../js/utils/constants.js');

    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dataDir = path.resolve(__dirname, '../../data');
    const fixturePath = path.resolve(
        __dirname,
        '../../docs/design/病薬表示機能_詳細設計/fixtures/acceptance_scenarios.json'
    );
    const scenario = JSON.parse(fs.readFileSync(fixturePath, 'utf8'))
        .scenarios.find(s => s.id === 'S-06');
    assert.ok(scenario, 'S-06 fixture');
    assert.deepStrictEqual(scenario.input, {
        year: 1970, month: 3, day: 15, hour: 10, minute: 0, gender: '男性'
    });

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

    const loader = new MockDataLoader(dataDir);
    const stemBranchData = await loader.loadStemBranchMaster();
    const kakkyokuRules = await loader.loadKakkyokuRules();
    const fortuneCalculator = new FortuneCalculator(loader);
    await fortuneCalculator.initialize();
    const greatFortuneCalculator = new GreatFortuneCalculator(fortuneCalculator);
    await greatFortuneCalculator.initialize();
    const juuniunCalculator = new JuuniunCalculator(loader);
    await juuniunCalculator.initialize();
    const tsuuhenCalculator = new TsuuhenCalculator();
    const gouChuuCalculator = new GouChuuCalculator();
    const deps = {
        kishouAssessor: new KishouAssessor(),
        gouChuuCalculator,
        strengthAssessor: new DayMasterStrengthAssessor(stemBranchData),
        kakkyokuCalculator: new KakkyokuCalculator(stemBranchData),
        keizenAnalyzer: new KeizenAnalyzer(kakkyokuRules),
        byoyakuCalculator: new ByoyakuCalculator(kakkyokuRules),
        daiunHyoukaCalculator: new DaiunHyoukaCalculator(tsuuhenCalculator, gouChuuCalculator)
    };

    const { year, month, day, hour, minute, gender } = scenario.input;
    const fortune = await fortuneCalculator.calculateFortune(year, month, day, hour, minute);
    assert.strictEqual(
        `${fortune.yearPillar.stem}${fortune.yearPillar.branch}`,
        `${scenario.expectedPillars.year.stem}${scenario.expectedPillars.year.branch}`
    );
    const juuniunResults = juuniunCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.branch,
        fortune.monthPillar.branch,
        fortune.dayPillar.branch,
        fortune.hourPillar ? fortune.hourPillar.branch : null
    );
    const tsuuhenResults = tsuuhenCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.stem,
        fortune.monthPillar.stem,
        fortune.hourPillar ? fortune.hourPillar.stem : null
    );
    const greatFortuneCycles = greatFortuneCalculator.calculateCycles(
        year, month, day, hour, minute, gender
    );
    const optional = runOptionalDiagnostics(deps, {
        byoyakuEnabled: true,
        fortune,
        juuniunResults,
        tsuuhenResults,
        greatFortuneCycles
    });

    assert.strictEqual(optional.byoyakuResult.medicine.element, '金');
    const caution = optional.byoyakuResult.diagnoses
        .find(d => d.source === 'keizen')?.medicineCaution;
    assert.strictEqual(caution?.element, '土');

    const { daiunEvaluations } = optional;
    assert.ok(daiunEvaluations?.length > 0);
    assert.strictEqual(daiunEvaluations.length, greatFortuneCycles.length);

    for (let i = 0; i < greatFortuneCycles.length; i++) {
        const stemEl = STEM_ELEMENTS[greatFortuneCycles[i].stem];
        const evalResult = daiunEvaluations[i];
        if (stemEl === '金') {
            assert.ok(
                ['大吉', '吉', '小吉'].includes(evalResult.judgment),
                `fixture金干大運は吉: ${evalResult.judgment}`
            );
        }
        if (stemEl === '土') {
            assert.ok(
                !['大吉', '吉', '小吉'].includes(evalResult.judgment),
                `fixture土干大運を吉にしない: ${evalResult.judgment}`
            );
            assert.ok(
                !String(evalResult.reason || '').includes('薬を生む'),
                `fixture土干理由に薬を生むを出さない: ${evalResult.reason}`
            );
        }
        // 降格土が干・支どちらにあっても「薬を生む」を出さない
        assert.ok(
            !/（土）→[^。]*薬を生む/.test(String(evalResult.reason || '')),
            `降格土の役割表示に薬を生むを出さない: ${evalResult.reason}`
        );
    }
});
