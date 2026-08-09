import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DayMasterStrengthAssessor } from '../../js/core/DayMasterStrengthAssessor.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data');

const stemBranchData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'stem_branch_master.json'), 'utf8'));

let assessor;

test('DayMasterStrengthAssessor.setup', () => {
    assessor = new DayMasterStrengthAssessor(stemBranchData);
    assert.ok(assessor, 'Assessor instantiated');
});

test('DayMasterStrengthAssessor.assess - 身旺の命式', () => {
    // 甲木日主、寅月（得令）、地支に木の根あり、天干に比劫・印星あり
    // 甲寅年 甲寅月 甲寅日 甲寅時 → 極端な例
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] }
    };
    const juuniunResult = {
        year:  { juuniun: '建禄' },
        month: { juuniun: '建禄' },
        day:   { juuniun: '建禄' },
        hour:  { juuniun: '沐浴' }
    };

    const result = assessor.assess(fortuneResult, juuniunResult);
    assert.strictEqual(result.strength, 'strong', '身旺と判定される');
    assert.strictEqual(result.strengthLabel, '身旺');
    assert.ok(result.score >= 3, 'スコアが3以上');
    assert.ok(result.details.monthLordScore > 0, '月令得令でプラス');
    assert.ok(result.details.rootScore > 0, '根があるのでプラス');
    assert.ok(result.details.heavenlyStemScore > 0, '天干の助力あり');
    assert.strictEqual(result.details.juuniunBonus, 1, '月支が建禄なのでボーナスあり');
});

test('DayMasterStrengthAssessor.assess - 身弱の命式', () => {
    // 甲木日主、申月（金月、剋される）、地支に根なし、天干に官殺
    const fortuneResult = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const juuniunResult = {
        year:  { juuniun: '絶' },
        month: { juuniun: '絶' },
        day:   { juuniun: '死' },
        hour:  { juuniun: '絶' }
    };

    const result = assessor.assess(fortuneResult, juuniunResult);
    assert.strictEqual(result.strength, 'weak', '身弱と判定される');
    assert.strictEqual(result.strengthLabel, '身弱');
    assert.ok(result.score <= 1, 'スコアが1以下');
});

test('DayMasterStrengthAssessor.assess - 中和の命式', () => {
    // 甲木日主、午月（火月=洩らす=-1）、辰に根あり(+1)、壬は水=印星(+1)、丙は火=食神(0)
    // monthLord=-1, root=1(辰の乙), heavenlyStem=1(壬), juuniunBonus=0(死) → total=1... still weak
    // Adjust: 甲木日主、辰月（土月=剋される=-1のはず... いや甲は木、辰は土、木剋土=日干が剋す方向→無関係=0）
    // 甲木日主、巳月（火月、木生火=洩らす=-1）、天干に壬(水=印+1)、辰に根(+1)、丙(火=食神=0)
    // monthLord=-1, root=1, heavenlyStem=1, juuniunBonus=1(冠帯)=total=2 → neutral
    const fortuneResult = {
        yearPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        monthPillar: { stem: '壬', branch: '巳', hiddenStems: ['丙', '庚', '戊'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const juuniunResult = {
        year:  { juuniun: '死' },
        month: { juuniun: '冠帯' },
        day:   { juuniun: '衰' },
        hour:  { juuniun: '絶' }
    };

    const result = assessor.assess(fortuneResult, juuniunResult);
    assert.strictEqual(result.strength, 'neutral', '中和と判定される');
    assert.strictEqual(result.strengthLabel, '中和');
    assert.strictEqual(result.score, 2, 'スコアが2');
});

test('DayMasterStrengthAssessor.assess - 時柱なしでも動作する', () => {
    const fortuneResult = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  null
    };
    const juuniunResult = {
        year:  { juuniun: '建禄' },
        month: { juuniun: '建禄' },
        day:   { juuniun: '建禄' },
        hour:  null
    };

    const result = assessor.assess(fortuneResult, juuniunResult);
    assert.ok(result.strength, '時柱なしでも判定できる');
    assert.ok(typeof result.score === 'number', 'スコアが数値');
});

test('DayMasterStrengthAssessor.assess - 合化成功で根の評価が化後の五行で行われる', () => {
    // 癸水日主、年支=丑(蔵干に癸=水=根)、月支=丑(同)、時支=子(蔵干に癸=水=根)
    // 子丑合化土が成功すると、これらの地支は土になり水の根が消失する
    const fortuneResult = {
        yearPillar:  { stem: '丙', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        dayPillar:   { stem: '癸', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '戊', branch: '子', hiddenStems: ['癸'] }
    };
    const juuniunResult = {
        year:  { juuniun: '衰' },
        month: { juuniun: '衰' },
        day:   { juuniun: '死' },
        hour:  { juuniun: '帝旺' }
    };

    // 合化なし: 丑(idx0,1)に癸=水=根, 子(idx3)に癸=水=根 → rootScore=3
    const resultWithout = assessor.assess(fortuneResult, juuniunResult);

    // 合化あり: idx0,1,3がすべて土に変化 → 水の根なし → rootScore=0
    const gouChuuResult = {
        liuhe: [], sanhe: [], banhe: [], fanghe: [], liuchong: [],
        transformedElementMap: new Map([[0, '土'], [1, '土'], [3, '土']])
    };
    const resultWith = assessor.assess(fortuneResult, juuniunResult, gouChuuResult);

    assert.strictEqual(resultWithout.details.rootScore, 3, '合化なしで根スコア3');
    assert.strictEqual(resultWith.details.rootScore, 0, '合化後は根スコア0（化後の五行で評価）');
});
