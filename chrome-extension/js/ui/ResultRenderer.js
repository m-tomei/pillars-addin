/**
 * 結果描画クラス
 */
export class ResultRenderer {
  constructor() {
    this.elements = {};
    this.bindElements();
  }

  bindElements() {
    this.elements.resultSection = document.getElementById("result-section");
    this.elements.fortuneResult = document.getElementById("fortune-result");
    this.elements.greatFortuneResult = document.getElementById("great-fortune-result");
    this.elements.savePngBtn = document.getElementById("save-png-btn");
  }

  /**
   * 結果を表示してセクションを表示状態にする
   */
  showResults(fortune, juuniunResults, tsuuhenResults, greatFortuneCycles, year) {
    this.renderFortuneTable(fortune, juuniunResults, tsuuhenResults);
    this.renderGreatFortune(greatFortuneCycles, year);
    this.elements.resultSection.style.display = "block";
  }

  /**
   * 結果をクリアして非表示にする
   */
  clear() {
    this.elements.fortuneResult.innerHTML = "";
    this.elements.greatFortuneResult.innerHTML = "";
    this.elements.resultSection.style.display = "none";
  }

  /**
   * 命式テーブルのレンダリング
   */
  renderFortuneTable(fortune, juuniunResults, tsuuhenResults) {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">年柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">月柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">日柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">時柱</th>
          </tr>
        </thead>
        <tbody>
          <!-- 天干 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.stem}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.stem : "-"}
            </td>
          </tr>
          <!-- 地支 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.yearPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.monthPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.dayPillar.branch}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold;">
              ${fortune.hourPillar ? fortune.hourPillar.branch : "-"}
            </td>
          </tr>
          <!-- 蔵干 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.yearPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.monthPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${this.formatHiddenStems(fortune.dayPillar.hiddenStems)}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; font-size: 12px;">
              ${fortune.hourPillar ? this.formatHiddenStems(fortune.hourPillar.hiddenStems) : "-"}
            </td>
          </tr>
          <!-- 十二運 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.year ? juuniunResults.year.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.month ? juuniunResults.month.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.day ? juuniunResults.day.juuniun : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #fff8dc;">
              ${juuniunResults.hour ? juuniunResults.hour.juuniun : "-"}
            </td>
          </tr>
          <!-- 通変星 -->
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.year ? tsuuhenResults.year.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.month ? tsuuhenResults.month.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.day ? tsuuhenResults.day.tsuuhen : "-"}
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: center; background-color: #e6f3ff;">
              ${tsuuhenResults.hour ? tsuuhenResults.hour.tsuuhen : "-"}
            </td>
          </tr>
        </tbody>
      </table>
    `;

    this.elements.fortuneResult.innerHTML = tableHTML;
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
    if (!cycles || cycles.length === 0) {
      this.elements.greatFortuneResult.innerHTML = "<p>大運情報なし</p>";
      return;
    }

    const cardsHTML = cycles
      .map((cycle) => {
        const startYear = birthYear + cycle.ageStart;
        const endYear = birthYear + cycle.ageEnd;

        return `
      <div style="border: 1px solid #ddd; border-radius: 4px; padding: 12px; margin-bottom: 10px; background-color: #f9f9f9;">
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${cycle.ageStart}歳 - ${cycle.ageEnd}歳
        </div>
        <div style="font-size: 14px;">
          天干: ${cycle.stem} / 地支: ${cycle.branch}
        </div>
        <div style="font-size: 12px; color: #666; margin-top: 4px;">
          ${startYear}年 - ${endYear}年
        </div>
      </div>
    `;
      })
      .join("");

    this.elements.greatFortuneResult.innerHTML = `
      <h3 style="margin-top: 20px; margin-bottom: 12px;">大運</h3>
      ${cardsHTML}
    `;
  }

  onSavePNG(handler) {
    this.elements.savePngBtn.addEventListener("click", handler);
  }
}
