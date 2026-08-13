/**
 * フォーム描画・操作クラス
 */
import {
  DEFAULT_PREFECTURE_CODE,
  DEFAULT_SHI_MODE,
  MANUAL_PREFECTURE_VALUE,
  SHI_HELP_TEXT,
  SHI_MODE,
} from "../utils/constants.js";

export class FormRenderer {
    constructor(doc = typeof document !== "undefined" ? document : null) {
        this.document = doc;
        this.elements = {};
        if (this.document) {
            this.bindElements();
        }
    }

    /**
     * DOM要素のバインド
     */
    bindElements() {
        const doc = this.document;
        this.elements.form = doc.getElementById("fortune-form");

        this.elements.year = doc.getElementById("year");
        this.elements.month = doc.getElementById("month");
        this.elements.day = doc.getElementById("day");
        this.elements.hour = doc.getElementById("hour");
        this.elements.minute = doc.getElementById("minute");
        this.elements.timeUnknown = doc.getElementById("time-unknown");
        this.elements.genderInputs = doc.getElementsByName("gender");
        this.elements.shiModeInputs = doc.getElementsByName("shi-mode");
        this.elements.prefecture = doc.getElementById("prefecture");
        this.elements.tzGroup = doc.getElementById("tz-group");
        this.elements.tzSign = doc.getElementById("tz-sign");
        this.elements.tzHour = doc.getElementById("tz-hour");
        this.elements.tzMinute = doc.getElementById("tz-minute");
        this.elements.shiModeHelp = doc.getElementById("shi-mode-help");
        this.elements.tzHelp = doc.getElementById("tz-help");

        this.elements.calculateBtn = doc.getElementById("calculate-btn");
        this.elements.clearBtn = doc.getElementById("clear-btn");
        this.elements.pasteBtn = doc.getElementById("paste-btn");
        this.elements.errorMessage = doc.getElementById("error-message");

        this._bindShiModeHelp();
        this._bindTimeUnknown();
        this._bindPrefecture();
        this.updateShiHelp();
        this.updateTimeUnknownState();
        this.updateTimezoneVisibility();
    }

    _bindShiModeHelp() {
        const inputs = this.elements.shiModeInputs;
        if (!inputs) {
            return;
        }
        for (const radio of inputs) {
            radio.addEventListener("change", () => this.updateShiHelp());
        }
    }

    _bindTimeUnknown() {
        const checkbox = this.elements.timeUnknown;
        if (!checkbox || typeof checkbox.addEventListener !== "function") {
            return;
        }
        checkbox.addEventListener("change", () => this.updateTimeUnknownState());
    }

    _bindPrefecture() {
        const select = this.elements.prefecture;
        if (!select || typeof select.addEventListener !== "function") {
            return;
        }
        select.addEventListener("change", () => this.updateTimezoneVisibility());
    }

    updateShiHelp() {
        if (!this.elements.shiModeHelp) {
            return;
        }
        const mode = this._getRadioValue(this.elements.shiModeInputs) || DEFAULT_SHI_MODE;
        this.elements.shiModeHelp.textContent = SHI_HELP_TEXT[mode] || SHI_HELP_TEXT[SHI_MODE.SWITCH_23];
    }

    _isTimeUnknown() {
        return !!(this.elements.timeUnknown && this.elements.timeUnknown.checked);
    }

    updateTimeUnknownState() {
        const unknown = this._isTimeUnknown();
        if (this.elements.hour) {
            this.elements.hour.disabled = unknown;
            if (unknown) {
                this.elements.hour.value = "";
            }
        }
        if (this.elements.minute) {
            this.elements.minute.disabled = unknown;
            if (unknown) {
                this.elements.minute.value = "";
            }
        }
    }

    isManualPrefecture() {
        return this.elements.prefecture?.value === MANUAL_PREFECTURE_VALUE;
    }

    updateTimezoneVisibility() {
        const group = this.elements.tzGroup;
        const manual = this.isManualPrefecture();
        if (group && group.style) {
            group.style.display = manual ? "block" : "none";
        }
        if (!manual) {
            if (this.elements.tzSign) this.elements.tzSign.value = "+";
            if (this.elements.tzHour) this.elements.tzHour.value = "0";
            if (this.elements.tzMinute) this.elements.tzMinute.value = "0";
        }
    }

    _getRadioValue(inputs) {
        if (!inputs) {
            return null;
        }
        for (const radio of inputs) {
            if (radio.checked) {
                return radio.value;
            }
        }
        return null;
    }

    _setRadioValue(inputs, value) {
        if (!inputs) {
            return;
        }
        for (const radio of inputs) {
            radio.checked = radio.value === value;
        }
    }

    /**
     * 都道府県セレクトをマスタから生成する
     */
    populatePrefectures(master) {
        const select = this.elements.prefecture;
        const doc = this.document;
        if (!select || !master || !Array.isArray(master.prefectures)) {
            return;
        }

        select.innerHTML = "";
        if (Array.isArray(select.options)) {
            select.options.length = 0;
        }

        const manual = doc.createElement("option");
        manual.value = MANUAL_PREFECTURE_VALUE;
        manual.textContent = "手動";
        select.appendChild(manual);

        for (const prefecture of master.prefectures) {
            const option = doc.createElement("option");
            option.value = prefecture.code;
            option.textContent = prefecture.name;
            select.appendChild(option);
        }

        select.value = DEFAULT_PREFECTURE_CODE;
        this.updateTimezoneVisibility();
    }

    /**
     * フォームの値を取得
     */
    getValues() {
        const unknown = this._isTimeUnknown();
        return {
            year: this.elements.year.value,
            month: this.elements.month.value,
            day: this.elements.day.value,
            hour: unknown ? "" : this.elements.hour.value,
            minute: unknown ? "" : this.elements.minute.value,
            timeUnknown: unknown,
            gender: this._getRadioValue(this.elements.genderInputs),
            prefectureCode: this.elements.prefecture.value,
            tzSign: this.elements.tzSign.value,
            tzHour: this.elements.tzHour.value,
            tzMinute: this.elements.tzMinute.value,
            shiMode: this._getRadioValue(this.elements.shiModeInputs),
        };
    }

    /**
     * フォームに値をセット（クリップボード貼り付けなどで使用）
     */
    setValues(values) {
        if (values.year) this.elements.year.value = values.year;
        if (values.month) this.elements.month.value = values.month;
        if (values.day) this.elements.day.value = values.day;

        const hasTime = values.hour !== null && values.hour !== undefined && values.hour !== "";
        if (this.elements.timeUnknown) {
            this.elements.timeUnknown.checked = !hasTime;
        }
        this.updateTimeUnknownState();
        if (hasTime) {
            this.elements.hour.value = values.hour;
            if (values.minute !== null && values.minute !== undefined) {
                this.elements.minute.value = values.minute;
            }
        }

        if (values.gender) {
            this._setRadioValue(this.elements.genderInputs, values.gender);
        }
        if (values.prefectureCode !== undefined) {
            this.elements.prefecture.value = values.prefectureCode || DEFAULT_PREFECTURE_CODE;
            this.updateTimezoneVisibility();
        }
        if (values.tzSign) this.elements.tzSign.value = values.tzSign;
        if (values.tzHour !== undefined && values.tzHour !== null) this.elements.tzHour.value = values.tzHour;
        if (values.tzMinute !== undefined && values.tzMinute !== null) this.elements.tzMinute.value = values.tzMinute;
        if (values.shiMode) {
            this._setRadioValue(this.elements.shiModeInputs, values.shiMode);
            this.updateShiHelp();
        }
    }

    /**
     * フォームのリセット
     */
    reset() {
        if (this.elements.form && typeof this.elements.form.reset === "function") {
            this.elements.form.reset();
        }
        this._applyDefaults();
        this.hideError();
    }

    _applyDefaults() {
        this._setRadioValue(this.elements.shiModeInputs, DEFAULT_SHI_MODE);
        if (this.elements.timeUnknown) this.elements.timeUnknown.checked = false;
        if (this.elements.hour) this.elements.hour.value = "";
        if (this.elements.minute) this.elements.minute.value = "";
        if (this.elements.tzSign) this.elements.tzSign.value = "+";
        if (this.elements.tzHour) this.elements.tzHour.value = "0";
        if (this.elements.tzMinute) this.elements.tzMinute.value = "0";
        if (this.elements.prefecture) this.elements.prefecture.value = DEFAULT_PREFECTURE_CODE;
        this.updateShiHelp();
        this.updateTimeUnknownState();
        this.updateTimezoneVisibility();
    }

    /**
     * エラー表示
     */
    showError(message) {
        this.elements.errorMessage.textContent = message;
        this.elements.errorMessage.style.display = "block";
    }

    /**
     * エラー非表示
     */
    hideError() {
        this.elements.errorMessage.style.display = "none";
    }

    /**
     * イベントリスナー登録
     */
    onSubmit(handler) {
        this.elements.form.addEventListener("submit", (e) => {
            e.preventDefault();
            handler();
        });
    }

    onClear(handler) {
        this.elements.clearBtn.addEventListener("click", handler);
    }

    onPaste(handler) {
        this.elements.pasteBtn.addEventListener("click", handler);
    }
}
