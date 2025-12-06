/**
 * 十二運計算機
 *
 * 日干と地支の組み合わせから十二運を計算する。
 * 十二運は命式の各柱（年柱・月柱・日柱・時柱）と大運に付与される。
 * 十二運は人生の運勢の流れを12段階で表す。
 */

import { CalculationError } from '../utils/errors.js';

/**
 * 十二運計算機クラス
 *
 * 日干と地支の組み合わせから十二運を取得する。
 */
export class JuuniunCalculator {
  /**
   * コンストラクタ
   *
   * @param {DataLoader} dataLoader - DataLoaderインスタンス
   * @throws {TypeError} dataLoaderがnullまたはundefinedの場合
   *
   * @example
   * const dataLoader = new DataLoader('./data/');
   * const calculator = new JuuniunCalculator(dataLoader);
   */
  constructor(dataLoader) {
    if (!dataLoader) {
      throw new TypeError('dataLoaderは必須です');
    }
    this.dataLoader = dataLoader;
    this.juuniunData = null;
    this.juuniunOrder = null;
    this.juuniunMeanings = null;
  }

  /**
   * 十二運計算機を初期化する
   *
   * 十二運マスタデータ（juuniin_master.json）を読み込む。
   *
   * @returns {Promise<void>}
   * @throws {CalculationError} データ読み込みに失敗した場合
   * @throws {CalculationError} データの形式が不正な場合
   *
   * @example
   * await calculator.initialize();
   */
  async initialize() {
    try {
      const masterData = await this.dataLoader.loadJuuniunMaster();

      if (!masterData.data) {
        throw new CalculationError('十二運マスタデータが見つかりません');
      }

      if (!masterData.reference) {
        throw new CalculationError('十二運リファレンスデータが見つかりません');
      }

      this.juuniunData = masterData.data;
      this.juuniunOrder = masterData.reference['十二運の順序'];
      this.juuniunMeanings = masterData.reference['意味'];

      if (!this.juuniunOrder || !Array.isArray(this.juuniunOrder)) {
        throw new CalculationError('十二運の順序データが不正です');
      }

      if (!this.juuniunMeanings || typeof this.juuniunMeanings !== 'object') {
        throw new CalculationError('十二運の意味データが不正です');
      }
    } catch (error) {
      if (error instanceof CalculationError) {
        throw error;
      }
      throw new CalculationError(
        `十二運マスタデータの読み込みに失敗しました: ${error.message}`
      );
    }
  }

  /**
   * 日干と地支から十二運を計算する
   *
   * @param {string} dayStem - 日干（例: "甲"）
   * @param {string} branch - 地支（例: "子"）
   * @returns {{
   *   dayStem: string,
   *   branch: string,
   *   juuniun: string,
   *   meaning: string
   * }} 十二運情報
   *
   * @throws {CalculationError} 計算機が初期化されていない場合
   * @throws {CalculationError} 日干が無効な場合
   * @throws {CalculationError} 地支が無効な場合
   *
   * @example
   * const result = calculator.calculateJuuniun('甲', '子');
   * // { dayStem: '甲', branch: '子', juuniun: '沐浴', meaning: '成長期・不安定' }
   */
  calculateJuuniun(dayStem, branch) {
    if (!this.juuniunData) {
      throw new CalculationError('計算機が初期化されていません。initialize()を呼び出してください。');
    }

    if (!dayStem || typeof dayStem !== 'string') {
      throw new CalculationError('無効な日干です: 日干は文字列である必要があります。');
    }

    if (!(dayStem in this.juuniunData)) {
      throw new CalculationError(
        `無効な日干です: ${dayStem}。` +
        '日干は十干（甲・乙・丙・丁・戊・己・庚・辛・壬・癸）のいずれかである必要があります。'
      );
    }

    const stemData = this.juuniunData[dayStem];

    if (!branch || typeof branch !== 'string') {
      throw new CalculationError('無効な地支です: 地支は文字列である必要があります。');
    }

    if (!(branch in stemData)) {
      throw new CalculationError(
        `無効な地支です: ${branch}。` +
        '地支は十二支（子・丑・寅・卯・辰・巳・午・未・申・酉・戌・亥）のいずれかである必要があります。'
      );
    }

    const juuniun = stemData[branch];
    const meaning = this.juuniunMeanings[juuniun] || '';

    return {
      dayStem,
      branch,
      juuniun,
      meaning
    };
  }

  /**
   * 四柱すべての十二運を一括計算する
   *
   * @param {string} dayStem - 日干（例: "甲"）
   * @param {string} yearBranch - 年支（例: "子"）
   * @param {string} monthBranch - 月支（例: "寅"）
   * @param {string} dayBranch - 日支（例: "午"）
   * @param {string} hourBranch - 時支（例: "戌"）
   * @returns {{
   *   year: {dayStem: string, branch: string, juuniun: string, meaning: string},
   *   month: {dayStem: string, branch: string, juuniun: string, meaning: string},
   *   day: {dayStem: string, branch: string, juuniun: string, meaning: string},
   *   hour: {dayStem: string, branch: string, juuniun: string, meaning: string}
   * }} 各柱の十二運情報
   *
   * @throws {CalculationError} 計算機が初期化されていない場合
   * @throws {CalculationError} 日干または地支が無効な場合
   *
   * @example
   * const result = calculator.calculateForPillars('甲', '子', '寅', '午', '戌');
   * console.log(result.year.juuniun);  // '沐浴'
   * console.log(result.month.juuniun); // '建禄'
   */
  calculateForPillars(dayStem, yearBranch, monthBranch, dayBranch, hourBranch) {
    return {
      year: this.calculateJuuniun(dayStem, yearBranch),
      month: this.calculateJuuniun(dayStem, monthBranch),
      day: this.calculateJuuniun(dayStem, dayBranch),
      hour: this.calculateJuuniun(dayStem, hourBranch)
    };
  }

  /**
   * 十二運の強弱を数値で取得する（参考用）
   *
   * 帝旺が最も強く（10点）、絶が最も弱い（0点）。
   *
   * @param {string} juuniun - 十二運名（例: "帝旺"）
   * @returns {number} 強弱スコア（0-10）、無効な十二運の場合は-1
   *
   * @example
   * calculator.getJuuniunStrength('帝旺');  // 10
   * calculator.getJuuniunStrength('絶');    // 0
   * calculator.getJuuniunStrength('建禄');  // 8
   */
  getJuuniunStrength(juuniun) {
    const strengthMap = {
      '帝旺': 10,
      '建禄': 8,
      '冠帯': 7,
      '長生': 6,
      '養': 5,
      '沐浴': 4,
      '胎': 3,
      '墓': 2,
      '衰': 1,
      '病': 1,
      '死': 1,
      '絶': 0
    };

    return strengthMap[juuniun] !== undefined ? strengthMap[juuniun] : -1;
  }

  /**
   * 十二運が旺相（強い状態）かどうかを判定する
   *
   * 旺相: 長生・冠帯・建禄・帝旺
   *
   * @param {string} juuniun - 十二運名
   * @returns {boolean} 旺相の場合true、それ以外false
   *
   * @example
   * calculator.isProsperous('帝旺');  // true
   * calculator.isProsperous('病');    // false
   */
  isProsperous(juuniun) {
    const prosperousSet = new Set(['長生', '冠帯', '建禄', '帝旺']);
    return prosperousSet.has(juuniun);
  }

  /**
   * 十二運が休囚死絶（弱い状態）かどうかを判定する
   *
   * 休囚死絶: 衰・病・死・墓・絶
   *
   * @param {string} juuniun - 十二運名
   * @returns {boolean} 休囚死絶の場合true、それ以外false
   *
   * @example
   * calculator.isWeak('死');    // true
   * calculator.isWeak('建禄');  // false
   */
  isWeak(juuniun) {
    const weakSet = new Set(['衰', '病', '死', '墓', '絶']);
    return weakSet.has(juuniun);
  }
}
