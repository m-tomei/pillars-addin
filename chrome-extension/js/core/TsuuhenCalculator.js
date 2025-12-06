/**
 * TsuuhenCalculator - 通変星計算クラス
 * Calculate the 10 transformations (Tsuuhen) in Four Pillars of Destiny
 */

import { STEM_ELEMENTS, YANG_STEMS, YIN_STEMS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

/**
 * 通変星計算クラス
 * Calculates the relationships between heavenly stems to determine Tsuuhen stars
 */
export class TsuuhenCalculator {
  /**
   * Initialize the Tsuuhen calculator
   */
  constructor() {
    this.tsuuhenMap = this._buildTsuuhenMap();
  }

  /**
   * Build the mapping of relationships to Tsuuhen names
   * @private
   * @returns {Object} Mapping of relationship+yinyang to Tsuuhen name
   */
  _buildTsuuhenMap() {
    return {
      // Same element
      'same_same': '比肩',        // Hiken (Shoulder)
      'same_diff': '劫財',        // Gouzai (Rob Wealth)

      // I generate (Child element)
      'generate_same': '食神',    // Shokujin (Eating God)
      'generate_diff': '傷官',    // Shoukan (Hurting Officer)

      // I control (Grandchild element)
      'control_same': '偏財',     // Henzai (Indirect Wealth)
      'control_diff': '正財',     // Seizai (Direct Wealth)

      // Controls me (Grandparent element)
      'controlled_same': '偏官',  // Henkan (Indirect Officer) / 七殺 (Shichisatsu)
      'controlled_diff': '正官',  // Seikan (Direct Officer)

      // Generates me (Parent element)
      'generated_same': '偏印',   // Henin (Indirect Seal)
      'generated_diff': '正印'    // Seiin (Direct Seal)
    };
  }

  /**
   * Get the element (木火土金水) from a heavenly stem
   * @private
   * @param {string} stem - Heavenly stem (甲乙丙丁戊己庚辛壬癸)
   * @returns {string} Element (木火土金水)
   * @throws {CalculationError} If stem is invalid
   */
  _getStemElement(stem) {
    const element = STEM_ELEMENTS[stem];
    if (!element) {
      throw new CalculationError(`無効な天干: ${stem}`);
    }
    return element;
  }

  /**
   * Get the yin/yang from a heavenly stem
   * @private
   * @param {string} stem - Heavenly stem (甲乙丙丁戊己庚辛壬癸)
   * @returns {string} '陽' or '陰'
   * @throws {CalculationError} If stem is invalid
   */
  _getStemYinYang(stem) {
    if (YANG_STEMS.includes(stem)) {
      return '陽';
    } else if (YIN_STEMS.includes(stem)) {
      return '陰';
    } else {
      throw new CalculationError(`無効な天干: ${stem}`);
    }
  }

  /**
   * Determine the 5-element relationship between day element and target element
   * @private
   * @param {string} dayElement - Day master's element
   * @param {string} targetElement - Target element to compare
   * @returns {string} Relationship type: 'same', 'generate', 'control', 'controlled', 'generated'
   */
  _getRelationship(dayElement, targetElement) {
    // Same element
    if (dayElement === targetElement) {
      return 'same';
    }

    // Define generation cycle: 木→火→土→金→水→木
    const generateCycle = {
      '木': '火',
      '火': '土',
      '土': '金',
      '金': '水',
      '水': '木'
    };

    // Define control cycle: 木→土, 土→水, 水→火, 火→金, 金→木
    const controlCycle = {
      '木': '土',
      '土': '水',
      '水': '火',
      '火': '金',
      '金': '木'
    };

    // I generate (day element generates target element)
    if (generateCycle[dayElement] === targetElement) {
      return 'generate';
    }

    // Generates me (target element generates day element)
    if (generateCycle[targetElement] === dayElement) {
      return 'generated';
    }

    // I control (day element controls target element)
    if (controlCycle[dayElement] === targetElement) {
      return 'control';
    }

    // Controls me (target element controls day element)
    if (controlCycle[targetElement] === dayElement) {
      return 'controlled';
    }

    // Should never reach here if all elements are valid
    throw new CalculationError(`関係性を判定できません: ${dayElement} と ${targetElement}`);
  }

  /**
   * Calculate Tsuuhen between day stem and target stem
   * @param {string} dayStem - Day master's heavenly stem
   * @param {string} targetStem - Target heavenly stem to analyze
   * @returns {Object} { tsuuhen: string, relationship: string }
   * @throws {CalculationError} If stems are invalid
   */
  calculateTsuuhen(dayStem, targetStem) {
    // Validate inputs
    if (!dayStem || !targetStem) {
      throw new CalculationError('日干と対象天干は必須です');
    }

    // Get elements and yin/yang
    const dayElement = this._getStemElement(dayStem);
    const targetElement = this._getStemElement(targetStem);
    const dayYinYang = this._getStemYinYang(dayStem);
    const targetYinYang = this._getStemYinYang(targetStem);

    // Determine relationship
    const relationship = this._getRelationship(dayElement, targetElement);

    // Determine if same or different yin/yang
    const yinYangMatch = dayYinYang === targetYinYang ? 'same' : 'diff';

    // Build lookup key
    const key = `${relationship}_${yinYangMatch}`;

    // Get Tsuuhen name
    const tsuuhen = this.tsuuhenMap[key];

    if (!tsuuhen) {
      throw new CalculationError(`通変星を判定できません: ${key}`);
    }

    return {
      tsuuhen: tsuuhen,
      relationship: relationship
    };
  }

  /**
   * Calculate Tsuuhen for the three pillars (year, month, hour)
   * Day pillar is excluded as it represents self (比肩 by definition)
   * @param {string} dayStem - Day master's heavenly stem
   * @param {string} yearStem - Year pillar's heavenly stem
   * @param {string} monthStem - Month pillar's heavenly stem
   * @param {string} hourStem - Hour pillar's heavenly stem
   * @returns {Object} { year: {tsuuhen, relationship}, month: {tsuuhen, relationship}, hour: {tsuuhen, relationship} }
   * @throws {CalculationError} If any stem is invalid
   */
  calculateForPillars(dayStem, yearStem, monthStem, hourStem) {
    // Validate day stem
    if (!dayStem) {
      throw new CalculationError('日干は必須です');
    }

    const result = {};

    // Calculate for year pillar
    if (yearStem) {
      result.year = this.calculateTsuuhen(dayStem, yearStem);
    }

    // Calculate for month pillar
    if (monthStem) {
      result.month = this.calculateTsuuhen(dayStem, monthStem);
    }

    // Calculate for hour pillar
    if (hourStem) {
      result.hour = this.calculateTsuuhen(dayStem, hourStem);
    }

    return result;
  }
}

export default TsuuhenCalculator;
