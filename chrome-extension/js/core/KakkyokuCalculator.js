/**
 * KakkyokuCalculator - 格局判定クラス
 * 命式の格局（パターン）を判定する。
 * 命理正宗（張楠）の理論に基づく。
 *
 * 対応格局: 正格10種 + 五行一気格5種 + 従格2種 = 17種
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS, YANG_STEMS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

// 建禄テーブル: 日干 → 建禄の地支
const KENROKU_TABLE = {
  '甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
  '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'
};

// 陽刃テーブル: 六陽干のみ
const YOUJIN_TABLE = {
  '甲': '卯', '丙': '午', '戊': '午', '庚': '酉', '壬': '子'
};

// 五行一気格の判定ルール
const GOGYOU_IKKI_RULES = [
  {
    name: '曲直仁寿格',
    dayStems: ['甲', '乙'],
    dayElement: '木',
    requiredSets: [
      ['寅', '卯', '辰'],  // 東方三会
      ['亥', '卯', '未']   // 木三合
    ],
    breakStems: ['庚', '辛'],
    breakBranches: ['申', '酉']
  },
  {
    name: '稼穡格',
    dayStems: ['戊', '己'],
    dayElement: '土',
    requiredSets: [
      ['辰', '戌', '丑', '未']  // 四墓全
    ],
    breakStems: ['甲', '乙'],
    breakBranches: ['寅', '卯']
  },
  {
    name: '炎上格',
    dayStems: ['丙', '丁'],
    dayElement: '火',
    requiredSets: [
      ['寅', '午', '戌'],  // 火三合
      ['巳', '午', '未']   // 南方三会
    ],
    breakStems: ['壬', '癸'],
    breakBranches: ['亥', '子']
  },
  {
    name: '潤下格',
    dayStems: ['壬', '癸'],
    dayElement: '水',
    requiredSets: [
      ['申', '子', '辰'],  // 水三合
      ['亥', '子', '丑']   // 北方三会
    ],
    breakStems: ['戊', '己'],
    breakBranches: ['辰', '戌', '丑', '未']
  },
  {
    name: '従革格',
    dayStems: ['庚', '辛'],
    dayElement: '金',
    requiredSets: [
      ['巳', '酉', '丑'],  // 金三合
      ['申', '酉', '戌']   // 西方三会
    ],
    breakStems: ['丙', '丁'],
    breakBranches: ['巳', '午']
  }
];

// 蔵干から通変星名への対応を取るためのヘルパー
const GENERATE_CYCLE = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};
const CONTROL_CYCLE = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};

// 五行から代表天干への対応（合化成功時の仮想蔵干用）
const ELEMENT_TO_STEMS = {
  '木': ['甲', '乙'],
  '火': ['丙', '丁'],
  '土': ['戊', '己'],
  '金': ['庚', '辛'],
  '水': ['壬', '癸']
};

// 正格破格ルール: 忌神透出 + 救神不在 = 破格
const BREAK_RULES = {
  '正官格': { enemies: ['傷官'], rescues: ['正印', '偏印'], reason: '傷官見官' },
  '偏官格': { enemies: ['偏印'], rescues: ['正財', '偏財'], reason: '梟印奪食（制殺手段を失う）' },
  '正財格': { enemies: ['劫財', '比肩'], rescues: ['正官', '偏官'], reason: '比劫奪財' },
  '偏財格': { enemies: ['劫財', '比肩'], rescues: ['正官', '偏官'], reason: '群劫争財' },
  '傷官格': { enemies: ['正官'], rescues: ['正印', '偏印'], reason: '傷官見官' },
  '食神格': { enemies: ['偏印'], rescues: ['正財', '偏財'], reason: '梟印奪食' },
  '印綬格': { enemies: ['正財', '偏財'], rescues: ['劫財', '比肩'], reason: '貪財壊印' },
  '偏印格': { enemies: ['正財', '偏財'], rescues: ['劫財', '比肩'], reason: '財破印綬' },
};

// 蔵干の五行から十神名を得る（日干基準）
function getTenGodName(dayElement, dayStemIsYang, targetElement, targetStemIsYang) {
  const sameYinYang = dayStemIsYang === targetStemIsYang;

  if (targetElement === dayElement) {
    return sameYinYang ? '比肩' : '劫財';
  }
  if (GENERATE_CYCLE[dayElement] === targetElement) {
    return sameYinYang ? '食神' : '傷官';
  }
  if (CONTROL_CYCLE[dayElement] === targetElement) {
    return sameYinYang ? '偏財' : '正財';
  }
  if (CONTROL_CYCLE[targetElement] === dayElement) {
    return sameYinYang ? '偏官' : '正官';
  }
  if (GENERATE_CYCLE[targetElement] === dayElement) {
    return sameYinYang ? '偏印' : '正印';
  }
  return null;
}

export class KakkyokuCalculator {
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
   * 格局を判定する
   * @param {Object} fortuneResult - FortuneCalculator.calculateFortune()の戻り値
   * @param {Object} tsuuhenResult - TsuuhenCalculator.calculateForPillars()の戻り値
   * @param {Object} strengthResult - DayMasterStrengthAssessor.assess()の戻り値
   * @param {Object} [gouChuuResult=null] - GouChuuCalculator.analyzeNatalChart()の戻り値
   * @returns {Object} 格局判定結果
   */
  calculate(fortuneResult, tsuuhenResult, strengthResult, gouChuuResult = null) {
    if (!fortuneResult || !fortuneResult.dayPillar) {
      throw new CalculationError('命式データが不正です');
    }

    const dayStem = fortuneResult.dayPillar.stem;
    const dayElement = STEM_ELEMENTS[dayStem];
    const branches = this._getAllBranches(fortuneResult);
    const stems = this._getAllStems(fortuneResult);
    const transformedMap = gouChuuResult?.transformedElementMap || null;

    // 1. 五行一気格チェック
    const gogyouResult = this._checkGogyouIkki(dayStem, dayElement, branches, stems, gouChuuResult);
    if (gogyouResult) return gogyouResult;

    // 2. 従格チェック（合化成功した地支は化後の五行で根を判定）
    const juukakuResult = this._checkFollowingKakkyoku(dayStem, dayElement, fortuneResult, tsuuhenResult, strengthResult, transformedMap);
    if (juukakuResult) return juukakuResult;

    // 3. 正格判定（合化成功した月支は化後の五行で月令を判定）
    return this._determineRegularKakkyoku(dayStem, dayElement, fortuneResult, tsuuhenResult, transformedMap);
  }

  /**
   * 四柱の全地支を取得
   * @private
   */
  _getAllBranches(fortuneResult) {
    const branches = [
      fortuneResult.yearPillar.branch,
      fortuneResult.monthPillar.branch,
      fortuneResult.dayPillar.branch
    ];
    if (fortuneResult.hourPillar) {
      branches.push(fortuneResult.hourPillar.branch);
    }
    return branches;
  }

  /**
   * 四柱の全天干を取得
   * @private
   */
  _getAllStems(fortuneResult) {
    const stems = [
      fortuneResult.yearPillar.stem,
      fortuneResult.monthPillar.stem,
      fortuneResult.dayPillar.stem
    ];
    if (fortuneResult.hourPillar) {
      stems.push(fortuneResult.hourPillar.stem);
    }
    return stems;
  }

  /**
   * 五行一気格のチェック
   * @private
   */
  _checkGogyouIkki(dayStem, dayElement, branches, stems, gouChuuResult = null) {
    for (const rule of GOGYOU_IKKI_RULES) {
      // 日干が対応五行か
      if (!rule.dayStems.includes(dayStem)) continue;

      // 三合or三会が成立するか
      let setMatched = false;
      let matchedSet = null;
      for (const reqSet of rule.requiredSets) {
        if (reqSet.every(b => branches.includes(b))) {
          setMatched = true;
          matchedSet = reqSet;
          break;
        }
      }
      if (!setMatched) continue;

      // 冲による三合/三会の破壊チェック
      if (gouChuuResult && matchedSet) {
        const clashBreaks = gouChuuResult.liuchong.some(clash =>
          clash.intensityLevel >= 2 &&
          clash.branches.some(b => matchedSet.includes(b))
        );
        if (clashBreaks) {
          setMatched = false;
          continue;
        }
      }

      // 破格要素チェック（天干）
      const breakStemFound = stems.some(s => s !== dayStem && rule.breakStems.includes(s));
      // 破格要素チェック（地支）
      const breakBranchFound = branches.some(b => rule.breakBranches.includes(b));

      if (breakStemFound || breakBranchFound) {
        return {
          kakkyoku: rule.name,
          category: 'special_element',
          categoryLabel: '五行一気格',
          basis: '三合/三会成立',
          basisDetail: `${rule.dayElement}の三合/三会が成立するが破格要素あり`,
          isEstablished: false,
          breakReason: breakStemFound
            ? `天干に破格要素（${rule.breakStems.filter(s => stems.includes(s)).join('・')}）あり`
            : `地支に破格要素（${rule.breakBranches.filter(b => branches.includes(b)).join('・')}）あり`
        };
      }

      return {
        kakkyoku: rule.name,
        category: 'special_element',
        categoryLabel: '五行一気格',
        basis: '三合/三会成立',
        basisDetail: `日干${dayStem}（${rule.dayElement}）に${rule.dayElement}の三合/三会が成立`,
        isEstablished: true,
        breakReason: null
      };
    }
    return null;
  }

  /**
   * 従格のチェック
   * @private
   */
  _checkFollowingKakkyoku(dayStem, dayElement, fortuneResult, tsuuhenResult, strengthResult, transformedMap = null) {
    // 従格は身弱が前提（スコアが非常に低い）
    if (strengthResult.score > 0) return null;

    // 日主が完全無根かチェック（合化成功した地支は化後の五行で判定）
    const hasRoot = this._hasDayMasterRoot(dayElement, fortuneResult, transformedMap);
    if (hasRoot) return null;

    // 天干に比劫がないかチェック（日干自身は除く）
    const otherStems = [
      fortuneResult.yearPillar.stem,
      fortuneResult.monthPillar.stem,
      fortuneResult.hourPillar ? fortuneResult.hourPillar.stem : null
    ].filter(s => s);

    const hasBijou = otherStems.some(s => STEM_ELEMENTS[s] === dayElement);
    if (hasBijou) return null;

    // 官殺充満チェック → 従殺格
    const controlElement = CONTROL_CYCLE[dayElement]; // 日干を剋する五行 (wrong direction)
    // 日干を剋するのは: 金剋木、木剋土、... controlCycleのキーが剋される
    // Correct: targetElement controls dayElement → CONTROL_CYCLE[targetElement] === dayElement
    const officerElement = this._getControllingElement(dayElement);
    const officerCount = otherStems.filter(s => STEM_ELEMENTS[s] === officerElement).length;

    if (officerCount >= 2) {
      return {
        kakkyoku: '従殺格',
        category: 'following',
        categoryLabel: '従格',
        basis: '日主無根・官殺充満',
        basisDetail: `日干${dayStem}に根なし、天干に官殺（${officerElement}）が充満`,
        isEstablished: true,
        breakReason: null
      };
    }

    // 財星充満チェック → 従財格
    const wealthElement = CONTROL_CYCLE[dayElement]; // 日干が剋する五行 = 財
    const wealthCount = otherStems.filter(s => STEM_ELEMENTS[s] === wealthElement).length;

    if (wealthCount >= 2) {
      return {
        kakkyoku: '従財格',
        category: 'following',
        categoryLabel: '従格',
        basis: '日主無根・財星充満',
        basisDetail: `日干${dayStem}に根なし、天干に財星（${wealthElement}）が充満`,
        isEstablished: true,
        breakReason: null
      };
    }

    return null;
  }

  /**
   * 日干を剋する五行を取得
   * @private
   */
  _getControllingElement(dayElement) {
    // CONTROL_CYCLE[X] === dayElement となる X を探す
    for (const [key, value] of Object.entries(CONTROL_CYCLE)) {
      if (value === dayElement) {
        return key; // key が dayElement を剋する
      }
    }
    return null;
  }

  /**
   * 日主に地支の根があるかチェック
   * @private
   */
  _hasDayMasterRoot(dayElement, fortuneResult, transformedMap = null) {
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
        if (transformedMap.get(i) === dayElement) {
          return true;
        }
        continue;
      }

      const hiddenStems = pillar.hiddenStems || [];
      for (const hs of hiddenStems) {
        if (STEM_ELEMENTS[hs] === dayElement) {
          return true;
        }
      }
    }
    return false;
  }

  /**
   * 正格を判定する（月令ベース）
   * 命理正宗準拠: 官殺優先 → 月令透出 → 月令主気 → 建禄/陽刃フォールバック
   * @private
   */
  _determineRegularKakkyoku(dayStem, dayElement, fortuneResult, tsuuhenResult, transformedMap = null) {
    const monthBranch = fortuneResult.monthPillar.branch;
    const dayStemIsYang = YANG_STEMS.includes(dayStem);

    // 3a. 建禄/陽刃フラグ（即returnせず、フォールバック用に記録）
    const isKenroku = KENROKU_TABLE[dayStem] === monthBranch;
    const isYoujin = YOUJIN_TABLE[dayStem] && YOUJIN_TABLE[dayStem] === monthBranch;

    // 天干に透出している十神を収集（日干以外）
    const otherStems = [];
    otherStems.push({ stem: fortuneResult.yearPillar.stem, position: '年干' });
    otherStems.push({ stem: fortuneResult.monthPillar.stem, position: '月干' });
    if (fortuneResult.hourPillar) {
      otherStems.push({ stem: fortuneResult.hourPillar.stem, position: '時干' });
    }

    // 月支の蔵干を取得（格局判定は月令の本来の蔵干で行う。合化は格局に影響しない）
    const monthHiddenStems = fortuneResult.monthPillar.hiddenStems || [];

    // 3b. 官殺優先の原則（「有殺論殺、無殺論官」）
    // 天干に官殺が透出していれば月令蔵干に関係なく最優先で格とする
    const officerElement = this._getControllingElement(dayElement);
    // 偏官（七殺）を先に探す
    let officialResult = null;
    for (const { stem, position } of otherStems) {
      if (stem === dayStem) continue;
      const stemElement = STEM_ELEMENTS[stem];
      if (stemElement !== officerElement) continue;
      const stemIsYang = YANG_STEMS.includes(stem);
      const tenGod = getTenGodName(dayElement, dayStemIsYang, stemElement, stemIsYang);
      if (tenGod === '偏官') {
        officialResult = { tenGod, stem, position };
        break; // 偏官が見つかれば即採用
      }
      if (tenGod === '正官' && !officialResult) {
        officialResult = { tenGod, stem, position };
        // 正官は見つけても偏官がないか残りを探す
      }
    }
    if (officialResult) {
      const result = {
        kakkyoku: `${officialResult.tenGod}格`,
        category: 'regular',
        categoryLabel: '正格',
        basis: '官殺優先',
        basisDetail: `${officialResult.position}の${officialResult.stem}（${officialResult.tenGod}）が天干に透出（官殺優先の原則）`,
        isEstablished: true,
        breakReason: null
      };
      return this._checkRegularBreak(result, tsuuhenResult);
    }

    // 3b-2. 月令蔵干主気が官殺なら、他の蔵干の透出より優先して格とする
    // （月令の主気が官殺 = 最も強い根拠）
    if (monthHiddenStems.length > 0) {
      const mainHs = monthHiddenStems[0];
      const mainHsElement = STEM_ELEMENTS[mainHs];
      if (mainHsElement === officerElement) {
        const mainHsIsYang = YANG_STEMS.includes(mainHs);
        const tenGod = getTenGodName(dayElement, dayStemIsYang, mainHsElement, mainHsIsYang);
        if (tenGod === '偏官' || tenGod === '正官') {
          const result = {
            kakkyoku: `${tenGod}格`,
            category: 'regular',
            categoryLabel: '正格',
            basis: '官殺優先・月令主気',
            basisDetail: `月支${monthBranch}の蔵干主気${mainHs}（${mainHsElement}）が${tenGod}（官殺優先の原則）`,
            isEstablished: true,
            breakReason: null
          };
          return this._checkRegularBreak(result, tsuuhenResult);
        }
      }
    }

    // 3c. 月令蔵干透出チェック（比劫は除外）
    // 月支蔵干のうち天干に透出しているものを格とする
    for (const hs of monthHiddenStems) {
      const hsElement = STEM_ELEMENTS[hs];
      if (hsElement === dayElement) continue; // 比劫は格局にならない

      for (const { stem, position } of otherStems) {
        if (stem === dayStem) continue;
        const stemElement = STEM_ELEMENTS[stem];
        // 同じ五行の天干が透出している
        if (stemElement === hsElement) {
          const stemIsYang = YANG_STEMS.includes(stem);
          const tenGod = getTenGodName(dayElement, dayStemIsYang, stemElement, stemIsYang);
          if (tenGod && tenGod !== '比肩' && tenGod !== '劫財') {
            const result = {
              kakkyoku: `${tenGod}格`,
              category: 'regular',
              categoryLabel: '正格',
              basis: '月令透出',
              basisDetail: `月支${monthBranch}の蔵干${hs}（${hsElement}）が${position}に透出（${tenGod}）`,
              isEstablished: true,
              breakReason: null
            };
            return this._checkRegularBreak(result, tsuuhenResult);
          }
        }
      }
    }

    // 3d. 月令蔵干の主気（透出していなければ主気で判定、比劫なら次の蔵干へ）
    if (monthHiddenStems.length > 0) {
      for (let i = 0; i < monthHiddenStems.length; i++) {
        const hs = monthHiddenStems[i];
        const hsElement = STEM_ELEMENTS[hs];
        if (hsElement === dayElement) continue; // 比劫はスキップ

        const hsIsYang = YANG_STEMS.includes(hs);
        const tenGod = getTenGodName(dayElement, dayStemIsYang, hsElement, hsIsYang);
        if (tenGod && tenGod !== '比肩' && tenGod !== '劫財') {
          const basisLabel = i === 0 ? '月令蔵干主気' : '月令蔵干副気';
          const result = {
            kakkyoku: `${tenGod}格`,
            category: 'regular',
            categoryLabel: '正格',
            basis: basisLabel,
            basisDetail: `月支${monthBranch}の蔵干${i === 0 ? '主気' : ''}${hs}（${hsElement}）による${tenGod}`,
            isEstablished: true,
            breakReason: null
          };
          return this._checkRegularBreak(result, tsuuhenResult);
        }
      }
    }

    // 3e. フォールバック
    // 陽刃格（月支が陽刃で他に格が取れなかった場合）
    if (isYoujin) {
      const result = {
        kakkyoku: '陽刃格',
        category: 'regular',
        categoryLabel: '正格',
        basis: '月支が陽刃',
        basisDetail: `月支${monthBranch}が日干${dayStem}（陽干）の陽刃（他に取格なし）`,
        isEstablished: true,
        breakReason: null
      };
      return this._checkRegularBreak(result, tsuuhenResult);
    }

    // 建禄格（月支が建禄で他に格が取れなかった場合）
    if (isKenroku) {
      const result = {
        kakkyoku: '建禄格',
        category: 'regular',
        categoryLabel: '正格',
        basis: '月支が建禄',
        basisDetail: `月支${monthBranch}が日干${dayStem}の建禄（他に取格なし）`,
        isEstablished: true,
        breakReason: null
      };
      return this._checkRegularBreak(result, tsuuhenResult);
    }

    // 月支五行から判定（格局判定は月令の本来の五行で行う）
    const monthElement = BRANCH_ELEMENTS[monthBranch];
    if (monthElement && monthElement !== dayElement) {
      const monthBranchData = this.stemBranchData.branches[monthBranch];
      const monthIsYang = monthBranchData && monthBranchData.yin_yang === '陽';
      const tenGod = getTenGodName(dayElement, dayStemIsYang, monthElement, monthIsYang);
      if (tenGod && tenGod !== '比肩' && tenGod !== '劫財') {
        const result = {
          kakkyoku: `${tenGod}格`,
          category: 'regular',
          categoryLabel: '正格',
          basis: '月支五行',
          basisDetail: `月支${monthBranch}（${monthElement}）による${tenGod}`,
          isEstablished: true,
          breakReason: null
        };
        return this._checkRegularBreak(result, tsuuhenResult);
      }
    }

    // 最終フォールバック
    return {
      kakkyoku: '建禄格',
      category: 'regular',
      categoryLabel: '正格',
      basis: '月令判定不能',
      basisDetail: '月令から格局を特定できないため建禄格として扱う',
      isEstablished: true,
      breakReason: null
    };
  }

  /**
   * 正格の破格判定
   * 忌神が天干に透出し、救神が不在なら破格
   * @private
   * @param {Object} result - 正格判定結果
   * @param {Object} tsuuhenResult - 通変星結果
   * @returns {Object} 破格判定を反映した結果
   */
  _checkRegularBreak(result, tsuuhenResult) {
    const rule = BREAK_RULES[result.kakkyoku];
    if (!rule) return result;

    // 天干の通変星リストを収集
    const tsuuhenList = [];
    if (tsuuhenResult.year) tsuuhenList.push(tsuuhenResult.year.tsuuhen);
    if (tsuuhenResult.month) tsuuhenList.push(tsuuhenResult.month.tsuuhen);
    if (tsuuhenResult.hour) tsuuhenList.push(tsuuhenResult.hour.tsuuhen);

    // 忌神が天干に透出しているか
    const hasEnemy = rule.enemies.some(e => tsuuhenList.includes(e));
    if (!hasEnemy) return result;

    // 救神が天干に透出しているか
    const hasRescue = rule.rescues.some(r => tsuuhenList.includes(r));
    if (hasRescue) return result;

    // 忌神あり + 救神なし → 破格
    return {
      ...result,
      isEstablished: false,
      breakReason: rule.reason
    };
  }
}

export default KakkyokuCalculator;
