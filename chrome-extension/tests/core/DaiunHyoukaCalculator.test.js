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
