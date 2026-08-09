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
    this.elements.kakkyokuByoyakuSection = document.getElementById("kakkyoku-byoyaku-section");
    this.elements.kakkyokuByoyakuResult = document.getElementById("kakkyoku-byoyaku-result");
    this.elements.kakkyokuToggle = document.getElementById("kakkyoku-toggle");
    this.elements.gouChuuSection = document.getElementById("gouchuu-section");
    this.elements.gouChuuResult = document.getElementById("gouchuu-result");
    this.elements.gouChuuToggle = document.getElementById("gouchuu-toggle");
    this.elements.greatFortuneSection = document.getElementById("great-fortune-section");
    this.elements.greatFortuneResult = document.getElementById("great-fortune-result");
    this.elements.greatFortuneToggle = document.getElementById("great-fortune-toggle");
    this.elements.savePngBtn = document.getElementById("save-png-btn");

    if (this.elements.kakkyokuToggle) {
      this.elements.kakkyokuToggle.addEventListener("change", () => {
        this._toggleKakkyokuByoyaku();
      });
    }

    if (this.elements.gouChuuToggle) {
      this.elements.gouChuuToggle.addEventListener("change", () => {
        this._toggleGouChuu();
      });
    }

    if (this.elements.greatFortuneToggle) {
      this.elements.greatFortuneToggle.addEventListener("change", () => {
        this._toggleGreatFortuneDetail();
      });
    }
  }

  /**
   * 結果を表示してセクションを表示状態にする
   */
  showResults(fortune, juuniunResults, tsuuhenResults, greatFortuneCycles, year, kakkyokuResult, byoyakuResult, strengthResult, daiunEvaluations = null, gouChuuResult = null) {
    this.renderFortuneTable(fortune, juuniunResults, tsuuhenResults);
    if (kakkyokuResult && byoyakuResult && strengthResult) {
      this.renderKakkyokuByoyaku(kakkyokuResult, byoyakuResult, strengthResult);
      if (this.elements.kakkyokuByoyakuSection) {
        this.elements.kakkyokuByoyakuSection.style.display = "block";
      }
    }
    if (gouChuuResult) {
      this.renderGouChuu(gouChuuResult);
      if (this.elements.gouChuuSection) {
        this.elements.gouChuuSection.style.display = "block";
      }
    }
    this.renderGreatFortune(greatFortuneCycles, year, daiunEvaluations);
    if (this.elements.greatFortuneSection) {
      this.elements.greatFortuneSection.style.display = "block";
    }
    this.elements.resultSection.style.display = "block";
  }

  /**
   * 結果をクリアして非表示にする
   */
  clear() {
    this.elements.fortuneResult.innerHTML = "";
    if (this.elements.kakkyokuByoyakuResult) {
      this.elements.kakkyokuByoyakuResult.innerHTML = "";
    }
    if (this.elements.kakkyokuByoyakuSection) {
      this.elements.kakkyokuByoyakuSection.style.display = "none";
    }
    if (this.elements.gouChuuResult) {
      this.elements.gouChuuResult.innerHTML = "";
    }
    if (this.elements.gouChuuSection) {
      this.elements.gouChuuSection.style.display = "none";
    }
    this.elements.greatFortuneResult.innerHTML = "";
    if (this.elements.greatFortuneSection) {
      this.elements.greatFortuneSection.style.display = "none";
    }
    this.elements.resultSection.style.display = "none";
  }

  /**
   * 格局・病薬セクションの表示/非表示を切り替える
   * @private
   */
  _toggleKakkyokuByoyaku() {
    if (!this.elements.kakkyokuByoyakuResult) return;
    const isVisible = this.elements.kakkyokuToggle.checked;
    this.elements.kakkyokuByoyakuResult.style.display = isVisible ? "block" : "none";
  }

  /**
   * 合冲分析セクションの表示/非表示を切り替える
   * @private
   */
  _toggleGouChuu() {
    if (!this.elements.gouChuuResult) return;
    const isVisible = this.elements.gouChuuToggle.checked;
    this.elements.gouChuuResult.style.display = isVisible ? "block" : "none";
  }

  /**
   * 大運吉凶詳細の表示/非表示を切り替える
   * @private
   */
  _toggleGreatFortuneDetail() {
    if (!this.elements.greatFortuneResult) return;
    const isVisible = this.elements.greatFortuneToggle.checked;
    const details = this.elements.greatFortuneResult.querySelectorAll('.cycle-detail');
    details.forEach(el => {
      el.classList.toggle('visible', isVisible);
    });
  }

  /**
   * 命式テーブルのレンダリング
   */
  renderFortuneTable(fortune, juuniunResults, tsuuhenResults) {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">時柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">日柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">月柱</th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center;">年柱</th>
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
          <tr>
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
   * 格局・病薬診断のレンダリング
   */
  renderKakkyokuByoyaku(kakkyokuResult, byoyakuResult, strengthResult) {
    if (!this.elements.kakkyokuByoyakuResult) return;

    const strengthColor = strengthResult.strength === 'strong' ? '#1a5276'
      : strengthResult.strength === 'weak' ? '#b7410e'
      : '#1e8449';
    const strengthBg = strengthResult.strength === 'strong' ? '#d4e6f1'
      : strengthResult.strength === 'weak' ? '#fdebd0'
      : '#d5f5e3';

    const kakkyokuStatusHTML = kakkyokuResult.isEstablished
      ? '<span style="color: #27ae60;">成格</span>'
      : `<span style="color: #e74c3c;">破格（${kakkyokuResult.breakReason}）</span>`;

    // 病薬ブロックを生成（diagnoses配列があれば複数、なければ後方互換で単一）
    const diagnosesToRender = byoyakuResult.diagnoses || [{
      disease: byoyakuResult.disease,
      medicine: byoyakuResult.medicine,
      reason: byoyakuResult.summary
    }];

    const diseaseBg = '#fdedec';
    const diseaseBorder = '#e74c3c';
    const medicineBg = '#eafaf1';
    const medicineBorder = '#27ae60';

    const diagnosisBlocksHTML = diagnosesToRender.map((diag, idx) => {
      const label = diagnosesToRender.length > 1 ? `病${idx + 1}` : '病';

      const severityLabel = diag.disease.severity === 'severe' ? '重度'
        : diag.disease.severity === 'moderate' ? '中度'
        : '軽度';

      const medicineExistsHTML = diag.medicine.exists
        ? `<span style="color: #27ae60; font-weight: bold;">&#10003; 命式中に薬あり（${diag.medicine.location}）</span>`
        : `<span style="color: #e67e22;">&#10007; 命式中に薬なし（行運で補う）</span>`;

      return `
          <!-- ${label} -->
          <div style="background-color: ${diseaseBg}; border-left: 4px solid ${diseaseBorder}; padding: 8px 12px; margin-bottom: 4px; border-radius: 0 4px 4px 0;">
            <div style="font-weight: bold; color: #c0392b; margin-bottom: 4px;">
              【${label}】${diag.disease.name}（${byoyakuResult.fourDisease}の病・${severityLabel}）
            </div>
            <div style="font-size: 12px; color: #555;">
              ${diag.disease.element ? `五行: ${diag.disease.element}` : ''}
              ${diag.disease.tenGod ? `／ 十神: ${diag.disease.tenGod}` : ''}
            </div>
          </div>

          <!-- 薬 -->
          <div style="background-color: ${medicineBg}; border-left: 4px solid ${medicineBorder}; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
            <div style="font-weight: bold; color: #1e8449; margin-bottom: 4px;">
              【薬】${diag.medicine.name}（${byoyakuResult.fourMedicine}の薬）${diag.medicine.element ? `→ ${diag.medicine.element}` : ''}
            </div>
            <div style="font-size: 12px; color: #555; margin-bottom: 4px;">
              ${diag.reason}
            </div>
            <div style="font-size: 11px;">
              ${medicineExistsHTML}
            </div>
          </div>`;
    }).join('');

    const html = `
      <div style="margin-top: 20px; border: 2px solid #8e44ad; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #8e44ad; color: white; padding: 8px 12px; font-weight: bold; text-align: center;">
          格局・病薬 診断
        </div>
        <div style="padding: 12px;">

          <!-- 身旺弱 -->
          <div style="background-color: ${strengthBg}; border-left: 4px solid ${strengthColor}; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
            <div style="font-weight: bold; color: ${strengthColor}; margin-bottom: 4px;">
              【身旺弱】${strengthResult.strengthLabel}（スコア: ${strengthResult.score}）
            </div>
            <div style="font-size: 11px; color: #555;">
              月令: ${strengthResult.details.monthLordScore >= 0 ? '+' : ''}${strengthResult.details.monthLordScore} ／
              地支根: +${strengthResult.details.rootScore} ／
              天干助力: +${strengthResult.details.heavenlyStemScore} ／
              十二運: +${strengthResult.details.juuniunBonus}${strengthResult.details.gouChuuScore != null && strengthResult.details.gouChuuScore !== 0 ? ` ／ 合冲: ${strengthResult.details.gouChuuScore >= 0 ? '+' : ''}${strengthResult.details.gouChuuScore}` : ''}
            </div>
          </div>

          <!-- 格局 -->
          <div style="background-color: #f4ecf7; border-left: 4px solid #8e44ad; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
            <div style="font-weight: bold; color: #6c3483; margin-bottom: 4px;">
              【格局】${kakkyokuResult.kakkyoku}（${kakkyokuResult.categoryLabel}）　${kakkyokuStatusHTML}
            </div>
            <div style="font-size: 11px; color: #555;">
              根拠: ${kakkyokuResult.basisDetail}
            </div>
          </div>

          ${diagnosisBlocksHTML}

        </div>
      </div>
    `;

    this.elements.kakkyokuByoyakuResult.innerHTML = html;
  }

  /**
   * 合冲分析のレンダリング
   */
  renderGouChuu(gouChuuResult) {
    if (!this.elements.gouChuuResult) return;

    const allItems = [
      ...gouChuuResult.liuhe,
      ...gouChuuResult.sanhe,
      ...gouChuuResult.banhe,
      ...gouChuuResult.fanghe,
      ...gouChuuResult.liuchong
    ];

    if (allItems.length === 0) {
      this.elements.gouChuuResult.innerHTML = `
        <div style="margin-top: 20px; border: 2px solid #e67e22; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #e67e22; color: white; padding: 8px 12px; font-weight: bold; text-align: center;">
            合冲分析
          </div>
          <div style="padding: 12px; color: #888; text-align: center;">
            合冲関係なし
          </div>
        </div>`;
      return;
    }

    const itemsHTML = allItems.map(item => {
      const isClash = item.type === '六冲';
      const borderColor = isClash ? '#e74c3c' : '#27ae60';
      const bgColor = isClash ? '#fdedec' : '#eafaf1';
      const textColor = isClash ? '#c0392b' : '#1e8449';

      let detailHTML = '';

      if (item.type === '支合' || item.type === '三合') {
        const transformColor = item.isTransformed ? '#27ae60' : '#e67e22';
        const transformIcon = item.isTransformed ? '&#10003;' : '&#10007;';
        detailHTML = `
          <div style="font-size: 12px; color: #555;">
            ${item.positions.join('・')} → ${item.resultElement}に化す
          </div>
          <div style="font-size: 11px; color: ${transformColor};">
            ${transformIcon} ${item.transformDetail}
          </div>`;
      } else if (item.type === '半合') {
        detailHTML = `
          <div style="font-size: 12px; color: #555;">
            ${item.positions.join('・')} → ${item.resultElement}（部分的傾向）
          </div>`;
      } else if (item.type === '方合') {
        detailHTML = `
          <div style="font-size: 12px; color: #555;">
            ${item.positions.join('・')} → ${item.resultElement}（${item.direction}・${item.season}）
          </div>`;
      } else if (item.type === '六冲') {
        const levelLabel = item.intensityLevel === 3 ? '強'
          : item.intensityLevel === 2 ? '中' : '弱';
        detailHTML = `
          <div style="font-size: 12px; color: #555;">
            ${item.positions.join('↔')} ${item.intensity}（${levelLabel}）
          </div>`;
      }

      return `
        <div style="background-color: ${bgColor}; border-left: 4px solid ${borderColor}; padding: 8px 12px; margin-bottom: 4px; border-radius: 0 4px 4px 0;">
          <div style="font-weight: bold; color: ${textColor}; margin-bottom: 2px;">
            【${item.type}】${item.name}
          </div>
          ${detailHTML}
        </div>`;
    }).join('');

    this.elements.gouChuuResult.innerHTML = `
      <div style="margin-top: 20px; border: 2px solid #e67e22; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #e67e22; color: white; padding: 8px 12px; font-weight: bold; text-align: center;">
          合冲分析
        </div>
        <div style="padding: 12px;">
          ${itemsHTML}
        </div>
      </div>`;
  }

  /**
   * 大運のレンダリング
   */
  renderGreatFortune(cycles, birthYear, evaluations = null) {
    if (!cycles || cycles.length === 0) {
      this.elements.greatFortuneResult.innerHTML = "<p>大運情報なし</p>";
      return;
    }

    // 判定ラベルからCSSクラスへの対応
    const judgmentClassMap = {
      '大吉': 'kichi-dai',
      '吉':   'kichi',
      '小吉': 'kichi-sho',
      '平':   'hei',
      '小凶': 'kyou-sho',
      '凶':   'kyou',
      '大凶': 'kyou-dai'
    };

    // 判定ラベルの表示色
    const judgmentColorMap = {
      '大吉': '#1a8c3f',
      '吉':   '#27ae60',
      '小吉': '#6ab04c',
      '平':   '#7f8c8d',
      '小凶': '#e67e22',
      '凶':   '#e74c3c',
      '大凶': '#c0392b'
    };

    const cardsHTML = cycles
      .map((cycle, i) => {
        const startYear = birthYear + cycle.ageStart;
        const endYear = birthYear + cycle.ageEnd;
        const evalData = evaluations ? evaluations[i] : null;

        const cardClass = evalData ? ` ${judgmentClassMap[evalData.judgment] || ''}` : '';

        let judgmentHTML = '';
        if (evalData) {
          const color = judgmentColorMap[evalData.judgment] || '#555';
          let gouChuuHTML = '';
          if (evalData.gouChuu) {
            const gc = evalData.gouChuu;
            const gcItems = [
              ...gc.liuhe.map(i => `${i.name}`),
              ...gc.sanhe.map(i => `${i.name}`),
              ...gc.banhe.map(i => `${i.name}`),
              ...gc.fanghe.map(i => `${i.name}`),
              ...gc.liuchong.map(i => `${i.name}`)
            ];
            if (gcItems.length > 0) {
              gouChuuHTML = `<div style="margin-top: 2px; font-size: 10px; color: #e67e22;">合冲: ${gcItems.join('、')}</div>`;
            }
          }
          judgmentHTML = `
            <div class="cycle-judgment" style="color: ${color};">
              ${evalData.judgment}
            </div>
            <div style="font-size: 10px; color: #888;">${evalData.stemTsuuhen}</div>
            <div class="cycle-detail">
              ${evalData.gaitouType ? `<div style="margin-top: 2px;">${evalData.gaitouType}</div>` : ''}
              <div style="margin-top: 2px;">${evalData.reason}</div>
              ${gouChuuHTML}
            </div>`;
        }

        return `
      <div class="cycle-card${cardClass}">
        <div class="cycle-age">
          ${cycle.ageStart}歳 - ${cycle.ageEnd}歳
        </div>
        <div class="cycle-jiazi">
          ${cycle.stem}${cycle.branch}
        </div>
        <div style="font-size: 11px; color: #666; margin-top: 4px;">
          ${startYear}年 - ${endYear}年
        </div>
        ${judgmentHTML}
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
    this.elements.savePngBtn.addEventListener("click", handler);
  }
}
