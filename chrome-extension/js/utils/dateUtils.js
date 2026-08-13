/**
 * 日付ユーティリティ
 * 暦演算は数値ベース。節気比較用 Date は JST epoch で扱う。
 */

import { InvalidDateError } from './errors.js';
import { JST_OFFSET_MS } from './constants.js';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function floorDiv(a, b) {
  return Math.floor(a / b);
}

function mod(a, b) {
  return ((a % b) + b) % b;
}

export class DateUtils {
  static isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  }

  static daysInMonth(year, month) {
    const mdays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (month < 1 || month > 12) {
      return 0;
    }
    if (month === 2 && this.isLeapYear(year)) {
      return 29;
    }
    return mdays[month - 1];
  }

  /**
   * 日付の妥当性をチェック（グレゴリオ暦。OS TZ非依存）
   */
  static isValidDate(year, month, day) {
    if (!year || !month || !day) {
      return false;
    }
    if (month < 1 || month > 12) {
      return false;
    }
    const dim = this.daysInMonth(year, month);
    return day >= 1 && day <= dim;
  }

  /**
   * JST暦の数値 → UTC epoch millis
   */
  static toJstEpochMillis(year, month, day, hour = 0, minute = 0) {
    return Date.UTC(year, month - 1, day, hour, minute) - JST_OFFSET_MS;
  }

  /**
   * 日加算（数値カレンダー。new Date 不使用）
   * @returns {{year:number, month:number, day:number}}
   */
  static addDays(year, month, day, deltaDays) {
    let y = year;
    let m = month;
    let d = day;
    let n = deltaDays;
    if (n >= 0) {
      d += n;
      while (d > this.daysInMonth(y, m)) {
        d -= this.daysInMonth(y, m);
        m += 1;
        if (m > 12) {
          m = 1;
          y += 1;
        }
      }
    } else {
      while (n < 0) {
        d -= 1;
        n += 1;
        if (d < 1) {
          m -= 1;
          if (m < 1) {
            m = 12;
            y -= 1;
          }
          d = this.daysInMonth(y, m);
        }
      }
    }
    return { year: y, month: m, day: d };
  }

  /**
   * 分加算（数値カレンダー）
   * @returns {{year:number, month:number, day:number, hour:number, minute:number}}
   */
  static addMinutes(year, month, day, hour, minute, deltaMinutes) {
    const minutesOfDay = hour * 60 + minute + deltaMinutes;
    const daysDelta = floorDiv(minutesOfDay, 1440);
    const minuteOfDay = mod(minutesOfDay, 1440);
    const hour2 = Math.floor(minuteOfDay / 60);
    const minute2 = minuteOfDay % 60;
    const date2 = this.addDays(year, month, day, daysDelta);
    return { ...date2, hour: hour2, minute: minute2 };
  }

  /**
   * 経過日数（小数を保持）。大運立運の距離に使う。
   */
  static getElapsedDays(date1, date2) {
    return (date2.getTime() - date1.getTime()) / MS_PER_DAY;
  }

  /**
   * JST暦日の整数差。大運距離には使わない。
   */
  static getCalendarDaysDifference(date1, date2) {
    const day1 = Math.floor((date1.getTime() + JST_OFFSET_MS) / MS_PER_DAY);
    const day2 = Math.floor((date2.getTime() + JST_OFFSET_MS) / MS_PER_DAY);
    return day2 - day1;
  }

  /**
   * @deprecated P3 で大運は getElapsedDays へ置換。現状は暦日差（日柱用）の互換エイリアス。
   */
  static getDaysDifference(date1, date2) {
    return this.getCalendarDaysDifference(date1, date2);
  }

  /**
   * ISO文字列をDateへ。オフセットは削除しない。
   */
  static parseISOString(isoString) {
    return new Date(isoString);
  }

  /**
   * 日付をフォーマット
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
   * JST暦の数値から Date（instant）を作成
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

    return new Date(this.toJstEpochMillis(year, month, day, hour, minute));
  }
}
