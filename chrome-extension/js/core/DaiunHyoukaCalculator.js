/**
 * DaiunHyoukaCalculator - 大運吉凶判定クラス
 *
 * 各大運サイクルの吉凶を、病薬診断をベースに動静説・蓋頭論を考慮して判定する。
 *
 * 判定の流れ:
 *   1. 病薬結果から薬の五行・病の五行を収集
 *   2. 各大運サイクルの天干・地支の五行をスコアリング
 *   3. 蓋頭論（天干と地支の関係）を分析
 *   4. 動静説に基づく重み付け（天干=動、地支=静）
 *   5. 総合スコアから7段階判定
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS } from '../utils/constants.js';

// 五行の相生関係: key が value を生じる
const GENERATE_CYCLE = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};

// 五行の相剋関係: key が value を剋する
const CONTROL_CYCLE = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};

// 判定テーブル: スコア範囲 → 判定ラベル
const JUDGMENT_THRESHOLDS = [
  { min: 2.0, label: '大吉' },
  { min: 1.0, label: '吉' },
  { min: 0.3, label: '小吉' },
  { min: -0.3, label: '平' },
  { min: -1.0, label: '小凶' },
  { min: -2.0, label: '凶' },
];
const WORST_JUDGMENT = '大凶';

export class DaiunHyoukaCalculator {
  /**
   * @param {TsuuhenCalculator} tsuuhenCalculator - 通変星算出用インスタンス
   * @param {GouChuuCalculator} [gouChuuCalculator=null] - 合冲計算用インスタンス
   */
  constructor(tsuuhenCalculator, gouChuuCalculator = null) {
    this.tsuuhenCalculator = tsuuhenCalculator;
    this.gouChuuCalculator = gouChuuCalculator;
  }

  /**
   * 大運サイクルの吉凶を判定する
   *
   * @param {Array} cycles - GreatFortuneCalculator.calculateCycles()の戻り値
   * @param {Object} byoyakuResult - ByoyakuCalculator.diagnose()の戻り値
   * @param {Object} fortuneResult - FortuneCalculator.calculateFortune()の戻り値
   * @param {Object} strengthResult - DayMasterStrengthAssessor.assess()の戻り値
   * @returns {Array<Object>} 各サイクルの吉凶判定結果
   */
  evaluate(cycles, byoyakuResult, fortuneResult, strengthResult) {
    if (!cycles || cycles.length === 0) return [];

    const dayStem = fortuneResult.dayPillar.stem;

    // 薬・病の五行を収集
    const medicineElements = [...new Set(
      byoyakuResult.diagnoses
        .map(d => d.medicine.element)
        .filter(Boolean)
    )];
    const diseaseElement = byoyakuResult.diagnoses[0]?.disease.element || null;

    return cycles.map(cycle => {
      const stemElement = STEM_ELEMENTS[cycle.stem];
      const originalBranchElement = BRANCH_ELEMENTS[cycle.branch];

      // 天干の通変星を算出
      const stemTsuuhen = this.tsuuhenCalculator.calculateTsuuhen(dayStem, cycle.stem);

      // 合冲分析（地支の五行変化を先に判定）
      let daiunGouChuuResult = null;
      let gouChuuAdjust = 0;
      if (this.gouChuuCalculator) {
        daiunGouChuuResult = this.gouChuuCalculator.analyzeDaiunInteraction(
          cycle.branch, fortuneResult
        );
        gouChuuAdjust = this._scoreDaiunGouChuu(
          daiunGouChuuResult, medicineElements, diseaseElement
        );
      }

      // 大運地支が合化成功した場合は化後の五行で評価
      const branchElement = (daiunGouChuuResult?.transformedElementMap?.has(4))
        ? daiunGouChuuResult.transformedElementMap.get(4)
        : originalBranchElement;

      // 天干・地支のスコア計算（合化後の五行で評価）
      const stemScore = this._scoreElement(stemElement, medicineElements, diseaseElement);
      const branchScore = this._scoreElement(branchElement, medicineElements, diseaseElement);

      // 蓋頭論分析
      const gaitouType = this._analyzeGaitou(stemElement, branchElement);

      // 動静説に基づく重み付け
      const { stemWeight, branchWeight } = this._getWeights(gaitouType);

      // 総合スコア
      const totalScore = stemScore * stemWeight + branchScore * branchWeight + gouChuuAdjust;

      // 判定
      const judgment = this._scoreToJudgment(totalScore);

      // 理由テキスト
      const reason = this._buildReason(
        cycle.stem, stemElement, stemTsuuhen.tsuuhen, stemScore,
        cycle.branch, branchElement, branchScore,
        gaitouType, medicineElements, diseaseElement
      );

      return {
        cycleNumber: cycle.cycleNumber,
        judgment,
        score: Math.round(totalScore * 100) / 100,
        stemTsuuhen: stemTsuuhen.tsuuhen,
        stemElement,
        branchElement,
        gaitouType,
        reason,
        gouChuu: daiunGouChuuResult
      };
    });
  }

  /**
   * 五行のスコアを計算
   * @private
   */
  _scoreElement(element, medicineElements, diseaseElement) {
    if (!element) return 0;
    let score = 0;

    // 薬の五行と一致
    if (medicineElements.includes(element)) score += 3;
    // 病の五行と一致
    if (element === diseaseElement) score -= 3;
    // 薬を生む
    if (medicineElements.some(m => GENERATE_CYCLE[element] === m)) score += 1;
    // 病を生む
    if (GENERATE_CYCLE[element] === diseaseElement) score -= 1;
    // 病を剋す
    if (CONTROL_CYCLE[element] === diseaseElement) score += 1;
    // 薬を剋す
    if (medicineElements.some(m => CONTROL_CYCLE[element] === m)) score -= 1;

    return score;
  }

  /**
   * 蓋頭論: 天干と地支の関係を分析
   * @private
   */
  _analyzeGaitou(stemElement, branchElement) {
    if (!stemElement || !branchElement) return null;
    if (stemElement === branchElement) return '同気';
    if (CONTROL_CYCLE[stemElement] === branchElement) return '蓋頭';
    if (CONTROL_CYCLE[branchElement] === stemElement) return '截脚';
    if (GENERATE_CYCLE[stemElement] === branchElement) return '相生順';
    if (GENERATE_CYCLE[branchElement] === stemElement) return '相生逆';
    return null;
  }

  /**
   * 動静説に基づく重み付けを取得
   * @private
   */
  _getWeights(gaitouType) {
    switch (gaitouType) {
      case '蓋頭':  return { stemWeight: 0.7, branchWeight: 0.3 };
      case '截脚':  return { stemWeight: 0.4, branchWeight: 0.6 };
      case '同気':  return { stemWeight: 0.5, branchWeight: 0.5 };
      default:      return { stemWeight: 0.6, branchWeight: 0.4 };
    }
  }

  /**
   * スコアを7段階判定に変換
   * @private
   */
  _scoreToJudgment(score) {
    for (const threshold of JUDGMENT_THRESHOLDS) {
      if (score >= threshold.min) return threshold.label;
    }
    return WORST_JUDGMENT;
  }

  /**
   * 判定理由テキストを生成
   * @private
   */
  _buildReason(stem, stemEl, stemTsuuhen, stemScore,
               branch, branchEl, branchScore,
               gaitouType, medicineElements, diseaseElement) {
    const stemRole = this._describeRole(stemEl, medicineElements, diseaseElement);
    const branchRole = this._describeRole(branchEl, medicineElements, diseaseElement);

    let text = `天干 ${stem}（${stemTsuuhen}・${stemEl}）→ ${stemRole}【動】、`;
    text += `地支 ${branch}（${branchEl}）→ ${branchRole}【静】。`;

    if (gaitouType) {
      const gaitouDesc = {
        '同気':   '同気で力が統一。',
        '蓋頭':   '蓋頭（干が支を剋す）で天干の効果が主。',
        '截脚':   '截脚（支が干を剋す）で地支の効果が主。',
        '相生順': '干が支を生み相乗効果。',
        '相生逆': '支が干を生み相乗効果。'
      };
      text += gaitouDesc[gaitouType] || '';
    }

    return text;
  }

  /**
   * 五行の役割を簡潔に記述
   * @private
   */
  _describeRole(element, medicineElements, diseaseElement) {
    if (!element) return '不明';
    const roles = [];
    if (medicineElements.includes(element)) roles.push('薬の五行');
    if (element === diseaseElement) roles.push('病の五行');
    if (medicineElements.some(m => GENERATE_CYCLE[element] === m)) roles.push('薬を生む');
    if (GENERATE_CYCLE[element] === diseaseElement) roles.push('病を生む');
    if (CONTROL_CYCLE[element] === diseaseElement) roles.push('病を剋す');
    if (medicineElements.some(m => CONTROL_CYCLE[element] === m)) roles.push('薬を剋す');
    return roles.length > 0 ? roles.join('・') : '中立';
  }

  /**
   * 大運合冲のスコア補正を計算
   * 薬の五行と合→加点、病の五行と合→減点
   * @private
   */
  _scoreDaiunGouChuu(gouChuuResult, medicineElements, diseaseElement) {
    if (!gouChuuResult) return 0;
    let adjust = 0;

    // 合化成功した結果の五行をスコアリング
    const transformedItems = [
      ...gouChuuResult.liuhe.filter(item => item.isTransformed),
      ...gouChuuResult.sanhe.filter(item => item.isTransformed),
      ...gouChuuResult.fanghe
    ];

    for (const item of transformedItems) {
      const re = item.resultElement;
      if (medicineElements.includes(re)) adjust += 0.5;
      if (re === diseaseElement) adjust -= 0.5;
    }

    // 冲は対立を生む → 中程度以上の冲で微調整
    for (const clash of gouChuuResult.liuchong) {
      if (clash.intensityLevel >= 2) {
        adjust -= 0.3;
      }
    }

    return Math.round(adjust * 100) / 100;
  }
}

export default DaiunHyoukaCalculator;
