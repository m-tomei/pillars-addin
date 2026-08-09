/**
 * KeizenAnalyzer - 継善（主軸・用神損傷）
 *
 * 根拠: 継善篇 / BYO-DD-04
 * 格局から守るべき主軸を定め、破（breaks）を列挙する。
 */

import { STEM_ELEMENTS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

const GENERATE_CYCLE = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木'
};

const CONTROL_CYCLE = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木'
};

const KAKKYOKU_YOUSHIN_MAP = {
  正官格: 'officer',
  偏官格: 'officer',
  正財格: 'wealth',
  偏財格: 'wealth',
  傷官格: 'output',
  食神格: 'output',
  印綬格: 'seal',
  偏印格: 'seal',
  建禄格: 'self',
  陽刃格: 'self'
};

const YOUSHIN_LABEL = {
  officer: '官殺',
  wealth: '財',
  output: '食傷',
  seal: '印',
  self: '比劫'
};

/** condition → 重症ヒント（主軸横断の既定） */
const CONDITION_SEVERITY = {
  傷官透出: 'severe',
  食神透出: 'moderate',
  比劫多: 'severe',
  官殺多: 'severe',
  印多: 'moderate',
  財多: 'severe'
};

export class KeizenAnalyzer {
  /**
   * @param {object} rules kakkyoku_rules.json
   */
  constructor(rules) {
    if (!rules) {
      throw new CalculationError('継善分析に格局ルールデータは必須です');
    }
    this.rules = rules;
  }

  /**
   * @param {object} kakkyokuResult
   * @param {object} strengthResult
   * @param {object} tsuuhenResult
   * @param {object} fortuneResult
   * @param {object} [gouChuuResult]
   * @returns {object} KeizenResult
   */
  analyze(kakkyokuResult, strengthResult, tsuuhenResult, fortuneResult, gouChuuResult = null) {
    if (!kakkyokuResult || !strengthResult || !fortuneResult) {
      throw new CalculationError('継善分析に必要なデータが不足しています');
    }

    const dayStem = fortuneResult.dayPillar?.stem;
    const dayElement = STEM_ELEMENTS[dayStem];
    if (!dayElement) {
      throw new CalculationError('日干の五行を特定できません');
    }

    const youshinCategory = this._resolveYoushinCategory(kakkyokuResult);
    const youshinLabel = youshinCategory ? YOUSHIN_LABEL[youshinCategory] : (kakkyokuResult.kakkyoku || '不明');
    const youshinElement = youshinCategory
      ? this._getCategoryElement(youshinCategory, dayElement)
      : null;

    const pillar = {
      kakkyoku: kakkyokuResult.kakkyoku,
      youshinCategory,
      youshinLabel,
      youshinElement,
      isEstablished: Boolean(kakkyokuResult.isEstablished)
    };

    const tsuuhenList = this._collectTsuuhen(tsuuhenResult);
    const transformedMap = gouChuuResult?.transformedElementMap || null;
    const conditions = this._evaluateConditions(
      fortuneResult, dayElement, tsuuhenList, transformedMap
    );

    const breaks = this._detectBreaks(
      kakkyokuResult, strengthResult, conditions, dayElement
    );

    // 破格時は breaks の重症度を底上げ（KZ-3）
    if (!pillar.isEstablished) {
      for (const item of breaks) {
        if (item.severityHint === 'mild') item.severityHint = 'moderate';
        else if (item.severityHint === 'moderate') item.severityHint = 'severe';
      }
    }

    breaks.sort((a, b) => this._severityRank(b.severityHint) - this._severityRank(a.severityHint));

    const supports = this._detectSupports(youshinCategory, tsuuhenList);
    const summary = this._buildSummary(pillar, breaks, supports);

    return { pillar, breaks, supports, summary, conditions };
  }

  /**
   * @private
   */
  _resolveYoushinCategory(kakkyokuResult) {
    if (KAKKYOKU_YOUSHIN_MAP[kakkyokuResult.kakkyoku]) {
      return KAKKYOKU_YOUSHIN_MAP[kakkyokuResult.kakkyoku];
    }
    // 五行一気・従格など
    if (kakkyokuResult.category === 'special_element' || kakkyokuResult.category === 'following') {
      return 'self';
    }
    return null;
  }

  /**
   * kakkyoku_rules の condition と照合して breaks を生成
   * @private
   */
  _detectBreaks(kakkyokuResult, strengthResult, conditions, dayElement) {
    const kakkyokuName = kakkyokuResult.kakkyoku;
    const rule = this.rules[kakkyokuName];
    if (!rule) return [];

    const keys = this._strengthKeysToTry(strengthResult.strength);
    const seen = new Set();
    const breaks = [];

    for (const strengthKey of keys) {
      const strengthRule = rule[strengthKey];
      if (!strengthRule?.diseases) continue;

      for (const diseaseRule of strengthRule.diseases) {
        const cond = diseaseRule.condition;
        if (!conditions[cond] || seen.has(cond + '|' + diseaseRule.disease)) continue;
        seen.add(cond + '|' + diseaseRule.disease);

        breaks.push({
          id: this._toBreakId(cond, diseaseRule.disease),
          condition: cond,
          name: diseaseRule.disease,
          diseaseTenGod: this._inferDiseaseTenGod(diseaseRule.disease),
          diseaseElement: this._inferDiseaseElement(diseaseRule.disease, dayElement),
          severityHint: CONDITION_SEVERITY[cond] || 'moderate',
          reason: diseaseRule.reason || `${cond}により${diseaseRule.disease}`,
          medicineHint: diseaseRule.medicine || null,
          strengthSide: strengthKey
        });
      }

      // 中和: strong で1件でも取れたら weak は試さない（KZ-1）
      if (strengthResult.strength === 'neutral' && breaks.length > 0) break;
    }

    return breaks;
  }

  /**
   * @private
   */
  _strengthKeysToTry(strength) {
    if (strength === 'weak') return ['weak'];
    if (strength === 'neutral') return ['strong', 'weak'];
    return ['strong'];
  }

  /**
   * 表示用の助け（初版は参考のみ）
   * @private
   */
  _detectSupports(youshinCategory, tsuuhenList) {
    const supports = [];
    const has = (names) => tsuuhenList.some(t => names.includes(t));

    if (youshinCategory === 'officer') {
      if (has(['正財', '偏財'])) {
        supports.push({ name: '財生官', tenGod: '財', reason: '財が官を生じる' });
      }
      if (has(['正印', '偏印'])) {
        supports.push({ name: '印護身', tenGod: '印', reason: '印が身を助け官を受ける' });
      }
    } else if (youshinCategory === 'wealth') {
      if (has(['正官', '偏官'])) {
        supports.push({ name: '官護財', tenGod: '官殺', reason: '官殺が比劫を制し財を護る' });
      }
      if (has(['食神', '傷官'])) {
        supports.push({ name: '食傷生財', tenGod: '食傷', reason: '食傷が財を生じる' });
      }
    } else if (youshinCategory === 'seal') {
      if (has(['比肩', '劫財'])) {
        supports.push({ name: '比劫護印', tenGod: '比劫', reason: '比劫が財を制し印を護る' });
      }
    } else if (youshinCategory === 'output') {
      if (has(['正財', '偏財'])) {
        supports.push({ name: '財洩食傷', tenGod: '財', reason: '財が食傷の気を洩らす' });
      }
    }

    return supports;
  }

  /**
   * @private
   */
  _evaluateConditions(fortuneResult, dayElement, tsuuhenList, transformedMap) {
    const conditions = {};
    const allHiddenElements = [];
    const pillars = [
      fortuneResult.yearPillar, fortuneResult.monthPillar,
      fortuneResult.dayPillar, fortuneResult.hourPillar
    ];

    for (let i = 0; i < pillars.length; i++) {
      const p = pillars[i];
      if (!p) continue;
      if (transformedMap && transformedMap.has(i)) {
        allHiddenElements.push(transformedMap.get(i));
        continue;
      }
      for (const hs of (p.hiddenStems || [])) {
        allHiddenElements.push(STEM_ELEMENTS[hs]);
      }
    }

    const officerEl = this._getControllingElement(dayElement);

    const bijouCount = tsuuhenList.filter(t => t === '比肩' || t === '劫財').length;
    const sameElInHidden = allHiddenElements.filter(e => e === dayElement).length;
    conditions['比劫多'] = bijouCount >= 2 || sameElInHidden >= 3;

    const officerStemCount = tsuuhenList.filter(t => t === '正官' || t === '偏官').length;
    const officerHiddenCount = allHiddenElements.filter(e => e === officerEl).length;
    conditions['官殺多'] = officerStemCount >= 2 || officerHiddenCount >= 3;

    const sealCount = tsuuhenList.filter(t => t === '正印' || t === '偏印').length;
    conditions['印多'] = sealCount >= 2;

    conditions['傷官透出'] = tsuuhenList.includes('傷官');
    conditions['食神透出'] = tsuuhenList.includes('食神');

    const wealthCount = tsuuhenList.filter(t => t === '正財' || t === '偏財').length;
    conditions['財多'] = wealthCount >= 2;

    return conditions;
  }

  /**
   * @private
   */
  _collectTsuuhen(tsuuhenResult) {
    const list = [];
    if (!tsuuhenResult) return list;
    if (tsuuhenResult.year) list.push(tsuuhenResult.year.tsuuhen);
    if (tsuuhenResult.month) list.push(tsuuhenResult.month.tsuuhen);
    if (tsuuhenResult.hour) list.push(tsuuhenResult.hour.tsuuhen);
    return list;
  }

  /**
   * @private
   */
  _getControllingElement(dayElement) {
    for (const [key, value] of Object.entries(CONTROL_CYCLE)) {
      if (value === dayElement) return key;
    }
    return null;
  }

  /**
   * @private
   */
  _getGeneratingElement(dayElement) {
    for (const [key, value] of Object.entries(GENERATE_CYCLE)) {
      if (value === dayElement) return key;
    }
    return null;
  }

  /**
   * @private
   */
  _getCategoryElement(category, dayElement) {
    switch (category) {
      case 'self': return dayElement;
      case 'output': return GENERATE_CYCLE[dayElement];
      case 'wealth': return CONTROL_CYCLE[dayElement];
      case 'officer': return this._getControllingElement(dayElement);
      case 'seal': return this._getGeneratingElement(dayElement);
      default: return null;
    }
  }

  /**
   * @private
   */
  _inferDiseaseTenGod(diseaseName) {
    if (!diseaseName) return null;
    if (diseaseName.includes('比劫') || diseaseName.includes('群劫') || diseaseName.includes('抗殺')) return '比劫';
    if (diseaseName.includes('傷官')) return '傷官';
    if (diseaseName.includes('食神') || diseaseName.includes('制殺')) return '食神';
    if (diseaseName.includes('印') || diseaseName.includes('梟')) return '印';
    if (diseaseName.includes('財') || diseaseName.includes('貪財')) return '財';
    if (diseaseName.includes('官') || diseaseName.includes('殺')) return '官殺';
    return null;
  }

  /**
   * @private
   */
  _inferDiseaseElement(diseaseName, dayElement) {
    const tenGod = this._inferDiseaseTenGod(diseaseName);
    if (!tenGod) return null;
    if (tenGod === '比劫') return dayElement;
    if (tenGod === '傷官' || tenGod === '食神') return GENERATE_CYCLE[dayElement];
    if (tenGod === '財') return CONTROL_CYCLE[dayElement];
    if (tenGod === '官殺') return this._getControllingElement(dayElement);
    if (tenGod === '印') return this._getGeneratingElement(dayElement);
    return null;
  }

  /**
   * @private
   */
  _toBreakId(condition, disease) {
    return `${condition}_${disease}`.replace(/\s+/g, '_');
  }

  /**
   * @private
   */
  _severityRank(hint) {
    if (hint === 'severe') return 3;
    if (hint === 'moderate') return 2;
    return 1;
  }

  /**
   * @private
   */
  _buildSummary(pillar, breaks, supports) {
    const status = pillar.isEstablished ? '成格' : '破格';
    if (breaks.length === 0) {
      const supportText = supports.length
        ? `助け: ${supports.map(s => s.name).join('・')}`
        : '目立った用神損傷なし';
      return `${pillar.kakkyoku}（主軸:${pillar.youshinLabel}・${status}）。${supportText}`;
    }
    const names = breaks.map(b => b.name).join('、');
    return `${pillar.kakkyoku}（主軸:${pillar.youshinLabel}・${status}）。損傷: ${names}`;
  }
}
