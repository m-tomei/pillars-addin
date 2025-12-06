/**
 * データローダー
 * JSONファイルを読み込み、キャッシュする
 */

import { DataLoadError } from './errors.js';

export class DataLoader {
  constructor(basePath = './data/') {
    this.basePath = basePath;
    this.cache = new Map();
  }

  /**
   * JSONファイルを読み込む
   * @param {string} filename - ファイル名
   * @returns {Promise<Object>} JSONデータ
   */
  async loadJSON(filename) {
    // キャッシュチェック
    if (this.cache.has(filename)) {
      return this.cache.get(filename);
    }

    try {
      const response = await fetch(this.basePath + filename);
      
      if (!response.ok) {
        throw new DataLoadError(`Failed to load ${filename}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // キャッシュに保存
      this.cache.set(filename, data);
      
      return data;
    } catch (error) {
      if (error instanceof DataLoadError) {
        throw error;
      }
      throw new DataLoadError(`Error loading ${filename}: ${error.message}`);
    }
  }

  /**
   * 節気データを読み込む
   * @returns {Promise<Object>}
   */
  async loadSolarTerms() {
    return await this.loadJSON('solar_terms.json');
  }

  /**
   * 干支マスタデータを読み込む
   * @returns {Promise<Object>}
   */
  async loadStemBranchMaster() {
    return await this.loadJSON('stem_branch_master.json');
  }

  /**
   * 十二運マスタデータを読み込む
   * @returns {Promise<Object>}
   */
  async loadJuuniunMaster() {
    return await this.loadJSON('juuniin_master.json');
  }

  /**
   * 納音マスタデータを読み込む
   * @returns {Promise<Object>}
   */
  async loadNaonMaster() {
    return await this.loadJSON('naon_master.json');
  }

  /**
   * 五虎遁マスタデータを読み込む
   * @returns {Promise<Object>}
   */
  async loadGokotongetsuketsu() {
    return await this.loadJSON('gokotongetsuketsu.json');
  }

  /**
   * キャッシュをクリア
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 特定のファイルのキャッシュをクリア
   * @param {string} filename - ファイル名
   */
  clearCacheFor(filename) {
    this.cache.delete(filename);
  }
}
