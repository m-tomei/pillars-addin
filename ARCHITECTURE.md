# 四柱推命 Chrome拡張機能 アーキテクチャ設計書

**バージョン**: 1.0  
**作成日**: 2025-12-06  
**対象プロジェクト**: 四柱推命 Chrome Extension (Pillars Add-in)

---

## 目次

1. [全体アーキテクチャ](#全体アーキテクチャ)
2. [レイヤ構成](#レイヤ構成)
3. [ディレクトリ構造](#ディレクトリ構造)
4. [クラス設計](#クラス設計)
5. [データフロー](#データフロー)
6. [エラーハンドリング戦略](#エラーハンドリング戦略)
7. [パフォーマンス最適化](#パフォーマンス最適化)
8. [セキュリティ考慮事項](#セキュリティ考慮事項)
9. [テスト可能性](#テスト可能性)
10. [Chrome拡張機能固有設計](#chrome拡張機能固有設計)
11. [実装フェーズ](#実装フェーズ)

---

## 全体アーキテクチャ

### アーキテクチャ概要図

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome側パネル (UI層)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Presentation Layer (HTML/CSS/DOM操作)            │  │
│  │  ├─ side-panel.html (UIレイアウト)                   │  │
│  │  ├─ styles/ (CSS スタイルシート)                     │  │
│  │  └─ ui/ (DOMコンポーネント)                          │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Application Layer (ビジネスロジック調整)          │  │
│  │  ├─ AppController (入出力調整)                        │  │
│  │  ├─ InputManager (入力取得と検証)                     │  │
│  │  ├─ ResultFormatter (結果フォーマット)                │  │
│  │  └─ StateManager (状態管理)                          │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Domain Layer (計算ロジック・ドメイン)            │  │
│  │  ├─ FortuneCalculator (四柱計算)                     │  │
│  │  ├─ GreatFortuneCalculator (大運計算)                │  │
│  │  ├─ JuuniunCalculator (十二運計算)                   │  │
│  │  ├─ TsuuhenCalculator (通変星計算)                   │  │
│  │  ├─ StemBranchResolver (干支解析)                    │  │
│  │  └─ ValidationEngine (入力検証)                      │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │     Data Layer (データアクセス)                       │  │
│  │  ├─ DataLoader (マスタデータ読込)                    │  │
│  │  ├─ DataCache (キャッシング)                         │  │
│  │  ├─ ResourceLoader (リソースファイル管理)            │  │
│  │  └─ JSONParser (JSON解析)                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 相互作用フロー

```
ユーザー操作
    ↓
[InputParser] ← クリップボード/手動入力
    ↓
[ValidationEngine] ← 入力検証
    ↓
[FortuneCalculator] → [DataLoader] ← マスタデータ取得
    ↓
[JuuniunCalculator] ← 十二運計算
    ↓
[TsuuhenCalculator] ← 通変星計算
    ↓
[GreatFortuneCalculator] ← 大運計算
    ↓
[ResultFormatter] ← 結果フォーマット
    ↓
[ResultRenderer] → HTML/DOM
    ↓
[ImageExporter] (PNG出力時)
    ↓
ユーザーに表示/保存
```

---

## レイヤ構成

### 1. Presentation Layer (プレゼンテーション層)

**責務**: ユーザーインターフェースの表示と操作

**主要コンポーネント**:
- **side-panel.html**: サイドパネルのHTMLテンプレート
- **css/styles.css**: グローバルスタイル
- **css/components.css**: コンポーネント単位のスタイル
- **ui/FormRenderer.js**: フォーム表示コンポーネント
- **ui/ResultRenderer.js**: 結果表示コンポーネント

**責務詳細**:
- ユーザー入力フォームの表示
- 計算結果の整形と表示
- DOM操作とイベント処理
- UIの状態更新（ローディング、エラー表示）

### 2. Application Layer (アプリケーション層)

**責務**: ビジネスロジックの調整とデータフロー管理

**主要コンポーネント**:
- **core/AppController.js**: メインアプリケーションコントローラ
- **core/InputManager.js**: 入力値の取得と前処理
- **core/ResultFormatter.js**: 計算結果のフォーマット
- **core/StateManager.js**: アプリケーション状態管理

**責務詳細**:
- UIからの入力を取得し、Domain層に渡す
- Domain層からの結果を受け取り、Presentation層に渡す
- エラーハンドリングと例外処理
- 計算結果のキャッシング管理

### 3. Domain Layer (ドメイン層)

**責務**: ビジネスロジック（四柱推命計算）の実装

**主要コンポーネント**:
- **core/FortuneCalculator.js**: 四柱計算エンジン
- **core/GreatFortuneCalculator.js**: 大運計算エンジン
- **core/JuuniunCalculator.js**: 十二運計算エンジン
- **core/TsuuhenCalculator.js**: 通変星計算エンジン
- **core/StemBranchResolver.js**: 干支管理と変換
- **core/ValidationEngine.js**: 入力値検証

**責務詳細**:
- 四柱（年柱・月柱・日柱・時柱）の計算
- 大運の計算と進行方向の判定
- 十二運・通変星などの付与
- ビジネスルールの実装
- データ検証とドメイン例外の発生

### 4. Data Layer (データ層)

**責務**: マスタデータへのアクセスと管理

**主要コンポーネント**:
- **core/DataLoader.js**: JSONデータファイルの読込
- **core/DataCache.js**: データのメモリキャッシング
- **utils/ResourceLoader.js**: リソースファイル管理
- **data/*.json**: マスタデータファイル

**責務詳細**:
- JSONマスタデータの読込
- データのキャッシング管理
- リソースファイルのパス管理
- データフォーマットの変換

---

## ディレクトリ構造

```
pillars-addin/
├── manifest.json                    # Chrome拡張機能マニフェスト
├── ARCHITECTURE.md                  # このファイル
├── REQUIREMENTS.md                  # 要件定義書
├── README.md
│
├── src/
│   ├── index.js                     # メインエントリポイント
│   │
│   ├── core/                        # ドメイン層・データ層
│   │   ├── FortuneCalculator.js     # 四柱計算エンジン
│   │   ├── GreatFortuneCalculator.js # 大運計算エンジン
│   │   ├── JuuniunCalculator.js     # 十二運計算エンジン
│   │   ├── TsuuhenCalculator.js     # 通変星計算エンジン
│   │   ├── StemBranchResolver.js    # 干支管理
│   │   ├── ValidationEngine.js      # 入力検証
│   │   ├── DataLoader.js            # マスタデータ読込
│   │   ├── DataCache.js             # キャッシング
│   │   └── Constants.js             # 定数定義
│   │
│   ├── ui/                          # プレゼンテーション層
│   │   ├── FormRenderer.js          # フォーム表示
│   │   ├── ResultRenderer.js        # 結果表示
│   │   ├── ImageExporter.js         # PNG出力
│   │   └── ComponentManager.js      # UI コンポーネント管理
│   │
│   ├── app/                         # アプリケーション層
│   │   ├── AppController.js         # メインコントローラ
│   │   ├── InputManager.js          # 入力管理
│   │   ├── ResultFormatter.js       # 結果フォーマット
│   │   ├── StateManager.js          # 状態管理
│   │   └── EventBus.js              # イベント駆動
│   │
│   ├── utils/                       # ユーティリティ
│   │   ├── DateUtils.js             # 日付ユーティリティ
│   │   ├── StringUtils.js           # 文字列ユーティリティ
│   │   ├── ClipboardParser.js       # クリップボード解析
│   │   ├── Logger.js                # ロギング
│   │   ├── Constants.js             # グローバル定数
│   │   ├── Errors.js                # エラークラス定義
│   │   └── Validators.js            # 検証関数集
│   │
│   └── data/                        # マスタデータ
│       ├── stem_branch_master.json  # 干支マスタ
│       ├── solar_terms.json         # 節入り時刻データ（大規模）
│       ├── juuniin_master.json      # 十二運マスタ
│       ├── tsuuhen_master.json      # 通変星マスタ
│       ├── naon_master.json         # 納音マスタ
│       └── gokotongetsuketsu.json   # 五行月建日月マスタ
│
├── public/                          # 静的ファイル
│   ├── side-panel.html              # サイドパネルHTML
│   ├── styles/
│   │   ├── main.css                 # メインスタイル
│   │   ├── components.css           # コンポーネントスタイル
│   │   ├── responsive.css           # レスポンシブスタイル
│   │   └── theme.css                # テーマカラー
│   ├── images/
│   │   ├── icon-16.png              # 拡張機能アイコン
│   │   ├── icon-48.png
│   │   ├── icon-128.png
│   │   └── logo.svg
│   └── scripts/
│       ├── side-panel.js            # サイドパネル初期化スクリプト
│       └── content-script.js        # コンテンツスクリプト（将来用）
│
├── tests/                           # テストスイート
│   ├── unit/
│   │   ├── FortuneCalculator.test.js
│   │   ├── GreatFortuneCalculator.test.js
│   │   ├── JuuniunCalculator.test.js
│   │   ├── TsuuhenCalculator.test.js
│   │   ├── ValidationEngine.test.js
│   │   └── DataLoader.test.js
│   ├── integration/
│   │   ├── FullCalculation.test.js
│   │   └── DataFlow.test.js
│   └── fixtures/
│       ├── sample_inputs.js         # テストデータ
│       └── expected_outputs.js
│
├── docs/                            # ドキュメント
│   ├── calculation-algorithm.md     # 計算アルゴリズム詳細
│   ├── data-format.md               # データフォーマット仕様
│   └── api-reference.md             # APIリファレンス
│
└── package.json                     # 依存関係管理（将来用）
```

---

## クラス設計

### 1. FortuneCalculator（四柱計算）

**責務**: 生年月日時から四柱（年柱・月柱・日柱・時柱）を計算

```javascript
class FortuneCalculator {
  // プロパティ
  - stemBranchData: Object          // 干支マスタデータ
  - solarTermsData: Object          // 節入り時刻データ
  - cache: Map<string, Object>      // 計算キャッシュ

  // コンストラクタ
  + constructor(dataLoader: DataLoader, cache: DataCache)

  // 公開メソッド
  + calculateFourPillars(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number
    ): Promise<FourPillarsResult>

  + calculateYearPillar(year: number): Promise<Pillar>
    // 年柱計算: (year - 1864) % 60 で六十甲子を算出
    // 立春を考慮した年柱計算

  + calculateMonthPillar(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number
    ): Promise<Pillar>
    // 月柱計算: 節入り時刻を基準に月支を判定
    // 五虎遁によって月干を計算

  + calculateDayPillar(
      year: number,
      month: number,
      day: number
    ): Promise<Pillar>
    // 日柱計算: 基準日（1900-01-01 = 甲戌）からの日数で算出
    // (days + 10) % 60 で六十甲子を決定

  + calculateHourPillar(
      hour: number,
      minute: number,
      dayMaster: string
    ): Promise<Pillar>
    // 時柱計算: 23:00を境界に前日の干支を使用
    // 五虎遁によって時干を計算

  + getHiddenStems(branch: string): Promise<string[]>
    // 地支から蔵干を取得

  + getSolarTermDateTime(year: number, termName: string): Promise<Date>
    // 指定年の節入り時刻を取得

  // プライベートメソッド
  - _loadStemBranchData(): Promise<Object>
  - _loadSolarTermsData(): Promise<Object>
  - _calculateCacheKey(...args): string
  - _validateInputs(year, month, day, hour, minute): void
}
```

**Key Algorithms**:

1. **年柱計算**
   ```
   年柱インデックス = (西暦年 - 1864) % 60
   六十甲子[インデックス] から 天干・地支を取得
   ```

2. **月柱計算**
   - 節入り時刻をマスタデータから取得
   - 入力日時が前の節か後の節かで月支を判定
   - 月干は「五虎遁」を使用して年干から計算
   ```
   月干テーブル = {
     甲年,乙年 → 寅月: 丙, 卯月: 丁, 辰月: 戊, ...
     丙年,丁年 → 寅月: 戊, 卯月: 己, 辰月: 庚, ...
     ...
   }
   ```

3. **日柱計算**
   - 基準日: 1900-01-01 = 甲戌 (インデックス: 10)
   - 与えられた日付までの日数を計算
   ```
   日柱インデックス = (1900-01-01からの日数 + 10) % 60
   ```

4. **時柱計算**
   - 23:00を境界に日の切り替え判定
   - 時支は固定: 子(23-01), 丑(01-03), ..., 亥(21-23)
   - 時干は五虎遁を使用して日干から計算

### 2. GreatFortuneCalculator（大運計算）

**責務**: 生年月日と性別から大運を計算

```javascript
class GreatFortuneCalculator {
  // プロパティ
  - fortuneCalculator: FortuneCalculator
  - jiziMap: Map<string, number>          // 六十甲子インデックスマップ
  - cache: DataCache

  // コンストラクタ
  + constructor(fortuneCalculator: FortuneCalculator, cache: DataCache)

  // 公開メソッド
  + calculateGreatFortune(
      year: number,
      month: number,
      day: number,
      gender: string,
      roundingMethod: string = "round"
    ): Promise<GreatFortuneResult>
    // 大運全体を計算

  + calculateStartAge(
      year: number,
      month: number,
      day: number,
      gender: string,
      roundingMethod: string = "round"
    ): Promise<number>
    // 大運開始年齢を計算

  + isForwardProgression(birth_year: number, gender: string): boolean
    // 順行/逆行を判定
    // 男性 ∧ 陽年 → 順行
    // 男性 ∧ 陰年 → 逆行
    // 女性 ∧ 陰年 → 順行
    // 女性 ∧ 陽年 → 逆行

  + generateGreatFortuneCycles(
      monthPillar: Pillar,
      startAge: number,
      isForward: boolean,
      cycleCount: number = 10
    ): Promise<GreatFortuneCycle[]>
    // 大運サイクルを生成（各サイクル10年）

  + calculateDaysToNextSolarTerm(
      year: number,
      month: number,
      day: number,
      isForward: boolean
    ): Promise<number>
    // 次の節入り（順行）または前の節入り（逆行）までの日数

  // プライベートメソッド
  - _getYearStem(year: number): string
  - _isYangYear(year: number): boolean
  - _roundAge(days: number, method: string): number
  - _getNextJiazi(currentJiazi: string, isForward: boolean): string
}
```

**Key Algorithms**:

1. **順行/逆行判定**
   ```javascript
   const isYangYear = (year) => {
     const stem = getYearStem(year);
     return ['甲', '丙', '戊', '庚', '壬'].includes(stem);
   };

   const isForward = (gender, isYangYear) => {
     if (gender === '男性') return isYangYear;
     if (gender === '女性') return !isYangYear;
   };
   ```

2. **開始年齢計算**
   ```javascript
   // 生日から次/前の節入り日までの日数
   const days = calculateDaysToSolarTerm(birth_date, isForward);
   const age = roundingMethod === 'round'
     ? Math.round(days / 3)
     : Math.ceil(days / 3);
   ```

3. **大運サイクル生成**
   ```javascript
   // 月柱から開始する大運を生成
   let currentJiazi = monthPillar;
   for (let i = 0; i < 10; i++) {
     const cycle = {
       number: i + 1,
       jiazi: currentJiazi,
       ageStart: startAge + (i * 10),
       ageEnd: startAge + ((i + 1) * 10) - 1
     };
     currentJiazi = isForward ? next(currentJiazi) : prev(currentJiazi);
   }
   ```

### 3. JuuniunCalculator（十二運計算）

**責務**: 日干と地支の組み合わせから十二運を取得

```javascript
class JuuniunCalculator {
  // プロパティ
  - juuniunData: Map<string, Map<string, string>>  // 十二運テーブル
  - meanings: Map<string, string>                  // 十二運の意味
  - cache: DataCache

  // コンストラクタ
  + constructor(dataLoader: DataLoader, cache: DataCache)

  // 公開メソッド
  + calculateJuuniun(dayStem: string, branch: string): Promise<Juuniun>
    // 単一の十二運を計算
    // 入力: 日干（甲-癸）、地支（子-亥）
    // 出力: 十二運名（長生、沐浴、...）

  + calculateForAllPillars(
      dayStem: string,
      yearBranch: string,
      monthBranch: string,
      dayBranch: string,
      hourBranch: string
    ): Promise<PillarsJuuniun>
    // 四柱全ての十二運を一括計算

  + getJuuniunMeaning(juuniunName: string): string
    // 十二運の詳細説明を取得

  // プライベートメソッド
  - _loadJuuniunData(): Promise<Object>
  - _validateInputs(stem, branch): void
}
```

**十二運テーブル例**:
```
日干: 甲 の場合
  子支: 沐浴, 丑支: 冠帯, 寅支: 建禄, 卯支: 帝旺, ...

十二運の流れ（例：甲干）:
子 → 沐浴（成長期・不安定）
丑 → 冠帯（成人・発展準備）
寅 → 建禄（仕事開始・独立準備）
卯 → 帝旺（絶頂期・最強）
辰 → 衰（衰退開始）
...
```

### 4. TsuuhenCalculator（通変星計算）**[NEW - 新規実装]**

**責務**: 日干と四柱の関係から通変星（比肩・劫財・食神...など）を計算

```javascript
class TsuuhenCalculator {
  // プロパティ
  - tsuuhenData: Map<string, Object>      // 通変星マスタ
  - relationshipMatrix: Map<string, string> // 干支関係行列
  - cache: DataCache

  // コンストラクタ
  + constructor(dataLoader: DataLoader, cache: DataCache)

  // 公開メソッド
  + calculateTsuuhen(
      dayStem: string,
      targetStem: string,
      targetBranch: string
    ): Promise<Tsuuhen>
    // 単一の通変星を計算
    // 入力: 日干、対象天干、対象地支
    // 出力: 通変星と詳細情報

  + calculateForAllPillars(
      dayStem: string,
      yearPillar: Pillar,
      monthPillar: Pillar,
      dayPillar: Pillar,
      hourPillar: Pillar
    ): Promise<PillarsTsuuhen>
    // 四柱全ての通変星を一括計算

  + calculateGanAndZhi(
      dayStem: string,
      targetStem: string,
      targetBranch: string
    ): Promise<GanZhiAnalysis>
    // 天干と地支の関係を個別に分析
    // 返却: { gan: "比肩", zhi: "敵", combined: ... }

  + getRelationshipType(dayStem: string, targetStem: string): string
    // 天干同士の関係を取得
    // 返却: "同", "生", "剋", "被剋", "洩"

  + getStrengthAnalysis(tsuuhen: Tsuuhen): StrengthAnalysis
    // 通変星の強弱分析を取得

  // プライベートメソッド
  - _loadTsuuhenData(): Promise<Object>
  - _analyzeGanRelationship(dayStem, targetStem): string
  - _analyzeZhiRelationship(dayBranch, targetBranch): string
  - _validateInputs(dayStem, targetStem, targetBranch): void
}
```

**通変星の分類**:
```
十干関係による分類（日干を基準）:

同 (同じ干)
  ├─ 比肩（陽-陽, 陰-陰）
  └─ 劫財（異陰陽）

生 (生じる)
  ├─ 食神（日干が生じる）
  └─ 傷官（日干が生じる）

剋 (剋する)
  ├─ 偏財（日干が剋する）
  └─ 正財（日干が剋する）

被剋 (剋される)
  ├─ 偏官・七殺（日干が剋される）
  └─ 正官（日干が剋される）

洩 (洩れ出す)
  ├─ 偏印（日干から洩れる）
  └─ 正印（日干から洩れる）

組み合わせ:
  10天干 × 12地支の関係 = 複雑な相互作用
```

### 5. DataLoader（データロード）

**責務**: JSON マスタデータの読込とキャッシング

```javascript
class DataLoader {
  // プロパティ
  - cache: DataCache
  - resourcePath: string              // リソースベースパス
  - loadedData: Map<string, Object>   // 読込済みデータ
  - loadingPromises: Map<string, Promise> // 読込中の Promise

  // コンストラクタ
  + constructor(resourcePath: string, cache: DataCache)

  // 公開メソッド
  + loadStemBranchMaster(): Promise<Object>
    // stem_branch_master.json を読込
    // 返却: { sixty_jiazi: [...], stems: {...}, branches: {...} }

  + loadSolarTerms(): Promise<Object>
    // solar_terms.json を読込 (大規模)
    // 返却: { years: { "2020": { terms: {...} }, ... } }

  + loadJuuniunMaster(): Promise<Object>
    // juuniin_master.json を読込
    // 返却: { data: {...}, reference: {...} }

  + loadTsuuhenMaster(): Promise<Object>
    // tsuuhen_master.json を読込
    // 返却: { tsuuhen: {...}, relationships: {...} }

  + loadNaonMaster(): Promise<Object>
    // naon_master.json を読込
    // 返却: { naon: {...} }

  + loadGokotongetsuketsuMaster(): Promise<Object>
    // gokotongetsuketsu.json を読込

  + loadAllMasterData(): Promise<Object>
    // 全マスタデータを一括読込
    // 返却: { stems: {...}, solar_terms: {...}, ... }

  + isDataLoaded(dataKey: string): boolean
    // 指定データが読込済みか確認

  + clearCache(): void
    // キャッシュをクリア

  // プライベートメソッド
  - _loadJsonFile(filename: string): Promise<Object>
  - _validateJsonFormat(data: Object, schema: Object): boolean
  - _getCacheKey(filename: string): string
}
```

**特殊考慮**:
- **solar_terms.json** は約 200KB と大規模なため、遅延読込を実装
- データは初回読込後、メモリキャッシュに保持
- 複数の FortuneCalculator インスタンスでデータを共有

### 6. InputParser（入力解析）

**責務**: ユーザー入力（手動・クリップボード）を解析

```javascript
class InputParser {
  // 公開メソッド
  + parseManualInput(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number,
      gender: string,
      location?: string
    ): Promise<ParsedInput>
    // 手動入力を解析

  + parseClipboardText(text: string): Promise<ParsedInput>
    // クリップボード テキストを解析
    // パターン例:
    //   "1990-05-15 14:30 東京"
    //   "1990/5/15 14:30"
    //   "1990年5月15日 14:30"
    //   "1990 5 15 14:30"
    //   "1990-05-15 14:30:00 JST"

  + extractDateFromFreeText(text: string): Promise<ParsedDate>
    // 自由形式テキストから日付を抽出
    // 曜日や説明を無視して日時情報のみ抽出

  + validateParsedInput(input: ParsedInput): ValidationResult
    // 解析結果を検証
    // エラー: 無効な日付、範囲外など

  // プライベートメソッド
  - _parseDate(dateStr: string): ParsedDate
  - _parseTime(timeStr: string): ParsedTime
  - _matchDatePattern(text: string): RegExpMatchArray | null
  - _matchTimePattern(text: string): RegExpMatchArray | null
  - _parseJapaneseDate(text: string): ParsedDate
  - _normalizeDate(parsed: ParsedDate): ParsedDate
}
```

**対応フォーマット例**:
```javascript
// 対応入力形式
"1990-05-15 14:30 東京"
"1990/5/15 14:30:00"
"1990年5月15日 14時30分"
"昭和65年5月15日 午後2時30分"
"1990.5.15 14:30"
"May 15, 1990 2:30 PM"
```

### 7. ResultRenderer（結果表示）

**責務**: 計算結果を HTML にレンダリング

```javascript
class ResultRenderer {
  // プロパティ
  - container: HTMLElement
  - template: HTMLTemplateElement

  // コンストラクタ
  + constructor(container: HTMLElement)

  // 公開メソッド
  + renderFourPillars(fourPillars: FourPillarsResult): void
    // 四柱を HTML にレンダリング
    // 表示内容:
    //   年柱: [天干][地支] (蔵干: ...)
    //   月柱: [天干][地支] (蔵干: ...)
    //   ...

  + renderGreatFortune(greatFortune: GreatFortuneResult): void
    // 大運を HTML にレンダリング
    // 表示内容:
    //   開始年齢, 順行/逆行, 10サイクル（各10年）

  + renderJuuniun(juuniunData: PillarsJuuniun): void
    // 十二運を HTML にレンダリング

  + renderTsuuhen(tsuuhenData: PillarsTsuuhen): void
    // 通変星を HTML にレンダリング

  + renderFullResult(result: CalculationResult): void
    // 全結果を一括レンダリング

  + renderError(error: Error): void
    // エラーメッセージをレンダリング

  + clearResult(): void
    // 結果を消去

  + showLoadingState(): void
    // ローディング中の表示

  + hideLoadingState(): void
    // ローディング表示を消去

  // プライベートメソッド
  - _createPillarHtml(pillar: Pillar, hiddenStems: string[]): string
  - _createGreatFortuneCycleHtml(cycle: GreatFortuneCycle): string
  - _createJuuniunHtml(juuniun: Juuniun): string
  - _createTsuuhenHtml(tsuuhen: Tsuuhen): string
  - _sanitizeHtml(html: string): string
}
```

### 8. ImageExporter（PNG 出力）

**責務**: 画面内容を PNG 画像で出力

```javascript
class ImageExporter {
  // プロパティ
  - htmlToCanvas: Function          // html2canvas ライブラリ

  // コンストラクタ
  + constructor()

  // 公開メソッド
  + exportToPNG(
      element: HTMLElement,
      filename: string,
      scale?: number
    ): Promise<void>
    // 指定要素を PNG で出力
    // 出力: ダウンロード開始

  + exportFourPillarsPNG(result: FourPillarsResult): Promise<void>
    // 四柱部分を PNG で出力

  + exportGreatFortunePNG(result: GreatFortuneResult): Promise<void>
    // 大運部分を PNG で出力

  + exportFullResultPNG(result: CalculationResult): Promise<void>
    // 全結果を PNG で出力

  + generateDataUrl(element: HTMLElement): Promise<string>
    // 要素から Data URL を生成（プレビュー用）

  // プライベートメソッド
  - _downloadBlob(blob: Blob, filename: string): void
  - _generateFilename(prefix: string): string
  - _configureCanvasOptions(): Object
}
```

---

## データフロー

### 1. 初期化フロー

```
アプリケーション起動
    ↓
manifest.json読込 ← Chrome実行環境
    ↓
side-panel.html レンダリング
    ↓
side-panel.js 実行
    ↓
[AppController] 初期化
    ↓
[DataLoader.loadAllMasterData()]
    ├─ stem_branch_master.json
    ├─ solar_terms.json
    ├─ juuniin_master.json
    ├─ tsuuhen_master.json
    └─ naon_master.json
    ↓
[DataCache] メモリに保持
    ↓
[FormRenderer] フォーム表示
    ↓
ユーザー操作待機
```

### 2. 計算フロー

```
ユーザー入力（手動/クリップボード）
    ↓
[InputParser] 入力解析
    ↓
[ValidationEngine] 検証
    ├─ 日付範囲チェック（1900-2100年）
    ├─ 月日の妥当性
    ├─ 時刻の妥当性
    └─ 性別の妥当性
    ↓ (エラー時)
    [ResultRenderer.renderError()]
    ↓
[AppController.startCalculation()]
    ↓
[FortuneCalculator.calculateFourPillars()]
    ├─ calculateYearPillar()
    │  └─ データロード: stem_branch_master.json
    ├─ calculateMonthPillar()
    │  └─ データロード: solar_terms.json (年による遅延読込)
    ├─ calculateDayPillar()
    │  └─ 基準日（1900-01-01）からの日数計算
    └─ calculateHourPillar()
       ├─ 時支の決定
       └─ 五虎遁で時干を計算
    ↓
[JuuniunCalculator.calculateForAllPillars()]
    ├─ 日干と各柱の地支から十二運を取得
    └─ データロード: juuniin_master.json
    ↓
[TsuuhenCalculator.calculateForAllPillars()]
    ├─ 日干と各柱の干支から通変星を取得
    └─ データロード: tsuuhen_master.json
    ↓
[GreatFortuneCalculator.calculateGreatFortune()]
    ├─ isForwardProgression() で順行/逆行を判定
    ├─ calculateStartAge() で開始年齢を計算
    └─ generateGreatFortuneCycles() で10サイクルを生成
    ↓
[ResultFormatter] 結果をフォーマット
    ├─ 四柱情報の整形
    ├─ 大運サイクルのテーブル化
    └─ JSON構造化
    ↓
[ResultRenderer] HTML にレンダリング
    ├─ 四柱表示
    ├─ 大運表示
    ├─ 十二運表示
    └─ 通変星表示
    ↓
[StateManager] 結果をメモリに保持
    ↓
ユーザーに表示
    ↓
(PNG出力時)
[ImageExporter.exportToPNG()]
    ├─ html2canvas で描画
    └─ ダウンロード開始
```

### 3. エラーハンドリングフロー

```
例外発生
    ↓
[try-catch] キャッチ
    ↓
例外タイプの判定
    ├─ ValidationError
    │  ├─ 原因: 入力値が不正
    │  └─ メッセージ例: "無効な日付です"
    ├─ RangeError
    │  ├─ 原因: 年が計算範囲外
    │  └─ メッセージ例: "計算可能範囲は1900-2100年です"
    ├─ DataLoadError
    │  ├─ 原因: マスタデータ読込失敗
    │  └─ メッセージ例: "データファイルが見つかりません"
    ├─ CalculationError
    │  ├─ 原因: 計算エラー
    │  └─ メッセージ例: "計算処理でエラーが発生しました"
    └─ UnexpectedError
       ├─ 原因: 予期しないエラー
       └─ メッセージ例: "予期しないエラーが発生しました"
    ↓
[Logger.error()] ロギング
    ↓
[ResultRenderer.renderError()] ユーザーに通知
    ↓
UI を初期状態に戻す
```

---

## エラーハンドリング戦略

### Custom Error Classes

```javascript
// ベースエラークラス
class FourPillarsError extends Error {
  constructor(message: string, code: string) {
    super(message);
    this.name = 'FourPillarsError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

// 入力値エラー
class ValidationError extends FourPillarsError {
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// 範囲外エラー
class RangeError extends FourPillarsError {
  constructor(message: string, min?: number, max?: number) {
    super(message, 'RANGE_ERROR');
    this.min = min;
    this.max = max;
  }
}

// データ読込エラー
class DataLoadError extends FourPillarsError {
  constructor(message: string, filename?: string) {
    super(message, 'DATA_LOAD_ERROR');
    this.filename = filename;
  }
}

// 計算エラー
class CalculationError extends FourPillarsError {
  constructor(message: string, step?: string) {
    super(message, 'CALCULATION_ERROR');
    this.step = step;
  }
}

// 予期しないエラー
class UnexpectedError extends FourPillarsError {
  constructor(message: string, originalError?: Error) {
    super(message, 'UNEXPECTED_ERROR');
    this.originalError = originalError;
  }
}
```

### エラーメッセージの設計

| エラータイプ | メッセージ例 | ユーザー表示 | ログレベル |
|---|---|---|---|
| ValidationError | "年は1900-2100の範囲で入力してください" | 表示 | WARN |
| RangeError | "計算可能範囲は1900年〜2100年です" | 表示 | WARN |
| DataLoadError | "必要なデータファイルが見つかりません" | 表示 | ERROR |
| CalculationError | "年柱計算でエラーが発生しました" | 「計算に失敗しました」と簡潔表示 | ERROR |
| UnexpectedError | "予期しないエラーが発生しました" | 「システムエラー」と表示 | ERROR |

### エラーリカバリー戦略

1. **入力値エラー**
   - ユーザーに詳細メッセージを表示
   - フォームをハイライト
   - 修正を促す

2. **データ読込エラー**
   - リトライロジックを実装（最大3回）
   - オフラインの場合を想定（サービスワーカー）
   - フォールバックデータの使用

3. **計算エラー**
   - 部分的な結果を表示可能か判定
   - ログに詳細情報を記録
   - ユーザーには簡潔なメッセージを表示

---

## パフォーマンス最適化

### 1. Data Caching（データキャッシング）

```javascript
class DataCache {
  // メモリキャッシュ
  - cache: Map<string, CacheEntry>
  - maxSize: number = 100 * 1024 * 1024  // 100MB
  - currentSize: number

  // コンストラクタ
  + constructor(maxSize?: number)

  // 公開メソッド
  + get(key: string): Object | null
  + set(key: string, value: Object, ttl?: number): void
  + has(key: string): boolean
  + clear(): void
  + getStats(): CacheStats

  // プライベートメソッド
  - _evictOldest(): void
  - _validateMemoryUsage(): void
}

// キャッシュ戦略
const cacheStrategy = {
  'stem_branch_master': {
    ttl: null,              // 永続的にキャッシュ
    priority: 'high'
  },
  'solar_terms': {
    ttl: 24 * 60 * 60,      // 24時間
    priority: 'high'
  },
  'calculation_results': {
    ttl: 60 * 60,           // 1時間
    priority: 'low'
  }
};
```

**キャッシング対象**:
- **永続キャッシュ**: stem_branch_master.json, juuniin_master.json, tsuuhen_master.json
- **セッションキャッシュ**: 計算結果（タブを閉じるとクリア）
- **短期キャッシュ**: solar_terms.json（24時間有効）

### 2. Lazy Loading（遅延読込）

```javascript
// solar_terms.json は大規模なため遅延読込
class LazyDataLoader {
  + loadSolarTermsLazy(year: number): Promise<Object>
    // 必要な年のデータのみ読込
    // 例: 2020年のデータが必要 → 2020年分のみ取得

  + preloadAdjacentYears(year: number): Promise<void>
    // 前後の年も先読み（バックグラウンド）
}
```

### 3. Calculation Optimization（計算最適化）

```javascript
// 計算結果のメモ化
class MemoizedCalculator {
  - cache: Map<string, any>

  + calculateFourPillars(
      year: number,
      month: number,
      day: number,
      hour: number,
      minute: number
    ): Promise<FourPillarsResult>
    // 入力値をキーにキャッシュ
    // 同じ入力で複数回計算しない
}
```

### 4. DOM Rendering Optimization（DOM描画最適化）

```javascript
// Virtual DOM的なアプローチ
class VirtualRenderer {
  + renderBatch(updates: Update[]): void
    // requestAnimationFrame を使用した最適化

  + debounceRender(fn: Function, delay: number): void
    // 短時間での複数描画を統合
}

// React/Vue の Fragment 的パターン
const renderPillars = (fourPillars) => {
  const fragment = document.createDocumentFragment();
  // fragment に複数要素を追加
  // 最後に一度 DOM に追加
};
```

### 5. パフォーマンス指標

| 処理 | 目標 | 実現方法 |
|---|---|---|
| アプリ起動 | < 1.5秒 | 初期データの遅延読込 |
| 四柱計算 | < 300ms | メモ化・キャッシング |
| 大運計算 | < 500ms | 効率的なアルゴリズム |
| 結果表示 | < 200ms | 仮想DOM・バッチ更新 |
| PNG出力 | < 2秒 | Canvas最適化 |

---

## セキュリティ考慮事項

### 1. Content Security Policy（CSP）

**manifest.json での設定**:
```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

**実装**:
- インライン JavaScript を使用しない
- `eval()` を使用しない
- 外部スクリプト読込は HTTPS のみ

### 2. 入力サニタイズ

```javascript
class InputSanitizer {
  + sanitizeText(input: string): string
    // HTML特殊文字をエスケープ
    // XSS対策

  + sanitizeNumber(input: string): number
    // 数値入力のみ許可

  + sanitizeDate(input: string): Date
    // 日付フォーマットを検証
}
```

### 3. DOM操作の安全性

```javascript
// 危険: 直接 HTML を挿入
// element.innerHTML = '<div>' + userData + '</div>';

// 安全: テキストノードを挿入
const element = document.createElement('div');
element.textContent = userData;
container.appendChild(element);

// または sanitizeHTML を使用
const sanitized = DOMPurify.sanitize(userData);
element.innerHTML = sanitized;
```

### 4. データのプライバシー

- **ローカル保存なし**: セッション終了時にメモリから削除
- **通信なし**: すべての計算はローカルで実行
- **Cookie 未使用**: 状態はメモリのみ

### 5. リソースファイルの検証

```javascript
class ResourceValidator {
  + validateJsonSchema(data: Object, schema: Object): boolean
    // JSON スキーマを検証

  + validateDataIntegrity(data: Object): boolean
    // データの完全性をチェック（オプション: チェックサムなど）
}
```

### 6. 権限管理

**必要な Chrome 権限**:
```json
{
  "permissions": [
    "sidePanel"
  ]
}
```

- 最小限の権限のみ要求
- ネットワークアクセス不要
- タブ読取りアクセス不要

---

## テスト可能性

### テスト戦略

#### Unit Tests（ユニットテスト）

```javascript
// FortuneCalculator.test.js
describe('FortuneCalculator', () => {
  let calculator;
  let mockDataLoader;

  beforeEach(() => {
    mockDataLoader = createMockDataLoader();
    calculator = new FortuneCalculator(mockDataLoader);
  });

  describe('calculateYearPillar', () => {
    test('1990年は庚午年', async () => {
      const [stem, branch] = await calculator.calculateYearPillar(1990);
      expect(stem).toBe('庚');
      expect(branch).toBe('午');
    });

    test('1900年は庚子年', async () => {
      const [stem, branch] = await calculator.calculateYearPillar(1900);
      expect(stem).toBe('庚');
      expect(branch).toBe('子');
    });

    test('範囲外の年はエラー', async () => {
      await expect(
        calculator.calculateYearPillar(1800)
      ).rejects.toThrow(RangeError);
    });
  });

  describe('calculateMonthPillar', () => {
    test('1990年5月15日は午月', async () => {
      const [stem, branch] = await calculator.calculateMonthPillar(
        1990, 5, 15, 14, 30
      );
      expect(branch).toBe('午');
    });
  });

  describe('calculateDayPillar', () => {
    test('1900年1月1日は甲戌日', async () => {
      const [stem, branch] = await calculator.calculateDayPillar(
        1900, 1, 1
      );
      expect(stem).toBe('甲');
      expect(branch).toBe('戌');
    });
  });
});

// GreatFortuneCalculator.test.js
describe('GreatFortuneCalculator', () => {
  describe('isForwardProgression', () => {
    test('男性 + 陽年 = 順行', () => {
      expect(calc.isForwardProgression(1990, '男性')).toBe(true);
    });

    test('女性 + 陽年 = 逆行', () => {
      expect(calc.isForwardProgression(1990, '女性')).toBe(false);
    });
  });

  describe('calculateStartAge', () => {
    test('開始年齢の計算', async () => {
      const age = await calc.calculateStartAge(1990, 5, 15, '男性');
      expect(age).toBeGreaterThanOrEqual(0);
      expect(age).toBeLessThan(10);
    });
  });
});

// ValidationEngine.test.js
describe('ValidationEngine', () => {
  describe('validateDate', () => {
    test('有効な日付を受け入れる', () => {
      const result = validator.validateDate(1990, 5, 15);
      expect(result.valid).toBe(true);
    });

    test('無効な日付を拒否する', () => {
      const result = validator.validateDate(1990, 13, 32);
      expect(result.valid).toBe(false);
    });

    test('範囲外の年を拒否する', () => {
      const result = validator.validateDate(1800, 1, 1);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('1900');
    });
  });
});
```

#### Integration Tests（統合テスト）

```javascript
// FullCalculation.test.js
describe('Full Calculation Flow', () => {
  test('生年月日から命式全体を計算', async () => {
    const result = await appController.calculateFortune({
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      gender: '男性'
    });

    expect(result).toHaveProperty('fourPillars');
    expect(result).toHaveProperty('greatFortune');
    expect(result).toHaveProperty('juuniun');
    expect(result).toHaveProperty('tsuuhen');

    expect(result.fourPillars).toEqual({
      year: { stem: '庚', branch: '午', hidden_stems: [...] },
      month: { stem: '癸', branch: '午', hidden_stems: [...] },
      day: { stem: '辛', branch: '丑', hidden_stems: [...] },
      hour: { stem: '丁', branch: '午', hidden_stems: [...] }
    });
  });

  test('クリップボード入力から命式を計算', async () => {
    const text = "1990-05-15 14:30 東京 男性";
    const result = await appController.calculateFromClipboard(text);
    expect(result).toHaveProperty('fourPillars');
  });
});
```

#### E2E Tests（エンドツーエンドテスト）

```javascript
// サイドパネルの統合テスト
describe('Side Panel E2E', () => {
  test('フォーム入力 → 計算 → 表示', async () => {
    // DOM に入力値を設定
    document.querySelector('[name="year"]').value = '1990';
    document.querySelector('[name="month"]').value = '5';
    // ...

    // 計算ボタンをクリック
    document.querySelector('#calculateButton').click();

    // 結果が表示されるまで待機
    await waitFor(() => {
      expect(document.querySelector('.fourPillars')).toBeInTheDocument();
    });

    // 結果を検証
    expect(document.querySelector('.fourPillars')).toContainText('庚午');
  });
});
```

### テストデータ（Test Fixtures）

```javascript
// tests/fixtures/sample_inputs.js
export const sampleInputs = {
  validInput: {
    year: 1990,
    month: 5,
    day: 15,
    hour: 14,
    minute: 30,
    gender: '男性'
  },
  edgeCaseInputs: [
    { year: 1900, month: 1, day: 1 },  // 最小値
    { year: 2100, month: 12, day: 31 }, // 最大値
    { year: 2000, month: 2, day: 29 }   // うるう年
  ],
  invalidInputs: [
    { year: 1800, month: 1, day: 1 },   // 範囲外
    { year: 2101, month: 1, day: 1 },   // 範囲外
    { year: 1990, month: 13, day: 1 },  // 無効な月
    { year: 1990, month: 2, day: 30 }   // 無効な日
  ]
};

// tests/fixtures/expected_outputs.js
export const expectedOutputs = {
  '1990-05-15 14:30': {
    year: { stem: '庚', branch: '午' },
    month: { stem: '癸', branch: '午' },
    day: { stem: '辛', branch: '丑' },
    hour: { stem: '丁', branch: '午' }
  },
  // ... 他の期待値
};
```

### テストダブルの実装

```javascript
// Mock DataLoader
class MockDataLoader {
  async loadStemBranchMaster() {
    return {
      sixty_jiazi: MOCK_SIXTY_JIAZI,
      stems: MOCK_STEMS,
      branches: MOCK_BRANCHES
    };
  }

  async loadSolarTerms() {
    return {
      years: MOCK_SOLAR_TERMS
    };
  }
}

// Stub FortuneCalculator
class StubFortuneCalculator {
  async calculateFourPillars() {
    return {
      year: { stem: '庚', branch: '午' },
      month: { stem: '癸', branch: '午' },
      day: { stem: '辛', branch: '丑' },
      hour: { stem: '丁', branch: '午' }
    };
  }
}
```

---

## Chrome拡張機能固有設計

### manifest.json 構成

```json
{
  "manifest_version": 3,
  "name": "四柱推命 - 命式計算",
  "version": "1.0.0",
  "description": "生年月日から四柱推命の命式と大運を計算します",

  "icons": {
    "16": "public/images/icon-16.png",
    "48": "public/images/icon-48.png",
    "128": "public/images/icon-128.png"
  },

  "permissions": [
    "sidePanel"
  ],

  "action": {
    "default_title": "四柱推命 命式計算"
  },

  "side_panel": {
    "default_path": "public/side-panel.html"
  },

  "web_accessible_resources": [
    {
      "resources": [
        "src/data/*.json"
      ],
      "matches": []
    }
  ]
}
```

### サイドパネル API 実装

```javascript
// public/scripts/side-panel.js

// サイドパネルが開かれる時のイベント
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    chrome.sidePanel.open({ tabId: sender.tab.id }, () => {
      sendResponse({ success: true });
    });
  }
});

// サイドパネルのパネル
chrome.sidePanel.getPanelBehavior((behavior) => {
  if (behavior.openPanelOnActionClick) {
    // アクション クリック時にパネルを開く
  }
});
```

### バックグラウンド・スクリプト（future-proof）

```javascript
// background.js (将来の拡張用)

// Chrome 120+ のサービスワーカー
chrome.runtime.onInstalled.addListener(() => {
  console.log('Four Pillars Add-in installed');
});

// オフラインサポート（将来実装）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkOnlineStatus') {
    navigator.onLine ? sendResponse({ online: true }) 
                     : sendResponse({ online: false });
  }
});
```

### Content Script（将来の機能用）

```javascript
// public/scripts/content-script.js
// 将来: ウェブページから選択テキストを抽出して命式計算など

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    const selectedText = window.getSelection().toString();
    sendResponse({ text: selectedText });
  }
});
```

### サイドパネルのレイアウト

```html
<!-- public/side-panel.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>四柱推命 - 命式計算</title>
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="styles/components.css">
</head>
<body>
  <div class="app-container">
    <!-- ヘッダー -->
    <header class="app-header">
      <h1>四柱推命 命式計算</h1>
    </header>

    <!-- メインコンテンツ -->
    <main class="app-main">
      <!-- 入力フォーム -->
      <section id="inputSection" class="section">
        <form id="fortuneForm">
          <!-- 生年月日入力 -->
          <!-- 出生時刻入力（オプション） -->
          <!-- 性別選択 -->
          <!-- クリップボード貼り付けボタン -->
        </form>
      </section>

      <!-- 結果表示エリア -->
      <section id="resultSection" class="section" style="display: none;">
        <!-- 四柱表示 -->
        <!-- 大運表示 -->
        <!-- エクスポートボタン -->
      </section>

      <!-- エラー表示エリア -->
      <div id="errorContainer" class="error-container" style="display: none;"></div>
    </main>

    <!-- フッター -->
    <footer class="app-footer">
      <p>© 2025 Four Pillars Add-in</p>
    </footer>
  </div>

  <!-- スクリプト読込 -->
  <script src="../src/app/AppController.js"></script>
  <script src="../src/index.js"></script>
</body>
</html>
```

---

## 実装フェーズ

### Phase 1: 基盤構築（1-2週間）

**目標**: プロジェクト構造を確立し、基本的なUI/DOMを構築

**タスク**:
1. `manifest.json` を実装
2. `side-panel.html` と基本スタイル（CSS）を作成
3. `public/scripts/side-panel.js` で初期化
4. GitHub リポジトリの整備
5. デイレクトリ構造を構築

**成果物**:
- Chrome拡張機能が起動可能な状態
- サイドパネルが表示される
- フォームのスケルトンが表示される

**チェックリスト**:
- [ ] manifest.json の基本構成
- [ ] side-panel.html のテンプレート
- [ ] CSS フレームワークの選択（Bootstrap/Tailwind/自作）
- [ ] プロジェクト構成の確定

---

### Phase 2: 計算エンジン実装（2-3週間）

**目標**: 四柱・大運・十二運・通変星の計算エンジンを完成

**タスク**:

#### 2.1 データレイヤー実装
- `DataLoader.js`: JSON マスタデータ読込
- `DataCache.js`: メモリキャッシング実装
- `Constants.js`: グローバル定数定義

#### 2.2 コア計算エンジン実装
- `FortuneCalculator.js`: 四柱計算
  - `calculateYearPillar()`: (year - 1864) % 60
  - `calculateMonthPillar()`: 節入り時刻考慮
  - `calculateDayPillar()`: 基準日からの日数
  - `calculateHourPillar()`: 時支と五虎遁

- `GreatFortuneCalculator.js`: 大運計算
  - `isForwardProgression()`: 性別 ∧ 年干陰陽
  - `calculateStartAge()`: 節入り日までの日数÷3
  - `generateGreatFortuneCycles()`: 10サイクル生成

- `JuuniunCalculator.js`: 十二運計算
  - `calculateJuuniun()`: 日干と地支から十二運
  - `calculateForAllPillars()`: 四柱全て計算

- `TsuuhenCalculator.js`: 通変星計算 **[NEW]**
  - `calculateTsuuhen()`: 日干と対象干支から通変星
  - `calculateForAllPillars()`: 四柱全て計算
  - `getRelationshipType()`: 天干同士の関係（同・生・剋など）

#### 2.3 検証エンジン実装
- `ValidationEngine.js`: 入力値検証
  - 日付の妥当性チェック
  - 年の範囲チェック（1900-2100）
  - 月日の妥当性

**成果物**:
- FortuneCalculator で四柱計算可能
- GreatFortuneCalculator で大運計算可能
- JuuniunCalculator で十二運計算可能
- TsuuhenCalculator で通変星計算可能
- ValidationEngine で入力値検証可能

**チェックリスト**:
- [ ] マスタデータの JSON ファイル配置
- [ ] DataLoader で全ファイルが読込可能
- [ ] キャッシングが動作
- [ ] FortuneCalculator で既知のテストケースを通過
- [ ] GreatFortuneCalculator で順行/逆行が正確に判定
- [ ] JuuniunCalculator で十二運が正確に計算
- [ ] TsuuhenCalculator で通変星が正確に計算

---

### Phase 3: UI 実装（2週間）

**目標**: ユーザー入力からの計算・結果表示を完成

**タスク**:

#### 3.1 入力処理実装
- `InputManager.js`: フォーム値の取得
- `InputParser.js`: クリップボード解析
  - 複数のテキスト形式に対応
  - 日本語日付（昭和など）の解析
  - 自由形式テキストの抽出

#### 3.2 アプリケーション層実装
- `AppController.js`: メインコントローラ
- `StateManager.js`: 状態管理
- `EventBus.js`: イベント駆動（オプション）
- `ResultFormatter.js`: 結果のフォーマット

#### 3.3 プレゼンテーション層実装
- `FormRenderer.js`: フォーム表示
- `ResultRenderer.js`: 結果表示
  - 四柱テーブル表示
  - 大運テーブル表示
  - 十二運・通変星表示
- `ComponentManager.js`: UI コンポーネント管理

#### 3.4 スタイル実装
- `styles/main.css`: メインスタイル
- `styles/components.css`: コンポーネント別スタイル
- `styles/responsive.css`: レスポンシブ対応
- `styles/theme.css`: カラーテーマ

**成果物**:
- サイドパネルで生年月日を手動入力できる
- クリップボードからテキストをペースト可能
- 計算ボタンで命式を計算・表示
- 結果が見やすくフォーマットされている

**チェックリスト**:
- [ ] フォーム入力が全フィールド動作
- [ ] クリップボード貼り付けで複数形式を解析可能
- [ ] 計算結果が正確に表示される
- [ ] エラーメッセージがユーザーフレンドリー
- [ ] UI がサイドパネルに適したサイズ

---

### Phase 4: エクスポート・最適化（1-2週間）

**目標**: PNG出力と基本的なパフォーマンス最適化を完成

**タスク**:

#### 4.1 エクスポート機能
- `ImageExporter.js`: html2canvas 統合
  - 四柱の PNG 出力
  - 大運の PNG 出力
  - 全結果の PNG 出力
  - ファイル名の自動生成

#### 4.2 パフォーマンス最適化
- キャッシング戦略の実装（結果・マスタデータ）
- Lazy loading の実装（solar_terms.json）
- DOM描画の最適化
- バンドルサイズの最小化

#### 4.3 エラーハンドリング
- Custom Error Classes の実装
- エラーメッセージの国際化対応（日本語）
- エラーログの実装

**成果物**:
- PNG出力機能が動作
- 計算速度が 1秒以内
- メモリ使用量が最小化されている

**チェックリスト**:
- [ ] html2canvas が統合されている
- [ ] PNG出力がダウンロード可能
- [ ] キャッシングでパフォーマンス向上を確認
- [ ] エラーハンドリングが網羅的

---

### Phase 5: テスト・ドキュメント（1-2週間）

**目標**: テストの完成とドキュメントの整備

**タスク**:

#### 5.1 テスト実装
- ユニットテスト: 各計算器のテスト
- 統合テスト: 全フローのテスト
- E2E テスト: サイドパネルのテスト
- テストカバレッジ目標: 80% 以上

#### 5.2 ドキュメント
- API リファレンス
- 計算アルゴリズムの詳細解説
- デベロッパーガイド
- ユーザーガイド

#### 5.3 リリース準備
- Chrome Web Store への登録（オプション）
- バージョン管理の整備
- CHANGELOG の作成
- README の最終化

**成果物**:
- テストが 80% 以上のカバレッジを達成
- ドキュメントが完全
- リリース可能な状態

**チェックリスト**:
- [ ] すべてのテストがパス
- [ ] ARCHITECTURE.md が最新
- [ ] API ドキュメントが完備
- [ ] GitHub リポジトリが公開可能

---

## まとめ

このアーキテクチャ設計は、以下の原則に基づいて構築されています：

1. **レイヤード・アーキテクチャ**: 各層の責務を明確に分離
2. **オブジェクト指向**: クラス設計により拡張性を確保
3. **テスト駆動開発**: テスト可能な設計
4. **パフォーマンス重視**: キャッシング・遅延読込により高速化
5. **セキュリティ**: CSP・入力サニタイズにより安全性を確保
6. **ユーザーフレンドリー**: わかりやすいエラーメッセージとUI

Python実装の計算ロジックを忠実に移植しながら、Web環境に最適化された実装を目指します。

---

**作成者**: Architecture Design Team  
**最終更新**: 2025-12-06  
**ステータス**: Ready for Implementation
