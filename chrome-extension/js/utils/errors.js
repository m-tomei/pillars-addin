/**
 * カスタムエラークラス
 */

/**
 * 基底エラークラス
 */
export class FortuneError extends Error {
  constructor(message) {
    super(message);
    this.name = 'FortuneError';
  }
}

/**
 * 無効な日付エラー
 */
export class InvalidDateError extends FortuneError {
  constructor(message) {
    super(message);
    this.name = 'InvalidDateError';
  }
}

/**
 * 計算エラー
 */
export class CalculationError extends FortuneError {
  constructor(message) {
    super(message);
    this.name = 'CalculationError';
  }
}

/**
 * データ読み込みエラー
 */
export class DataLoadError extends FortuneError {
  constructor(message) {
    super(message);
    this.name = 'DataLoadError';
  }
}

/**
 * 節気データ未発見エラー
 */
export class SolarTermNotFoundError extends FortuneError {
  constructor(message) {
    super(message);
    this.name = 'SolarTermNotFoundError';
  }
}
