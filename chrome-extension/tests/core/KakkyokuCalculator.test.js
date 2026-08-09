import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { KakkyokuCalculator } from '../../js/core/KakkyokuCalculator.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

const stemBranchData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'stem_branch_master.json'), 'utf8'));

let calculator;

test('KakkyokuCalculator.setup', () => {
    calculator = new KakkyokuCalculator(stemBranchData);
    assert.ok(calculator, 'Calculator instantiated');
});

test('KakkyokuCalculator - 正官格の判定（月支蔵干に正官が透出）', () => {
    // 甲木日主、酉月（金月）、天干に辛（正官）が透出
    // 辛は酉の蔵干に含まれる → 月令透出
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'weak', score: 1 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '正官格と判定される');
    assert.strictEqual(result.category, 'regular');
    assert.strictEqual(result.categoryLabel, '正格');
    assert.strictEqual(result.isEstablished, true);
});

test('KakkyokuCalculator - 偏官格の判定（天干に偏官が透出）', () => {
    // 甲木日主、申月（金月）、天干に庚（偏官）が透出
    // 庚は申の蔵干に含まれる → 官殺優先
    const fortuneResult = {
        yearPillar:  { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        monthPillar: { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏財', relationship: 'control' },
        month: { tsuuhen: '偏官', relationship: 'controlled' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'neutral', score: 2 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '偏官格と判定される');
    assert.strictEqual(result.category, 'regular');
});

test('KakkyokuCalculator - 建禄月で食神が透出 → 食神格', () => {
    // 甲木日主、寅月（建禄）、月干に丙（食神）が透出
    // 命理正宗: 建禄月でも天干に透出があればその格を取る
    // 寅の蔵干=[甲,丙,戊] → 丙(火)が月干に透出 → 食神格
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '食神', relationship: 'generate' },
        hour:  { tsuuhen: '偏財', relationship: 'control' }
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '食神格', '建禄月でも食神透出で食神格');
    assert.strictEqual(result.basis, '月令透出');
});

test('KakkyokuCalculator - 陽刃格の判定（六陽干のみ）', () => {
    // 甲木日主、卯月 → 卯は甲の陽刃
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '劫財', relationship: 'same' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '陽刃格', '陽刃格と判定される');
    assert.strictEqual(result.basis, '月支が陽刃');
});

test('KakkyokuCalculator - 五行一気格の判定（曲直格）', () => {
    // 甲木日主、地支に寅卯辰（東方三会）
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
    const strengthResult = { strength: 'strong', score: 8 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '曲直仁寿格', '曲直仁寿格と判定される');
    assert.strictEqual(result.category, 'special_element');
    assert.strictEqual(result.categoryLabel, '五行一気格');
    assert.strictEqual(result.isEstablished, true);
});

test('KakkyokuCalculator - 五行一気格の破格判定', () => {
    // 甲木日主、地支に寅卯辰あるが、天干に庚（破格要素）
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '劫財', relationship: 'same' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '曲直仁寿格', '曲直仁寿格と判定される');
    assert.strictEqual(result.isEstablished, false, '破格と判定される');
    assert.ok(result.breakReason, '破格理由あり');
});

test('KakkyokuCalculator - 従殺格の判定', () => {
    // 乙木日主、完全無根、天干に庚庚（官殺充満）
    // 乙は陰干なので陽刃テーブルにない → 陽刃格にならない
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
    const strengthResult = { strength: 'weak', score: -1 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '従殺格', '従殺格と判定される');
    assert.strictEqual(result.category, 'following');
    assert.strictEqual(result.categoryLabel, '従格');
});

test('KakkyokuCalculator - 官殺優先の原則（月令蔵干に官殺なくても天干に透出すれば優先）', () => {
    // 甲木日主、午月（火月）、年干に辛（正官）あり
    // 月支の蔵干は丁,己 → 天干の辛は金なので月支蔵干にない
    // 命理正宗: 天干に官殺があれば月令蔵干に関係なく最優先で格とする
    const fortuneResult = {
        yearPillar:  { stem: '辛', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '丁', branch: '卯', hiddenStems: ['乙'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '正官', relationship: 'controlled' },
        month: { tsuuhen: '偏印', relationship: 'generated' },
        hour:  { tsuuhen: '傷官', relationship: 'generate' }
    };
    const strengthResult = { strength: 'strong', score: 4 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '天干に正官あり→月令蔵干不問で正官格');
    assert.strictEqual(result.basis, '官殺優先');
    assert.strictEqual(result.category, 'regular');
});

// ═══════════════════════════════════════════════════════
//  正格の破格判定テスト
// ═══════════════════════════════════════════════════════

test('KakkyokuCalculator - 傷官見官で破格（正官格 + 天干に傷官 + 印なし）', () => {
    // 甲木日主、酉月（金月）、天干に辛（正官）が透出 → 正官格
    // 時干に丁（傷官）が透出 → 忌神
    // 印（壬癸 = 偏印/正印）なし → 救神なし → 破格
    const fortuneResult = {
        yearPillar:  { stem: '戊', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '丁', branch: '巳', hiddenStems: ['丙', '戊', '庚'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏財', relationship: 'control' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '傷官', relationship: 'generate' }
    };
    const strengthResult = { strength: 'weak', score: 0 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '正官格と判定される');
    assert.strictEqual(result.isEstablished, false, '破格と判定される');
    assert.strictEqual(result.breakReason, '傷官見官', '破格理由が傷官見官');
});

test('KakkyokuCalculator - 傷官見官だが印で救い（正官格 + 傷官 + 印あり → 成格）', () => {
    // 甲木日主、酉月（金月）、天干に辛（正官）→ 正官格
    // 年干に丁（傷官）→ 忌神
    // 時干に壬（偏印）→ 救神あり → 成格
    const fortuneResult = {
        yearPillar:  { stem: '丁', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        monthPillar: { stem: '辛', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '壬', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '傷官', relationship: 'generate' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'weak', score: 0 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '正官格と判定される');
    assert.strictEqual(result.isEstablished, true, '印で救われ成格');
    assert.strictEqual(result.breakReason, null, '破格理由なし');
});

test('KakkyokuCalculator - 梟印奪食で破格（食神格 + 偏印透出 + 財なし）', () => {
    // 甲木日主、午月（火月）、蔵干に丁火（食傷）
    // 月干に丙（食神）→ 食神格
    // 年干に壬（偏印）→ 忌神
    // 財（正財・偏財）なし → 救神なし → 破格
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '食神', relationship: 'generate' },
        hour:  { tsuuhen: '比肩', relationship: 'same' }
    };
    const strengthResult = { strength: 'strong', score: 4 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '食神格', '食神格と判定される');
    assert.strictEqual(result.isEstablished, false, '破格と判定される');
    assert.strictEqual(result.breakReason, '梟印奪食', '破格理由が梟印奪食');
});

test('KakkyokuCalculator - 結果構造の検証', () => {
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '丙', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '偏官', relationship: 'controlled' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'neutral', score: 2 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.ok(result.kakkyoku, '格局名がある');
    assert.ok(result.category, 'カテゴリがある');
    assert.ok(result.categoryLabel, 'カテゴリラベルがある');
    assert.ok(result.basis, '判定根拠がある');
    assert.ok(result.basisDetail, '詳細説明がある');
    assert.ok(typeof result.isEstablished === 'boolean', '成格/破格がboolean');
});

// ═══════════════════════════════════════════════════════
//  合化成功時の変換五行による評価テスト
// ═══════════════════════════════════════════════════════

test('KakkyokuCalculator - 合化成功でも格局判定は月令の本来の蔵干で行う', () => {
    // 甲木日主、月支=子（蔵干=['癸']=水）
    // 月支蔵干の癸(水)が時干の癸に透出 → 正印格
    // 合化成功しても格局判定は本来の月令蔵干に基づく（正印格のまま）
    const fortuneResult = {
        yearPillar:  { stem: '丙', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '丙', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '癸', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '食神', relationship: 'generate' },
        month: { tsuuhen: '食神', relationship: 'generate' },
        hour:  { tsuuhen: '正印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'neutral', score: 2 };

    // 合化なし → 正印格
    const resultWithout = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(resultWithout.kakkyoku, '正印格', '合化なしで正印格');

    // 合化あり（月支=子 idx1 が土に変化）→ 格局判定は本来の蔵干で行うため正印格のまま
    const gouChuuResult = {
        liuhe: [], sanhe: [], banhe: [], fanghe: [], liuchong: [],
        transformedElementMap: new Map([[1, '土']])
    };
    const resultWith = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult, gouChuuResult);
    assert.strictEqual(resultWith.kakkyoku, '正印格', '合化成功でも格局は月令の本来の蔵干で判定');
});

test('KakkyokuCalculator - 合化成功で根が消失し従格が成立する', () => {
    // 乙木日主、完全身弱、唯一の根=日支卯(蔵干乙=木)
    // 天干に庚庚(金=official)=2本 → 官殺充満
    // 合化なし: 卯に根あり → 従格不成立 → 正格判定
    // 合化あり: 卯(idx2)が火に変化 → 木の根消失 → 従殺格
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '庚', branch: '酉', hiddenStems: ['辛'] },
        dayPillar:   { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '戊', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '正官', relationship: 'controlled' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '正財', relationship: 'control' }
    };
    const strengthResult = { strength: 'weak', score: -1 };

    // 合化なし: 卯に乙=木=根あり → 従格不成立 → 正格判定
    const resultWithout = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.ok(resultWithout.category !== 'following', '合化なしでは従格にならない（根あり）');

    // 合化あり: 卯(idx2)が火に変化 → 木の根消失 → 従殺格
    const gouChuuResult = {
        liuhe: [], sanhe: [], banhe: [], fanghe: [], liuchong: [],
        transformedElementMap: new Map([[2, '火']])
    };
    const resultWith = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult, gouChuuResult);
    assert.strictEqual(resultWith.category, 'following', '合化後は従格（根なし）');
    assert.strictEqual(resultWith.kakkyoku, '従殺格', '官殺充満で従殺格');
});

// ═══════════════════════════════════════════════════════
//  命理正宗準拠: 建禄格・陽刃格・官殺優先テスト
// ═══════════════════════════════════════════════════════

test('KakkyokuCalculator - 建禄月で天干に財が透出 → 財格', () => {
    // 甲木日主、寅月（建禄）、年干に戊（偏財）
    // 寅の蔵干=[甲,丙,戊] → 戊(土)が年干に透出 → 偏財格
    const fortuneResult = {
        yearPillar:  { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏財', relationship: 'control' },
        month: { tsuuhen: '比肩', relationship: 'same' },
        hour:  { tsuuhen: '比肩', relationship: 'same' }
    };
    const strengthResult = { strength: 'strong', score: 6 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏財格', '建禄月でも財透出で偏財格');
    assert.strictEqual(result.basis, '月令透出');
});

test('KakkyokuCalculator - 建禄月で蔵干が全て比劫・透出なし → 建禄格', () => {
    // 乙木日主、卯月（建禄）、蔵干=[乙]（比肩のみ）
    // 天干に官殺(金)なし、月令蔵干に比劫以外なし → 建禄格フォールバック
    const fortuneResult = {
        yearPillar:  { stem: '癸', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '乙', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        hourPillar:  { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '比肩', relationship: 'same' },
        hour:  { tsuuhen: '正印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'strong', score: 7 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '建禄格', '蔵干が全て比劫で建禄格フォールバック');
    assert.strictEqual(result.basis, '月支が建禄');
});

test('KakkyokuCalculator - 有殺論殺（偏官と正官が両方ある場合、偏官優先）', () => {
    // 甲木日主、天干に庚（偏官）と辛（正官）の両方あり
    // 命理正宗「有殺論殺、無殺論官」→ 偏官格
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '辛', branch: '巳', hiddenStems: ['丙', '戊', '庚'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '正官', relationship: 'controlled' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'weak', score: 1 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '有殺論殺で偏官格が優先');
    assert.strictEqual(result.basis, '官殺優先');
});

test('KakkyokuCalculator - 陽刃月で官殺透出 → 官殺格', () => {
    // 甲木日主、卯月（陽刃）、年干に庚（偏官）
    // 命理正宗: 陽刃月でも官殺透出があれば官殺格が優先
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '甲', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '壬', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '劫財', relationship: 'same' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '陽刃月でも偏官透出で偏官格');
    assert.strictEqual(result.basis, '官殺優先');
});

test('KakkyokuCalculator - 命理正宗実例⑤: 庚日主・丑月・時干丁火 → 正官格', () => {
    // 庚金日主、丑月、時干に丁（正官）
    // 丑の蔵干=[己,癸,辛] → 金(辛)の五行が官殺ではない
    // しかし天干に丁(火=官殺)あり → 月令蔵干不問で正官格
    const fortuneResult = {
        yearPillar:  { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        monthPillar: { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        dayPillar:   { stem: '庚', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '丁', branch: '丑', hiddenStems: ['己', '癸', '辛'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '正印', relationship: 'generated' },
        hour:  { tsuuhen: '正官', relationship: 'controlled' }
    };
    const strengthResult = { strength: 'strong', score: 4 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '庚日主・丑月・時干丁→正官格（月令蔵干不問）');
    assert.strictEqual(result.basis, '官殺優先');
});

test('KakkyokuCalculator - 命理正宗実例⑥: 壬日主・寅月・年干戊 → 偏官格', () => {
    // 壬水日主、寅月（建禄ではない）、年干に戊（偏官）
    // 壬を剋するのは土 → 戊は偏官 → 官殺優先で偏官格
    const fortuneResult = {
        yearPillar:  { stem: '戊', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        hourPillar:  { stem: '庚', branch: '子', hiddenStems: ['癸'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '食神', relationship: 'generate' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'neutral', score: 3 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '壬日主に戊(偏官)透出→偏官格');
    assert.strictEqual(result.basis, '官殺優先');
});

test('KakkyokuCalculator - 命理正宗実例⑦: 丙日主・子月・年干壬 → 偏官格', () => {
    // 丙火日主、子月、年干に壬（偏官）
    // 丙を剋するのは水 → 壬は偏官 → 官殺優先で偏官格
    const fortuneResult = {
        yearPillar:  { stem: '壬', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '庚', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏官', relationship: 'controlled' },
        month: { tsuuhen: '偏財', relationship: 'control' },
        hour:  { tsuuhen: '偏印', relationship: 'generated' }
    };
    const strengthResult = { strength: 'neutral', score: 2 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '丙日主に壬(偏官)透出→偏官格');
    assert.strictEqual(result.basis, '官殺優先');
});

test('KakkyokuCalculator - 命理正宗実例⑧: 乙日主・午月・天干に官殺なし → 月令蔵干透出', () => {
    // 乙木日主、午月、天干に官殺(金)なし
    // 午の蔵干=[丁,己] → 丁(火)が時干に透出 → 食神格
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '午', hiddenStems: ['丁', '己'] },
        dayPillar:   { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '丁', branch: '亥', hiddenStems: ['壬', '甲'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '劫財', relationship: 'same' },
        month: { tsuuhen: '正印', relationship: 'generated' },
        hour:  { tsuuhen: '食神', relationship: 'generate' }
    };
    const strengthResult = { strength: 'strong', score: 5 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '食神格', '乙日主・午月・丁透出→食神格');
    assert.strictEqual(result.basis, '月令透出');
});

test('KakkyokuCalculator - 命理正宗実例⑨: 丁日主・亥月 → 月令主気が正官なので正官格', () => {
    // 丁火日主、亥月、年干に甲（正印）が透出
    // 亥の蔵干=[壬,甲] → 主気の壬(水)は丁にとって正官
    // 甲(正印)が年干に透出しているが、月令主気が官殺なので正官格を優先
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        monthPillar: { stem: '辛', branch: '亥', hiddenStems: ['壬', '甲'] },
        dayPillar:   { stem: '丁', branch: '巳', hiddenStems: ['丙', '戊', '庚'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '正印', relationship: 'generated' },
        month: { tsuuhen: '偏財', relationship: 'control' },
        hour:  { tsuuhen: '劫財', relationship: 'same' }
    };
    const strengthResult = { strength: 'neutral', score: 3 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '正官格', '亥月主気=壬(正官)→官殺優先で正官格');
    assert.strictEqual(result.basis, '官殺優先・月令主気');
});

test('KakkyokuCalculator - 月令蔵干主気が官殺なら透出より優先（戊日主・寅月・丙透出）', () => {
    // 戊土日主、寅月、天干に丙(偏印)が透出
    // 寅の蔵干=[甲,丙,戊] → 主気の甲(木)は偏官
    // 丙(火=偏印)が年干に透出しているが、月令主気が官殺なので偏官格を優先
    const fortuneResult = {
        yearPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '庚', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '戊', branch: '戌', hiddenStems: ['戊', '辛', '丁'] },
        hourPillar:  { stem: '辛', branch: '酉', hiddenStems: ['辛'] }
    };
    const tsuuhenResult = {
        year:  { tsuuhen: '偏印', relationship: 'generated' },
        month: { tsuuhen: '食神', relationship: 'generate' },
        hour:  { tsuuhen: '傷官', relationship: 'generate' }
    };
    const strengthResult = { strength: 'strong', score: 4 };

    const result = calculator.calculate(fortuneResult, tsuuhenResult, strengthResult);
    assert.strictEqual(result.kakkyoku, '偏官格', '月令主気が偏官なら偏官格が優先');
    assert.strictEqual(result.basis, '官殺優先・月令主気');
});
