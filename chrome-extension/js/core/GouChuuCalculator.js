/**
 * GouChuuCalculator - 合冲計算クラス
 *
 * 命式の地支間における合（支合・三合・半合・方合）と冲（六冲）を分析する。
 * 命理正宗（張楠）の理論に基づく。
 *
 * 自己完結型（TsuuhenCalculatorと同パターン、async initなし）。
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS, YANG_STEMS } from '../utils/constants.js';

// 五行の相生関係: key が value を生じる
const GENERATE_CYCLE = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};

// 六合（支合）
const LIUHE_PAIRS = [
  { branches: ['子', '丑'], resultElement: '土', name: '子丑合化土' },
  { branches: ['寅', '亥'], resultElement: '木', name: '寅亥合化木' },
  { branches: ['卯', '戌'], resultElement: '火', name: '卯戌合化火' },
  { branches: ['辰', '酉'], resultElement: '金', name: '辰酉合化金' },
  { branches: ['巳', '申'], resultElement: '水', name: '巳申合化水' },
  { branches: ['午', '未'], resultElement: '土', name: '午未合化土' }
];

// 三合
const SANHE_TRIOS = [
  { branches: ['申', '子', '辰'], resultElement: '水', emperor: '子', name: '申子辰合水局' },
  { branches: ['亥', '卯', '未'], resultElement: '木', emperor: '卯', name: '亥卯未合木局' },
  { branches: ['寅', '午', '戌'], resultElement: '火', emperor: '午', name: '寅午戌合火局' },
  { branches: ['巳', '酉', '丑'], resultElement: '金', emperor: '酉', name: '巳酉丑合金局' }
];

// 半合（帝旺を含むペアのみ）
const BANHE_PAIRS = [
  { branches: ['申', '子'], resultElement: '水', name: '申子半合水局' },
  { branches: ['子', '辰'], resultElement: '水', name: '子辰半合水局' },
  { branches: ['亥', '卯'], resultElement: '木', name: '亥卯半合木局' },
  { branches: ['卯', '未'], resultElement: '木', name: '卯未半合木局' },
  { branches: ['寅', '午'], resultElement: '火', name: '寅午半合火局' },
  { branches: ['午', '戌'], resultElement: '火', name: '午戌半合火局' },
  { branches: ['巳', '酉'], resultElement: '金', name: '巳酉半合金局' },
  { branches: ['酉', '丑'], resultElement: '金', name: '酉丑半合金局' }
];

// 方合
const FANGHE_GROUPS = [
  { branches: ['寅', '卯', '辰'], resultElement: '木', direction: '東方', season: '春', name: '寅卯辰方合木局' },
  { branches: ['巳', '午', '未'], resultElement: '火', direction: '南方', season: '夏', name: '巳午未方合火局' },
  { branches: ['申', '酉', '戌'], resultElement: '金', direction: '西方', season: '秋', name: '申酉戌方合金局' },
  { branches: ['亥', '子', '丑'], resultElement: '水', direction: '北方', season: '冬', name: '亥子丑方合水局' }
];

// 六冲
const LIUCHONG_PAIRS = [
  { branches: ['子', '午'], name: '子午冲' },
  { branches: ['丑', '未'], name: '丑未冲' },
  { branches: ['寅', '申'], name: '寅申冲' },
  { branches: ['卯', '酉'], name: '卯酉冲' },
  { branches: ['辰', '戌'], name: '辰戌冲' },
  { branches: ['巳', '亥'], name: '巳亥冲' }
];

// 地支の季節五行対応（合化の月令判定用）
const BRANCH_SEASON_ELEMENT = {
  '寅': '木', '卯': '木', '辰': '土',
  '巳': '火', '午': '火', '未': '土',
  '申': '金', '酉': '金', '戌': '土',
  '亥': '水', '子': '水', '丑': '土'
};

// 柱位置名
const POSITION_NAMES = ['年支', '月支', '日支', '時支', '大運支'];

export class GouChuuCalculator {
  constructor() {
    // 六冲の逆引きテーブル構築
    this._clashMap = new Map();
    for (const pair of LIUCHONG_PAIRS) {
      this._clashMap.set(pair.branches[0], pair.branches[1]);
      this._clashMap.set(pair.branches[1], pair.branches[0]);
    }
  }

  /**
   * 命式四柱の全合冲を分析
   * @param {Object} fortuneResult - FortuneCalculator.calculateFortune()の戻り値
   * @returns {Object} GouChuuResult
   */
  analyzeNatalChart(fortuneResult) {
    const branches = this._extractBranches(fortuneResult);
    const branchPositions = this._extractBranchPositions(fortuneResult);
    const result = this._analyze(branches, branchPositions, fortuneResult);
    result.transformedElementMap = this.buildTransformedElementMap(result);
    return result;
  }

  /**
   * 大運地支と命式の合冲を分析
   * @param {string} daiunBranch - 大運の地支
   * @param {Object} fortuneResult - FortuneCalculator.calculateFortune()の戻り値
   * @returns {Object} GouChuuResult（大運地支が関与するもののみ）
   */
  analyzeDaiunInteraction(daiunBranch, fortuneResult) {
    const natalBranches = this._extractBranches(fortuneResult);
    const natalPositions = this._extractBranchPositions(fortuneResult);

    // 大運を5番目の地支として追加
    const allBranches = [...natalBranches, daiunBranch];
    const allPositions = [...natalPositions, { branch: daiunBranch, index: 4 }];

    const fullResult = this._analyze(allBranches, allPositions, fortuneResult);

    // 大運地支が関与するもののみ抽出
    const daiunIndex = 4;
    const filtered = {
      liuhe: fullResult.liuhe.filter(item => item.positionIndices.includes(daiunIndex)),
      sanhe: fullResult.sanhe.filter(item => item.positionIndices.includes(daiunIndex)),
      banhe: fullResult.banhe.filter(item => item.positionIndices.includes(daiunIndex)),
      fanghe: fullResult.fanghe.filter(item => item.positionIndices.includes(daiunIndex)),
      liuchong: fullResult.liuchong.filter(item => item.positionIndices.includes(daiunIndex))
    };
    filtered.transformedElementMap = this.buildTransformedElementMap(filtered);
    return filtered;
  }

  /**
   * 地支リストと位置情報から全合冲を分析
   * @private
   */
  _analyze(branches, branchPositions, fortuneResult) {
    // 冲を先に検出（合化判定で冲の有無を参照するため）
    const liuchong = this._detectLiuchong(branchPositions);

    // 合の検出
    const liuhe = this._detectLiuhe(branchPositions, fortuneResult, branches, liuchong);
    const sanhe = this._detectSanhe(branchPositions, fortuneResult, branches, liuchong);
    const fanghe = this._detectFanghe(branchPositions);

    // 半合は三合が成立していない場合のみ
    const sanheUsedBranches = this._collectSanheUsedIndices(sanhe);
    const banhe = this._detectBanhe(branchPositions, sanheUsedBranches);

    return { liuhe, sanhe, banhe, fanghe, liuchong };
  }

  /**
   * fortuneResultから地支リストを抽出
   * @private
   */
  _extractBranches(fortuneResult) {
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
   * fortuneResultから地支位置情報を抽出
   * @private
   */
  _extractBranchPositions(fortuneResult) {
    const positions = [
      { branch: fortuneResult.yearPillar.branch, index: 0 },
      { branch: fortuneResult.monthPillar.branch, index: 1 },
      { branch: fortuneResult.dayPillar.branch, index: 2 }
    ];
    if (fortuneResult.hourPillar) {
      positions.push({ branch: fortuneResult.hourPillar.branch, index: 3 });
    }
    return positions;
  }

  /**
   * 六合（支合）を検出
   * @private
   */
  _detectLiuhe(branchPositions, fortuneResult, allBranches, liuchong) {
    const results = [];
    for (const pair of LIUHE_PAIRS) {
      const matches = this._findAllPairCombinations(branchPositions, pair.branches);
      for (const match of matches) {
        const transformation = this._checkLiuheTransformation(
          pair, allBranches, fortuneResult, match, liuchong
        );
        results.push({
          type: '支合',
          name: pair.name,
          branches: [match[0].branch, match[1].branch],
          positions: [POSITION_NAMES[match[0].index], POSITION_NAMES[match[1].index]],
          positionIndices: [match[0].index, match[1].index],
          resultElement: pair.resultElement,
          isTransformed: transformation.isTransformed,
          transformDetail: transformation.transformDetail
        });
      }
    }
    return results;
  }

  /**
   * 三合を検出
   * @private
   */
  _detectSanhe(branchPositions, fortuneResult, allBranches, liuchong) {
    const results = [];
    for (const trio of SANHE_TRIOS) {
      const matches = this._findTrioCombinations(branchPositions, trio.branches);
      for (const match of matches) {
        const transformation = this._checkSanheTransformation(
          trio, allBranches, fortuneResult, match, liuchong
        );
        results.push({
          type: '三合',
          name: trio.name,
          branches: match.map(m => m.branch),
          positions: match.map(m => POSITION_NAMES[m.index]),
          positionIndices: match.map(m => m.index),
          resultElement: trio.resultElement,
          isTransformed: transformation.isTransformed,
          transformDetail: transformation.transformDetail
        });
      }
    }
    return results;
  }

  /**
   * 半合を検出（三合成立済みの組合せは除外）
   * @private
   */
  _detectBanhe(branchPositions, sanheUsedIndices) {
    const results = [];
    for (const pair of BANHE_PAIRS) {
      const matches = this._findAllPairCombinations(branchPositions, pair.branches);
      for (const match of matches) {
        // 三合で既に使われているインデックスの組合せは除外
        const indices = [match[0].index, match[1].index];
        const isUsedBySanhe = sanheUsedIndices.some(usedSet =>
          indices.every(idx => usedSet.includes(idx))
        );
        if (isUsedBySanhe) continue;

        results.push({
          type: '半合',
          name: pair.name,
          branches: [match[0].branch, match[1].branch],
          positions: [POSITION_NAMES[match[0].index], POSITION_NAMES[match[1].index]],
          positionIndices: [match[0].index, match[1].index],
          resultElement: pair.resultElement
        });
      }
    }
    return results;
  }

  /**
   * 方合を検出
   * @private
   */
  _detectFanghe(branchPositions) {
    const results = [];
    for (const group of FANGHE_GROUPS) {
      const matches = this._findTrioCombinations(branchPositions, group.branches);
      for (const match of matches) {
        results.push({
          type: '方合',
          name: group.name,
          branches: match.map(m => m.branch),
          positions: match.map(m => POSITION_NAMES[m.index]),
          positionIndices: match.map(m => m.index),
          resultElement: group.resultElement,
          direction: group.direction,
          season: group.season
        });
      }
    }
    return results;
  }

  /**
   * 六冲を検出
   * @private
   */
  _detectLiuchong(branchPositions) {
    const results = [];
    for (const pair of LIUCHONG_PAIRS) {
      const matches = this._findAllPairCombinations(branchPositions, pair.branches);
      for (const match of matches) {
        const intensity = this._calcClashIntensity(match[0].index, match[1].index);
        results.push({
          type: '六冲',
          name: pair.name,
          branches: [match[0].branch, match[1].branch],
          positions: [POSITION_NAMES[match[0].index], POSITION_NAMES[match[1].index]],
          positionIndices: [match[0].index, match[1].index],
          intensity: intensity.intensity,
          intensityLevel: intensity.level
        });
      }
    }
    return results;
  }

  /**
   * 2地支のペア組合せを全て見つける
   * @private
   */
  _findAllPairCombinations(branchPositions, requiredBranches) {
    const [b1, b2] = requiredBranches;
    const group1 = branchPositions.filter(p => p.branch === b1);
    const group2 = branchPositions.filter(p => p.branch === b2);
    const results = [];
    for (const p1 of group1) {
      for (const p2 of group2) {
        if (p1.index !== p2.index) {
          results.push([p1, p2]);
        }
      }
    }
    return results;
  }

  /**
   * 3地支の組合せを全て見つける
   * @private
   */
  _findTrioCombinations(branchPositions, requiredBranches) {
    const [b1, b2, b3] = requiredBranches;
    const group1 = branchPositions.filter(p => p.branch === b1);
    const group2 = branchPositions.filter(p => p.branch === b2);
    const group3 = branchPositions.filter(p => p.branch === b3);
    const results = [];
    for (const p1 of group1) {
      for (const p2 of group2) {
        for (const p3 of group3) {
          if (p1.index !== p2.index && p1.index !== p3.index && p2.index !== p3.index) {
            results.push([p1, p2, p3]);
          }
        }
      }
    }
    return results;
  }

  /**
   * 三合で使われたインデックスセットを収集
   * @private
   */
  _collectSanheUsedIndices(sanheResults) {
    return sanheResults.map(s => s.positionIndices);
  }

  /**
   * 六合の合化判定（命理正宗の4条件）
   * @private
   */
  _checkLiuheTransformation(pair, allBranches, fortuneResult, match, liuchong) {
    const monthBranch = fortuneResult.monthPillar.branch;
    const monthElement = BRANCH_SEASON_ELEMENT[monthBranch];
    const resultElement = pair.resultElement;
    const stems = this._getAllStems(fortuneResult);

    // 条件1: 月令が変化先五行を支持（同五行 or 生じる）
    const monthSupports = (monthElement === resultElement) ||
      (GENERATE_CYCLE[monthElement] === resultElement);

    // 条件2: 構成地支が冲を受けていない
    const matchIndices = [match[0].index, match[1].index];
    const isClashed = liuchong.some(clash =>
      clash.positionIndices.some(idx => matchIndices.includes(idx))
    );

    // 条件3: 天干に化神（変化先五行の天干）が透出
    const hasChemicalAgent = stems.some(s =>
      STEM_ELEMENTS[s] === resultElement
    );

    // 条件4: 被化者に強い根がない（変化元の五行が天干に2つ以上透出していない）
    const originalElements = pair.branches.map(b => BRANCH_SEASON_ELEMENT[b]);
    const hasStrongOpposition = originalElements.some(origEl => {
      if (origEl === resultElement) return false;
      return stems.filter(s => STEM_ELEMENTS[s] === origEl).length >= 2;
    });

    if (monthSupports && !isClashed && hasChemicalAgent && !hasStrongOpposition) {
      return { isTransformed: true, transformDetail: '合化成功（月令支持、化神透出、冲なし）' };
    }

    const reasons = [];
    if (!monthSupports) reasons.push(`月令（${monthElement}）が${resultElement}を支持しない`);
    if (isClashed) reasons.push('冲を受けている');
    if (!hasChemicalAgent) reasons.push('天干に化神なし');
    if (hasStrongOpposition) reasons.push('被化者に根あり');
    return { isTransformed: false, transformDetail: `合而不化（${reasons.join('、')}）` };
  }

  /**
   * 三合の合化判定（六合と同様の4条件 + 帝旺未冲）
   * @private
   */
  _checkSanheTransformation(trio, allBranches, fortuneResult, match, liuchong) {
    const monthBranch = fortuneResult.monthPillar.branch;
    const monthElement = BRANCH_SEASON_ELEMENT[monthBranch];
    const resultElement = trio.resultElement;
    const stems = this._getAllStems(fortuneResult);

    // 条件1: 月令が変化先五行を支持
    const monthSupports = (monthElement === resultElement) ||
      (GENERATE_CYCLE[monthElement] === resultElement);

    // 条件2: 帝旺の地支が冲を受けていない
    const emperorPos = match.find(m => m.branch === trio.emperor);
    const emperorClashed = emperorPos && liuchong.some(clash =>
      clash.positionIndices.includes(emperorPos.index)
    );

    // 条件3: 天干に化神が透出
    const hasChemicalAgent = stems.some(s =>
      STEM_ELEMENTS[s] === resultElement
    );

    // 条件4: 被化者に強い根がない
    const originalElements = trio.branches.map(b => BRANCH_SEASON_ELEMENT[b]);
    const hasStrongOpposition = originalElements.some(origEl => {
      if (origEl === resultElement) return false;
      return stems.filter(s => STEM_ELEMENTS[s] === origEl).length >= 2;
    });

    if (monthSupports && !emperorClashed && hasChemicalAgent && !hasStrongOpposition) {
      return { isTransformed: true, transformDetail: '合化成功（月令支持、化神透出、帝旺未冲）' };
    }

    const reasons = [];
    if (!monthSupports) reasons.push(`月令（${monthElement}）が${resultElement}を支持しない`);
    if (emperorClashed) reasons.push('帝旺が冲を受けている');
    if (!hasChemicalAgent) reasons.push('天干に化神なし');
    if (hasStrongOpposition) reasons.push('被化者に根あり');
    return { isTransformed: false, transformDetail: `合而不化（${reasons.join('、')}）` };
  }

  /**
   * 冲の強度判定
   * @private
   */
  _calcClashIntensity(posIndex1, posIndex2) {
    const distance = Math.abs(posIndex1 - posIndex2);
    if (distance === 1) return { intensity: '紧贴相冲', level: 3 };
    if (distance === 2) return { intensity: '隔支相冲', level: 2 };
    return { intensity: '遥冲', level: 1 };
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
   * ある地支が指定された地支群から冲を受けているかチェック
   * @private
   */
  _isBranchClashedBy(branch, otherBranches) {
    const clashTarget = this._clashMap.get(branch);
    return clashTarget && otherBranches.includes(clashTarget);
  }

  /**
   * 合化成功した地支の positionIndex → 化後の五行 マッピングを構築する。
   *
   * 合化成功した地支は化後の五行として評価すべきである。
   * 優先順位: 方合 > 三合 > 六合（強い合が弱い合を上書き）
   *
   * @param {Object} gouChuuResult - analyzeNatalChart() または analyzeDaiunInteraction() の戻り値
   * @returns {Map<number, string>} positionIndex → 化後の五行
   */
  buildTransformedElementMap(gouChuuResult) {
    const map = new Map();
    if (!gouChuuResult) return map;

    // 六合（合化成功のみ）
    for (const item of gouChuuResult.liuhe) {
      if (!item.isTransformed) continue;
      for (const idx of item.positionIndices) {
        map.set(idx, item.resultElement);
      }
    }

    // 三合（合化成功のみ）— 六合を上書き
    for (const item of gouChuuResult.sanhe) {
      if (!item.isTransformed) continue;
      for (const idx of item.positionIndices) {
        map.set(idx, item.resultElement);
      }
    }

    // 方合（常に成立）— 最優先
    for (const item of gouChuuResult.fanghe) {
      for (const idx of item.positionIndices) {
        map.set(idx, item.resultElement);
      }
    }

    return map;
  }
}

export default GouChuuCalculator;
