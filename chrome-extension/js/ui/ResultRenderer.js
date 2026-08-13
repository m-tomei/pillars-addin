/**
 * 結果描画クラス
 */
import { DateUtils } from "../utils/dateUtils.js";
import { SHI_MODE, SHI_MODE_LABEL } from "../utils/constants.js";

function pad2(value) {
  return String(value).padStart(2, "0");
}

export class ResultRenderer {
  constructor(doc = typeof document !== "undefined" ? document : null) {
    this.document = doc;
    this.elements = {};
    if (this.document) {
      this.bindElements();
    }
  }

  bindElements() {
    const doc = this.document;
    this.elements.resultSection = doc.getElementById("result-section");
    this.elements.fortuneResult = doc.getElementById("fortune-result");
    this.elements.greatFortuneResult = doc.getElementById("great-fortune-result");
    this.elements.savePngBtn = doc.getElementById("save-png-btn");
    this.elements.timeCorrectionSummary = doc.getElementById("time-correction-summary");
  }

  /**
   * 結果を表示してセクションを表示状態にする
   * @param {object} fortune
   * @param {object} juuniunResults
   * @param {object} tsuuhenResults
   * @param {Array} greatFortuneCycles
   * @param {number} displayYear 補正適用時は t_corrected.year
   * @param {{correction?: object, shiMode?: string}} [meta]
   */
  showResults(fortune, juuniunResults, tsuuhenResults, greatFortuneCycles, displayYear, meta = {}) {
    this.displayYear = displayYear;
    this.meta = meta;
    this.renderCorrectionSummary(meta.correction, meta.shiMode);
    this.renderFortuneTable(fortune, juuniunResults, tsuuhenResults);
    this.renderGreatFortune(greatFortuneCycles, displayYear);
    if (this.elements.resultSection) {
      this.elements.resultSection.style.display = "block";
    }
  }

  /**
   * 結果をクリアして非表示にする
   */
  clear() {
    if (this.elements.fortuneResult) {
      this.elements.fortuneResult.innerHTML = "";
    }
    if (this.elements.greatFortuneResult) {
      this.elements.greatFortuneResult.innerHTML = "";
    }
    this.clearCorrectionSummary();
    if (this.elements.resultSection) {
      this.elements.resultSection.style.display = "none";
    }
  }

  clearCorrectionSummary() {
    const el = this.elements.timeCorrectionSummary;
    if (!el) {
      return;
    }
    el.innerHTML = "";
    el.style.display = "none";
  }

  /**
   * 時刻補正サマリ（命式テーブル直前 / PNGキャプチャ対象）
   */
  renderCorrectionSummary(correction, shiMode) {
    const el = this.elements.timeCorrectionSummary;
    if (!el) {
      return;
    }

    if (!correction || correction.applied === false) {
      el.innerHTML = "<p>時刻補正: 時刻未入力のため補正・時柱なし</p>";
      el.style.display = "block";
      return;
    }

    const display = correction.display || {};
    const shiLabel = SHI_MODE_LABEL[shiMode] || shiMode || "";
    const note = this._dayPillarNote(correction, shiMode);

    el.innerHTML = `
      <h3>時刻補正</h3>
      <p>時刻補正: ${display.statusText || "適用"}</p>
      <ul>
        <li>入力時刻: ${display.inputText || ""}</li>
        <li>時差: ${display.offsetText || ""}</li>
        <li>地方平均時補正: ${display.longitudeText || ""}</li>
        <li>補正後時刻: ${display.correctedText || ""}</li>
        <li>子時モード: ${shiLabel}</li>
      </ul>
      ${note}
    `;
    el.style.display = "block";
  }

  _dayPillarNote(correction, shiMode) {
    if (shiMode !== SHI_MODE.SWITCH_23) {
      return "";
    }
    const corrected = correction.corrected;
    if (!corrected || corrected.hour !== 23) {
      return "";
    }
    const next = DateUtils.addDays(corrected.year, corrected.month, corrected.day, 1);
    const ymd = `${next.year}-${pad2(next.month)}-${pad2(next.day)}`;
    return `<p class="correction-note">注: 23時切替のため日柱は翌日扱い（${ymd}）</p>`;
  }

  /**
   * 命式テーブルのレンダリング
   */
  renderFortuneTable(fortune, juuniunResults, tsuuhenResults) {
    const tableHTML = `
      <table class="fortune-table" style="width: 100%; table-layout: fixed; border-collapse: collapse; margin-top: 20px;">
        <colgroup>
          <col style="width: 25%">
          <col style="width: 25%">
          <col style="width: 25%">
          <col style="width: 25%">
        </colgroup>
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 25%;">時柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 25%;">日柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 25%;">月柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; width: 25%;">年柱</th>
          </tr>
        </thead>
        <tbody>
          <!-- 天干 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.stem : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.stem}
            </td>
          </tr>
          <!-- 地支 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.branch : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.branch}
            </td>
          </tr>
          <!-- 蔵干 -->
          <tr class="hidden-stems-row">
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${fortune.hourPillar ? this.formatHiddenStems(fortune.hourPillar.hiddenStems) : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.dayPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.monthPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.yearPillar.hiddenStems)}
            </td>
          </tr>
          <!-- 十二運 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.hour ? juuniunResults.hour.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.day ? juuniunResults.day.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.month ? juuniunResults.month.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.year ? juuniunResults.year.juuniun : "-"}
            </td>
          </tr>
          <!-- 通変星 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.hour ? tsuuhenResults.hour.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.day ? tsuuhenResults.day.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.month ? tsuuhenResults.month.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.year ? tsuuhenResults.year.tsuuhen : "-"}
            </td>
          </tr>
        </tbody>
      </table>
    `;

    if (this.elements.fortuneResult) {
      this.elements.fortuneResult.innerHTML = tableHTML;
    }
  }

  formatHiddenStems(hiddenStems) {
    if (!hiddenStems || hiddenStems.length === 0) {
      return "-";
    }
    // hiddenStemsは文字列の配列（例: ['甲', '丙', '戊']）
    return hiddenStems.join(" ");
  }

  /**
   * 大運のレンダリング
   */
  renderGreatFortune(cycles, birthYear) {
    if (!this.elements.greatFortuneResult) {
      return;
    }
    if (!cycles || cycles.length === 0) {
      this.elements.greatFortuneResult.innerHTML = "<p>大運情報なし</p>";
      return;
    }

    const cardsHTML = cycles
      .map((cycle) => {
        const startYear = birthYear + cycle.ageStart;
        const endYear = birthYear + cycle.ageEnd;

        return `
      <div class="cycle-card">
        <div class="cycle-age">
          ${cycle.ageStart}歳 - ${cycle.ageEnd}歳
        </div>
        <div class="cycle-jiazi">
          ${cycle.stem}${cycle.branch}
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          ${startYear}年 - ${endYear}年
        </div>
      </div>
    `;
      })
      .join("");

    this.elements.greatFortuneResult.innerHTML = `
      <div class="great-fortune-header">
        <strong>大運</strong>
      </div>
      <div class="great-fortune-cycles">
        ${cardsHTML}
      </div>
    `;
  }

  onSavePNG(handler) {
    if (this.elements.savePngBtn) {
      this.elements.savePngBtn.addEventListener("click", handler);
    }
  }
}
