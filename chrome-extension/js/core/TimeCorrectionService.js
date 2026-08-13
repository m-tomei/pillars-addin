/**
 * 時刻補正サービス
 * 時差・地方平均時補正と表示用文字列の生成。干支計算・DOM・入力検証は行わない。
 */

import { DateUtils } from '../utils/dateUtils.js';
import { CalculationError } from '../utils/errors.js';
import { JST_REFERENCE_LONGITUDE } from '../utils/constants.js';

function pad2(value) {
  return String(value).padStart(2, '0');
}

function formatDateTime({ year, month, day, hour, minute }) {
  return `${year}-${pad2(month)}-${pad2(day)} ${pad2(hour)}:${pad2(minute)}`;
}

function formatSignedMinutes(minutes) {
  const sign = minutes > 0 ? '+' : '';
  return `${sign}${minutes}分`;
}

export class TimeCorrectionService {
  /**
   * @param {object} longitudeMaster - prefecture_longitude.json
   */
  constructor(longitudeMaster) {
    if (!TimeCorrectionService._isValidMaster(longitudeMaster)) {
      throw new CalculationError('経度マスタが不正です');
    }
    this.master = longitudeMaster;
    this.byCode = new Map(longitudeMaster.prefectures.map((p) => [p.code, p]));
  }

  static _isValidMaster(master) {
    if (
      !master ||
      master.referenceMeridianEast !== JST_REFERENCE_LONGITUDE ||
      !Array.isArray(master.prefectures) ||
      master.prefectures.length !== 47
    ) {
      return false;
    }

    const codes = new Set();
    return master.prefectures.every((prefecture) => {
      if (
        !prefecture ||
        typeof prefecture.code !== 'string' ||
        !/^\d{2}$/.test(prefecture.code) ||
        typeof prefecture.name !== 'string' ||
        prefecture.name.length === 0 ||
        !Number.isFinite(prefecture.longitudeEast)
      ) {
        return false;
      }
      codes.add(prefecture.code);
      return true;
    }) && codes.size === 47;
  }

  /**
   * UIの符号・時・分を分単位オフセットへ変換する。
   * @param {string|number} sign '+' / '-' または 1 / -1
   * @param {number|string} hour
   * @param {number|string} minute
   * @returns {number}
   */
  static parseOffset(sign, hour, minute) {
    const negative = sign === '-' || sign === -1 || sign === '-1';
    const signFactor = negative ? -1 : 1;
    return signFactor * (Number(hour) * 60 + Number(minute));
  }

  /**
   * 分単位オフセットを "+05:30" 形式にする。
   * @param {number} offsetMinutes
   * @returns {string}
   */
  static formatOffset(offsetMinutes) {
    const sign = offsetMinutes < 0 ? '-' : '+';
    const abs = Math.abs(offsetMinutes);
    const hours = Math.floor(abs / 60);
    const minutes = abs % 60;
    return `${sign}${pad2(hours)}:${pad2(minutes)}`;
  }

  /**
   * 時刻あり前提の補正。applied は補正量0でも true。
   * 時差範囲外の検証は InputManager の責務（TC-09）。
   */
  correct({ year, month, day, hour, minute, prefectureCode, offsetMinutes }) {
    const offset = offsetMinutes ?? 0;
    const { longitudeOffsetMinutes, prefecture } = this._resolvePrefecture(prefectureCode);
    const totalOffsetMinutes = offset + longitudeOffsetMinutes;
    const input = { year, month, day, hour, minute };
    const corrected = DateUtils.addMinutes(year, month, day, hour, minute, totalOffsetMinutes);

    return {
      applied: true,
      input,
      corrected,
      offsetMinutes: offset,
      longitudeOffsetMinutes,
      totalOffsetMinutes,
      prefecture,
      display: {
        statusText: '適用',
        inputText: formatDateTime(input),
        offsetText: `${TimeCorrectionService.formatOffset(offset)}（${offset}分）`,
        longitudeText: this._formatLongitudeText(prefecture, longitudeOffsetMinutes),
        correctedText: formatDateTime(corrected),
      },
    };
  }

  _resolvePrefecture(prefectureCode) {
    if (prefectureCode == null || prefectureCode === '') {
      return { longitudeOffsetMinutes: 0, prefecture: null };
    }

    const pref = this.byCode.get(prefectureCode);
    if (!pref) {
      throw new CalculationError(`経度マスタに存在しない都道府県コードです: ${prefectureCode}`);
    }

    const reference = this.master.referenceMeridianEast;
    const longitudeOffsetMinutes = Math.round(4 * (pref.longitudeEast - reference));
    return {
      longitudeOffsetMinutes,
      prefecture: {
        code: pref.code,
        name: pref.name,
        longitudeEast: pref.longitudeEast,
      },
    };
  }

  _formatLongitudeText(prefecture, longitudeOffsetMinutes) {
    const minutesText = formatSignedMinutes(longitudeOffsetMinutes);
    if (!prefecture) {
      return minutesText;
    }
    return `${minutesText}（${prefecture.name} / 東経${prefecture.longitudeEast}°）`;
  }
}
