# Phase 2 進捗管理

## Phase 2: コア計算エンジン実装

### 目標
四柱推命の計算ロジックをJavaScriptで実装する

### 完了チェックリスト

#### ✅ Phase 1 (完了)
- [x] ディレクトリ構造作成
- [x] manifest.json作成
- [x] JSONデータファイルコピー
- [x] constants.js実装
- [x] errors.js実装
- [x] dataLoader.js実装
- [x] 基本UI実装

#### 🔄 Phase 2 (進行中)

##### 2.1 DateUtils実装
- [ ] DateUtils クラス作成
- [ ] isValidDate() メソッド
- [ ] getDaysDifference() メソッド
- [ ] parseISOString() メソッド
- [ ] 単体テスト

##### 2.2 FortuneCalculator実装
- [ ] FortuneCalculator クラス作成
- [ ] initialize() メソッド
- [ ] getHiddenStems() メソッド
- [ ] getSolarTermDateTime() メソッド
- [ ] calculateYearPillar() メソッド
- [ ] calculateYearPillarWithDate() メソッド（立春考慮）
- [ ] calculateMonthPillar() メソッド（節入り考慮）
- [ ] _determineMonthBranch() メソッド
- [ ] _calculateMonthStem() メソッド（五虎遁）
- [ ] calculateDayPillar() メソッド
- [ ] calculateHourPillar() メソッド
- [ ] calculateFortune() メソッド（統合）
- [ ] 単体テスト（20+ケース）

##### 2.3 GreatFortuneCalculator実装
- [ ] GreatFortuneCalculator クラス作成
- [ ] initialize() メソッド
- [ ] isYangYear() メソッド
- [ ] isForwardProgression() メソッド
- [ ] _getNextSolarTerm() メソッド
- [ ] _getPreviousSolarTerm() メソッド
- [ ] calculateStartAge() メソッド
- [ ] calculateCycles() メソッド
- [ ] _getJiaziIndex() メソッド
- [ ] 単体テスト（10+ケース）

##### 2.4 JuuniunCalculator実装
- [ ] JuuniunCalculator クラス作成
- [ ] initialize() メソッド
- [ ] calculateJuuniun() メソッド
- [ ] calculateForPillars() メソッド
- [ ] getJuuniunStrength() メソッド
- [ ] isProsperous() メソッド
- [ ] isWeak() メソッド
- [ ] 単体テスト（10+ケース）

##### 2.5 TsuuhenCalculator実装
- [ ] TsuuhenCalculator クラス作成
- [ ] _buildTsuuhenMap() メソッド
- [ ] _getStemElement() メソッド
- [ ] _getStemYinYang() メソッド
- [ ] _getRelationship() メソッド
- [ ] calculateTsuuhen() メソッド
- [ ] calculateForPillars() メソッド
- [ ] 単体テスト（10+ケース）

##### 2.6 統合とテスト
- [ ] 全計算エンジンの統合
- [ ] Pythonアプリとの結果比較（20+ケース）
- [ ] エラーケースのテスト
- [ ] パフォーマンス測定

### テストケース

#### 基本テストケース
1. 1990-05-15 14:30 男性
2. 2020-02-04 17:00 女性（立春境界）
3. 1900-01-01 12:00 男性（基準日）
4. 2000-12-31 23:30 女性（年末・23時台）
5. 1985-03-21 09:00 男性

#### 境界値テストケース
6. 立春前後（2月3-5日）
7. 各節気の境界
8. 23:00-01:00（時柱境界）
9. うるう年（2月29日）
10. 範囲外年（1899, 2101）

### 推定時間
- DateUtils: 2時間
- FortuneCalculator: 12-15時間
- GreatFortuneCalculator: 6-8時間
- JuuniunCalculator: 3-4時間
- TsuuhenCalculator: 4-5時間
- テスト: 5-6時間
- **合計: 32-40時間**

### 成功基準
- [ ] 全ての計算エンジンが正常動作
- [ ] Pythonアプリと結果が100%一致
- [ ] エラーハンドリングが適切
- [ ] パフォーマンス < 300ms

---

**最終更新**: 2025-12-06
**ステータス**: 進行中
