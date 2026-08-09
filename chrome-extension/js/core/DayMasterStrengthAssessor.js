/**
 * DayMasterStrengthAssessor - 身旺弱判定クラス
 * 日主（日干）の強弱を簡易的に判定する。
 * 格局判定・病薬判定の前提となる。
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS, YANG_STEMS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

// 五行の相生関係: key が target を生じる
const GENERATE_CYCLE = {
  '木': '火',
  '火': '土',
  '土': '金',
  '金': '水',
  '水': '木'
};

// 五行の相剋関係: key が target を剋する
const CONTROL_CYCLE = {
  '木': '土',
  '土': '水',
  '水': '火',
  '火': '金',
  '金': '木'
};

export class DayMasterStrengthAssessor {
  /**
   * @param {Object} stemBranchData - stem_branch_master.json のデータ
   */
  constructor(stemBranchData) {
    if (!stemBranchData) {
      throw new CalculationError('干支マスタデータは必須です');
    }
    this.stemBranchData = stemBranchData;
  }

  /**
   * 身旺弱を判定する
   * @param {Object} fortuneResult - FortuneCalculator.calculateFortune()の戻り値
   * @param {Object} juuniunResult - JuuniunCalculator.calculateForPillars()の戻り値
   * @param {Object} [gouChuuResult=null] - GouChuuCalculator.analyzeNatalChart()の戻り値
   * @returns {Object} 身旺弱判定結果
   */
  assess(fortuneResult, juuniunResult, gouChuuResult = null) {
    if (!fortuneResult || !fortuneResult.dayPillar) {
      throw new CalculationError('命式データが不正です');
    }

    const dayStem = fortuneResult.dayPillar.stem;
    const dayElement = STEM_ELEMENTS[dayStem];

    if (!dayElement) {
      throw new CalculationError(`無効な日干: ${dayStem}`);
    }

    // 合化成功した地支の変換マップ（positionIndex → 化後の五行）
    const transformedMap = gouChuuResult?.transformedElementMap || null;

    // 1. 月令の得失スコア（合化成功時は化後の五行で判定）
    const monthLordScore = this._calcMonthLordScore(dayElement, fortuneResult.monthPillar.branch, transformedMap);

    // 2. 地支の根スコア（合化成功した地支は化後の五行で根を判定）
    const rootScore = this._calcRootScore(dayElement, fortuneResult, transformedMap);

    // 3. 天干の助力スコア
    const heavenlyStemScore = this._calcHeavenlyStemScore(dayStem, dayElement, fortuneResult);

    // 4. 十二運ボーナス
    const juuniunBonus = this._calcJuuniunBonus(juuniunResult);

    // 5. 合冲スコア（冲による弱化）
    const gouChuuScore = this._calcGouChuuScore(gouChuuResult, dayElement, fortuneResult, transformedMap);

    const totalScore = monthLordScore + rootScore + heavenlyStemScore + juuniunBonus + gouChuuScore;

    let strength, strengthLabel;
    if (totalScore >= 3) {
      strength = 'strong';
      strengthLabel = '身旺';
    } else if (totalScore <= 1) {
      strength = 'weak';
      strengthLabel = '身弱';
    } else {
      strength = 'neutral';
      strengthLabel = '中和';
    }

    return {
      strength,
      strengthLabel,
      score: totalScore,
      details: {
        monthLordScore,
        rootScore,
        heavenlyStemScore,
        juuniunBonus,
        gouChuuScore
      }
    };
  }

  /**
   * 月令の得失スコアを計算
   * 合化成功した月支は化後の五行で月令を判定する。
   * @private
   */
  _calcMonthLordScore(dayElement, monthBranch, transformedMap = null) {
    // 月支(index=1)が合化成功している場合は化後の五行で判定
    let monthElement;
    if (transformedMap && transformedMap.has(1)) {
      monthElement = transformedMap.get(1);
    } else {
      monthElement = BRANCH_ELEMENTS[monthBranch];
    }
    if (!monthElement) return 0;

    // 月支の五行が日干と同じか、日干を生じる → 得令 (+2)
    if (monthElement === dayElement) {
      return 2;
    }
    // 月支が日干を生じる（母の五行）
    if (GENERATE_CYCLE[monthElement] === dayElement) {
      return 2;
    }
    // 月支が日干を剋する、または日干の気を洩らす
    if (CONTROL_CYCLE[monthElement] === dayElement || GENERATE_CYCLE[dayElement] === monthElement) {
      return -1;
    }
    // 無関係
    return 0;
  }

  /**
   * 地支の根スコアを計算
   * 合化成功した地支は化後の五行で根を判定する。
   * 合化していない地支は従来通り蔵干の五行で判定。
   * @private
   */
  _calcRootScore(dayElement, fortuneResult, transformedMap = null) {
    let score = 0;
    const pillars = [
      fortuneResult.yearPillar,
      fortuneResult.monthPillar,
      fortuneResult.dayPillar,
      fortuneResult.hourPillar
    ];

    for (let i = 0; i < pillars.length; i++) {
      const pillar = pillars[i];
      if (!pillar) continue;

      // 合化成功した地支は化後の五行で根を判定
      if (transformedMap && transformedMap.has(i)) {
        const transformedElement = transformedMap.get(i);
        if (transformedElement === dayElement) {
          score++;
        }
        continue; // 化後の五行で判定したので元の蔵干はスキップ
      }

      // 合化していない地支は従来通り蔵干で判定
      const hiddenStems = pillar.hiddenStems || [];
      for (const hs of hiddenStems) {
        const hsElement = STEM_ELEMENTS[hs];
        if (hsElement === dayElement) {
          score++;
          break; // 各柱につき最大1点
        }
      }
    }

    return score; // 最大4
  }

  /**
   * 天干の助力スコアを計算（比肩・劫財・印星の天干数）
   * @private
   */
  _calcHeavenlyStemScore(dayStem, dayElement, fortuneResult) {
    let score = 0;
    const otherStems = [
      fortuneResult.yearPillar.stem,
      fortuneResult.monthPillar.stem,
      fortuneResult.hourPillar ? fortuneResult.hourPillar.stem : null
    ];

    for (const stem of otherStems) {
      if (!stem) continue;
      const stemElement = STEM_ELEMENTS[stem];
      if (!stemElement) continue;

      // 比肩・劫財（同じ五行）
      if (stemElement === dayElement) {
        score++;
        continue;
      }
      // 印星（日干を生じる五行）
      if (GENERATE_CYCLE[stemElement] === dayElement) {
        score++;
      }
    }

    return score; // 最大3
  }

  /**
   * 十二運ボーナスを計算
   * 月支の十二運が建禄・帝旺・冠帯・長生 → +1
   * @private
   */
  _calcJuuniunBonus(juuniunResult) {
    if (!juuniunResult || !juuniunResult.month) return 0;

    const monthJuuniun = juuniunResult.month.juuniun;
    const prosperousSet = new Set(['建禄', '帝旺', '冠帯', '長生']);

    return prosperousSet.has(monthJuuniun) ? 1 : 0;
  }

  /**
   * 合冲スコアを計算
   * 合化による五行変化は _calcMonthLordScore と _calcRootScore で反映済み。
   * ここでは冲による弱化のみ計算する。
   * @private
   */
  _calcGouChuuScore(gouChuuResult, dayElement, fortuneResult, transformedMap = null) {
    if (!gouChuuResult) return 0;
    let score = 0;

    // 強い冲（level>=2）で日干の根がある地支が冲される → 弱化
    // ただし合化成功した地支は化後の五行で判定
    if (fortuneResult) {
      const pillars = [
        fortuneResult.yearPillar,
        fortuneResult.monthPillar,
        fortuneResult.dayPillar,
        fortuneResult.hourPillar
      ];

      for (const clash of gouChuuResult.liuchong) {
        if (clash.intensityLevel < 2) continue;
        let rootFound = false;
        for (const posIdx of clash.positionIndices) {
          if (posIdx >= pillars.length || !pillars[posIdx]) continue;

          if (transformedMap && transformedMap.has(posIdx)) {
            // 合化した地支: 化後の五行で根を判定
            if (transformedMap.get(posIdx) === dayElement) {
              rootFound = true;
              break;
            }
          } else {
            // 未合化の地支: 蔵干で根を判定
            const pillar = pillars[posIdx];
            const hiddenStems = pillar.hiddenStems || [];
            if (hiddenStems.some(hs => STEM_ELEMENTS[hs] === dayElement)) {
              rootFound = true;
              break;
            }
          }
        }
        if (rootFound) {
          score -= 1;
        }
      }
    }

    return score;
  }
}

export default DayMasterStrengthAssessor;
