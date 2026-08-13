/**
 * 入力管理クラス
 */
import { InputParser } from "../utils/InputParser.js";
import { DateUtils } from "../utils/dateUtils.js";
import { InvalidDateError } from "../utils/errors.js";
import {
  DEFAULT_SHI_MODE,
  MAX_ABS_OFFSET_MINUTES,
  SHI_MODE,
} from "../utils/constants.js";

const VALID_SHI_MODES = new Set(Object.values(SHI_MODE));

export class InputManager {
    constructor(formRenderer) {
        this.formRenderer = formRenderer;
        this.prefectureCodes = new Set();
    }

    setLongitudeMaster(master) {
        const prefectures = master && Array.isArray(master.prefectures) ? master.prefectures : [];
        this.prefectureCodes = new Set(prefectures.map((p) => p.code));
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
            {
                prefectureCode: rawValues.prefectureCode,
                tzSign: rawValues.tzSign,
                tzHour: rawValues.tzHour,
                tzMinute: rawValues.tzMinute,
                shiMode: rawValues.shiMode,
            }
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
     * 入力データのバリデーションと正規化
     */
    validateInput(data) {
        const { year, month, day, hour, gender } = data;

        if (!year || !month || !day) {
            throw new InvalidDateError("年月日は必須です");
        }

        if (!gender) {
            throw new InvalidDateError("性別は必須です");
        }

        if (!DateUtils.isValidDate(year, month, day)) {
            throw new InvalidDateError(`無効な日付です: ${year}年${month}月${day}日`);
        }

        if (hour !== null && hour !== undefined) {
            if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
                throw new InvalidDateError("時は0〜23の範囲で入力してください");
            }
            if (data.minute === null || data.minute === undefined) {
                data.minute = 0;
            }
        } else {
            data.minute = null;
        }

        if (
            data.minute !== null &&
            (!Number.isInteger(data.minute) || data.minute < 0 || data.minute > 59)
        ) {
            throw new InvalidDateError("分は0〜59の範囲で入力してください");
        }

        if (data.tzSign !== "+" && data.tzSign !== "-") {
            throw new InvalidDateError(`時差の符号が不正です: ${data.tzSign}`);
        }
        if (data.shiMode == null || data.shiMode === "") {
            data.shiMode = DEFAULT_SHI_MODE;
        }
        if (!VALID_SHI_MODES.has(data.shiMode)) {
            throw new InvalidDateError(`子時モードが不正です: ${data.shiMode}`);
        }

        if (!Number.isFinite(data.tzHour) || data.tzHour < 0 || data.tzHour > 23) {
            throw new InvalidDateError("時差の時間は0〜23の範囲で入力してください");
        }
        if (!Number.isFinite(data.tzMinute) || data.tzMinute < 0 || data.tzMinute > 59) {
            throw new InvalidDateError("時差の分は0〜59の範囲で入力してください");
        }
        if (!Number.isFinite(data.offsetMinutes) || Math.abs(data.offsetMinutes) > MAX_ABS_OFFSET_MINUTES) {
            throw new InvalidDateError("時差は±23:59の範囲で入力してください");
        }

        if (data.prefectureCode != null && data.prefectureCode !== "") {
            if (!this.prefectureCodes.has(data.prefectureCode)) {
                throw new InvalidDateError(`都道府県コードが不正です: ${data.prefectureCode}`);
            }
        } else {
            data.prefectureCode = null;
        }
    }
}
