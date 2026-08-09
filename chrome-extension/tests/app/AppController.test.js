import { AppController } from '../../js/app/AppController.js';

function createController({ initialized = true, calculated = false, valid = true } = {}) {
    const controller = Object.create(AppController.prototype);
    controller.initialized = initialized;
    controller.hasCalculatedResults = calculated;
    controller.byoyakuEnabled = false;
    controller.inputManager = {
        getFormInput: () => {
            if (!valid) throw new Error('入力エラー');
            return {};
        }
    };
    controller.calculateCalls = 0;
    controller.handleCalculate = () => {
        controller.calculateCalls += 1;
    };
    return controller;
}

test('D-04 未計算なら有効入力でも自動再計算しない', () => {
    const controller = createController({ calculated: false, valid: true });
    controller.handleByoyakuOptionChange(true);

    assert.strictEqual(controller.byoyakuEnabled, true, 'フラグは更新');
    assert.strictEqual(controller.calculateCalls, 0, '未計算なので再計算しない');
});

test('AC-03 計算済みかつ有効入力なら自動再計算する', () => {
    const controller = createController({ calculated: true, valid: true });
    controller.handleByoyakuOptionChange(false);

    assert.strictEqual(controller.byoyakuEnabled, false, 'フラグは更新');
    assert.strictEqual(controller.calculateCalls, 1, '一度だけ再計算');
});

test('AC-04 無効入力ならフラグだけ更新する', () => {
    const controller = createController({ calculated: true, valid: false });
    controller.handleByoyakuOptionChange(true);

    assert.strictEqual(controller.byoyakuEnabled, true, 'フラグは更新');
    assert.strictEqual(controller.calculateCalls, 0, '再計算しない');
});

test('BYO-DD-07 病薬計算失敗時も命式と大運を表示する', async () => {
    const controller = Object.create(AppController.prototype);
    const fortune = {
        yearPillar: { stem: '甲', branch: '子' },
        monthPillar: { stem: '丙', branch: '寅' },
        dayPillar: { stem: '戊', branch: '午' },
        hourPillar: { stem: '庚', branch: '申' }
    };
    const shown = { results: 0, byoyakuError: 0 };

    controller.formRenderer = {
        hideError() {},
        showError(message) { throw new Error(`unexpected form error: ${message}`); }
    };
    controller.inputManager = {
        getFormInput: () => ({
            year: 1990, month: 1, day: 1, hour: 12, minute: 0,
            gender: 'male', byoyakuEnabled: true
        })
    };
    controller.fortuneCalculator = { calculateFortune: async () => fortune };
    controller.juuniunCalculator = { calculateForPillars: () => ({}) };
    controller.tsuuhenCalculator = { calculateForPillars: () => ({}) };
    controller.greatFortuneCalculator = { calculateCycles: () => [] };
    controller.kishouAssessor = { assess: () => { throw new Error('病薬側の故障'); } };
    controller.gouChuuCalculator = {};
    controller.strengthAssessor = {};
    controller.kakkyokuCalculator = {};
    controller.keizenAnalyzer = {};
    controller.byoyakuCalculator = {};
    controller.daiunHyoukaCalculator = {};
    controller.resultRenderer = {
        showResults(...args) {
            shown.results += 1;
            assert.strictEqual(args[0], fortune, '命式を渡す');
            assert.strictEqual(args[5], null, '病薬依存結果はnull');
        },
        showByoyakuError() { shown.byoyakuError += 1; }
    };
    controller.hasCalculatedResults = false;

    await controller.handleCalculate();

    assert.strictEqual(shown.results, 1, '命式・大運を描画');
    assert.strictEqual(shown.byoyakuError, 1, '病薬位置に失敗表示');
    assert.strictEqual(controller.hasCalculatedResults, true, '命式は計算済み');
});
