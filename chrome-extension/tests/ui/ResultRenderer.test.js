import { ResultRenderer } from '../../js/ui/ResultRenderer.js';

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

function samplePayload(overrides = {}) {
    const base = {
        strengthResult: {
            strength: 'strong',
            strengthLabel: '身旺',
            score: 5,
            details: {
                monthLordScore: 2,
                rootScore: 2,
                heavenlyStemScore: 1,
                juuniunBonus: 0,
                gouChuuScore: 0
            }
        },
        kakkyokuResult: {
            kakkyoku: '正官格',
            categoryLabel: '正格',
            isEstablished: false,
            breakReason: '傷官見官',
            basisDetail: '月令に正官'
        },
        byoyakuResult: {
            fourDisease: '旺',
            fourMedicine: '損',
            fourDiseaseElement: '木',
            fourMedicineElement: '金',
            treatmentMode: null,
            disease: { name: '比劫奪財', element: '木', tenGod: '比肩', severity: 'moderate' },
            medicine: { name: '官殺', element: '金', tenGod: '正官', exists: true, location: '時干' },
            summary: '代表理由',
            diagnoses: [
                {
                    role: 'primary',
                    source: 'keizen',
                    disease: { name: '比劫奪財', element: '木', tenGod: '比肩', severity: 'moderate' },
                    medicine: {
                        name: '官殺',
                        element: '金',
                        tenGod: '正官',
                        exists: true,
                        location: '時干',
                        choukouAligned: false
                    },
                    medicineSecondary: {
                        name: '調候（冷ます）',
                        element: '水',
                        elements: ['水'],
                        exists: false,
                        location: null,
                        choukouAligned: true
                    },
                    reason: '比劫が財を奪う（主軸の薬と調候を併記）',
                    fourDisease: '旺',
                    fourMedicine: '損'
                },
                {
                    role: 'secondary',
                    source: 'kishou',
                    disease: {
                        name: '気象偏枯（熱/燥）',
                        element: null,
                        causeElements: ['火'],
                        tenGod: null,
                        severity: 'severe'
                    },
                    medicine: {
                        name: '調候（冷ます）',
                        element: '水',
                        exists: false,
                        location: null,
                        choukouAligned: true
                    },
                    reason: '気象の偏りを調候で整える',
                    fourDisease: null,
                    fourMedicine: null
                }
            ],
            kishou: {
                temperature: '熱',
                humidity: '燥',
                severity: 'severe',
                summary: '気象は熱・燥寄り。調候は「冷ます」',
                choukou: {
                    direction: '冷ます',
                    primaryElements: ['水'],
                    secondary: [{ direction: '潤す', elements: ['水'], reason: '燥の調候' }]
                }
            },
            keizen: {
                pillar: {
                    kakkyoku: '正官格',
                    youshinLabel: '官殺を守る',
                    isEstablished: false
                },
                breaks: [{ name: '傷官見官', condition: '傷官見官' }],
                summary: '正官格（主軸:官殺を守る・破格）。損傷: 傷官見官'
            },
            balance: {
                label: '病重薬軽',
                diseaseScore: 2,
                medicineScore: 1,
                reading: '病力2/薬力1（病重薬軽）'
            },
            kiki: {
                ki: [
                    { label: '官殺', element: '金', tenGod: '正官' },
                    { label: '調候（冷ます）', element: '水' }
                ],
                ji: [{ label: '比劫奪財', element: '木', tenGod: '比肩' }],
                note: '薬側を喜、病側を忌とする（役割ラベル）'
            }
        }
    };

    return {
        strengthResult: overrides.strengthResult || base.strengthResult,
        kakkyokuResult: overrides.kakkyokuResult || base.kakkyokuResult,
        byoyakuResult: {
            ...base.byoyakuResult,
            ...(overrides.byoyakuResult || {})
        }
    };
}

test('ResultRenderer - 表示順は気象→主軸→身旺弱→四病四薬→病薬→バランス→喜忌', () => {
    createDomStub();
    const renderer = new ResultRenderer();
    const payload = samplePayload();
    renderer.renderByoyakuSection(payload);

    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('病薬診断'), 'ヘッダは病薬診断');
    assert.ok(!html.includes('格局・病薬'), '旧ヘッダは出さない');

    const order = ['kishou', 'keizen', 'strength', 'four-disease', 'diagnosis', 'balance', 'kiki']
        .map(name => html.indexOf(`data-block="${name}"`));
    for (let i = 1; i < order.length; i++) {
        assert.ok(order[i - 1] >= 0, `${i - 1}番目ブロックが存在する`);
        assert.ok(order[i] > order[i - 1], `ブロック順が仕様どおり（${i - 1} < ${i}）`);
    }
});

test('ResultRenderer - 気象・主軸・四病四薬・喜忌を重複なく描画する', () => {
    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection(samplePayload());
    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;

    assert.ok(html.includes('【気象】熱・燥'), '気象ブロック');
    assert.ok(html.includes('調候: 冷ます → 水'), '調候方向');
    assert.ok(html.includes('（潤す → 水）'), '副調候');
    assert.ok(html.includes('【主軸】正官格（官殺を守る）'), '主軸ブロック');
    assert.ok(html.includes('破: 傷官見官'), '破要約');
    assert.ok(html.includes('【五行偏重】旺（木） → 損（金）'), '五行偏重分類を明示');
    assert.ok(html.includes('四病四薬による命式全体の分類'), '判定層の違いを明示');
    assert.ok(html.includes('【主軸の病】比劫奪財'), '主軸病ラベル');
    assert.ok(html.includes('【主軸の薬】官殺'), '主軸薬ラベル');
    assert.ok(!html.includes('気象偏枯'), '上段と重複する気象診断は出さない');
    assert.ok(!html.includes('【薬・調候】'), '調候薬を診断ごとに重複表示しない');
    assert.ok(html.includes('【主軸病薬のバランス】病重薬軽'), 'バランス');
    assert.ok(html.includes('今は薬不足'), 'バランス読解文');
    assert.ok(html.includes('主軸の喜: 官殺・金'), '主軸の喜');
    assert.ok(html.includes('調候の喜: 調候（冷ます）・水'), '調候の喜を分離');
    assert.ok(html.includes('主軸の忌: 比劫奪財・木'), '主軸の忌');
});

test('ResultRenderer - 雕は四薬ではなく琢で表示する', () => {
    createDomStub();
    const renderer = new ResultRenderer();
    renderer.renderByoyakuSection(samplePayload({
        byoyakuResult: {
            fourDisease: '雕',
            fourMedicine: null,
            fourDiseaseElement: null,
            fourMedicineElement: null,
            treatmentMode: '琢',
            treatmentElements: ['木'],
            diagnoses: [{
                role: 'primary',
                source: 'keizen',
                disease: { name: '未彫琢', element: null, tenGod: null, severity: 'mild' },
                medicine: {
                    name: '対立導入',
                    element: '火',
                    exists: false,
                    location: null,
                    choukouAligned: true
                },
                reason: '純だが未琢',
                fourDisease: '雕',
                fourMedicine: null,
                treatmentMode: '琢'
            }],
            kishou: {
                temperature: '温',
                humidity: '中和',
                severity: 'mild',
                summary: '気象はおおむね穏やか',
                choukou: { direction: 'なし', primaryElements: [], secondary: [] }
            },
            keizen: {
                pillar: { kakkyoku: '正官格', youshinLabel: '官殺を守る', isEstablished: true },
                breaks: [],
                summary: '成格'
            },
            balance: { label: '病なし薬なし', diseaseScore: 0, medicineScore: 0, reading: '平常' },
            kiki: { ki: [], ji: [], note: '' }
        }
    }));

    const html = renderer.elements.kakkyokuByoyakuResult.innerHTML;
    assert.ok(html.includes('【五行偏重】雕 → 処置 琢（木）'), '琢を四薬と分離');
    assert.ok(!html.includes('【主軸の薬】対立導入（琢）'), '個別薬に四薬処置を混ぜない');
    assert.ok(!html.includes('nullの薬'), 'null薬ラベルを出さない');
    assert.ok(html.includes('目立った破なし'), '破なし文言');
});

test('ResultRenderer - showResults はOFF時に病薬セクションを隠す', () => {
    const nodes = createDomStub();
    const renderer = new ResultRenderer();
    renderer.showResults(
        {
            yearPillar: { stem: '甲', branch: '子', hiddenStems: ['癸'] },
            monthPillar: { stem: '丙', branch: '寅', hiddenStems: ['甲'] },
            dayPillar: { stem: '戊', branch: '午', hiddenStems: ['丁'] },
            hourPillar: null
        },
        { year: { juuniun: '長生' }, month: { juuniun: '沐浴' }, day: { juuniun: '帝旺' }, hour: null },
        { year: { tsuuhen: '偏印' }, month: { tsuuhen: '七殺' }, day: { tsuuhen: '日主' }, hour: null },
        [],
        1990,
        null,
        null,
        null
    );

    assert.strictEqual(nodes.get('kakkyoku-byoyaku-section').style.display, 'none');
    assert.strictEqual(nodes.get('kakkyoku-byoyaku-result').innerHTML, '');
});

test('ResultRenderer - 病薬失敗時は病薬位置にエラーを表示する', () => {
    const nodes = createDomStub();
    const renderer = new ResultRenderer();

    renderer.showByoyakuError();

    assert.strictEqual(nodes.get('kakkyoku-byoyaku-section').style.display, 'block');
    assert.ok(
        nodes.get('kakkyoku-byoyaku-result').innerHTML.includes('病薬診断の計算に失敗'),
        '失敗メッセージ'
    );
});
