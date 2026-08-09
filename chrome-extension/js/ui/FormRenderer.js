/**
 * フォーム描画・操作クラス
 */
export class FormRenderer {
    constructor() {
        this.elements = {};
        this.bindElements();
    }

    /**
     * DOM要素のバインド
     */
    bindElements() {
        this.elements.form = document.getElementById("fortune-form");

        // 入力フィールド
        this.elements.year = document.getElementById("year");
        this.elements.month = document.getElementById("month");
        this.elements.day = document.getElementById("day");
        this.elements.hour = document.getElementById("hour");
        this.elements.minute = document.getElementById("minute");
        this.elements.genderInputs = document.getElementsByName("gender");
        this.elements.birthplace = document.getElementById("birthplace");
        this.elements.byoyakuOption = document.getElementById("byoyaku-option");

        // ボタン
        this.elements.calculateBtn = document.getElementById("calculate-btn");
        this.elements.clearBtn = document.getElementById("clear-btn");
        this.elements.pasteBtn = document.getElementById("paste-btn");

        // エラー表示エリア
        this.elements.errorMessage = document.getElementById("error-message");
    }

    /**
     * フォームの値を取得
     */
    getValues() {
        const year = this.elements.year.value;
        const month = this.elements.month.value;
        const day = this.elements.day.value;
        const hour = this.elements.hour.value;
        const minute = this.elements.minute.value;
        const birthplace = this.elements.birthplace.value;
        const byoyakuEnabled = this.isByoyakuEnabled();

        let gender = null;
        for (const radio of this.elements.genderInputs) {
            if (radio.checked) {
                gender = radio.value;
                break;
            }
        }

        return {
            year, month, day, hour, minute, gender, birthplace, byoyakuEnabled
        };
    }

    /**
     * 病薬オプション（セッション内・デフォルトOFF）
     */
    isByoyakuEnabled() {
        return Boolean(this.elements.byoyakuOption?.checked);
    }

    /**
     * フォームに値をセット（クリップボード貼り付けなどで使用）
     */
    setValues(values) {
        if (values.year) this.elements.year.value = values.year;
        if (values.month) this.elements.month.value = values.month;
        if (values.day) this.elements.day.value = values.day;
        if (values.hour !== null) this.elements.hour.value = values.hour;
        if (values.minute !== null) this.elements.minute.value = values.minute;
        if (values.birthplace) this.elements.birthplace.value = values.birthplace;

        if (values.gender) {
            for (const radio of this.elements.genderInputs) {
                if (radio.value === values.gender) {
                    radio.checked = true;
                    break;
                }
            }
        }

        if (typeof values.byoyakuEnabled === "boolean" && this.elements.byoyakuOption) {
            this.elements.byoyakuOption.checked = values.byoyakuEnabled;
        }
    }

    /**
     * フォームのリセット
     */
    reset() {
        this.elements.form.reset();
        this.hideError();
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

    onByoyakuOptionChange(handler) {
        if (!this.elements.byoyakuOption) return;
        this.elements.byoyakuOption.addEventListener("change", () => {
            handler(this.isByoyakuEnabled());
        });
    }
}
