import { getByoyakuPipelinePlan, runOptionalDiagnostics } from '../../js/app/byoyakuPipeline.js';

function createSpyDeps() {
    const calls = {
        kishou: 0,
        gouChuu: 0,
        strength: 0,
        kakkyoku: 0,
        byoyaku: 0,
        daiun: 0
    };

    const deps = {
        kishouAssessor: {
            assess: () => {
                calls.kishou += 1;
                return { temperature: '寒', humidity: '中', clarity: '不明', choukou: { direction: '温める', primaryElements: ['火'], secondary: [] } };
            }
        },
        gouChuuCalculator: {
            analyzeNatalChart: () => {
                calls.gouChuu += 1;
                return { relations: [] };
            }
        },
        strengthAssessor: {
            assess: () => {
                calls.strength += 1;
                return { strength: 'strong', score: 5 };
            }
        },
        kakkyokuCalculator: {
            calculate: () => {
                calls.kakkyoku += 1;
                return { kakkyoku: '正官格', isEstablished: true };
            }
        },
        byoyakuCalculator: {
            diagnose: () => {
                calls.byoyaku += 1;
                return {
                    disease: { name: '比劫奪官', element: '木' },
                    medicine: { name: '財星', element: '土', exists: true }
                };
            }
        },
        daiunHyoukaCalculator: {
            evaluate: () => {
                calls.daiun += 1;
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
    assert.strictEqual(calls.byoyaku, 0, 'Byoyaku 非実行');
    assert.strictEqual(calls.daiun, 0, 'DaiunHyouka 非実行');
    assert.strictEqual(result.byoyakuResult, null);
    assert.strictEqual(result.gouChuuResult, null);
    assert.strictEqual(result.kishouResult, null);
});

test('AC-02 ON時は optional calculator を各1回呼ぶ', () => {
    const { deps, calls } = createSpyDeps();
    const result = runOptionalDiagnostics(deps, { ...sampleCtx, byoyakuEnabled: true });

    assert.strictEqual(calls.kishou, 1, 'Kishou を格局より前に実行');
    assert.strictEqual(calls.gouChuu, 1);
    assert.strictEqual(calls.strength, 1);
    assert.strictEqual(calls.kakkyoku, 1);
    assert.strictEqual(calls.byoyaku, 1);
    assert.strictEqual(calls.daiun, 1);
    assert.ok(result.byoyakuResult, 'byoyakuResult が返る');
    assert.ok(result.kishouResult, 'kishouResult が返る');
    assert.ok(result.gouChuuResult, '内部用 gouChuuResult は保持');
    assert.ok(result.byoyakuResult.kishou, 'byoyakuResult に kishou を添付');
});
