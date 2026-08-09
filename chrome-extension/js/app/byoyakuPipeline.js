/**
 * 病薬オプションに応じた計算パイプライン分岐（Sprint B1）
 *
 * OFF: 命式本体のみ（Fortune / Juuniun / Tsuuhen / GreatFortune）
 * ON : 上記 + GouChuu / Strength / Kakkyoku / Byoyaku / DaiunHyouka
 */

/**
 * @param {boolean} byoyakuEnabled
 * @returns {{ runOptionalDiagnostics: boolean, showByoyakuSection: boolean, showGouChuuSection: boolean }}
 */
export function getByoyakuPipelinePlan(byoyakuEnabled) {
    const enabled = Boolean(byoyakuEnabled);
    return {
        runOptionalDiagnostics: enabled,
        showByoyakuSection: enabled,
        // D-02: 合冲は内部利用のみ。UIには出さない
        showGouChuuSection: false
    };
}

/**
 * 病薬ON時のみ optional 計算機を実行する。
 * OFF時は各計算機を呼ばず null を返す（AC-01 spy 用）。
 *
 * 順序: Kishou → GouChuu → Strength → Kakkyoku → Byoyaku → DaiunHyouka
 *
 * @param {object} deps
 * @param {object} deps.kishouAssessor
 * @param {object} deps.gouChuuCalculator
 * @param {object} deps.strengthAssessor
 * @param {object} deps.kakkyokuCalculator
 * @param {object} deps.byoyakuCalculator
 * @param {object} deps.daiunHyoukaCalculator
 * @param {object} ctx
 * @returns {{ kishouResult: object|null, gouChuuResult: object|null, strengthResult: object|null, kakkyokuResult: object|null, byoyakuResult: object|null, daiunEvaluations: object|null }}
 */
export function runOptionalDiagnostics(deps, ctx) {
    const plan = getByoyakuPipelinePlan(ctx.byoyakuEnabled);
    if (!plan.runOptionalDiagnostics) {
        return {
            kishouResult: null,
            gouChuuResult: null,
            strengthResult: null,
            kakkyokuResult: null,
            byoyakuResult: null,
            daiunEvaluations: null
        };
    }

    // 格局より前に気象（設計パイプライン）
    const kishouResult = deps.kishouAssessor.assess(ctx.fortune);

    const gouChuuResult = deps.gouChuuCalculator.analyzeNatalChart(ctx.fortune);
    const strengthResult = deps.strengthAssessor.assess(
        ctx.fortune, ctx.juuniunResults, gouChuuResult
    );
    const kakkyokuResult = deps.kakkyokuCalculator.calculate(
        ctx.fortune, ctx.tsuuhenResults, strengthResult, gouChuuResult
    );
    const byoyakuResult = deps.byoyakuCalculator.diagnose(
        kakkyokuResult, strengthResult, ctx.fortune, ctx.tsuuhenResults, gouChuuResult
    );
    // 気象結果は後続の突合（T-03d）で利用。現状は結果に添付するのみ
    if (byoyakuResult && !byoyakuResult.kishou) {
        byoyakuResult.kishou = kishouResult;
    }
    const daiunEvaluations = deps.daiunHyoukaCalculator.evaluate(
        ctx.greatFortuneCycles, byoyakuResult, ctx.fortune, strengthResult
    );

    return {
        kishouResult,
        gouChuuResult,
        strengthResult,
        kakkyokuResult,
        byoyakuResult,
        daiunEvaluations
    };
}
