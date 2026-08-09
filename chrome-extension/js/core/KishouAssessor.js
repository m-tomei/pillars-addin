/**
 * KishouAssessor - 気象（寒暖・燥湿）判定
 *
 * 根拠: 気象篇 / BYO-DD-03
 * 清濁は初版 `不明` 固定（D-08）
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

const TEMP_SCALE = ['寒', '涼', '中和', '温', '熱'];

const MONTH_BASE_TEMP = {
  亥: '寒', 子: '寒', 丑: '寒',
  寅: '温', 卯: '温', 辰: '温',
  巳: '熱', 午: '熱', 未: '熱',
  申: '涼', 酉: '涼', 戌: '涼'
};

const HEAT_COLD_SHIFT = 2.0;
const DRY_WET_DIFF = 1.5;
const SEVERE_DIFF = 3.0;

export class KishouAssessor {
  /**
   * @param {object} [options]
   * @param {number} [options.heatColdShift]
   * @param {number} [options.dryWetDiff]
   */
  constructor(options = {}) {
    this.heatColdShift = options.heatColdShift ?? HEAT_COLD_SHIFT;
    this.dryWetDiff = options.dryWetDiff ?? DRY_WET_DIFF;
  }

  /**
   * @param {object} fortuneResult
   * @param {object} [options]
   * @param {Record<string, number>} [options.elementDist] 外部から渡す五行分布
   * @returns {object} KishouResult
   */
  assess(fortuneResult, options = {}) {
    if (!fortuneResult?.monthPillar?.branch) {
      throw new CalculationError('気象判定に必要な命式データが不足しています');
    }

    const monthBranch = fortuneResult.monthPillar.branch;
    const baseTemp = MONTH_BASE_TEMP[monthBranch] || '中和';
    const dist = options.elementDist || this._calcSimpleDistribution(fortuneResult);

    const fire = dist['火'] || 0;
    const earth = dist['土'] || 0;
    const water = dist['水'] || 0;
    const metal = dist['金'] || 0;
    const wood = dist['木'] || 0;

    const heatScore = fire + earth * 0.5;
    const coldScore = water + metal * 0.5;
    const dryScore = fire * 0.5 + earth;
    const wetScore = water;

    const temperature = this._shiftTemperature(baseTemp, heatScore - coldScore);
    const humidity = this._classifyHumidity(dryScore, wetScore);
    const severity = this._classifySeverity(temperature, humidity, heatScore - coldScore);
    const choukou = this._buildChoukou(temperature, humidity, heatScore, coldScore, baseTemp);
    const isExtreme = severity !== 'mild';

    const causeElements = [];
    if (temperature === '寒' || temperature === '涼') {
      if (water > 0) causeElements.push('水');
      if (metal > 0) causeElements.push('金');
    } else if (temperature === '熱' || temperature === '温') {
      if (fire > 0) causeElements.push('火');
      if (earth > 0) causeElements.push('土');
    }

    return {
      temperature,
      humidity,
      clarity: '不明',
      severity,
      choukou,
      scores: {
        fireEarth: heatScore,
        waterMetal: coldScore,
        wood,
        heatScore,
        coldScore,
        dryScore,
        wetScore,
        baseTemp,
        monthBranch
      },
      summary: this._buildSummary(temperature, humidity, choukou),
      isExtreme,
      causeElements: [...new Set(causeElements)],
      deficientElements: [...choukou.primaryElements]
    };
  }

  /**
   * 簡易五行分布（天干1.0 / 地支1.0、月支×2.0）
   * @private
   */
  _calcSimpleDistribution(fortune) {
    const dist = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
    const pillars = ['yearPillar', 'monthPillar', 'dayPillar', 'hourPillar'];

    for (const key of pillars) {
      const pillar = fortune[key];
      if (!pillar) continue;

      const stemEl = STEM_ELEMENTS[pillar.stem];
      if (stemEl) dist[stemEl] += 1.0;

      const branchEl = BRANCH_ELEMENTS[pillar.branch];
      if (!branchEl) continue;
      const weight = key === 'monthPillar' ? 2.0 : 1.0;
      dist[branchEl] += weight;
    }

    return dist;
  }

  /**
   * @private
   */
  _shiftTemperature(baseTemp, heatMinusCold) {
    let idx = TEMP_SCALE.indexOf(baseTemp);
    if (idx < 0) idx = 2;

    if (heatMinusCold >= this.heatColdShift) {
      idx = Math.min(idx + 1, TEMP_SCALE.length - 1);
    } else if (heatMinusCold <= -this.heatColdShift) {
      idx = Math.max(idx - 1, 0);
    }

    return TEMP_SCALE[idx];
  }

  /**
   * @private
   */
  _classifyHumidity(dryScore, wetScore) {
    const diff = dryScore - wetScore;
    if (diff >= this.dryWetDiff) return '燥';
    if (-diff >= this.dryWetDiff) return '湿';
    return '中';
  }

  /**
   * @private
   */
  _classifySeverity(temperature, humidity, heatMinusCold) {
    const absDiff = Math.abs(heatMinusCold);
    if ((temperature === '寒' || temperature === '熱') && absDiff >= SEVERE_DIFF) {
      return 'severe';
    }
    if (temperature === '寒' || temperature === '熱' || humidity === '燥' || humidity === '湿') {
      return 'moderate';
    }
    return 'mild';
  }

  /**
   * @private
   */
  _buildChoukou(temperature, humidity, heatScore, coldScore, baseTemp) {
    let direction = 'なし';
    let primaryElements = [];
    const secondary = [];

    // 温度調候を優先。寒/涼は温める、熱/温は冷ます（冬月が火で涼へシフトしても温めるを維持）
    const coldSide = temperature === '寒' || temperature === '涼' || baseTemp === '寒';
    const hotSide = temperature === '熱' || temperature === '温' || baseTemp === '熱';

    if (coldSide && !hotSide) {
      direction = '温める';
      primaryElements = coldScore - heatScore >= this.heatColdShift ? ['火', '木'] : ['火'];
    } else if (hotSide && !coldSide) {
      direction = '冷ます';
      primaryElements = heatScore - coldScore >= this.heatColdShift ? ['水', '金'] : ['水'];
    } else if (temperature === '寒' || temperature === '涼') {
      direction = '温める';
      primaryElements = ['火'];
    } else if (temperature === '熱' || temperature === '温') {
      direction = '冷ます';
      primaryElements = ['水'];
    }

    if (humidity === '燥' && temperature !== '寒') {
      if (direction === 'なし') {
        direction = '潤す';
        primaryElements = ['水'];
      } else {
        secondary.push({ direction: '潤す', elements: ['水'], reason: '燥の調候' });
      }
    } else if (humidity === '湿' && temperature !== '熱') {
      if (direction === 'なし') {
        direction = '燥す';
        primaryElements = ['土'];
      } else {
        secondary.push({ direction: '燥す', elements: ['土'], reason: '湿の調候' });
      }
    }

    return { direction, primaryElements, secondary };
  }

  /**
   * @private
   */
  _buildSummary(temperature, humidity, choukou) {
    if (choukou.direction === 'なし') {
      return `気象はおおむね穏やか（${temperature}/${humidity}）`;
    }
    return `気象は${temperature}・${humidity}寄り。調候は「${choukou.direction}」`;
  }
}
