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
