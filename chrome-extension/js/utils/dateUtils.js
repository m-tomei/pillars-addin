/**
 * 日付ユーティリティ
 */

import { InvalidDateError } from './errors.js';

export class DateUtils {
  /**
   * 日付の妥当性をチェック
   * @param {number} year - 年
   * @param {number} month - 月 (1-12)
   * @param {number} day - 日
   * @returns {boolean}
   */
  static isValidDate(year, month, day) {
    if (!year || !month || !day) {
      return false;
    }

    const date = new Date(year, month - 1, day);
    
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /**
   * 2つの日付間の日数差を計算
   * @param {Date} date1 - 日付1
   * @param {Date} date2 - 日付2
   * @returns {number} 日数差（date2 - date1）
   */
  static getDaysDifference(date1, date2) {
    const msPerDay = 24 * 60 * 60 * 1000;
    const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
    const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
    
    return Math.floor((utc2 - utc1) / msPerDay);
  }

  /**
   * ISO文字列をDateオブジェクトに変換
   * @param {string} isoString - ISO 8601形式の文字列
   * @returns {Date}
   */
  static parseISOString(isoString) {
    const cleanString = isoString.replace(/\+\d{2}:\d{2}$/, '');
    return new Date(cleanString);
  }

  /**
   * 日付をフォーマット
   * @param {Date} date - 日付オブジェクト
   * @param {string} format - フォーマット
   * @returns {string}
   */
  static formatDate(date, format = 'YYYY-MM-DD') {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute);
  }

  /**
   * 日付を作成
   * @param {number} year - 年
   * @param {number} month - 月 (1-12)
   * @param {number} day - 日
   * @param {number} hour - 時
   * @param {number} minute - 分
   * @returns {Date}
   */
  static createDate(year, month, day, hour = 0, minute = 0) {
    if (!this.isValidDate(year, month, day)) {
      throw new InvalidDateError(`無効な日付です: ${year}-${month}-${day}`);
    }

    if (hour < 0 || hour > 23) {
      throw new InvalidDateError(`無効な時刻です: ${hour}時`);
    }

    if (minute < 0 || minute > 59) {
      throw new InvalidDateError(`無効な分です: ${minute}分`);
    }

    return new Date(year, month - 1, day, hour, minute, 0, 0);
  }
}
