import { GouChuuCalculator } from '../../js/core/GouChuuCalculator.js';

let calc;

test('GouChuuCalculator.setup', () => {
    calc = new GouChuuCalculator();
    assert.ok(calc, 'Calculator instantiated');
});

// ============================================================
// 六合（支合）検出
// ============================================================

test('GouChuuCalculator - 六合検出: 子丑合', () => {
    // 時支=子, 年支=丑
    const fortune = {
        yearPillar:  { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '丙', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.ok(result.liuhe.length >= 1, '六合が1つ以上検出される');
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.strictEqual(match.resultElement, '土');
    assert.deepStrictEqual(match.branches, ['子', '丑']);
});

test('GouChuuCalculator - 六合検出: 寅亥合', () => {
    // 月支=寅, 時支=亥
    const fortune = {
        yearPillar:  { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '壬', branch: '亥', hiddenStems: ['壬', '甲'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuhe.find(l => l.name === '寅亥合化木');
    assert.ok(match, '寅亥合が検出される');
    assert.strictEqual(match.resultElement, '木');
});

test('GouChuuCalculator - 六合なしの場合', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        dayPillar:   { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        hourPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.strictEqual(result.liuhe.length, 0, '六合なし');
});

// ============================================================
// 三合検出
// ============================================================

test('GouChuuCalculator - 三合検出: 申子辰合水局', () => {
    const fortune = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.ok(result.sanhe.length >= 1, '三合が検出される');
    const match = result.sanhe.find(s => s.name === '申子辰合水局');
    assert.ok(match, '申子辰三合が検出される');
    assert.strictEqual(match.resultElement, '水');
    assert.strictEqual(match.type, '三合');
});

test('GouChuuCalculator - 三合なしの場合', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        dayPillar:   { stem: '庚', branch: '酉', hiddenStems: ['辛'] },
        hourPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.strictEqual(result.sanhe.length, 0, '三合なし');
});

// ============================================================
// 半合検出
// ============================================================

test('GouChuuCalculator - 半合検出: 帝旺を含むペア', () => {
    // 申と子があるが辰がない → 半合
    const fortune = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.banhe.find(b => b.name === '申子半合水局');
    assert.ok(match, '申子半合が検出される');
    assert.strictEqual(match.resultElement, '水');
});

test('GouChuuCalculator - 三合成立時は半合を報告しない', () => {
    // 申子辰が揃う → 三合成立、申子の半合は非報告
    const fortune = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.ok(result.sanhe.length >= 1, '三合が成立');
    // 三合の構成地支(年=0,月=1,日=2)による半合は除外される
    const overlapping = result.banhe.filter(b => {
        const sanheIndices = result.sanhe[0].positionIndices;
        return b.positionIndices.every(idx => sanheIndices.includes(idx));
    });
    assert.strictEqual(overlapping.length, 0, '三合構成の半合は報告されない');
});

// ============================================================
// 方合検出
// ============================================================

test('GouChuuCalculator - 方合検出: 寅卯辰方合木局', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.fanghe.find(f => f.name === '寅卯辰方合木局');
    assert.ok(match, '寅卯辰方合が検出される');
    assert.strictEqual(match.resultElement, '木');
    assert.strictEqual(match.direction, '東方');
    assert.strictEqual(match.season, '春');
});

// ============================================================
// 六冲検出
// ============================================================

test('GouChuuCalculator - 六冲検出: 子午冲', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuchong.find(c => c.name === '子午冲');
    assert.ok(match, '子午冲が検出される');
    assert.strictEqual(match.type, '六冲');
});

test('GouChuuCalculator - 冲の強度: 紧贴（隣接）', () => {
    // 月支=子(idx1), 日支=午(idx2) → distance=1 → 紧贴
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const clash = result.liuchong.find(c => c.name === '子午冲');
    assert.ok(clash, '子午冲検出');
    assert.strictEqual(clash.intensityLevel, 3, '隣接なので最強');
    assert.strictEqual(clash.intensity, '紧贴相冲');
});

test('GouChuuCalculator - 冲の強度: 隔支（2つ離れ）', () => {
    // 年支=子(idx0), 日支=午(idx2) → distance=2 → 隔支
    const fortune = {
        yearPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const clash = result.liuchong.find(c => c.name === '子午冲');
    assert.ok(clash, '子午冲検出');
    assert.strictEqual(clash.intensityLevel, 2, '2つ離れなので中');
    assert.strictEqual(clash.intensity, '隔支相冲');
});

test('GouChuuCalculator - 冲の強度: 遥冲（3つ離れ）', () => {
    // 年支=子(idx0), 時支=午(idx3) → distance=3 → 遥冲
    const fortune = {
        yearPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const clash = result.liuchong.find(c => c.name === '子午冲');
    assert.ok(clash, '子午冲検出');
    assert.strictEqual(clash.intensityLevel, 1, '3つ離れなので弱');
    assert.strictEqual(clash.intensity, '遥冲');
});

// ============================================================
// 合化判定
// ============================================================

test('GouChuuCalculator - 六合合化成功（4条件充足）', () => {
    // 子丑合化土: 月令=丑(土)→土を支持、天干に戊(土)あり、冲なし、被化者に強根なし
    // 注意: 子午冲を避けるため日支は午以外にする
    const fortune = {
        yearPillar:  { stem: '戊', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.strictEqual(match.isTransformed, true, '合化成功');
    assert.ok(match.transformDetail.includes('合化成功'), '合化成功の詳細');
});

test('GouChuuCalculator - 六合合而不化（月令不支持）', () => {
    // 子丑合化土: 月令=寅(木)→土を支持しない
    const fortune = {
        yearPillar:  { stem: '戊', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.strictEqual(match.isTransformed, false, '合化不成立');
    assert.ok(match.transformDetail.includes('月令'), '月令不支持の理由');
});

test('GouChuuCalculator - 六合合而不化（冲受け）', () => {
    // 子丑合化土: 月令=未(土)→土を支持するが、子が午と冲
    const fortune = {
        yearPillar:  { stem: '戊', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.strictEqual(match.isTransformed, false, '冲を受けているので合化不成立');
    assert.ok(match.transformDetail.includes('冲'), '冲受けの理由');
});

test('GouChuuCalculator - 六合合而不化（化神なし）', () => {
    // 子丑合化土: 月令=丑(土)→土を支持、しかし天干に土の天干なし
    const fortune = {
        yearPillar:  { stem: '壬', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '壬', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.strictEqual(match.isTransformed, false, '化神なしで合化不成立');
    assert.ok(match.transformDetail.includes('化神'), '化神なしの理由');
});

// ============================================================
// 三合の合化判定
// ============================================================

test('GouChuuCalculator - 三合合化成功', () => {
    // 申子辰合水局: 月支=子(水)→水を支持、天干に壬(水)あり、帝旺(子)未冲
    const fortune = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '壬', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const match = result.sanhe.find(s => s.name === '申子辰合水局');
    assert.ok(match, '申子辰三合が検出される');
    assert.strictEqual(match.isTransformed, true, '三合合化成功');
});

// ============================================================
// 複合ケース
// ============================================================

test('GouChuuCalculator - 合冲なしの命式', () => {
    // 関係性のない地支: 寅午酉丑 → 寅午は半合(火)がある
    // 完全に合冲なし: 子寅辰申は三合(水)がある...
    // 辰午申戌 → 辰戌冲がある
    // 寅巳酉丑 → 巳酉丑三合がある
    // 完全に合冲がない組合せ: 寅辰午申 → 寅午半合がある...
    // 丑卯巳未 → 丑未冲がある
    // 実質不可能に近いが、テストのため確認
    // 子卯巳申 → 巳申合がある
    // 丑辰午酉 → 辰酉合がある
    // 試し: 寅巳未戌 → 巳は寅午戌の火三合に含まれないので三合なし、寅と巳は六合なし、未と戌は六合なし
    // 寅巳の支合もなし、未戌の支合もなし。寅申冲→申なし。六冲なし。
    // 方合: 寅卯辰→卯なし。巳午未→午なし。OK
    // 半合: 寅午→午なし。寅と巳の半合はない。巳酉→酉なし。OK。
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '丙', branch: '巳', hiddenStems: ['丙', '庚', '戊'] },
        dayPillar:   { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        hourPillar:  { stem: '壬', branch: '戌', hiddenStems: ['戊', '辛', '丁'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.strictEqual(result.liuhe.length, 0, '六合なし');
    assert.strictEqual(result.sanhe.length, 0, '三合なし');
    assert.strictEqual(result.banhe.length, 0, '半合なし');
    assert.strictEqual(result.fanghe.length, 0, '方合なし');
    assert.strictEqual(result.liuchong.length, 0, '六冲なし');
});

// ============================================================
// 大運分析
// ============================================================

test('GouChuuCalculator - 大運分析: 大運地支と命式の支合', () => {
    // 命式: 年支=丑、大運地支=子 → 子丑合
    const fortune = {
        yearPillar:  { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeDaiunInteraction('子', fortune);
    assert.ok(result.liuhe.length >= 1, '大運との六合が検出される');
    const match = result.liuhe.find(l => l.name === '子丑合化土');
    assert.ok(match, '子丑合が検出される');
    assert.ok(match.positionIndices.includes(4), '大運(index=4)が含まれる');
});

test('GouChuuCalculator - 大運分析: 大運地支と命式の六冲', () => {
    // 命式: 日支=午、大運地支=子 → 子午冲
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] }
    };
    const result = calc.analyzeDaiunInteraction('子', fortune);
    assert.ok(result.liuchong.length >= 1, '大運との六冲が検出される');
    const clash = result.liuchong.find(c => c.name === '子午冲');
    assert.ok(clash, '子午冲が検出される');
    assert.ok(clash.positionIndices.includes(4), '大運(index=4)が含まれる');
});

test('GouChuuCalculator - 大運分析: 大運地支が命式と合冲なし', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        dayPillar:   { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        hourPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] }
    };
    // 大運=巳 → 寅と巳に支合・冲はなし（巳申合だが申なし、巳亥冲だが亥なし）
    const result = calc.analyzeDaiunInteraction('巳', fortune);
    assert.strictEqual(result.liuhe.length, 0, '大運との六合なし');
    assert.strictEqual(result.liuchong.length, 0, '大運との六冲なし');
    assert.strictEqual(result.sanhe.length, 0, '大運との三合なし');
    assert.strictEqual(result.banhe.length, 0, '大運との半合なし');
    assert.strictEqual(result.fanghe.length, 0, '大運との方合なし');
});

// ============================================================
// エッジケース
// ============================================================

test('GouChuuCalculator - 時柱なしでも動作する', () => {
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '乙', branch: '卯', hiddenStems: ['乙'] },
        dayPillar:   { stem: '戊', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  null
    };
    const result = calc.analyzeNatalChart(fortune);
    // 寅卯辰方合が成立するはず
    assert.ok(result.fanghe.length >= 1, '方合が検出される');
    assert.ok(result.fanghe[0].name === '寅卯辰方合木局', '寅卯辰方合');
});

test('GouChuuCalculator - 同一地支が複数の柱に存在', () => {
    // 年支=子、月支=子 → 同一地支が2つ
    const fortune = {
        yearPillar:  { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '午', hiddenStems: ['丁', '己'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    // 子午冲が複数成立: 年子-日午, 年子-時午, 月子-日午, 月子-時午
    assert.ok(result.liuchong.length >= 2, '複数の子午冲が検出される');
});

test('GouChuuCalculator - 戻り値構造の検証', () => {
    const fortune = {
        yearPillar:  { stem: '庚', branch: '申', hiddenStems: ['庚', '壬', '戊'] },
        monthPillar: { stem: '壬', branch: '子', hiddenStems: ['癸'] },
        dayPillar:   { stem: '甲', branch: '辰', hiddenStems: ['戊', '乙', '癸'] },
        hourPillar:  { stem: '丙', branch: '午', hiddenStems: ['丁', '己'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.ok(Array.isArray(result.liuhe), 'liuheは配列');
    assert.ok(Array.isArray(result.sanhe), 'sanheは配列');
    assert.ok(Array.isArray(result.banhe), 'banheは配列');
    assert.ok(Array.isArray(result.fanghe), 'fangheは配列');
    assert.ok(Array.isArray(result.liuchong), 'liuchongは配列');

    // 三合の要素構造を検証
    if (result.sanhe.length > 0) {
        const s = result.sanhe[0];
        assert.ok(s.type, 'typeあり');
        assert.ok(s.name, 'nameあり');
        assert.ok(Array.isArray(s.branches), 'branchesは配列');
        assert.ok(Array.isArray(s.positions), 'positionsは配列');
        assert.ok(Array.isArray(s.positionIndices), 'positionIndicesは配列');
        assert.ok(s.resultElement, 'resultElementあり');
        assert.ok(typeof s.isTransformed === 'boolean', 'isTransformedはboolean');
        assert.ok(typeof s.transformDetail === 'string', 'transformDetailはstring');
    }

    // 六冲の要素構造を検証
    if (result.liuchong.length > 0) {
        const c = result.liuchong[0];
        assert.ok(c.type, 'typeあり');
        assert.ok(c.name, 'nameあり');
        assert.ok(Array.isArray(c.branches), 'branchesは配列');
        assert.ok(typeof c.intensityLevel === 'number', 'intensityLevelは数値');
        assert.ok(typeof c.intensity === 'string', 'intensityはstring');
    }
});

// ============================================================
// transformedElementMap テスト
// ============================================================

test('GouChuuCalculator - transformedElementMapが合化成功を反映する', () => {
    // 子丑合化土成功: 年支=丑(idx0), 月支=丑(idx1), 時支=子(idx3)
    // 合化条件: 月令=丑(土)→土支持、天干に戊(土)=化神、冲なし
    const fortune = {
        yearPillar:  { stem: '戊', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        monthPillar: { stem: '己', branch: '丑', hiddenStems: ['己', '癸', '辛'] },
        dayPillar:   { stem: '甲', branch: '卯', hiddenStems: ['乙'] },
        hourPillar:  { stem: '甲', branch: '子', hiddenStems: ['癸'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    const map = result.transformedElementMap;
    assert.ok(map instanceof Map, 'transformedElementMapはMapインスタンス');
    // 子丑合化土が成功→ 関連する位置が土に変化
    assert.strictEqual(map.get(3), '土', '時支(子)が土に変化');
    assert.strictEqual(map.get(0), '土', '年支(丑)が土に変化');
    // 合化していない地支はマップに含まれない
    assert.strictEqual(map.has(2), false, '日支(卯)は合化していない');
});

test('GouChuuCalculator - 合化不成立時はtransformedElementMapが空', () => {
    // 合冲なしの命式（寅巳未戌）
    const fortune = {
        yearPillar:  { stem: '甲', branch: '寅', hiddenStems: ['甲', '丙', '戊'] },
        monthPillar: { stem: '丙', branch: '巳', hiddenStems: ['丙', '庚', '戊'] },
        dayPillar:   { stem: '己', branch: '未', hiddenStems: ['己', '丁', '乙'] },
        hourPillar:  { stem: '壬', branch: '戌', hiddenStems: ['戊', '辛', '丁'] }
    };
    const result = calc.analyzeNatalChart(fortune);
    assert.strictEqual(result.transformedElementMap.size, 0, '合化なしでマップが空');
});
