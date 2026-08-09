import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { ByoyakuCalculator } from '../../js/core/ByoyakuCalculator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

const rules = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'kakkyoku_rules.json'), 'utf8'));

let calculator;

test('ByoyakuCalculator.setup', () => {
    calculator = new ByoyakuCalculator(rules);
    assert.ok(calculator, 'Calculator instantiated');
});

test('ByoyakuCalculator - 正官格・身旺の病薬', () => {
    const kakkyokuResult = {
        kakkyoku: '正官格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'strong', score: 5 };

    // 甲木日主、天干に比肩2つ（比劫多）
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '比肩', relationship: 'same' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.strictEqual(result.disease.name, '比劫奪官', '比劫奪官と診断される');
    assert.ok(result.medicine.name.includes('財'), '薬は財星');
    assert.strictEqual(result.fourDisease, '旺', '四病は旺');
    assert.strictEqual(result.fourMedicine, '損', '四薬は損');
});

test('ByoyakuCalculator - 正官格・身弱の病薬', () => {
    const kakkyokuResult = {
        kakkyoku: '正官格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'weak', score: 0 };

    // 甲木日主、天干に官殺2つ（官殺多）、五行分散させ旺判定を回避
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '辛', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '壬', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.strictEqual(result.disease.name, '官殺混雑', '官殺混雑と診断される');
    assert.ok(result.medicine.name.includes('印'), '薬は印星');
    assert.strictEqual(result.fourDisease, '弱', '四病は弱');
    assert.strictEqual(result.fourMedicine, '益', '四薬は益');
});

test('ByoyakuCalculator - 偏官格・身弱の制殺太過', () => {
    const kakkyokuResult = {
        kakkyoku: '偏官格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'weak', score: 1 };

    // 甲木日主、天干に食神（食神透出 → 制殺太過）
    const fortuneResult = {
        yearPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '丁', branch: '未', hiddenStems: ['己', '丁', '乙'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '食神', relationship: 'generate' },
        month: { tsuuhen: '偏官', relationship: 'controlled' },
        hour:  { tsuuhen: '傷官', relationship: 'generate' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.strictEqual(result.disease.name, '制殺太過', '制殺太過と診断される');
    assert.ok(result.medicine.name.includes('財'), '薬は財星');
});

test('ByoyakuCalculator - 五行一気格の病薬', () => {
    const kakkyokuResult = {
        kakkyoku: '曲直仁寿格',
        category: 'special_element',
        categoryLabel: '五行一気格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'strong', score: 7 };

    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '劫財', relationship: 'same' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.ok(result.disease.name, '病名がある');
    assert.ok(result.medicine.name, '薬名がある');
    assert.ok(result.summary, 'サマリーがある');
});

test('ByoyakuCalculator - 従格の病薬', () => {
    const kakkyokuResult = {
        kakkyoku: '従殺格',
        category: 'following',
        categoryLabel: '従格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'weak', score: -1 };

    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '庚', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '乙', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        hourPillar:  { stem: '戊', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '正官', relationship: 'controlled' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '正財', relationship: 'control' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.ok(result.disease.name, '病名がある');
    assert.ok(result.medicine.name.includes('財'), '薬は財星');
    assert.strictEqual(result.fourDisease, '弱', '従格身弱は四病が弱');
});

test('ByoyakuCalculator - 複数病薬マッチ（比劫多かつ印多）', () => {
    const kakkyokuResult = {
        kakkyoku: '正官格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'strong', score: 5 };

    // 甲木日主: 比肩×2 + 偏印×1（比劫多 & 印多）
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '壬', branch: '亥', hiddenStems: ['壬', '甲'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };

    // 印多の条件は sealCount >= 2 なので偏印1つでは足りない。
    // 比肩2つなので比劫多はマッチ。印多は不成立 → diagnoses.length === 1
    // 印多もマッチさせるために tsuuhenを調整する
    const tsuuhenResultMulti = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '偏印', relationship: 'generated' },
        hour:  { tsuuhen: '正印', relationship: 'generated' }
    };

    // 比肩は1つだが、蔵干に甲が3つ（寅の甲、子の中にはないが亥の甲）→ 比劫多は sameElInHidden >= 3 でマッチ
    // 寅:甲、亥:甲、日干:甲(dayPillar蔵干ではない)… 足りない場合に備え fortuneResult を調整
    const fortuneResultMulti = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '亥', hiddenStems: ['壬', '甲'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '癸', branch: '丑', hiddenStems: ['己', '癸', '辛'] }
    };

    // tsuuhenResultMulti: 比肩(year) + 偏印(month) + 正印(hour)
    // → bijouCount=1, sameElInHidden: 甲(寅)+甲(亥) = 木2つ → sameElInHidden < 3 → 比劫多不成立
    // 比劫多を確実にマッチさせるには bijouCount >= 2 が必要

    const fortuneResultFinal = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '亥', hiddenStems: ['壬', '甲'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '癸', branch: '丑', hiddenStems: ['己', '癸', '辛'] }
    };
    const tsuuhenResultFinal = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '偏印', relationship: 'generated' },
        hour:  { tsuuhen: '正印', relationship: 'generated' }
    };

    // bijouCount = 1 (比肩 only), sameElInHidden: 甲(寅)+甲(亥) = 2 → 比劫多不成立
    // sealCount = 2 (偏印+正印) → 印多成立
    // → diagnoses.length === 1 (印多のみ)

    // 比劫多もマッチさせるには比肩or劫財が2つ天干に必要
    const tsuuhenResultBoth = {
        year:  { tsuuhen: '劫財', relationship: 'same' },
        month: { tsuuhen: '偏印', relationship: 'generated' },
        hour:  { tsuuhen: '正印', relationship: 'generated' }
    };
    // bijouCount = 1 (劫財) → まだ1… 2つ必要

    // 蔵干で sameElInHidden >= 3 にする: 木=甲の蔵干を3箇所以上に
    const fortuneResultBoth = {
        yearPillar:  { stem: '乙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '甲', branch: '亥', hiddenStems: ['壬', '甲'] },
        hourPillar:  { stem: '癸', branch: '辰', hiddenStems: ['戊', '乙', '癸'] }
    };
    // dayElement = 木（甲）
    // allHiddenElements木: 甲(寅)=木, 乙(卯)=木, 甲(亥)=木, 乙(辰)=木 → sameElInHidden = 4 >= 3 → 比劫多成立
    // tsuuhenResultBoth: 劫財, 偏印, 正印 → sealCount = 2 → 印多成立

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResultBoth, tsuuhenResultBoth);

    assert.ok(result.diagnoses, 'diagnoses配列がある');
    assert.ok(result.diagnoses.length >= 2, `複数の病薬がマッチ（${result.diagnoses.length}件）`);

    const diseaseNames = result.diagnoses.map(d => d.disease.name);
    assert.ok(diseaseNames.includes('比劫奪官'), '比劫奪官がマッチ');
    assert.ok(diseaseNames.includes('印多護官太過'), '印多護官太過がマッチ');

    // 後方互換: result.disease / result.medicine は先頭要素
    assert.strictEqual(result.disease.name, result.diagnoses[0].disease.name, '後方互換: disease.nameは先頭要素');
    assert.strictEqual(result.medicine.name, result.diagnoses[0].medicine.name, '後方互換: medicine.nameは先頭要素');

    // 各診断に薬の所在情報がある
    for (const diag of result.diagnoses) {
        assert.ok(typeof diag.medicine.exists === 'boolean', '各薬にexistsがある');
        assert.ok(diag.reason, '各診断にreasonがある');
    }
});

test('ByoyakuCalculator - diagnoses配列が単一マッチでも存在する', () => {
    const kakkyokuResult = {
        kakkyoku: '正官格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'strong', score: 5 };

    // 比劫多のみマッチ（印多は不成立）
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '比肩', relationship: 'same' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '比肩', relationship: 'same' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);
    assert.ok(result.diagnoses, 'diagnoses配列がある');
    assert.strictEqual(result.diagnoses.length, 1, '単一マッチ');
    assert.strictEqual(result.diagnoses[0].disease.name, '比劫奪官', '比劫奪官');
});

test('ByoyakuCalculator - 結果構造の検証', () => {
    const kakkyokuResult = {
        kakkyoku: '正財格',
        category: 'regular',
        categoryLabel: '正格',
        isEstablished: true,
        breakReason: null
    };
    const strengthResult = { strength: 'strong', score: 4 };

    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '丙', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '正財', relationship: 'control' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };

    const result = calculator.diagnose(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult);

    // 構造チェック
    assert.ok(result.disease, 'diseaseオブジェクトがある');
    assert.ok(result.disease.name, '病名がある');
    assert.ok(result.disease.severity, '重症度がある');

    assert.ok(result.medicine, 'medicineオブジェクトがある');
    assert.ok(result.medicine.name, '薬名がある');
    assert.ok(typeof result.medicine.exists === 'boolean', 'existsがboolean');

    assert.ok(result.summary, 'サマリーがある');
    assert.ok(result.fourDisease, '四病分類がある');
    assert.ok(result.fourMedicine, '四薬分類がある');
});
