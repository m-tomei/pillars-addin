/**
 * ByoyakuCalculator - 病薬判定クラス
 *
 * 命理正宗（張楠）の「雕枯旺弱四病説」「損益生長四薬説」に基づき、
 * 命式の病（不均衡）と薬（解決策）を診断する。
 *
 * 診断手順（第11章「病薬説の総合実践」）：
 *   1. 日干確認 — 身旺弱を把握する
 *   2. 月令特定 — 最も影響力のある五行を特定する
 *   3. 従重者論 — 命式全体で最も重い五行を「病」とみなす
 *   4. 四病分類 — 雕・枯・旺・弱 のいずれかに分類する
 *   5. 四薬処方 — 損・益・生・長 のいずれかで治療する
 */

import { STEM_ELEMENTS, BRANCH_ELEMENTS, YANG_STEMS } from '../utils/constants.js';
import { CalculationError } from '../utils/errors.js';

// 五行の相生関係: key が value を生じる
const GENERATE_CYCLE = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木'
};

// 五行の相剋関係: key が value を剋する
const CONTROL_CYCLE = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木'
};

// 五行リスト
const ELEMENTS = ['木', '火', '土', '金', '水'];

// 長養三方（R-01）。土は初版対象外
const CHOUYOU_BRANCHES = {
  木: ['寅', '卯', '辰'],
  火: ['巳', '午', '未'],
  金: ['申', '酉', '戌'],
  水: ['亥', '子', '丑'],
  土: []
};

const CONG_ZHONG_OU_RATIO = 0.40;

// 十神 → 用神五行を得るための関係マッピング
// 格局名から、その格局が「用いている」十神カテゴリを得る
const KAKKYOKU_YOUSHIN_MAP = {
  '正官格': 'officer',     // 官星
  '偏官格': 'officer',     // 官殺
  '正財格': 'wealth',      // 財星
  '偏財格': 'wealth',      // 財星
  '傷官格': 'output',      // 食傷
  '食神格': 'output',      // 食傷
  '印綬格': 'seal',        // 印星
  '偏印格': 'seal',        // 印星
  '建禄格': 'self',        // 比劫（身旺なので財官を求める）
  '陽刃格': 'self',        // 比劫（身旺なので官殺を求める）
};

// 雕の病の対義関係: 用神カテゴリ → 対立するカテゴリ
// 「官星のみで傷官なし」「財星のみで比劫なし」...
const OPPOSITION_MAP = {
  'officer': 'output',   // 官星 ↔ 食傷
  'wealth':  'self',     // 財星 ↔ 比劫
  'seal':    'wealth',   // 印綬 ↔ 財星
  'output':  'seal',     // 食傷 ↔ 印星
};

export class ByoyakuCalculator {
  /**
   * @param {Object} rules - kakkyoku_rules.json のデータ
   */
  constructor(rules) {
    if (!rules) {
      throw new CalculationError('格局ルールデータは必須です');
    }
    this.rules = rules;
  }

  /**
   * 病薬を診断する
   *
   * v2 正規API: diagnose({ kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult, kishouResult, keizenResult, gouChuuResult? })
   * 位置引数形式は移行用アダプタ（既存テスト互換）。新規コードでは object 形式を使う。
   *
   * @returns {Object} 病薬診断結果
   */
  diagnose(inputOrKakkyoku, strengthResult, fortuneResult, tsuuhenResult, gouChuuResult = null) {
    if (this._isDiagnoseV2Input(inputOrKakkyoku)) {
      return this._diagnoseV2(inputOrKakkyoku);
    }

    // 位置引数 → v2 アダプタ（kishou/keizen が無い場合はスタブ）
    return this._diagnoseV2({
      kakkyokuResult: inputOrKakkyoku,
      strengthResult,
      fortuneResult,
      tsuuhenResult,
      gouChuuResult,
      kishouResult: this._stubKishouResult(),
      keizenResult: this._stubKeizenResult(inputOrKakkyoku),
      _viaLegacyAdapter: true
    });
  }

  /**
   * @private
   */
  _isDiagnoseV2Input(value) {
    return Boolean(
      value &&
      typeof value === 'object' &&
      value.kakkyokuResult &&
      value.strengthResult &&
      value.fortuneResult
    );
  }

  /**
   * @private
   */
  _stubKishouResult() {
    return {
      temperature: '中和',
      humidity: '中',
      clarity: '不明',
      severity: 'mild',
      choukou: { direction: 'なし', primaryElements: [], secondary: [] },
      scores: {},
      summary: '（互換アダプタ: 気象未評価）',
      isExtreme: false,
      causeElements: [],
      deficientElements: []
    };
  }

  /**
   * @private
   */
  _stubKeizenResult(kakkyokuResult) {
    return {
      pillar: {
        kakkyoku: kakkyokuResult?.kakkyoku || null,
        youshinCategory: KAKKYOKU_YOUSHIN_MAP[kakkyokuResult?.kakkyoku] || null,
        youshinLabel: '',
        youshinElement: null,
        isEstablished: Boolean(kakkyokuResult?.isEstablished)
      },
      breaks: [],
      supports: [],
      summary: '（互換アダプタ: 継善未評価）'
    };
  }

  /**
   * v2 正規診断
   * @private
   */
  _diagnoseV2(input) {
    const {
      kakkyokuResult,
      strengthResult,
      fortuneResult,
      tsuuhenResult,
      gouChuuResult = null,
      kishouResult,
      keizenResult
    } = input;

    if (!kakkyokuResult || !strengthResult || !fortuneResult) {
      throw new CalculationError('病薬判定に必要なデータが不足しています');
    }
    if (!kishouResult) {
      throw new CalculationError('kishouResult は必須です');
    }
    if (!keizenResult) {
      throw new CalculationError('keizenResult は必須です');
    }

    const dayStem = fortuneResult.dayPillar.stem;
    const dayElement = STEM_ELEMENTS[dayStem];

    // 合化成功した地支の変換マップ
    const transformedMap = gouChuuResult?.transformedElementMap || null;

    // ── Step 1–2: 五行分布を計算（従重者論の基礎） ──
    const elementDist = this._calcElementDistribution(fortuneResult, transformedMap);

    // ── Step 3: 従重者論 — 最も重い五行を特定 ──
    const heaviestElement = this._findHeaviestElement(elementDist, dayElement);
    const total = ELEMENTS.reduce((s, el) => s + (elementDist[el] || 0), 0);
    const heaviestRatio = total > 0 ? (elementDist[heaviestElement] || 0) / total : 0;

    // ── 天干の通変星を収集 ──
    const tsuuhenList = this._collectTsuuhen(tsuuhenResult);

    // ── 用神カテゴリの特定（継善の主軸を優先） ──
    const youshinCategory = keizenResult.pillar?.youshinCategory
      || KAKKYOKU_YOUSHIN_MAP[kakkyokuResult.kakkyoku]
      || null;

    // ── Step 4: 四病分類 ──
    const fourDiseaseResult = this._classifyFourDisease(
      kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult,
      dayElement, elementDist, tsuuhenList, youshinCategory, transformedMap
    );

    // ── Step 5: 四薬処方 ──
    const fourMedicineResult = this._classifyFourMedicine(
      fourDiseaseResult, dayElement, elementDist, fortuneResult, youshinCategory
    );

    // ── 格局固有ルールで具体的病薬名を取得（複数マッチ） ──
    const specificDiagnoses = this._getSpecificDiagnosis(
      kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult,
      dayElement, tsuuhenList, transformedMap
    );

    // ── 重症度判定 ──
    const severity = this._assessSeverity(
      strengthResult, kakkyokuResult, fourDiseaseResult, elementDist, dayElement
    );

    const treatmentMode = fourMedicineResult.treatmentMode
      ?? (fourDiseaseResult.type === '雕' ? '琢' : null);
    const treatmentElements = fourMedicineResult.treatmentElements
      || (treatmentMode === '琢' && fourMedicineResult.element
        ? [fourMedicineResult.element]
        : []);

    // ── 各診断ごとに薬の五行・所在を計算 ──
    let diagnoses = specificDiagnoses.map(diag => {
      const diseaseElement = this._inferDiseaseElementFromTenGod(diag.diseaseTenGod, dayElement)
        ?? fourDiseaseResult.diseaseElement
        ?? null;
      const medicineElement = this._inferMedicineElement(diag.medicineTenGod, dayElement)
        || fourMedicineResult.element
        || treatmentElements[0]
        || null;
      const medicineLocation = this._findMedicineInChart(medicineElement, fortuneResult, transformedMap);
      return {
        role: 'primary',
        source: 'keizen',
        disease: {
          name: diag.diseaseName,
          element: diseaseElement,
          tenGod: diag.diseaseTenGod,
          severity
        },
        medicine: {
          name: diag.medicineName,
          element: medicineElement,
          tenGod: diag.medicineTenGod,
          exists: medicineLocation.exists,
          location: medicineLocation.location,
          choukouAligned: false
        },
        reason: diag.reason,
        fourDisease: fourDiseaseResult.type,
        fourMedicine: fourMedicineResult.type,
        treatmentMode
      };
    });

    // ── 調候 × 十神薬の突合（T-03d）──
    diagnoses = diagnoses.map(diag => this._reconcileWithChoukou(diag, kishouResult));

    // 気象が extreme かつ用神損傷が無いとき、気象診断を先頭へ
    if (kishouResult?.isExtreme && (keizenResult.breaks || []).length === 0) {
      diagnoses = [this._buildKishouDiagnosis(kishouResult), ...diagnoses];
    } else if (kishouResult?.isExtreme) {
      diagnoses = [...diagnoses, this._buildKishouDiagnosis(kishouResult)];
    }

    const balance = this._assessBalance(
      diagnoses, fortuneResult, dayElement, fourDiseaseResult, keizenResult, kishouResult
    );
    const kiki = this._buildKiki(diagnoses);

    // 代表診断: 用神損傷の primary を優先（表示先頭と分離）
    const representative = diagnoses.find(d => d.source === 'keizen' && d.role === 'primary')
      || diagnoses[0];
    const choukouAligned = Boolean(representative?.medicine?.choukouAligned);

    return {
      disease: representative.disease,
      medicine: representative.medicine,
      summary: representative.reason,
      fourDisease: fourDiseaseResult.type,
      fourMedicine: fourMedicineResult.type,
      fourDiseaseElement: fourDiseaseResult.diseaseElement ?? null,
      fourMedicineElement: fourMedicineResult.element ?? null,
      treatmentMode,
      treatmentElements,
      diagnoses,
      heaviestElement,
      heaviestRatio,
      balance,
      kiki,
      kishou: kishouResult,
      keizen: {
        pillar: keizenResult.pillar,
        breaks: keizenResult.breaks || [],
        summary: keizenResult.summary || ''
      },
      meta: {
        version: 'byoyaku-2.0',
        choukouAligned,
        viaLegacyAdapter: Boolean(input._viaLegacyAdapter)
      }
    };
  }

  // ═══════════════════════════════════════════════════════
  //  五行分布の計算
  // ═══════════════════════════════════════════════════════

  /**
   * 命式全体の五行分布を加重計算する（BYO-DD-02 / R-02）
   *
   * 年干・時干=1.0、月干=1.2、日干は除外。
   * 蔵干=主0.7/中0.5/余0.3、月支主気のみ×2.0（寄与1.4）。
   * 合化成功支は化後五行を主気相当で加算し、月支なら同じ×2.0。
   * @private
   */
  _calcElementDistribution(fortuneResult, transformedMap = null) {
    const dist = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
    const pillarSpecs = [
      { key: 'yearPillar', stemWeight: 1.0, monthMainBoost: 1.0 },
      { key: 'monthPillar', stemWeight: 1.2, monthMainBoost: 2.0 },
      { key: 'dayPillar', stemWeight: 0, monthMainBoost: 1.0 },
      { key: 'hourPillar', stemWeight: 1.0, monthMainBoost: 1.0 }
    ];

    for (let i = 0; i < pillarSpecs.length; i++) {
      const { key, stemWeight, monthMainBoost } = pillarSpecs[i];
      const pillar = fortuneResult[key];
      if (!pillar) continue;

      const stemEl = STEM_ELEMENTS[pillar.stem];
      if (stemEl && stemWeight > 0) dist[stemEl] += stemWeight;

      // 合化成功した地支は化後の五行を主気相当で計算
      if (transformedMap && transformedMap.has(i)) {
        dist[transformedMap.get(i)] += 0.7 * monthMainBoost;
        continue;
      }

      const hidden = pillar.hiddenStems || [];
      if (hidden.length > 0) {
        const weights = [0.7 * monthMainBoost, 0.5, 0.3];
        for (let j = 0; j < hidden.length; j++) {
          const el = STEM_ELEMENTS[hidden[j]];
          if (el) dist[el] += (weights[j] ?? 0.3);
        }
        continue;
      }

      // 蔵干省略時は地支本気を主気として扱う
      const branchEl = BRANCH_ELEMENTS[pillar.branch];
      if (branchEl) dist[branchEl] += 0.7 * monthMainBoost;
    }
    return dist;
  }

  /**
   * 従重者論: 最も重い五行を特定する
   * @private
   */
  _findHeaviestElement(elementDist, dayElement) {
    let maxEl = null;
    let maxVal = -1;
    for (const el of ELEMENTS) {
      if (elementDist[el] > maxVal) {
        maxVal = elementDist[el];
        maxEl = el;
      }
    }
    return maxEl;
  }

  // ═══════════════════════════════════════════════════════
  //  四病の分類（雕・枯・旺・弱）
  // ═══════════════════════════════════════════════════════

  /**
   * 四病の分類
   *
   * 判定優先順位（R-01 / BYO-DD-05）:
   *   1. 特殊格局 → 旺/弱
   *   2. 旺（從重比率 ≥ 40%）
   *   3. 雕
   *   4. 枯
   *   5. 旺（身旺スコア）
   *   6. 弱（デフォルト）
   *
   * @private
   */
  _classifyFourDisease(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult,
                        dayElement, elementDist, tsuuhenList, youshinCategory, transformedMap = null) {

    // 五行一気格・従格は旺/弱で判定
    if (kakkyokuResult.category === 'special_element' || kakkyokuResult.category === 'following') {
      return this._classifySpecialKakkyoku(strengthResult, dayElement, elementDist);
    }

    // ── 2. 從重40%は雕より先に旺 ──
    const ouByRatio = this._checkOuByRatio(elementDist);
    if (ouByRatio) return ouByRatio;

    // ── 3. 雕チェック ──
    const choResult = this._checkCho(
      youshinCategory, tsuuhenList, dayElement, elementDist, fortuneResult, transformedMap
    );
    if (choResult) return choResult;

    // ── 4. 枯チェック ──
    const koResult = this._checkKo(
      youshinCategory, dayElement, elementDist, fortuneResult, transformedMap
    );
    if (koResult) return koResult;

    // ── 5. 身旺スコアによる旺 ──
    const ouByStrength = this._checkOuByStrength(dayElement, strengthResult);
    if (ouByStrength) return ouByStrength;

    // ── 6. 弱（デフォルト） ──
    return this._classifyJaku(dayElement, elementDist, strengthResult, youshinCategory);
  }

  /**
   * 雕（未彫琢）のチェック
   *
   * 「官星のみで傷官なし」「財星のみで比劫なし」
   * 「印綬のみで財なし」「食傷のみで印なし」
   * → 純然無雑＝磨かれていない玉
   *
   * @private
   */
  _checkCho(youshinCategory, tsuuhenList, dayElement, elementDist, fortuneResult, transformedMap = null) {
    if (!youshinCategory || youshinCategory === 'self') return null;

    const oppositionCategory = OPPOSITION_MAP[youshinCategory];
    if (!oppositionCategory) return null;

    // 用神カテゴリの十神が命式に存在するか
    const hasYoushin = this._hasTenGodCategory(youshinCategory, tsuuhenList);
    if (!hasYoushin) return null;

    // 対立カテゴリの十神が命式に存在するか
    const hasOpposition = this._hasTenGodCategory(oppositionCategory, tsuuhenList);

    // 蔵干にも対立五行がないかチェック（合化成功した地支は化後の五行で判定）
    const oppositionElement = this._getCategoryElement(oppositionCategory, dayElement);
    const hasOppositionInHidden = this._hasElementInHiddenStems(oppositionElement, fortuneResult, transformedMap);

    if (!hasOpposition && !hasOppositionInHidden) {
      // 雕: 害神五行は存在しない（fourDiseaseElement=null）。磨く側は treatmentElements
      return {
        type: '雕',
        diseaseElement: null,
        treatmentElements: oppositionElement ? [oppositionElement] : [],
        description: this._getChoDescription(youshinCategory),
        heaviestElement: null
      };
    }

    return null;
  }

  /**
   * 枯（枯渇）のチェック
   *
   * 用神が弱い（天干に透出していない or 分布が少ない）が、
   * 蔵干に根がある → 行運で復活可能
   *
   * @private
   */
  _checkKo(youshinCategory, dayElement, elementDist, fortuneResult, transformedMap = null) {
    if (!youshinCategory || youshinCategory === 'self') return null;

    const youshinElement = this._getCategoryElement(youshinCategory, dayElement);
    if (!youshinElement) return null;

    // 用神の五行が天干にない（弱い）
    const stemsWithoutDay = [
      fortuneResult.yearPillar.stem,
      fortuneResult.monthPillar.stem,
      fortuneResult.hourPillar ? fortuneResult.hourPillar.stem : null
    ].filter(s => s);

    const hasYoushinInStems = stemsWithoutDay.some(s => STEM_ELEMENTS[s] === youshinElement);

    // 用神の五行が全体的に弱い（分布スコアが1.5未満）
    const isWeak = elementDist[youshinElement] < 1.5;

    if (isWeak && !hasYoushinInStems) {
      // 蔵干に根があるか？（合化成功した地支は化後の五行で判定）
      const hasRoot = this._hasElementInHiddenStems(youshinElement, fortuneResult, transformedMap);

      if (hasRoot) {
        // 枯の病: 弱いが根がある → 復活可能
        return {
          type: '枯',
          diseaseElement: youshinElement,
          description: `${youshinElement}（用神）が枯渇しているが根あり`,
          heaviestElement: null
        };
      }
    }

    return null;
  }

  /**
   * 從重比率による旺（≥40%）
   * @private
   */
  _checkOuByRatio(elementDist) {
    const total = Object.values(elementDist).reduce((a, b) => a + b, 0);
    if (total === 0) return null;

    let maxEl = null;
    let maxRatio = 0;
    for (const el of ELEMENTS) {
      const ratio = elementDist[el] / total;
      if (ratio > maxRatio) {
        maxRatio = ratio;
        maxEl = el;
      }
    }

    if (maxRatio >= CONG_ZHONG_OU_RATIO) {
      return {
        type: '旺',
        diseaseElement: maxEl,
        description: `${maxEl}が命式の${Math.round(maxRatio * 100)}%を占め過旺`,
        heaviestElement: maxEl
      };
    }
    return null;
  }

  /**
   * 身旺スコアによる旺
   * @private
   */
  _checkOuByStrength(dayElement, strengthResult) {
    if (strengthResult.strength === 'strong' && strengthResult.score >= 4) {
      return {
        type: '旺',
        diseaseElement: dayElement,
        description: '日主が極めて旺盛',
        heaviestElement: dayElement
      };
    }
    return null;
  }

  /**
   * 弱（虚弱）の分類（旺でも雕でも枯でもない場合のデフォルト）
   * @private
   */
  _classifyJaku(dayElement, elementDist, strengthResult, youshinCategory) {
    // 何が弱いかを判定
    let weakElement = dayElement;
    let description = '日主が弱い';

    if (strengthResult.strength === 'weak') {
      weakElement = dayElement;
      description = '日主が弱い';
    } else if (youshinCategory) {
      // 用神の五行が弱い可能性
      const youshinEl = this._getCategoryElement(youshinCategory, dayElement);
      if (youshinEl && elementDist[youshinEl] < elementDist[dayElement]) {
        weakElement = youshinEl;
        description = `${youshinEl}（用神）が弱い`;
      }
    }

    return {
      type: '弱',
      diseaseElement: weakElement,
      description,
      heaviestElement: null
    };
  }

  /**
   * 五行一気格・従格用の四病分類
   * @private
   */
  _classifySpecialKakkyoku(strengthResult, dayElement, elementDist) {
    if (strengthResult.strength === 'strong' || strengthResult.score >= 3) {
      return {
        type: '旺',
        diseaseElement: dayElement,
        description: '専旺格・日主の五行が極めて旺盛',
        heaviestElement: dayElement
      };
    }
    return {
      type: '弱',
      diseaseElement: dayElement,
      description: '従格・日主が無根で弱い',
      heaviestElement: null
    };
  }

  // ═══════════════════════════════════════════════════════
  //  四薬の処方（損・益・生・長）
  // ═══════════════════════════════════════════════════════

  /**
   * 四薬を処方する（R-01 v1.1）
   *
   * - 旺＋長養 → 長（克）。それ以外の旺 → 損
   * - 弱 → 益
   * - 枯 → 生（滋養）
   * - 雕 → fourMedicine=null、treatmentMode=琢
   *
   * @private
   */
  _classifyFourMedicine(fourDiseaseResult, dayElement, elementDist, fortuneResult, youshinCategory) {
    const diseaseType = fourDiseaseResult.type;
    const diseaseElement = fourDiseaseResult.diseaseElement;
    const monthBranch = fortuneResult?.monthPillar?.branch || null;

    switch (diseaseType) {
      case '旺': {
        const controllingEl = this._getElementThatControls(diseaseElement);
        const stage = this._resolveElementStage(diseaseElement, monthBranch);
        if (stage === '長養') {
          return { type: '長', element: controllingEl, stage };
        }
        return { type: '損', element: controllingEl, stage };
      }

      case '弱': {
        if (diseaseElement === dayElement) {
          const generatingEl = this._getElementThatGenerates(dayElement);
          return { type: '益', element: generatingEl };
        }
        const generatingEl = this._getElementThatGenerates(diseaseElement);
        return { type: '益', element: generatingEl || diseaseElement };
      }

      case '枯': {
        const generatingEl = this._getElementThatGenerates(diseaseElement);
        return { type: '生', element: generatingEl };
      }

      case '雕': {
        const oppositionCategory = youshinCategory ? OPPOSITION_MAP[youshinCategory] : null;
        const oppositionEl = oppositionCategory
          ? this._getCategoryElement(oppositionCategory, dayElement)
          : null;
        const treatmentElements = fourDiseaseResult.treatmentElements?.length
          ? fourDiseaseResult.treatmentElements
          : (oppositionEl ? [oppositionEl] : []);
        return {
          type: null,
          element: null,
          treatmentMode: '琢',
          treatmentElements
        };
      }

      default:
        return { type: '益', element: this._getElementThatGenerates(dayElement) };
    }
  }

  /**
   * 対象五行の勢い段階（長養 / その他）。土は初版対象外。
   * @private
   */
  _resolveElementStage(element, monthBranch) {
    if (!element || !monthBranch || element === '土') return 'その他';
    const branches = CHOUYOU_BRANCHES[element] || [];
    if (branches.includes(monthBranch)) return '長養';
    return 'その他';
  }

  // ═══════════════════════════════════════════════════════
  //  格局固有ルールによる具体的な病薬名の取得
  // ═══════════════════════════════════════════════════════

  /**
   * kakkyoku_rules.json から具体的な病名・薬名を取得（複数マッチ対応）
   * @private
   * @returns {Array<Object>} マッチした病薬の配列
   */
  _getSpecificDiagnosis(kakkyokuResult, strengthResult, fortuneResult, tsuuhenResult,
                         dayElement, tsuuhenList, transformedMap = null) {
    const kakkyokuName = kakkyokuResult.kakkyoku;
    const strengthKey = strengthResult.strength === 'weak' ? 'weak' : 'strong';

    const kakkyokuRule = this.rules[kakkyokuName];
    if (!kakkyokuRule || !kakkyokuRule[strengthKey]) {
      const fb = this._createFallbackDiagnosis(strengthResult, dayElement);
      return [fb];
    }

    const strengthRule = kakkyokuRule[strengthKey];

    // condition判定で合致する病をすべて収集（合化成功した地支は化後の五行で判定）
    const conditions = this._evaluateConditions(fortuneResult, tsuuhenResult, dayElement, tsuuhenList, transformedMap);
    const allMatched = [];

    for (const rule of strengthRule.diseases) {
      if (conditions[rule.condition]) {
        allMatched.push(rule);
      }
    }

    if (allMatched.length === 0) {
      allMatched.push(strengthRule.defaultDisease);
    }

    return allMatched.map(matched => {
      const diseaseTenGod = this._inferDiseaseTenGod(matched.disease, dayElement);
      const medicineTenGod = this._inferMedicineTenGod(matched.medicine, dayElement);
      return {
        diseaseName: matched.disease,
        medicineName: matched.medicine,
        reason: matched.reason,
        diseaseTenGod,
        medicineTenGod
      };
    });
  }

  /**
   * ルールにない場合のフォールバック
   * @private
   */
  _createFallbackDiagnosis(strengthResult, dayElement) {
    const isStrong = strengthResult.strength !== 'weak';
    return {
      diseaseName: isStrong ? '身旺無依' : '身弱',
      medicineName: isStrong ? '財官' : '印星扶身',
      reason: isStrong
        ? '身が旺じて用神がない。財官運で用神を得る。'
        : '身が弱い。印星で日主を助けるのが薬となる。',
      diseaseTenGod: isStrong ? '比肩' : null,
      medicineTenGod: isStrong ? '正官' : '正印'
    };
  }

  // ═══════════════════════════════════════════════════════
  //  condition判定
  // ═══════════════════════════════════════════════════════

  /**
   * 各conditionの成否を判定
   * @private
   */
  _evaluateConditions(fortuneResult, tsuuhenResult, dayElement, tsuuhenList, transformedMap = null) {
    const conditions = {};

    // 蔵干の五行を全収集（合化成功した地支は化後の五行を使用）
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

    const officerElement = this._getElementThatControls(dayElement);
    // ↑ これは日干を剋する五行ではなく剋される方向... 修正が必要
    // 官殺 = 日干を剋する五行 = CONTROL_CYCLE のキーで、value === dayElement となるもの
    const officerEl = this._getControllingElement(dayElement);

    // 比劫多
    const bijouCount = tsuuhenList.filter(t => t === '比肩' || t === '劫財').length;
    const sameElInHidden = allHiddenElements.filter(e => e === dayElement).length;
    conditions['比劫多'] = bijouCount >= 2 || sameElInHidden >= 3;

    // 官殺多
    const officerStemCount = tsuuhenList.filter(t => t === '正官' || t === '偏官').length;
    const officerHiddenCount = allHiddenElements.filter(e => e === officerEl).length;
    conditions['官殺多'] = officerStemCount >= 2 || officerHiddenCount >= 3;

    // 印多
    const sealCount = tsuuhenList.filter(t => t === '正印' || t === '偏印').length;
    conditions['印多'] = sealCount >= 2;

    // 傷官透出
    conditions['傷官透出'] = tsuuhenList.includes('傷官');

    // 食神透出
    conditions['食神透出'] = tsuuhenList.includes('食神');

    // 財多
    const wealthCount = tsuuhenList.filter(t => t === '正財' || t === '偏財').length;
    conditions['財多'] = wealthCount >= 2;

    return conditions;
  }

  // ═══════════════════════════════════════════════════════
  //  ヘルパーメソッド
  // ═══════════════════════════════════════════════════════

  /** 天干の通変星リストを収集 */
  _collectTsuuhen(tsuuhenResult) {
    const list = [];
    if (tsuuhenResult.year) list.push(tsuuhenResult.year.tsuuhen);
    if (tsuuhenResult.month) list.push(tsuuhenResult.month.tsuuhen);
    if (tsuuhenResult.hour) list.push(tsuuhenResult.hour.tsuuhen);
    return list;
  }

  /** 日干を剋する五行を取得 (官殺の五行) */
  _getControllingElement(dayElement) {
    for (const [key, value] of Object.entries(CONTROL_CYCLE)) {
      if (value === dayElement) return key;
    }
    return null;
  }

  /** 日干を生じる五行を取得 (印星の五行) */
  _getGeneratingElement(dayElement) {
    for (const [key, value] of Object.entries(GENERATE_CYCLE)) {
      if (value === dayElement) return key;
    }
    return null;
  }

  /** targetElement を剋する五行 (= 損の薬) */
  _getElementThatControls(targetElement) {
    for (const [key, value] of Object.entries(CONTROL_CYCLE)) {
      if (value === targetElement) return key;
    }
    return null;
  }

  /** targetElement を生じる五行 (= 益/生の薬) */
  _getElementThatGenerates(targetElement) {
    for (const [key, value] of Object.entries(GENERATE_CYCLE)) {
      if (value === targetElement) return key;
    }
    return null;
  }

  /** 十神カテゴリが天干の通変星リストに存在するか */
  _hasTenGodCategory(category, tsuuhenList) {
    const map = {
      'officer': ['正官', '偏官'],
      'wealth':  ['正財', '偏財'],
      'output':  ['食神', '傷官'],
      'seal':    ['正印', '偏印'],
      'self':    ['比肩', '劫財']
    };
    const targets = map[category] || [];
    return tsuuhenList.some(t => targets.includes(t));
  }

  /** 十神カテゴリに対応する五行を取得（日干基準） */
  _getCategoryElement(category, dayElement) {
    switch (category) {
      case 'self':    return dayElement;
      case 'output':  return GENERATE_CYCLE[dayElement];          // 食傷 = 日干が生む
      case 'wealth':  return CONTROL_CYCLE[dayElement];           // 財 = 日干が剋す
      case 'officer': return this._getControllingElement(dayElement); // 官殺 = 日干を剋す
      case 'seal':    return this._getGeneratingElement(dayElement);  // 印 = 日干を生む
      default: return null;
    }
  }

  /** 蔵干に指定五行が含まれるか */
  _hasElementInHiddenStems(element, fortuneResult, transformedMap = null) {
    if (!element) return false;
    const pillars = [
      fortuneResult.yearPillar, fortuneResult.monthPillar,
      fortuneResult.dayPillar, fortuneResult.hourPillar
    ];
    for (let i = 0; i < pillars.length; i++) {
      const p = pillars[i];
      if (!p) continue;

      // 合化成功した地支は化後の五行で判定
      if (transformedMap && transformedMap.has(i)) {
        if (transformedMap.get(i) === element) return true;
        continue;
      }

      for (const hs of (p.hiddenStems || [])) {
        if (STEM_ELEMENTS[hs] === element) return true;
      }
    }
    return false;
  }

  /** 雕の説明テキスト */
  _getChoDescription(youshinCategory) {
    const descriptions = {
      'officer': '官星のみで傷官なし。官の価値を試す機会がない（未彫琢の玉）',
      'wealth':  '財星のみで比劫なし。財を守る意識が甘い（未彫琢の玉）',
      'seal':    '印綬のみで財星なし。学問に頼りすぎ実務に弱い（未彫琢の玉）',
      'output':  '食傷のみで印星なし。表現力はあるが深みがない（未彫琢の玉）',
    };
    return descriptions[youshinCategory] || '対立要素を欠き磨かれていない（未彫琢の玉）';
  }

  /** 命式中に薬の五行が存在するかチェック */
  _findMedicineInChart(medicineElement, fortuneResult, transformedMap = null) {
    if (!medicineElement) return { exists: false, location: null };

    // 天干チェック
    const positions = [
      { pillar: fortuneResult.yearPillar, name: '年干' },
      { pillar: fortuneResult.monthPillar, name: '月干' },
      { pillar: fortuneResult.hourPillar, name: '時干' }
    ];
    for (const { pillar, name } of positions) {
      if (pillar && STEM_ELEMENTS[pillar.stem] === medicineElement) {
        return { exists: true, location: name };
      }
    }

    // 蔵干チェック（合化成功した地支は化後の五行で判定）
    const pillarNames = ['年支', '月支', '日支', '時支'];
    const allPillars = [
      fortuneResult.yearPillar, fortuneResult.monthPillar,
      fortuneResult.dayPillar, fortuneResult.hourPillar
    ];
    for (let i = 0; i < allPillars.length; i++) {
      const p = allPillars[i];
      if (!p) continue;

      if (transformedMap && transformedMap.has(i)) {
        if (transformedMap.get(i) === medicineElement) {
          return { exists: true, location: `${pillarNames[i]}蔵干` };
        }
        continue;
      }

      for (const hs of (p.hiddenStems || [])) {
        if (STEM_ELEMENTS[hs] === medicineElement) {
          return { exists: true, location: `${pillarNames[i]}蔵干` };
        }
      }
    }

    return { exists: false, location: null };
  }

  /** 重症度を判定 */
  _assessSeverity(strengthResult, kakkyokuResult, fourDiseaseResult, elementDist, dayElement) {
    if (!kakkyokuResult.isEstablished) return 'severe';

    const score = strengthResult.score;

    // 旺の病で五行比率が高い → 重症
    if (fourDiseaseResult.type === '旺') {
      const total = Object.values(elementDist).reduce((a, b) => a + b, 0);
      const ratio = elementDist[fourDiseaseResult.diseaseElement] / total;
      if (ratio >= 0.50) return 'severe';
      if (ratio >= 0.40) return 'moderate';
      return 'mild';
    }

    // 弱の病
    if (fourDiseaseResult.type === '弱') {
      if (score <= -2) return 'severe';
      if (score <= 0) return 'moderate';
      return 'mild';
    }

    // 枯 → 根があるので moderate
    if (fourDiseaseResult.type === '枯') return 'moderate';

    // 雕 → mild（潜在的な問題）
    if (fourDiseaseResult.type === '雕') return 'mild';

    return 'moderate';
  }

  /** 病名から十神を推定 */
  _inferDiseaseTenGod(diseaseName, dayElement) {
    if (diseaseName.includes('比劫'))   return '比肩';
    if (diseaseName.includes('官殺') || diseaseName.includes('殺重') || diseaseName.includes('殺旺'))
      return '偏官';
    if (diseaseName.includes('官旺') || diseaseName.includes('官軽'))
      return '正官';
    if (diseaseName.includes('傷官'))   return '傷官';
    if (diseaseName.includes('食神'))   return '食神';
    if (diseaseName.includes('財'))     return '偏財';
    if (diseaseName.includes('印') || diseaseName.includes('梟'))
      return '偏印';
    if (diseaseName.includes('身旺'))   return '比肩';
    return null;
  }

  /** 薬名から十神を推定 */
  _inferMedicineTenGod(medicineName, dayElement) {
    if (medicineName.includes('財星') || medicineName.includes('財'))  return '正財';
    if (medicineName.includes('印星') || medicineName.includes('印'))  return '正印';
    if (medicineName.includes('官殺') || medicineName.includes('官'))  return '正官';
    if (medicineName.includes('食神'))  return '食神';
    if (medicineName.includes('食傷'))  return '食神';
    if (medicineName.includes('比劫'))  return '比肩';
    return null;
  }

  /** 薬の十神から五行を逆算する */
  _inferMedicineElement(medicineTenGod, dayElement) {
    if (!medicineTenGod) return null;
    switch (medicineTenGod) {
      case '比肩':
      case '劫財':
        return dayElement;
      case '食神':
      case '傷官':
        return GENERATE_CYCLE[dayElement];
      case '正財':
      case '偏財':
        return CONTROL_CYCLE[dayElement];
      case '正官':
      case '偏官':
        return this._getControllingElement(dayElement);
      case '正印':
      case '偏印':
        return this._getGeneratingElement(dayElement);
      default:
        return null;
    }
  }

  /** 病の十神から五行を逆算する */
  _inferDiseaseElementFromTenGod(diseaseTenGod, dayElement) {
    return this._inferMedicineElement(diseaseTenGod, dayElement);
  }

  /**
   * 十神薬と調候の突合（T-03d）
   * @private
   */
  _reconcileWithChoukou(diag, kishouResult) {
    const choukou = kishouResult?.choukou;
    if (!choukou || choukou.direction === 'なし') {
      return diag;
    }

    const choukouEls = choukou.primaryElements || [];
    const medEl = diag.medicine?.element;
    const aligned = Boolean(medEl && choukouEls.includes(medEl));

    const next = {
      ...diag,
      medicine: {
        ...diag.medicine,
        choukouAligned: aligned
      }
    };

    if (!aligned && choukouEls.length > 0) {
      next.medicineSecondary = {
        name: `調候（${choukou.direction}）`,
        element: choukouEls[0],
        elements: choukouEls,
        tenGod: null,
        exists: false,
        location: null,
        choukouAligned: true
      };
      next.reason = `${diag.reason}（主軸の薬と調候を併記）`;
    } else if (aligned) {
      next.reason = `${diag.reason}（格局薬と調候が一致）`;
    }

    return next;
  }

  /**
   * 気象診断アイテムを生成
   * @private
   */
  _buildKishouDiagnosis(kishouResult) {
    const direction = kishouResult.choukou?.direction || 'なし';
    const elements = kishouResult.choukou?.primaryElements || [];
    return {
      role: 'secondary',
      source: 'kishou',
      disease: {
        name: `気象偏枯（${kishouResult.temperature}/${kishouResult.humidity}）`,
        element: null,
        causeElements: kishouResult.causeElements || [],
        deficientElements: kishouResult.deficientElements || elements,
        tenGod: null,
        severity: kishouResult.severity || 'moderate'
      },
      medicine: {
        name: `調候（${direction}）`,
        element: elements[0] || null,
        elements,
        tenGod: null,
        exists: false,
        location: null,
        choukouAligned: true
      },
      reason: kishouResult.summary || '気象の偏りを調候で整える',
      fourDisease: null,
      fourMedicine: null,
      treatmentMode: null
    };
  }

  /**
   * 病薬バランス（0-3）
   * @private
   */
  _assessBalance(diagnoses, fortuneResult, dayElement, fourDiseaseResult, keizenResult, kishouResult) {
    const primary = diagnoses.find(d => d.source === 'keizen') || diagnoses[0];
    if (!primary) {
      return {
        label: '病なし薬なし',
        diseaseScore: 0,
        medicineScore: 0,
        reading: '目立った病薬なし'
      };
    }

    const noBreaks = (keizenResult?.breaks || []).length === 0;
    const mildKishou = !kishouResult?.isExtreme;
    if (
      (fourDiseaseResult.type === '雕' || noBreaks) &&
      mildKishou &&
      fourDiseaseResult.type !== '旺' &&
      fourDiseaseResult.type !== '弱' &&
      fourDiseaseResult.type !== '枯'
    ) {
      // 雕のみ・気象も穏やか → 病なし寄り
      if (fourDiseaseResult.type === '雕' && noBreaks) {
        return {
          label: '病なし薬なし',
          diseaseScore: 0,
          medicineScore: 0,
          reading: '用神は純だが、当面の破は軽い'
        };
      }
    }

    let diseaseScore = 0;
    const sev = primary.disease?.severity;
    if (sev === 'severe') diseaseScore += 2;
    else if (sev === 'moderate') diseaseScore += 1;

    const diseaseEl = primary.disease?.element;
    const monthBranchEl = BRANCH_ELEMENTS[fortuneResult.monthPillar?.branch];
    if (diseaseEl && diseaseEl === monthBranchEl) diseaseScore += 1;

    const stems = [
      fortuneResult.yearPillar?.stem,
      fortuneResult.monthPillar?.stem,
      fortuneResult.hourPillar?.stem
    ].filter(Boolean);
    if (diseaseEl) {
      const stemHits = stems.filter(s => STEM_ELEMENTS[s] === diseaseEl).length;
      if (stemHits >= 2) diseaseScore += 1;
      if (this._hasElementInHiddenStems(diseaseEl, fortuneResult)) diseaseScore += 1;
    }
    diseaseScore = Math.min(3, diseaseScore);

    let medicineScore = 0;
    const med = primary.medicine || {};
    if (med.exists && med.location && String(med.location).includes('干')) medicineScore += 2;
    else if (med.exists) medicineScore += 1;
    if (med.element && med.element === monthBranchEl) medicineScore += 1;
    if (med.choukouAligned) medicineScore += 1;
    medicineScore = Math.min(3, medicineScore);

    let label;
    if (diseaseScore >= 2 && medicineScore >= 2) label = '病重薬重';
    else if (diseaseScore >= 2 && medicineScore <= 1) label = '病重薬軽';
    else if (diseaseScore <= 1 && medicineScore >= 2) label = '病軽薬重';
    else label = '病軽薬軽';

    return {
      label,
      diseaseScore,
      medicineScore,
      reading: `病力${diseaseScore}/薬力${medicineScore}（${label}）`
    };
  }

  /**
   * 喜忌ラベル
   * @private
   */
  _buildKiki(diagnoses) {
    const ki = [];
    const ji = [];
    const seenKi = new Set();
    const seenJi = new Set();

    for (const diag of diagnoses) {
      if (diag.medicine?.element || diag.medicine?.tenGod) {
        const key = `${diag.medicine.tenGod || ''}:${diag.medicine.element || ''}`;
        if (!seenKi.has(key)) {
          seenKi.add(key);
          ki.push({
            label: diag.medicine.name,
            element: diag.medicine.element || undefined,
            tenGod: diag.medicine.tenGod || undefined
          });
        }
      }
      if (diag.medicineSecondary?.elements) {
        for (const el of diag.medicineSecondary.elements) {
          const key = `choukou:${el}`;
          if (!seenKi.has(key)) {
            seenKi.add(key);
            ki.push({ label: diag.medicineSecondary.name, element: el });
          }
        }
      }
      if (diag.disease?.element || diag.disease?.tenGod) {
        const key = `${diag.disease.tenGod || ''}:${diag.disease.element || ''}`;
        if (!seenJi.has(key)) {
          seenJi.add(key);
          ji.push({
            label: diag.disease.name,
            element: diag.disease.element || undefined,
            tenGod: diag.disease.tenGod || undefined
          });
        }
      }
    }

    return {
      ki,
      ji,
      note: '薬側を喜、病側を忌とする（役割ラベル）'
    };
  }
}

export default ByoyakuCalculator;
