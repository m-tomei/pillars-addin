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
    this.elements.gouChuuSection = document.getElementById("gouchuu-section");
    this.elements.gouChuuResult = document.getElementById("gouchuu-result");
    this.elements.gouChuuToggle = document.getElementById("gouchuu-toggle");
    this.elements.greatFortuneSection = document.getElementById("great-fortune-section");
    this.elements.greatFortuneResult = document.getElementById("great-fortune-result");
    this.elements.greatFortuneToggle = document.getElementById("great-fortune-toggle");
    this.elements.savePngBtn = document.getElementById("save-png-btn");

    // 旧 #kakkyoku-toggle は計算前オプションへ置換済み（T-05）

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
      this.renderByoyakuSection({ kakkyokuResult, byoyakuResult, strengthResult });
      if (this.elements.kakkyokuByoyakuSection) {
        this.elements.kakkyokuByoyakuSection.style.display = "block";
      }
    } else {
      this._hideByoyakuSection();
    }

    // D-02: 合冲は内部計算のみ。UIには出さない（引数は互換のため残す）
    this._hideGouChuuSection();

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
   * 病薬セクションを消して非表示にする
   * @private
   */
  _hideByoyakuSection() {
    if (this.elements.kakkyokuByoyakuResult) {
      this.elements.kakkyokuByoyakuResult.innerHTML = "";
    }
    if (this.elements.kakkyokuByoyakuSection) {
      this.elements.kakkyokuByoyakuSection.style.display = "none";
    }
  }

  /**
   * 合冲セクションを消して非表示にする（D-02）
   * @private
   */
  _hideGouChuuSection() {
    if (this.elements.gouChuuResult) {
      this.elements.gouChuuResult.innerHTML = "";
    }
    if (this.elements.gouChuuSection) {
      this.elements.gouChuuSection.style.display = "none";
    }
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
   * 旧API互換。v2は renderByoyakuSection を正とする。
   */
  renderKakkyokuByoyaku(kakkyokuResult, byoyakuResult, strengthResult) {
    this.renderByoyakuSection({ kakkyokuResult, byoyakuResult, strengthResult });
  }

  /**
   * 病薬診断セクション（気象→主軸→身旺弱→病薬→バランス→喜忌）
   * BYO-DD-07 / T-04
   */
  renderByoyakuSection({ strengthResult, kakkyokuResult, byoyakuResult }) {
    if (!this.elements.kakkyokuByoyakuResult) return;

    if (!byoyakuResult) {
      this.elements.kakkyokuByoyakuResult.innerHTML = `
        <div style="margin-top: 12px; color: #c0392b;">病薬を特定できませんでした</div>`;
      return;
    }

    const allDiagnoses = byoyakuResult.diagnoses?.length
      ? byoyakuResult.diagnoses
      : (byoyakuResult.disease ? [{
          role: 'primary',
          source: 'fallback',
          disease: byoyakuResult.disease,
          medicine: byoyakuResult.medicine,
          reason: byoyakuResult.summary,
          fourDisease: byoyakuResult.fourDisease,
          fourMedicine: byoyakuResult.fourMedicine,
          treatmentMode: byoyakuResult.treatmentMode
        }] : []);
    // 気象は上段の気象ブロックで表示済み。用神損傷診断がある場合は重複掲載しない。
    const doctrinalDiagnoses = allDiagnoses.filter(diag => diag.source !== 'kishou');
    const diagnosesToRender = doctrinalDiagnoses.length ? doctrinalDiagnoses : allDiagnoses;

    const html = `
      <div class="byoyaku-panel" style="margin-top: 12px; border: 2px solid #8e44ad; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #8e44ad; color: white; padding: 8px 12px; font-weight: bold; text-align: center;">
          病薬診断
        </div>
        <div class="byoyaku-panel-body" style="padding: 12px;">
          ${this._renderKishouBlock(byoyakuResult.kishou)}
          ${this._renderKeizenBlock(byoyakuResult.keizen, kakkyokuResult)}
          ${this._renderStrengthBlock(strengthResult)}
          ${this._renderFourDiseaseBlock(byoyakuResult)}
          ${diagnosesToRender.length
            ? this._renderDiagnosisBlocks(diagnosesToRender)
            : '<div style="color: #c0392b; margin-bottom: 10px;">病薬を特定できませんでした</div>'}
          ${this._renderBalanceBlock(byoyakuResult.balance)}
          ${this._renderKikiBlock(byoyakuResult.kiki)}
        </div>
      </div>
    `;

    this.elements.kakkyokuByoyakuResult.innerHTML = html;
  }

  /**
   * 命式本体の表示を維持したまま、病薬診断の失敗を表示する。
   */
  showByoyakuError() {
    if (!this.elements.kakkyokuByoyakuResult) return;

    this.elements.kakkyokuByoyakuResult.innerHTML = `
      <div style="margin-top: 12px; color: #c0392b;">
        病薬診断の計算に失敗しました。命式と大運はそのまま参照できます。
      </div>`;
    if (this.elements.kakkyokuByoyakuSection) {
      this.elements.kakkyokuByoyakuSection.style.display = "block";
    }
  }

  /** @private */
  _severityLabel(severity) {
    if (severity === 'severe') return '重度';
    if (severity === 'moderate') return '中度';
    return '軽度';
  }

  /** @private */
  _renderKishouBlock(kishou) {
    if (!kishou) {
      return `
        <div data-block="kishou" style="background-color: #eaf2f8; border-left: 4px solid #2980b9; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
          <div style="font-weight: bold; color: #1a5276;">【気象】判定簡易（中和扱い）</div>
        </div>`;
    }

    const severityLabel = this._severityLabel(kishou.severity);
    const choukou = kishou.choukou || {};
    const direction = choukou.direction || 'なし';
    const primary = (choukou.primaryElements || []).join('・') || '—';
    const secondaryItems = choukou.secondary || [];
    const secondary = secondaryItems.length
      ? `（${secondaryItems.map(item => {
          const elements = (item.elements || []).join('・') || '—';
          return `${item.direction || '副調候'} → ${elements}`;
        }).join(' ／ ')}）`
      : '';

    return `
      <div data-block="kishou" style="background-color: #eaf2f8; border-left: 4px solid #2980b9; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: #1a5276; margin-bottom: 4px;">
          【気象】${kishou.temperature}・${kishou.humidity}（偏り: ${severityLabel}）
        </div>
        <div style="font-size: 12px; color: #555; margin-bottom: 2px;">
          調候: ${direction} → ${primary}${secondary}
        </div>
        <div style="font-size: 11px; color: #555;">
          ${kishou.summary || ''}
        </div>
      </div>`;
  }

  /** @private */
  _renderKeizenBlock(keizen, kakkyokuResult) {
    const pillar = keizen?.pillar || {};
    const kakkyoku = pillar.kakkyoku || kakkyokuResult?.kakkyoku || '—';
    const youshinLabel = pillar.youshinLabel
      || kakkyokuResult?.categoryLabel
      || '';
    const established = pillar.isEstablished ?? kakkyokuResult?.isEstablished;
    const breakReason = kakkyokuResult?.breakReason || '';
    const breaks = keizen?.breaks || [];
    const statusHTML = established
      ? `<span style="color: ${breaks.length ? '#e67e22' : '#27ae60'};">成格${breaks.length ? '・損傷あり' : ''}</span>`
      : `<span style="color: #e74c3c;">破格${breakReason ? `（${breakReason}）` : ''}</span>`;
    const breakText = breaks.length
      ? breaks.map(b => b.name || b.condition).filter(Boolean).join('、')
      : '目立った破なし';
    return `
      <div data-block="keizen" style="background-color: #f4ecf7; border-left: 4px solid #8e44ad; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: #6c3483; margin-bottom: 4px;">
          【主軸】${kakkyoku}${youshinLabel ? `（${youshinLabel}）` : ''}　${statusHTML}
        </div>
        <div style="font-size: 12px; color: #555; margin-bottom: 2px;">
          破: ${breakText}
        </div>
      </div>`;
  }

  /** @private */
  _renderStrengthBlock(strengthResult) {
    if (!strengthResult) return '';

    const strengthColor = strengthResult.strength === 'strong' ? '#1a5276'
      : strengthResult.strength === 'weak' ? '#b7410e'
      : '#1e8449';
    const strengthBg = strengthResult.strength === 'strong' ? '#d4e6f1'
      : strengthResult.strength === 'weak' ? '#fdebd0'
      : '#d5f5e3';
    const details = strengthResult.details || {};
    const gouChuuPart = details.gouChuuScore != null && details.gouChuuScore !== 0
      ? ` ／ 合冲: ${details.gouChuuScore >= 0 ? '+' : ''}${details.gouChuuScore}`
      : '';

    return `
      <div data-block="strength" style="background-color: ${strengthBg}; border-left: 4px solid ${strengthColor}; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: ${strengthColor}; margin-bottom: 4px;">
          【身旺弱】${strengthResult.strengthLabel || strengthResult.strength}（スコア: ${strengthResult.score}）
        </div>
        <div style="font-size: 11px; color: #555;">
          月令: ${details.monthLordScore >= 0 ? '+' : ''}${details.monthLordScore ?? '—'} ／
          地支根: +${details.rootScore ?? '—'} ／
          天干助力: +${details.heavenlyStemScore ?? '—'} ／
          十二運: +${details.juuniunBonus ?? '—'}${gouChuuPart}
        </div>
      </div>`;
  }

  /** @private */
  _renderFourDiseaseBlock(byoyakuResult) {
    const disease = byoyakuResult.fourDisease || '—';
    const diseaseElement = byoyakuResult.fourDiseaseElement
      ? `（${byoyakuResult.fourDiseaseElement}）`
      : '';
    let treatment;
    if (byoyakuResult.fourMedicine) {
      const medicineElement = byoyakuResult.fourMedicineElement
        ? `（${byoyakuResult.fourMedicineElement}）`
        : '';
      treatment = `四薬: ${byoyakuResult.fourMedicine}${medicineElement}`;
    } else if (byoyakuResult.treatmentMode) {
      const treatmentElements = (byoyakuResult.treatmentElements || []).join('・');
      treatment = `処置: ${byoyakuResult.treatmentMode}${treatmentElements ? `（${treatmentElements}）` : ''}`;
    } else {
      treatment = '四薬: —';
    }

    return `
      <div data-block="four-disease" style="background-color: #fdf2e9; border-left: 4px solid #d35400; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: #a04000;">
          【四病四薬】四病: ${disease}${diseaseElement} ／ ${treatment}
        </div>
      </div>`;
  }

  /** @private */
  _renderDiagnosisBlocks(diagnosesToRender) {
    const diseaseBg = '#fdedec';
    const diseaseBorder = '#e74c3c';
    const medicineBg = '#eafaf1';
    const medicineBorder = '#27ae60';
    return diagnosesToRender.map((diag, idx) => {
      const roleTag = diag.role === 'primary'
        ? '主'
        : (diag.source === 'kishou' ? '副（気象）' : '副');
      const label = diagnosesToRender.length > 1
        ? `病${idx + 1}・${roleTag}`
        : (diag.role === 'secondary' ? `病・${roleTag}` : '病');

      const severityLabel = this._severityLabel(diag.disease?.severity);
      const diseaseMeta = severityLabel;

      const causeEls = (diag.disease?.causeElements || []).join('・');
      const elementLineParts = [];
      if (diag.disease?.element) elementLineParts.push(`五行: ${diag.disease.element}`);
      else if (causeEls) elementLineParts.push(`原因: ${causeEls}`);
      if (diag.disease?.tenGod) elementLineParts.push(`十神: ${diag.disease.tenGod}`);

      const medicine = diag.medicine || {};
      const medicineExistsHTML = medicine.exists
        ? `<span style="color: #27ae60; font-weight: bold;">&#10003; 命式中に薬あり（${medicine.location}）</span>`
        : `<span style="color: #e67e22;">&#10007; 命式中に薬なし（行運で補う）</span>`;

      let choukouNote = '';
      if (medicine.choukouAligned) {
        choukouNote = '<div style="font-size: 11px; color: #2980b9; margin-top: 2px;">（調候一致）</div>';
      }

      return `
          <div data-block="diagnosis" data-role="${diag.role || ''}" data-source="${diag.source || ''}">
            <div style="background-color: ${diseaseBg}; border-left: 4px solid ${diseaseBorder}; padding: 8px 12px; margin-bottom: 4px; border-radius: 0 4px 4px 0;">
              <div style="font-weight: bold; color: #c0392b; margin-bottom: 4px;">
                【${label}】${diag.disease?.name || '—'}${diseaseMeta ? `（${diseaseMeta}）` : ''}
              </div>
              ${elementLineParts.length ? `<div style="font-size: 12px; color: #555;">${elementLineParts.join(' ／ ')}</div>` : ''}
            </div>

            <div style="background-color: ${medicineBg}; border-left: 4px solid ${medicineBorder}; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
              <div style="font-weight: bold; color: #1e8449; margin-bottom: 4px;">
                【薬】${medicine.name || '—'}${medicine.element ? ` → ${medicine.element}` : ''}
              </div>
              <div style="font-size: 12px; color: #555; margin-bottom: 4px;">
                ${(diag.reason || '')
                  .replace(/（主軸の薬と調候を併記）$/, '')
                  .replace(/（格局薬と調候が一致）$/, '')}
              </div>
              <div style="font-size: 11px;">
                ${medicineExistsHTML}
              </div>
              ${choukouNote}
            </div>
          </div>`;
    }).join('');
  }

  /** @private */
  _renderBalanceBlock(balance) {
    const readings = {
      '病重薬重': '病も薬も重い。行運で中和を取りやすい型',
      '病重薬軽': '今は薬不足。薬旺の運を待つ',
      '病軽薬重': '薬が勝ちすぎて別偏りに注意',
      '病軽薬軽': '小さな不均衡',
      '病なし薬なし': '平常に近く、大きな起伏が出にくい'
    };
    const label = balance?.label || '病なし薬なし';
    const reading = readings[label] || balance?.reading || '';

    return `
      <div data-block="balance" style="background-color: #fef9e7; border-left: 4px solid #f39c12; padding: 8px 12px; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: #9a7d0a; margin-bottom: 4px;">
          【バランス】${label}
        </div>
        <div style="font-size: 12px; color: #555;">
          ${reading}
        </div>
      </div>`;
  }

  /** @private */
  _renderKikiBlock(kiki) {
    if (!kiki) return '';

    const formatItems = (items) => {
      if (!items?.length) return '—';
      const labels = items.map(item => {
        const bits = [item.label || item.tenGod, item.element].filter(Boolean);
        return bits.join('・');
      });
      return [...new Set(labels)].join('、');
    };

    return `
      <div data-block="kiki" style="background-color: #f8f9f9; border-left: 4px solid #566573; padding: 8px 12px; margin-bottom: 4px; border-radius: 0 4px 4px 0;">
        <div style="font-weight: bold; color: #2c3e50; margin-bottom: 4px;">【喜忌】</div>
        <div style="font-size: 12px; color: #555;">
          喜: ${formatItems(kiki.ki)}
        </div>
        <div style="font-size: 12px; color: #555; margin-top: 2px;">
          忌: ${formatItems(kiki.ji)}
        </div>
      </div>`;
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
