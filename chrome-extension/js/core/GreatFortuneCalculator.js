/**
 * 大運計算モジュール
 *
 * 大運（Daiun）は四柱推命における10年周期の運勢サイクルです。
 * このモジュールは、生年月日と性別から大運の開始年齢と各サイクルの干支を計算します。
 *
 * 理論的背景:
 * 1. 開始年齢の計算
 *    - 生年の天干から陰陽を判定（甲丙戊庚壬=陽、乙丁己辛癸=陰）
 *    - 順行/逆行の判定：
 *      * (男性 かつ 陽年) または (女性 かつ 陰年) → 順行
 *      * (男性 かつ 陰年) または (女性 かつ 陽年) → 逆行
 *    - 生日から次の節入り（順行）または前の節入り（逆行）までの日数を計算
 *    - 日数を3で割って年齢を算出（端数は四捨五入）
 *
 * 2. 大運サイクルの生成
 *    - 月柱の干支から順行/逆行で大運の干支を決定
 *    - 順行: 月柱の次の干支から開始
 *    - 逆行: 月柱の前の干支から開始
 *    - 各大運は10年間継続
 */

import { STEMS, BRANCHES, YANG_STEMS } from '../utils/constants.js';
import { InvalidDateError, CalculationError } from '../utils/errors.js';
import { DateUtils } from '../utils/dateUtils.js';

/**
 * 大運計算クラス
 */
export class GreatFortuneCalculator {
  /**
   * コンストラクタ
   *
   * @param {FortuneCalculator} fortuneCalculator - FortuneCalculatorインスタンス（必須）
   * @throws {Error} fortuneCalculatorが指定されていない場合
   */
  constructor(fortuneCalculator) {
    if (!fortuneCalculator) {
      throw new Error('fortuneCalculator引数は必須です。FortuneCalculatorインスタンスを渡してください。');
    }
    this.fortuneCalc = fortuneCalculator;
    this.jiaziMap = null;
  }

  /**
   * 初期化処理
   * 六十甲子マップを構築
   *
   * @returns {Promise<void>}
   */
  async initialize() {
    await this._buildJiaziMap();
  }

  /**
   * 六十甲子マップを構築
   * (stem, branch) -> index のマッピングを作成
   *
   * @returns {Promise<void>}
   * @private
   */
  async _buildJiaziMap() {
    if (!this.fortuneCalc.stemBranchData || !this.fortuneCalc.stemBranchData.sixty_jiazi) {
      throw new CalculationError('干支データが初期化されていません');
    }

    this.jiaziMap = new Map();
    this.fortuneCalc.stemBranchData.sixty_jiazi.forEach((item, index) => {
      const key = `${item.stem}-${item.branch}`;
      this.jiaziMap.set(key, index);
    });
  }

  /**
   * 年が陽年かどうか判定
   *
   * @param {number} year - 西暦年
   * @returns {boolean} 陽年ならtrue、陰年ならfalse
   */
  isYangYear(year) {
    const { stem: yearStem } = this.fortuneCalc.calculateYearPillar(year);
    // 甲・丙・戊・庚・壬 → 陽年
    return YANG_STEMS.includes(yearStem);
  }

  /**
   * 大運が順行か逆行かを判定
   *
   * @param {number} birthYear - 生年
   * @param {string} gender - 性別（"男性" or "女性"）
   * @returns {boolean} 順行ならtrue、逆行ならfalse
   * @throws {InvalidDateError} 性別が不正な場合
   */
  isForwardProgression(birthYear, gender) {
    if (gender !== '男性' && gender !== '女性') {
      throw new InvalidDateError(`性別は'男性'または'女性'を指定してください: ${gender}`);
    }

    const isYang = this.isYangYear(birthYear);

    // (男性 かつ 陽年) または (女性 かつ 陰年) → 順行
    // (男性 かつ 陰年) または (女性 かつ 陽年) → 逆行
    if (gender === '男性') {
      return isYang;
    } else {
      // 女性
      return !isYang;
    }
  }

  /**
   * 生日の次の節入り時刻を取得（順行用）
   *
   * @param {number} year - 生年
   * @param {number} month - 生月
   * @param {number} day - 生日
   * @returns {Date} 次の節入り時刻
   * @private
   */
  _getNextSolarTerm(year, month, day) {
    const birthDate = DateUtils.createDate(year, month, day, 12, 0);

    // 節気の順序（立春から始まる）
    const solarTerms = [
      '立春', '啓蟄', '清明', '立夏', '芒種', '小暑',
      '立秋', '白露', '寒露', '立冬', '大雪', '小寒'
    ];

    // 現在の年の全節気をチェック
    for (const termName of solarTerms) {
      const termDt = this.fortuneCalc.getSolarTermDateTime(year, termName);
      if (termDt > birthDate) {
        return termDt;
      }
    }

    // 現在の年の節気がすべて過去の場合、次の年の立春を返す
    const nextYearRisshun = this.fortuneCalc.getSolarTermDateTime(year + 1, '立春');
    return nextYearRisshun;
  }

  /**
   * 生日の前の節入り時刻を取得（逆行用）
   *
   * @param {number} year - 生年
   * @param {number} month - 生月
   * @param {number} day - 生日
   * @returns {Date} 前の節入り時刻
   * @private
   */
  _getPreviousSolarTerm(year, month, day) {
    const birthDate = DateUtils.createDate(year, month, day, 12, 0);

    // 節気の順序（小寒から逆順）
    const solarTerms = [
      '小寒', '大雪', '立冬', '寒露', '白露', '立秋',
      '小暑', '芒種', '立夏', '清明', '啓蟄', '立春'
    ];

    // 現在の年の全節気を逆順にチェック
    for (const termName of solarTerms) {
      const termDt = this.fortuneCalc.getSolarTermDateTime(year, termName);
      if (termDt < birthDate) {
        return termDt;
      }
    }

    // 現在の年の節気がすべて未来の場合、前の年の小寒を返す
    const prevYearShokan = this.fortuneCalc.getSolarTermDateTime(year - 1, '小寒');
    return prevYearShokan;
  }

  /**
   * 大運開始年齢を計算
   *
   * @param {number} birthYear - 生年
   * @param {number} birthMonth - 生月
   * @param {number} birthDay - 生日
   * @param {string} gender - 性別（"男性" or "女性"）
   * @param {string} roundingMethod - 端数処理方法（"round": 四捨五入、"ceil": 切り上げ）
   * @returns {number} 開始年齢（整数、0〜10歳）
   * @throws {InvalidDateError} 日付または性別が不正な場合
   * @throws {CalculationError} 計算中にエラーが発生した場合
   */
  calculateStartAge(birthYear, birthMonth, birthDay, gender, roundingMethod = 'round') {
    let birthDate;
    try {
      // 生年月日のDateオブジェクトを作成
      birthDate = DateUtils.createDate(birthYear, birthMonth, birthDay, 12, 0);
    } catch (e) {
      throw new InvalidDateError(`無効な日付です: ${birthYear}/${birthMonth}/${birthDay} - ${e.message}`);
    }

    // 順行/逆行の判定
    const isForward = this.isForwardProgression(birthYear, gender);

    // 次の節入り時刻を取得
    let nextTermDt;
    try {
      if (isForward) {
        // 順行: 生日の次の節入り時刻
        nextTermDt = this._getNextSolarTerm(birthYear, birthMonth, birthDay);
      } else {
        // 逆行: 生日の前の節入り時刻
        nextTermDt = this._getPreviousSolarTerm(birthYear, birthMonth, birthDay);
      }
    } catch (e) {
      throw new CalculationError(`節入り時刻の取得に失敗しました: ${e.message}`);
    }

    // 日数を計算
    const deltaDays = Math.abs(DateUtils.getDaysDifference(birthDate, nextTermDt));

    // 日数を3で割って年齢を算出
    const ageFloat = deltaDays / 3.0;

    // 端数処理
    let age;
    if (roundingMethod === 'round') {
      age = Math.round(ageFloat);
    } else if (roundingMethod === 'ceil') {
      age = Math.ceil(ageFloat);
    } else {
      throw new InvalidDateError(
        `端数処理方法は'round'または'ceil'を指定してください: ${roundingMethod}`
      );
    }

    // 0〜10歳の範囲に制限
    age = Math.max(0, Math.min(10, age));

    return age;
  }

  /**
   * 大運サイクルを計算
   *
   * @param {number} birthYear - 生年
   * @param {number} birthMonth - 生月
   * @param {number} birthDay - 生日
   * @param {number} birthHour - 生時
   * @param {number} birthMinute - 生分
   * @param {string} gender - 性別（"男性" or "女性"）
   * @param {number} numCycles - 計算するサイクル数（デフォルト10）
   * @param {string} roundingMethod - 端数処理方法（"round": 四捨五入、"ceil": 切り上げ）
   * @returns {Array<{
   *   cycleNumber: number,
   *   ageStart: number,
   *   ageEnd: number,
   *   stem: string,
   *   branch: string,
   *   jiaziIndex: number
   * }>} 大運サイクルのリスト
   * @throws {InvalidDateError} 日付または性別が不正な場合
   * @throws {CalculationError} 計算中にエラーが発生した場合
   */
  calculateCycles(
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    gender,
    numCycles = 10,
    roundingMethod = 'round'
  ) {
    // 開始年齢を計算
    const startAge = this.calculateStartAge(
      birthYear,
      birthMonth,
      birthDay,
      gender,
      roundingMethod
    );

    // 月柱を取得
    const monthPillar = this.fortuneCalc.calculateMonthPillar(
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute
    );

    // 月柱の六十甲子インデックスを取得
    const monthJiaziIndex = this._getJiaziIndex(monthPillar.stem, monthPillar.branch);

    // 順行/逆行の判定
    const isForward = this.isForwardProgression(birthYear, gender);

    // 大運サイクルを生成
    const cycles = [];
    let currentAge = startAge;

    for (let i = 0; i < numCycles; i++) {
      // 大運の干支インデックスを計算
      let daiunJiaziIndex;
      if (isForward) {
        // 順行: 月柱の次の干支から開始
        daiunJiaziIndex = (monthJiaziIndex + i + 1) % 60;
      } else {
        // 逆行: 月柱の前の干支から開始
        daiunJiaziIndex = (monthJiaziIndex - i - 1 + 60) % 60;
      }

      // インデックスから干支を取得
      const daiunStem = STEMS[daiunJiaziIndex % 10];
      const daiunBranch = BRANCHES[daiunJiaziIndex % 12];

      // サイクルを追加
      const cycle = {
        cycleNumber: i + 1,
        ageStart: currentAge,
        ageEnd: currentAge + 9,
        stem: daiunStem,
        branch: daiunBranch,
        jiaziIndex: daiunJiaziIndex
      };
      cycles.push(cycle);

      // 次のサイクルの開始年齢
      currentAge += 10;
    }

    return cycles;
  }

  /**
   * 干支から六十甲子のインデックスを取得
   *
   * @param {string} stem - 天干
   * @param {string} branch - 地支
   * @returns {number} 六十甲子のインデックス（0〜59）
   * @throws {CalculationError} 無効な干支の場合
   * @private
   */
  _getJiaziIndex(stem, branch) {
    if (!this.jiaziMap) {
      throw new CalculationError('六十甲子マップが初期化されていません');
    }

    const key = `${stem}-${branch}`;
    const index = this.jiaziMap.get(key);

    if (index === undefined) {
      throw new CalculationError(`無効な干支の組み合わせです: ${stem}${branch}`);
    }

    return index;
  }
}
