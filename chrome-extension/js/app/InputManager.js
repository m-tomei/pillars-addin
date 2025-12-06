/**
 * 入力管理クラス
 */
import { InputParser } from "../utils/InputParser.js";
import { DateUtils } from "../utils/dateUtils.js";
import { InvalidDateError } from "../utils/errors.js";

export class InputManager {
    constructor(formRenderer) {
        this.formRenderer = formRenderer;
    }

    /**
     * フォームから入力を取得し、パースして検証する
     */
    getFormInput() {
        const rawValues = this.formRenderer.getValues();

        const parsed = InputParser.parseManualInput(
            rawValues.year,
            rawValues.month,
            rawValues.day,
            rawValues.hour,
            rawValues.minute,
            rawValues.gender,
            rawValues.birthplace
        );

        this.validateInput(parsed);

        return parsed;
    }

    /**
     * クリップボードから入力を取得し、フォームに反映する
     */
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const parsed = InputParser.parseClipboardText(text);
            this.formRenderer.setValues(parsed);
            return true;
        } catch (error) {
            console.error("Paste error:", error);
            throw error;
        }
    }

    /**
     * 入力データのバリデーション
     */
    validateInput(data) {
        const { year, month, day, hour, minute, gender } = data;

        // 必須項目チェック
        if (!year || !month || !day) {
            throw new InvalidDateError("年月日は必須です");
        }

        if (!gender) {
            throw new InvalidDateError("性別は必須です");
        }

        // 日付の妥当性チェック (DateUtilsを使用)
        if (!DateUtils.isValidDate(year, month, day)) {
            throw new InvalidDateError(`無効な日付です: ${year}年${month}月${day}日`);
        }

        // 時刻チェック
        if (hour !== null && (hour < 0 || hour > 23)) {
            throw new InvalidDateError("時は0〜23の範囲で入力してください");
        }

        if (minute !== null && (minute < 0 || minute > 59)) {
            throw new InvalidDateError("分は0〜59の範囲で入力してください");
        }
    }
}
