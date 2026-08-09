import { getByoyakuPipelinePlan, runOptionalDiagnostics } from '../../js/app/byoyakuPipeline.js';

function createSpyDeps() {
    const calls = {
        kishou: 0,
        gouChuu: 0,
        strength: 0,
        kakkyoku: 0,
        keizen: 0,
        byoyaku: 0,
        daiun: 0,
        order: [],
        diagnoseInput: null
    };

    const deps = {
        kishouAssessor: {
            assess: () => {
                calls.kishou += 1;
                calls.order.push('kishou');
                return { temperature: '寒', humidity: '中', clarity: '不明', choukou: { direction: '温める', primaryElements: ['火'], secondary: [] } };
            }
        },
        gouChuuCalculator: {
            analyzeNatalChart: () => {
                calls.gouChuu += 1;
                calls.order.push('gouChuu');
                return { relations: [] };
            }
        },
        strengthAssessor: {
            assess: () => {
                calls.strength += 1;
                calls.order.push('strength');
                return { strength: 'strong', score: 5 };
            }
        },
        kakkyokuCalculator: {
            calculate: () => {
                calls.kakkyoku += 1;
                calls.order.push('kakkyoku');
                return { kakkyoku: '正官格', isEstablished: true };
            }
        },
        keizenAnalyzer: {
            analyze: () => {
                calls.keizen += 1;
                calls.order.push('keizen');
                return {
                    pillar: { kakkyoku: '正官格', youshinCategory: 'officer', youshinLabel: '官殺', isEstablished: true },
                    breaks: [],
                    supports: [],
                    summary: '正官格（成格）'
                };
            }
        },
        byoyakuCalculator: {
            diagnose: (input) => {
                calls.byoyaku += 1;
                calls.order.push('byoyaku');
                calls.diagnoseInput = input;
                return {
                    disease: { name: '比劫奪官', element: '木' },
                    medicine: { name: '財星', element: '土', exists: true },
                    kishou: input?.kishouResult || null,
                    keizen: input?.keizenResult
                        ? { pillar: input.keizenResult.pillar, breaks: input.keizenResult.breaks, summary: input.keizenResult.summary }
                        : null,
                    meta: { version: 'byoyaku-2.0' }
                };
            }
        },
        daiunHyoukaCalculator: {
            evaluate: () => {
                calls.daiun += 1;
                calls.order.push('daiun');
                return [{ judgment: '吉' }];
            }
        }
    };

    return { deps, calls };
}

const sampleCtx = {
    fortune: { dayPillar: { stem: '甲' } },
    juuniunResults: {},
    tsuuhenResults: {},
    greatFortuneCycles: [{ age: 1 }]
};

test('getByoyakuPipelinePlan - OFFは命式のみ', () => {
    const plan = getByoyakuPipelinePlan(false);
    assert.strictEqual(plan.runOptionalDiagnostics, false);
    assert.strictEqual(plan.showByoyakuSection, false);
    assert.strictEqual(plan.showGouChuuSection, false, 'D-02: 合冲UIは出さない');
});

test('getByoyakuPipelinePlan - ONは病薬計算するが合冲UIは出さない', () => {
    const plan = getByoyakuPipelinePlan(true);
    assert.strictEqual(plan.runOptionalDiagnostics, true);
    assert.strictEqual(plan.showByoyakuSection, true);
    assert.strictEqual(plan.showGouChuuSection, false, 'D-02: 合冲は内部のみ');
});

test('AC-01 OFF時は optional calculator を一切呼ばない', () => {
    const { deps, calls } = createSpyDeps();
    const result = runOptionalDiagnostics(deps, { ...sampleCtx, byoyakuEnabled: false });

    assert.strictEqual(calls.kishou, 0, 'Kishou 非実行');
    assert.strictEqual(calls.gouChuu, 0, 'GouChuu 非実行');
    assert.strictEqual(calls.strength, 0, 'Strength 非実行');
    assert.strictEqual(calls.kakkyoku, 0, 'Kakkyoku 非実行');
    assert.strictEqual(calls.keizen, 0, 'Keizen 非実行');
    assert.strictEqual(calls.byoyaku, 0, 'Byoyaku 非実行');
    assert.strictEqual(calls.daiun, 0, 'DaiunHyouka 非実行');
    assert.strictEqual(result.byoyakuResult, null);
    assert.strictEqual(result.gouChuuResult, null);
    assert.strictEqual(result.kishouResult, null);
    assert.strictEqual(result.keizenResult, null);
});

test('AC-02 ON時は optional calculator を各1回呼ぶ', () => {
    const { deps, calls } = createSpyDeps();
    const result = runOptionalDiagnostics(deps, { ...sampleCtx, byoyakuEnabled: true });

    assert.strictEqual(calls.kishou, 1, 'Kishou を格局より前に実行');
    assert.strictEqual(calls.gouChuu, 1);
    assert.strictEqual(calls.strength, 1);
    assert.strictEqual(calls.kakkyoku, 1);
    assert.strictEqual(calls.keizen, 1, 'Keizen を Byoyaku より前に実行');
    assert.strictEqual(calls.byoyaku, 1);
    assert.strictEqual(calls.daiun, 1);
    assert.deepStrictEqual(
        calls.order,
        ['kishou', 'gouChuu', 'strength', 'kakkyoku', 'keizen', 'byoyaku', 'daiun'],
        '設計順に実行'
    );
    assert.ok(calls.diagnoseInput.kishouResult, 'object APIへkishouResultを渡す');
    assert.ok(calls.diagnoseInput.keizenResult, 'object APIへkeizenResultを渡す');
    assert.ok(calls.diagnoseInput.gouChuuResult, 'object APIへgouChuuResultを渡す');
    assert.ok(result.byoyakuResult, 'byoyakuResult が返る');
    assert.ok(result.kishouResult, 'kishouResult が返る');
    assert.ok(result.keizenResult, 'keizenResult が返る');
    assert.ok(result.gouChuuResult, '内部用 gouChuuResult は保持');
    assert.ok(result.byoyakuResult.kishou, 'byoyakuResult に kishou を添付');
    assert.ok(result.byoyakuResult.keizen, 'byoyakuResult に keizen を添付');
});
