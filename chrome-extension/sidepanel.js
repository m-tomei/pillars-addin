/**
 * サイドパネル メインコントローラー
 */

import { DataLoader } from './js/utils/dataLoader.js';
import { InvalidDateError, CalculationError, DataLoadError } from './js/utils/errors.js';
import { ERROR_MESSAGES, MIN_YEAR, MAX_YEAR } from './js/utils/constants.js';

class AppController {
  constructor() {
    this.dataLoader = null;
    this.initialized = false;
  }

  /**
   * 初期化
   */
  async initialize() {
    try {
      console.log('Initializing application...');
      
      // DataLoader初期化
      this.dataLoader = new DataLoader();
      
      // UI要素の取得
      this.setupUIElements();
      
      // イベントリスナーの登録
      this.setupEventListeners();
      
      // データの事前読み込み（オプション）
      await this.preloadData();
      
      this.initialized = true;
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Initialization error:', error);
      this.showError('アプリケーションの初期化に失敗しました: ' + error.message);
    }
  }

  /**
   * UI要素の取得
   */
  setupUIElements() {
    // フォーム要素
    this.form = document.getElementById('fortune-form');
    this.yearInput = document.getElementById('year');
    this.monthInput = document.getElementById('month');
    this.dayInput = document.getElementById('day');
    this.hourInput = document.getElementById('hour');
    this.minuteInput = document.getElementById('minute');
    this.genderInputs = document.getElementsByName('gender');
    this.birthplaceInput = document.getElementById('birthplace');
    
    // ボタン
    this.calculateBtn = document.getElementById('calculate-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.pasteBtn = document.getElementById('paste-btn');
    this.savePngBtn = document.getElementById('save-png-btn');
    
    // 結果表示
    this.errorMessage = document.getElementById('error-message');
    this.resultSection = document.getElementById('result-section');
    this.fortuneResult = document.getElementById('fortune-result');
    this.greatFortuneResult = document.getElementById('great-fortune-result');
  }

  /**
   * イベントリスナーの登録
   */
  setupEventListeners() {
    // フォーム送信
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleCalculate();
    });
    
    // クリアボタン
    this.clearBtn.addEventListener('click', () => {
      this.handleClear();
    });
    
    // ペーストボタン
    this.pasteBtn.addEventListener('click', () => {
      this.handlePaste();
    });
    
    // PNG保存ボタン
    this.savePngBtn.addEventListener('click', () => {
      this.handleSavePNG();
    });
  }

  /**
   * データの事前読み込み
   */
  async preloadData() {
    try {
      console.log('Preloading data...');
      // 必要なデータを事前に読み込む
      await Promise.all([
        this.dataLoader.loadStemBranchMaster(),
        this.dataLoader.loadSolarTerms()
      ]);
      console.log('Data preloaded successfully');
    } catch (error) {
      console.warn('Data preload failed:', error);
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
      
      // 計算実行（Phase 2で実装予定）
      console.log('Input data:', inputData);
      
      // 仮の結果表示
      this.showPlaceholderResult(inputData);
      
    } catch (error) {
      console.error('Calculation error:', error);
      this.showError(error.message);
    }
  }

  /**
   * 入力データの取得
   */
  getInputData() {
    const year = parseInt(this.yearInput.value);
    const month = parseInt(this.monthInput.value);
    const day = parseInt(this.dayInput.value);
    const hour = this.hourInput.value ? parseInt(this.hourInput.value) : null;
    const minute = this.minuteInput.value ? parseInt(this.minuteInput.value) : null;
    
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
      throw new InvalidDateError('月は1〜12の範囲で入力してください');
    }
    
    if (day < 1 || day > 31) {
      throw new InvalidDateError('日は1〜31の範囲で入力してください');
    }
    
    // 日付の妥当性チェック
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
      throw new InvalidDateError(ERROR_MESSAGES.INVALID_DATE);
    }
    
    // 時刻チェック
    if (hour !== null && (hour < 0 || hour > 23)) {
      throw new InvalidDateError('時は0〜23の範囲で入力してください');
    }
    
    if (minute !== null && (minute < 0 || minute > 59)) {
      throw new InvalidDateError('分は0〜59の範囲で入力してください');
    }
  }

  /**
   * クリア処理
   */
  handleClear() {
    this.form.reset();
    this.hideError();
    this.resultSection.style.display = 'none';
  }

  /**
   * ペースト処理
   */
  async handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      console.log('Pasted text:', text);
      
      // 簡易的なパース（Phase 3で完全実装）
      this.showError('ペースト機能はPhase 3で実装予定です');
      
    } catch (error) {
      console.error('Paste error:', error);
      this.showError('クリップボードの読み取りに失敗しました');
    }
  }

  /**
   * PNG保存処理
   */
  handleSavePNG() {
    this.showError('PNG保存機能はPhase 4で実装予定です');
  }

  /**
   * エラー表示
   */
  showError(message) {
    this.errorMessage.textContent = message;
    this.errorMessage.style.display = 'block';
  }

  /**
   * エラー非表示
   */
  hideError() {
    this.errorMessage.style.display = 'none';
  }

  /**
   * プレースホルダー結果表示（Phase 1用）
   */
  showPlaceholderResult(data) {
    const { year, month, day, hour, minute, gender } = data;
    
    this.fortuneResult.innerHTML = `
      <div style="padding: 20px; background: #f8f9fa; border-radius: 4px; text-align: center;">
        <p style="margin-bottom: 12px; font-size: 14px; color: #666;">
          入力データを受け付けました
        </p>
        <p style="font-size: 13px; color: #888;">
          生年月日: ${year}年${month}月${day}日
          ${hour !== null ? ` ${hour}時${minute}分` : '（時刻未入力）'}
        </p>
        <p style="font-size: 13px; color: #888; margin-top: 8px;">
          性別: ${gender}
        </p>
        <p style="margin-top: 20px; font-size: 12px; color: #999;">
          命式計算機能はPhase 2で実装予定です
        </p>
      </div>
    `;
    
    this.resultSection.style.display = 'block';
  }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', async () => {
  const app = new AppController();
  await app.initialize();
});
