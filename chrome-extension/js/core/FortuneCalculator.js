/**
 * 命式計算エンジン
 *
 * 四柱推命の年柱・月柱・日柱・時柱を計算するコアエンジン
 */

import {
  STEMS,
  BRANCHES,
  HOUR_STEM_TABLE,
  HOUR_BRANCHES,
  MONTH_TERM_TO_BRANCH,
  BRANCH_TO_MONTH_INDEX,
  BASE_DATE_JIAZI_INDEX,
} from "../utils/constants.js";

import {
  InvalidDateError,
  SolarTermNotFoundError,
  CalculationError,
} from "../utils/errors.js";

import { DateUtils } from "../utils/dateUtils.js";

/**
 * 命式計算クラス
 */
export class FortuneCalculator {
  /**
   * コンストラクタ
   * @param {DataLoader} dataLoader - DataLoaderインスタンス
   */
  constructor(dataLoader) {
    this.dataLoader = dataLoader;
    this.stemBranchData = null;
    this.solarTermsData = null;
  }

  /**
   * 初期化処理
   * 干支マスタと節入り時刻データを読み込む
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.stemBranchData = await this.dataLoader.loadStemBranchMaster();
      this.solarTermsData = await this.dataLoader.loadSolarTerms();
    } catch (error) {
      throw new CalculationError(
        `データの読み込みに失敗しました: ${error.message}`,
      );
    }
  }

  /**
   * 地支から蔵干を取得
   *
   * @param {string} branch - 地支（子、丑、寅など）
   * @returns {string[]} 蔵干のリスト（1〜3個）
   * @throws {CalculationError} 無効な地支の場合
   */
  getHiddenStems(branch) {
    if (!this.stemBranchData || !this.stemBranchData.branches) {
      throw new CalculationError("干支データが初期化されていません");
    }

    if (!this.stemBranchData.branches[branch]) {
      throw new CalculationError(`無効な地支です: ${branch}`);
    }

    return this.stemBranchData.branches[branch].hidden_stems;
  }

  /**
   * 指定年の節入り時刻を取得
   *
   * @param {number} year - 西暦年
   * @param {string} termName - 節気名（立春、啓蟄など）
   * @returns {Date} 節入り時刻
   * @throws {SolarTermNotFoundError} データが見つからない場合
   */
  getSolarTermDateTime(year, termName) {
    if (!this.solarTermsData || !this.solarTermsData.years) {
      throw new CalculationError("節気データが初期化されていません");
    }

    const yearStr = String(year);
    if (!this.solarTermsData.years[yearStr]) {
      throw new SolarTermNotFoundError(`${year}年のデータが見つかりません`);
    }

    const yearData = this.solarTermsData.years[yearStr];
    if (!yearData.terms[termName]) {
      throw new SolarTermNotFoundError(`${termName}のデータが見つかりません`);
    }

    const termData = yearData.terms[termName];
    const dtStr = termData.datetime;

    // ISO 8601形式からDateオブジェクトに変換
    return DateUtils.parseISOString(dtStr);
  }

  /**
   * 年柱を計算（立春を考慮しない）
   *
   * @param {number} year - 西暦年
   * @returns {{stem: string, branch: string}} 年柱
   * @throws {InvalidDateError} 無効な年の場合
   */
  calculateYearPillar(year) {
    if (year < 1) {
      throw new InvalidDateError(`無効な年です: ${year}`);
    }

    if (!this.stemBranchData || !this.stemBranchData.sixty_jiazi) {
      throw new CalculationError("干支データが初期化されていません");
    }

    // 干支は60年周期
    // 基準: 1864年が甲子年（0番目）
    // 計算式: (year - 1864) % 60
    const baseYear = 1864;
    const jiaziIndex = (year - baseYear) % 60;

    const jiazi = this.stemBranchData.sixty_jiazi[jiaziIndex];
    return { stem: jiazi.stem, branch: jiazi.branch };
  }

  /**
   * 立春を考慮した年柱を計算
   *
   * @param {number} year - 西暦年
   * @param {number} month - 月（1-12）
   * @param {number} day - 日
   * @param {number} hour - 時（0-23）
   * @param {number} minute - 分
   * @returns {{stem: string, branch: string}} 年柱
   * @throws {InvalidDateError} 無効な日時の場合
   */
  calculateYearPillarWithDate(year, month, day, hour, minute) {
    // 入力日時を作成
    const inputDt = DateUtils.createDate(year, month, day, hour, minute);

    // 立春の日時を取得
    try {
      const risshun = this.getSolarTermDateTime(year, "立春");

      // 立春前なら前年の干支
      if (inputDt < risshun) {
        return this.calculateYearPillar(year - 1);
      } else {
        return this.calculateYearPillar(year);
      }
    } catch (error) {
      if (error instanceof SolarTermNotFoundError) {
        // 現在の年の立春が見つからない場合は、年だけで計算
        return this.calculateYearPillar(year);
      }
      throw error;
    }
  }

  /**
   * 月柱を計算（節入り時刻を考慮）
   *
   * @param {number} year - 西暦年
   * @param {number} month - 月（1-12）
   * @param {number} day - 日
   * @param {number} hour - 時（0-23）
   * @param {number} minute - 分
   * @returns {{stem: string, branch: string}} 月柱
   * @throws {SolarTermNotFoundError} 節入り時刻が見つからない場合
   * @throws {InvalidDateError} 無効な日時の場合
   */
  calculateMonthPillar(year, month, day, hour, minute) {
    const inputDt = DateUtils.createDate(year, month, day, hour, minute);

    // 年データの存在確認
    this._validateYearDataExists(year);

    // 月支を判定
    const monthBranch = this._determineMonthBranch(year, inputDt);

    // 月干を計算（年干から月干を求める）
    const { stem: yearStem } = this.calculateYearPillarWithDate(
      year,
      month,
      day,
      hour,
      minute,
    );
    const monthStem = this._calculateMonthStem(yearStem, monthBranch);

    return { stem: monthStem, branch: monthBranch };
  }

  /**
   * 年データの存在を確認
   *
   * @param {number} year - 西暦年
   * @throws {SolarTermNotFoundError} データが見つからない場合
   * @private
   */
  _validateYearDataExists(year) {
    const yearStr = String(year);
    if (!this.solarTermsData.years[yearStr]) {
      throw new SolarTermNotFoundError(`${year}年のデータが見つかりません`);
    }
  }

  /**
   * 入力日時から月支を判定
   *
   * @param {number} year - 西暦年
   * @param {Date} inputDt - 入力日時
   * @returns {string} 月支（子、丑、寅など）
   * @throws {CalculationError} 月支の判定に失敗した場合
   * @private
   */
  _determineMonthBranch(year, inputDt) {
    const monthTerms = Object.keys(MONTH_TERM_TO_BRANCH);

    // 各節気の期間を確認
    for (let i = 0; i < monthTerms.length; i++) {
      const termName = monthTerms[i];
      if (this._isInTermPeriod(year, i, termName, monthTerms, inputDt)) {
        return MONTH_TERM_TO_BRANCH[termName];
      }
    }

    // 立春前の特殊ケース（年初）を処理
    return this._handleEarlyYearCase(year, inputDt);
  }

  /**
   * 入力日時が指定された節気の期間内かを判定
   *
   * @param {number} year - 西暦年
   * @param {number} termIndex - 節気のインデックス
   * @param {string} termName - 節気名
   * @param {string[]} monthTerms - 節気名のリスト
   * @param {Date} inputDt - 入力日時
   * @returns {boolean} 期間内の場合true
   * @private
   */
  _isInTermPeriod(year, termIndex, termName, monthTerms, inputDt) {
    const termDt = this.getSolarTermDateTime(year, termName);
    const nextTermDt = this._getNextTermDateTime(year, termIndex, monthTerms);

    return termDt <= inputDt && inputDt < nextTermDt;
  }

  /**
   * 次の節気の日時を取得（年またぎに対応）
   *
   * @param {number} year - 西暦年
   * @param {number} currentTermIndex - 現在の節気のインデックス
   * @param {string[]} monthTerms - 節気名のリスト
   * @returns {Date} 次の節気の日時
   * @private
   */
  _getNextTermDateTime(year, currentTermIndex, monthTerms) {
    const nextIndex = (currentTermIndex + 1) % 12;
    const nextTermName = monthTerms[nextIndex];

    // 年末の節気（大雪、小寒）は次の年の節気を参照
    if (currentTermIndex >= 10) {
      return this.getSolarTermDateTime(year + 1, nextTermName);
    } else {
      return this.getSolarTermDateTime(year, nextTermName);
    }
  }

  /**
   * 立春前の特殊ケースを処理
   *
   * @param {number} year - 西暦年
   * @param {Date} inputDt - 入力日時
   * @returns {string} 月支（丑または子）
   * @throws {CalculationError} 月支の判定に失敗した場合
   * @private
   */
  _handleEarlyYearCase(year, inputDt) {
    const risshun = this.getSolarTermDateTime(year, "立春");

    if (inputDt < risshun) {
      // 小寒と立春の間なら丑月、小寒前なら子月
      try {
        const shokan = this.getSolarTermDateTime(year, "小寒");
        return inputDt >= shokan ? "丑" : "子";
      } catch (error) {
        if (error instanceof SolarTermNotFoundError) {
          // 小寒のデータがない場合は丑月とする（フォールバック）
          return "丑";
        }
        throw error;
      }
    } else {
      throw new CalculationError("月支の判定に失敗しました");
    }
  }

  /**
   * 年干と月支から月干を計算
   *
   * 五虎遁年起月訣:
   * - 甲己の年は丙を首とする（寅月が丙寅から始まる）
   * - 乙庚の年は戊を首とする
   * - 丙辛の年は庚を首とする
   * - 丁壬の年は壬を首とする
   * - 戊癸の年は甲を首とする
   *
   * @param {string} yearStem - 年干
   * @param {string} monthBranch - 月支
   * @returns {string} 月干
   * @throws {CalculationError} 無効な年干または月支の場合
   * @private
   */
  _calculateMonthStem(yearStem, monthBranch) {
    // 年干による寅月の天干の対応
    const yinStemMap = {
      甲: "丙",
      己: "丙",
      乙: "戊",
      庚: "戊",
      丙: "庚",
      辛: "庚",
      丁: "壬",
      壬: "壬",
      戊: "甲",
      癸: "甲",
    };

    const yinStem = yinStemMap[yearStem];
    if (!yinStem) {
      throw new CalculationError(`無効な年干です: ${yearStem}`);
    }

    // 寅月の天干インデックス
    const yinStemIndex = STEMS.indexOf(yinStem);

    // 月支のインデックス（寅=0, 卯=1, ...）
    const monthIndex = BRANCH_TO_MONTH_INDEX[monthBranch];
    if (monthIndex === undefined) {
      throw new CalculationError(`無効な月支です: ${monthBranch}`);
    }

    // 月干を計算
    const monthStemIndex = (yinStemIndex + monthIndex) % 10;
    return STEMS[monthStemIndex];
  }

  /**
   * 日柱を計算
   *
   * @param {number} year - 西暦年
   * @param {number} month - 月（1-12）
   * @param {number} day - 日
   * @param {number} hour - 時（0-23）デフォルト12時（推時機能で使用）
   * @param {number} minute - 分（0-59）デフォルト0分（推時機能で使用）
   * @returns {{stem: string, branch: string}} 日柱
   * @throws {InvalidDateError} 無効な日付の場合
   *
   * @description
   * 日柱は暦の日付で計算します。節入り時刻は月柱の計算に使用し、
   * 日柱には影響しません。23時台の日跨ぎ処理は時柱で行います。
   */
  calculateDayPillar(year, month, day, hour = 12, minute = 0) {
    // 日付の妥当性チェック
    DateUtils.createDate(year, month, day, hour, minute);

    if (!this.stemBranchData || !this.stemBranchData.sixty_jiazi) {
      throw new CalculationError("干支データが初期化されていません");
    }

    // ========== 日柱計算の基準日 ==========
    // 基準: 1900年1月1日 = 甲戌日（六十甲子の11番目、インデックス10）
    //
    // 典拠:
    //   この基準日は、四柱推命および万年暦の計算において広く採用されている標準値です。
    //   1900年1月1日が甲戌日であることは、以下で確認できます:
    //   - 中国の標準万年暦（中国科学院紫金山天文台による公式データ）
    //   - 日本の暦注計算における慣例的な基準日
    //   - 多くの四柱推命ソフトウェアおよび書籍で採用されている共通基準
    //
    // 検証方法:
    //   1900年1月1日から任意の日付までの経過日数を計算し、
    //   60で割った余りを六十甲子の順序に当てはめることで、
    //   その日の干支を求めることができます。
    //
    // 参考:
    //   - BASE_DATE_JIAZI_INDEX = 10 (constants.jsで定義)
    //   - 六十甲子: 甲子(0), 乙丑(1), ... , 甲戌(10), ... , 癸亥(59)
    const baseDate = new Date(1900, 0, 1); // 1900年1月1日

    // 暦上の日柱を計算（節入り時刻は考慮しない）
    const inputDate = new Date(year, month - 1, day);
    const deltaDays = DateUtils.getDaysDifference(baseDate, inputDate);
    const jiaziIndex = (BASE_DATE_JIAZI_INDEX + deltaDays) % 60;

    const jiazi = this.stemBranchData.sixty_jiazi[jiaziIndex];
    return { stem: jiazi.stem, branch: jiazi.branch };
  }

  /**
   * 時柱を計算
   *
   * @param {number} hour - 時（0-23）
   * @param {number} minute - 分（0-59）
   * @param {string} dayStem - 日の天干（時柱の天干計算に必要）
   * @returns {{stem: string, branch: string}} 時柱
   * @throws {InvalidDateError} 無効な時刻の場合
   * @throws {CalculationError} 無効な日干の場合
   *
   * @description
   * 23時台は翌日の子時として扱う
   */
  calculateHourPillar(hour, minute, dayStem) {
    if (hour < 0 || hour > 23) {
      throw new InvalidDateError(`無効な時刻です: ${hour}時`);
    }
    if (minute < 0 || minute > 59) {
      throw new InvalidDateError(`無効な分です: ${minute}分`);
    }

    // 時支を決定（数式ベース）
    // 23:00-00:59 → 子時（インデックス0）
    // 01:00-02:59 → 丑時（インデックス1）
    // ...
    // 21:00-22:59 → 亥時（インデックス11）
    //
    // 23時台は翌日の0時として扱うため (hour + 1) % 24 で正規化
    // 2時間ごとにインデックスが1つ進むため 2 で割る
    const hourBranchIndex = Math.floor(((hour + 1) % 24) / 2);
    const hourBranch = HOUR_BRANCHES[hourBranchIndex];

    // 時干を計算（五虎遁日起時訣）
    if (!HOUR_STEM_TABLE[dayStem]) {
      throw new CalculationError(`無効な日干です: ${dayStem}`);
    }

    const hourStem = HOUR_STEM_TABLE[dayStem][hourBranchIndex];

    return { stem: hourStem, branch: hourBranch };
  }

  /**
   * 完全な命式を計算
   *
   * @param {number} year - 西暦年
   * @param {number} month - 月（1-12）
   * @param {number} day - 日
   * @param {number} hour - 時（0-23）
   * @param {number} minute - 分
   * @returns {{
   *   yearPillar: {stem: string, branch: string, hiddenStems: string[]},
   *   monthPillar: {stem: string, branch: string, hiddenStems: string[]},
   *   dayPillar: {stem: string, branch: string, hiddenStems: string[]},
   *   hourPillar: {stem: string, branch: string, hiddenStems: string[]}
   * }} 完全な命式
   */
  calculateFortune(year, month, day, hour, minute) {
    // 年柱
    const yearPillar = this.calculateYearPillarWithDate(
      year,
      month,
      day,
      hour,
      minute,
    );
    const yearHidden = this.getHiddenStems(yearPillar.branch);

    // 月柱
    const monthPillar = this.calculateMonthPillar(
      year,
      month,
      day,
      hour,
      minute,
    );
    const monthHidden = this.getHiddenStems(monthPillar.branch);

    // 日柱（節入り時刻による補正のため時刻も渡す）
    const dayPillar = this.calculateDayPillar(year, month, day, hour, minute);
    const dayHidden = this.getHiddenStems(dayPillar.branch);

    // 時柱（時刻が指定されている場合のみ計算）
    let hourPillarResult = null;
    if (hour !== null && hour !== undefined) {
      const hourPillar = this.calculateHourPillar(
        hour,
        minute || 0,
        dayPillar.stem,
      );
      const hourHidden = this.getHiddenStems(hourPillar.branch);
      hourPillarResult = {
        stem: hourPillar.stem,
        branch: hourPillar.branch,
        hiddenStems: hourHidden,
      };
    }

    return {
      yearPillar: {
        stem: yearPillar.stem,
        branch: yearPillar.branch,
        hiddenStems: yearHidden,
      },
      monthPillar: {
        stem: monthPillar.stem,
        branch: monthPillar.branch,
        hiddenStems: monthHidden,
      },
      dayPillar: {
        stem: dayPillar.stem,
        branch: dayPillar.branch,
        hiddenStems: dayHidden,
      },
      hourPillar: hourPillarResult,
    };
  }
}
