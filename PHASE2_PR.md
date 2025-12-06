# Phase 2: Core Calculation Engines - 四柱推命計算ロジック実装

## 概要
Phase 2では、四柱推命の計算ロジックをPythonアプリからJavaScriptに完全移植しました。

## 実装内容

### ✅ 完了した項目

#### 1. DateUtils (日付ユーティリティ)
- ✅ `isValidDate()` - 日付妥当性チェック
- ✅ `getDaysDifference()` - 日数差分計算
- ✅ `parseISOString()` - ISO文字列パース
- ✅ `formatDate()` - 日付フォーマット
- ✅ `createDate()` - 日付オブジェクト生成

#### 2. FortuneCalculator (四柱計算)
**年柱計算**
- ✅ `calculateYearPillar(year)` - 基本年柱計算: `(year - 1864) % 60`
- ✅ `calculateYearPillarWithDate()` - 立春境界を考慮した年柱計算

**月柱計算**
- ✅ `calculateMonthPillar()` - 節入り時刻を考慮した月柱計算
- ✅ `_determineMonthBranch()` - 12節気からの月支判定
- ✅ `_calculateMonthStem()` - 五虎遁年起月訣による月干計算

**日柱計算**
- ✅ `calculateDayPillar()` - 1900-01-01(甲戌, index 10)からの経過日数計算

**時柱計算**
- ✅ `calculateHourPillar()` - 23:00境界処理（23:00-00:59は翌日の子時）
- ✅ HOUR_STEM_TABLE による時干計算

**統合**
- ✅ `calculateFortune()` - 完全な命式計算
- ✅ `getHiddenStems()` - 蔵干取得
- ✅ `getSolarTermDateTime()` - 節気日時取得

#### 3. GreatFortuneCalculator (大運計算)
- ✅ `isYangYear()` - 陽年判定（甲丙戊庚壬）
- ✅ `isForwardProgression()` - 順行/逆行判定
  - (陽年 && 男性) || (陰年 && 女性) → 順行
  - (陽年 && 女性) || (陰年 && 男性) → 逆行
- ✅ `calculateStartAge()` - 開始年齢計算（節入りまでの日数 ÷ 3）
- ✅ `calculateCycles()` - 10サイクル生成（各10年）
- ✅ `_getNextSolarTerm()` / `_getPreviousSolarTerm()` - 節気取得
- ✅ `_buildJiaziMap()` - 六十甲子マッピング

#### 4. JuuniunCalculator (十二運計算)
- ✅ `calculateJuuniun()` - 日干×地支から十二運取得
- ✅ `calculateForPillars()` - 四柱全ての十二運計算
- ✅ `getJuuniunStrength()` - 強弱スコア（0-10）
- ✅ `isProsperous()` - 旺相判定（長生・冠帯・建禄・帝旺）
- ✅ `isWeak()` - 休囚死絶判定（衰・病・死・墓・絶）

#### 5. TsuuhenCalculator (通変星計算) ⭐ 新規実装
- ✅ `calculateTsuuhen()` - 五行関係×陰陽から通変星計算
- ✅ `calculateForPillars()` - 年柱・月柱・時柱の通変星
- ✅ `_getStemElement()` - 天干から五行取得
- ✅ `_getStemYinYang()` - 天干の陰陽判定
- ✅ `_getRelationship()` - 五行関係判定（生・剋）

**10通変星**:
- 比肩（同五行・同陰陽）
- 劫財（同五行・異陰陽）
- 食神（我生・同陰陽）
- 傷官（我生・異陰陽）
- 偏財（我剋・同陰陽）
- 正財（我剋・異陰陽）
- 偏官/七殺（剋我・同陰陽）
- 正官（剋我・異陰陽）
- 偏印（生我・同陰陽）
- 正印（生我・異陰陽）

#### 6. UI統合
- ✅ sidepanel.js に全計算エンジン統合
- ✅ 実際の計算結果表示
- ✅ 命式テーブルレンダリング
- ✅ 大運サイクル表示
- ✅ エラーハンドリング

## 主要アルゴリズム

### 年柱
```javascript
jiazi_index = (year - 1864) % 60
```

### 月柱
1. 節入り時刻で月支判定
2. 五虎遁で月干計算：年干 → 寅月の天干 → 月支で調整

### 日柱
```javascript
base_date = 1900-01-01 (甲戌, index 10)
jiazi_index = (days_from_base + 10) % 60
```

### 時柱
```javascript
hour_branch_index = ((hour + 1) % 24) // 2
hour_stem = HOUR_STEM_TABLE[day_stem][hour_branch_index]
```

### 大運
```javascript
start_age = Math.round(days_to_term / 3)
forward: month_jiazi_index + i + 1
backward: month_jiazi_index - i - 1
```

## テスト可能なケース

### 基本ケース
1. **1990-05-15 14:30 男性**
   - 年柱: 庚午
   - 月柱: 辛巳
   - 日柱: 甲戌
   - 時柱: 辛未

2. **2020-02-04 17:00 女性** (立春境界)
   - 立春前なら前年（己亥年）
   - 立春後なら当年（庚子年）

### 境界値ケース
3. **2000-12-31 23:30 男性** (23時台)
   - 時柱は翌日の子時として計算

4. **1900-01-01 12:00 男性** (基準日)
   - 日柱: 甲戌（BASE_DATE_JIAZI_INDEX = 10）

## ファイル構成

```
chrome-extension/
├── js/
│   ├── core/
│   │   ├── FortuneCalculator.js       (17KB, 549行)
│   │   ├── GreatFortuneCalculator.js  (11KB, 376行)
│   │   ├── JuuniunCalculator.js       (8KB, 244行)
│   │   └── TsuuhenCalculator.js       (7KB, 206行)
│   └── utils/
│       └── dateUtils.js               (3KB, 98行)
└── sidepanel.js                       (15KB, 461行)
```

## Pythonアプリとの対応

| Python | JavaScript |
|--------|-----------|
| `src/services/calculation.py` | `FortuneCalculator.js` |
| `src/services/great_fortune_calc.py` | `GreatFortuneCalculator.js` |
| `src/services/juuniun_calculator.py` | `JuuniunCalculator.js` |
| (なし) | `TsuuhenCalculator.js` ⭐新規 |

## 次のステップ (Phase 3)

Phase 2が完了したので、次はPhase 3（UI実装）に進みます：

### Phase 3 予定内容
- [ ] InputParser実装（クリップボード対応）
- [ ] ResultRenderer改善
- [ ] エラー表示の改善
- [ ] レスポンシブデザイン調整
- [ ] 和暦対応（オプション）

## チェックリスト
- [x] DateUtils実装
- [x] FortuneCalculator実装（四柱計算）
- [x] GreatFortuneCalculator実装（大運計算）
- [x] JuuniunCalculator実装（十二運計算）
- [x] TsuuhenCalculator実装（通変星計算）⭐新規
- [x] sidepanel.js統合
- [x] エラーハンドリング
- [x] Git コミット
- [x] リモートプッシュ
- [ ] Phase 1 PRマージ後、Phase 2 PRレビュー

## 関連ドキュメント
- `REQUIREMENTS.md` - 要件定義
- `ARCHITECTURE.md` - アーキテクチャ設計
- `IMPLEMENTATION_CHECKLIST.md` - 実装チェックリスト
- `PHASE2_PROGRESS.md` - Phase 2進捗管理
