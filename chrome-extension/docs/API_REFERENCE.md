# API Reference

四柱推命計算エンジンの主要なクラスとメソッドのリファレンスです。

## Core Modules

### FortuneCalculator

四柱推命の命式（年柱・月柱・日柱・時柱）を計算するコアクラス。

**Constructor:**
`new FortuneCalculator(dataLoader)`
- `dataLoader`: `DataLoader` インスタンス

**Methods:**
- `initialize(): Promise<void>`
  - 干支マスタと二十四節気データを読み込みます。
- `calculateFortune(year, month, day, hour, minute): Promise<FortuneResult>`
  - 指定された日時の命式を計算します。
  - 戻り値: `{ yearPillar, monthPillar, dayPillar, hourPillar }`

---

### GreatFortuneCalculator

大運（10年ごとの運勢）を計算するクラス。

**Constructor:**
`new GreatFortuneCalculator(fortuneCalculator)`
- `fortuneCalculator`: 初期化済みの `FortuneCalculator` インスタンス

**Methods:**
- `initialize(): Promise<void>`
  - 内部マップを構築します。
- `calculateCycles(birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, numCycles = 10): Cycle[]`
  - 大運サイクルを計算します。
  - `gender`: '男性' または '女性'

---

### JuuniunCalculator

十二運（Life Cycles）を計算するクラス。

**Methods:**
- `calculateJuuniun(dayStem, branch): { juuniun, meaning }`
  - 日干と地支から十二運を算出します。
- `calculateForPillars(dayStem, yearBranch, monthBranch, dayBranch, hourBranch): PillarsJuuniun`
  - 四柱すべての十二運を一括計算します。

---

### TsuuhenCalculator

通変星（Ten Gods / Transformations）を計算するクラス。

**Methods:**
- `calculateTsuuhen(dayStem, targetStem): { tsuuhen, relationship }`
  - 日干と対象の天干の関係から通変星を算出します。
- `calculateForPillars(dayStem, yearStem, monthStem, hourStem): PillarsTsuuhen`
  - 各柱（年・月・時）の通変星を一括計算します。

## UI Modules

### InputParser

ユーザー入力を解析・正規化するクラス。

**Methods:**
- `parse(text): ParsedInput`
  - テキスト（生年月日など）を解析し、構造化データを返します。
  - サポート形式: "1990-01-01 12:00", "19900101", 和暦など。

### ImageExporter

結果を画像(PNG)としてエクスポートするクラス。

**Methods:**
- `static exportToPNG(element, filename): Promise<void>`
  - 指定されたDOM要素を画像化し、ダウンロードをトリガーします。

## Utilities

### DataLoader

データファイル（JSON）を読み込むユーティリティ。

**Methods:**
- `loadSolarTerms(): Promise<Object>`
- `loadStemBranchMaster(): Promise<Object>`
