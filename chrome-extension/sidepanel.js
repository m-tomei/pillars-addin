/**
 * サイドパネル メインコントローラー
 */

import { DataLoader } from "./js/utils/dataLoader.js";
import {
  InvalidDateError,
  CalculationError,
  DataLoadError,
} from "./js/utils/errors.js";
import { ERROR_MESSAGES, MIN_YEAR, MAX_YEAR } from "./js/utils/constants.js";
import { FortuneCalculator } from "./js/core/FortuneCalculator.js";
import { GreatFortuneCalculator } from "./js/core/GreatFortuneCalculator.js";
import { JuuniunCalculator } from "./js/core/JuuniunCalculator.js";
import { TsuuhenCalculator } from "./js/core/TsuuhenCalculator.js";

class AppController {
  constructor() {
    this.dataLoader = null;
    this.fortuneCalculator = null;
    this.greatFortuneCalculator = null;
    this.juuniunCalculator = null;
    this.tsuuhenCalculator = null;
    this.initialized = false;
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      console.log("Initializing application...");

      // DataLoader初期化
      this.dataLoader = new DataLoader();

      // 計算エンジンの初期化
      this.fortuneCalculator = new FortuneCalculator(this.dataLoader);
      await this.fortuneCalculator.initialize();

      this.greatFortuneCalculator = new GreatFortuneCalculator(
        this.fortuneCalculator,
      );
      await this.greatFortuneCalculator.initialize();

      this.juuniunCalculator = new JuuniunCalculator(this.dataLoader);
      await this.juuniunCalculator.initialize();

      this.tsuuhenCalculator = new TsuuhenCalculator();

      // UI要素の取得
      this.setupUIElements();

      // イベントリスナーの登録
      this.setupEventListeners();

      this.initialized = true;
      console.log("Application initialized successfully");
    } catch (error) {
      console.error("Initialization error:", error);
      this.showError(
        "アプリケーションの初期化に失敗しました: " + error.message,
      );
    }
  }

  /**
   * UI要素の取得
   */
  setupUIElements() {
    // フォーム要素
    this.form = document.getElementById("fortune-form");
    this.yearInput = document.getElementById("year");
    this.monthInput = document.getElementById("month");
    this.dayInput = document.getElementById("day");
    this.hourInput = document.getElementById("hour");
    this.minuteInput = document.getElementById("minute");
    this.genderInputs = document.getElementsByName("gender");
    this.birthplaceInput = document.getElementById("birthplace");

    // ボタン
    this.calculateBtn = document.getElementById("calculate-btn");
    this.clearBtn = document.getElementById("clear-btn");
    this.pasteBtn = document.getElementById("paste-btn");
    this.savePngBtn = document.getElementById("save-png-btn");

    // 結果表示
    this.errorMessage = document.getElementById("error-message");
    this.resultSection = document.getElementById("result-section");
    this.fortuneResult = document.getElementById("fortune-result");
    this.greatFortuneResult = document.getElementById("great-fortune-result");
  }

  /**
   * イベントリスナーの登録
   */
  setupEventListeners() {
    // フォーム送信
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleCalculate();
    });

    // クリアボタン
    this.clearBtn.addEventListener("click", () => {
      this.handleClear();
    });

    // ペーストボタン
    this.pasteBtn.addEventListener("click", () => {
      this.handlePaste();
    });

    // PNG保存ボタン
    this.savePngBtn.addEventListener("click", () => {
      this.handleSavePNG();
    });
  }

  /**
   * データの事前読み込み
   */
  async preloadData() {
    try {
      console.log("Preloading data...");
      // 必要なデータを事前に読み込む
      await Promise.all([
        this.dataLoader.loadStemBranchMaster(),
        this.dataLoader.loadSolarTerms(),
      ]);
      console.log("Data preloaded successfully");
    } catch (error) {
      console.warn("Data preload failed:", error);
      // 事前読み込み失敗は致命的ではない
    }
  }

  /**
   * 計算実行
   */
  async handleCalculate() {
    try {
      // エラーメッセージをクリア
      this.hideError();

      // 入力値の取得
      const inputData = this.getInputData();

      // バリデーション
      this.validateInput(inputData);

      console.log("Input data:", inputData);

      // 命式計算
      const fortune = await this.fortuneCalculator.calculateFortune(
        inputData.year,
        inputData.month,
        inputData.day,
        inputData.hour,
        inputData.minute,
      );

      console.log("Fortune calculated:", fortune);

      // 十二運計算
      const juuniunResults = this.juuniunCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.branch,
        fortune.monthPillar.branch,
        fortune.dayPillar.branch,
        fortune.hourPillar.branch,
      );
      console.log("Juuniun calculated:", juuniunResults);

      // 通変星計算
      const tsuuhenResults = this.tsuuhenCalculator.calculateForPillars(
        fortune.dayPillar.stem,
        fortune.yearPillar.stem,
        fortune.monthPillar.stem,
        fortune.hourPillar.stem,
      );
      console.log("Tsuuhen calculated:", tsuuhenResults);

      // 大運計算
      const greatFortuneCycles = this.greatFortuneCalculator.calculateCycles(
        inputData.year,
        inputData.month,
        inputData.day,
        inputData.hour,
        inputData.minute,
        inputData.gender,
      );
      console.log("Great fortune cycles calculated:", greatFortuneCycles);

      // 結果を表示
      this.renderFortuneTable(fortune, juuniunResults, tsuuhenResults);
      this.renderGreatFortune(greatFortuneCycles, inputData.year);

      // 結果セクションを表示
      this.resultSection.style.display = "block";
    } catch (error) {
      console.error("Calculation error:", error);
      this.showError(error.message);
    }
  }

  /**
   * 命式テーブルの表示
   */
  renderFortuneTable(fortune, juuniunResults, tsuuhenResults) {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">年柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">月柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">日柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">時柱</th>
          </tr>
        </thead>
        <tbody>
          <!-- 天干 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.stem : "-"}
            </td>
          </tr>
          <!-- 地支 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.branch : "-"}
            </td>
          </tr>
          <!-- 蔵干 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.yearPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.monthPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.dayPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${fortune.hourPillar ? this.formatHiddenStems(fortune.hourPillar.hiddenStems) : "-"}
            </td>
          </tr>
          <!-- 十二運 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.year || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.month || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.day || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.hour || "-"}
            </td>
          </tr>
          <!-- 通変星 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.year || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.month || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.day || "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.hour || "-"}
            </td>
          </tr>
        </tbody>
      </table>
    `;

    this.fortuneResult.innerHTML = tableHTML;
  }

  /**
   * 蔵干のフォーマット
   */
  formatHiddenStems(hiddenStems) {
    if (!hiddenStems || hiddenStems.length === 0) {
      return "-";
    }
    return hiddenStems.map((hs) => hs.stem).join(" ");
  }

  /**
   * 大運の表示
   */
  renderGreatFortune(cycles, birthYear) {
    if (!cycles || cycles.length === 0) {
      this.greatFortuneResult.innerHTML = "<p>大運情報なし</p>";
      return;
    }

    const cardsHTML = cycles
      .map((cycle) => {
        const startYear = birthYear + cycle.ageStart;
        const endYear = birthYear + cycle.ageEnd;

        return `
      <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin-bottom: 10px; background-color: #f9f9f9;">
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${cycle.ageStart}歳 - ${cycle.ageEnd}歳
        </div>
        <div style="font-size: 14px;">
          天干: ${cycle.stem} / 地支: ${cycle.branch}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          ${startYear}年 - ${endYear}年
        </div>
      </div>
    `;
      })
      .join("");

    this.greatFortuneResult.innerHTML = `
      <h3 style="margin-top: 20px; margin-bottom: 12px;">大運</h3>
      ${cardsHTML}
    `;
  }

  /**
   * 入力データの取得
   */
  getInputData() {
    const year = parseInt(this.yearInput.value);
    const month = parseInt(this.monthInput.value);
    const day = parseInt(this.dayInput.value);
    const hour = this.hourInput.value ? parseInt(this.hourInput.value) : null;
    const minute = this.minuteInput.value
      ? parseInt(this.minuteInput.value)
      : null;

    let gender = null;
    for (const radio of this.genderInputs) {
      if (radio.checked) {
        gender = radio.value;
        break;
      }
    }

    const birthplace = this.birthplaceInput.value.trim() || null;

    return { year, month, day, hour, minute, gender, birthplace };
  }

  /**
   * 入力バリデーション
   */
  validateInput(data) {
    const { year, month, day, hour, minute, gender } = data;

    // 必須項目チェック
    if (!year || !month || !day) {
      throw new InvalidDateError(ERROR_MESSAGES.INVALID_DATE);
    }

    if (!gender) {
      throw new InvalidDateError(ERROR_MESSAGES.GENDER_REQUIRED);
    }

    // 範囲チェック
    if (year < MIN_YEAR || year > MAX_YEAR) {
      throw new InvalidDateError(ERROR_MESSAGES.YEAR_OUT_OF_RANGE);
    }

    if (month < 1 || month > 12) {
      throw new InvalidDateError("月は1〜12の範囲で入力してください");
    }

    if (day < 1 || day > 31) {
      throw new InvalidDateError("日は1〜31の範囲で入力してください");
    }

    // 日付の妥当性チェック
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      throw new InvalidDateError(ERROR_MESSAGES.INVALID_DATE);
    }

    // 時刻チェック
    if (hour !== null && (hour < 0 || hour > 23)) {
      throw new InvalidDateError("時は0〜23の範囲で入力してください");
    }

    if (minute !== null && (minute < 0 || minute > 59)) {
      throw new InvalidDateError("分は0〜59の範囲で入力してください");
    }
  }

  /**
   * クリア処理
   */
  handleClear() {
    this.form.reset();
    this.hideError();
    this.resultSection.style.display = "none";
  }

  /**
   * ペースト処理
   */
  async handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      console.log("Pasted text:", text);

      // 簡易的なパース（Phase 3で完全実装）
      this.showError("ペースト機能はPhase 3で実装予定です");
    } catch (error) {
      console.error("Paste error:", error);
      this.showError("クリップボードの読み取りに失敗しました");
    }
  }

  /**
   * PNG保存処理
   */
  handleSavePNG() {
    this.showError("PNG保存機能はPhase 4で実装予定です");
  }

  /**
   * エラー表示
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = "block";
  }

  /**
   * エラー非表示
   */
  hideError() {
    this.errorMessage.style.display = "none";
  }
}

// アプリケーション起動
document.addEventListener("DOMContentLoaded", async () => {
  const app = new AppController();
  await app.initialize();
});
