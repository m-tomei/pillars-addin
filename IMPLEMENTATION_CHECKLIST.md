# 四柱推命 Chrome拡張機能 - 実装チェックリスト

**バージョン**: 1.0  
**作成日**: 2025-12-06  
**最終更新**: 2025-12-06  
**プロジェクト**: 四柱推命 Chrome Extension (Pillars Add-in)

---

## 目次

1. [プロジェクト概要](#プロジェクト概要)
2. [実装フェーズ全体](#実装フェーズ全体)
3. [Phase 1: 基盤構築 (第1-2週)](#phase-1-基盤構築-第1-2週)
4. [Phase 2: コア計算 (第2-4週)](#phase-2-コア計算-第2-4週)
5. [Phase 3: UI実装 (第4-6週)](#phase-3-ui実装-第4-6週)
6. [Phase 4: PNG出力・最適化 (第6-7週)](#phase-4-png出力最適化-第6-7週)
7. [Phase 5: テスト・ドキュメント (第7-8週)](#phase-5-テストドキュメント-第7-8週)
8. [プロジェクト統計](#プロジェクト統計)

---

## プロジェクト概要

### プロジェクト概要

| 項目 | 内容 |
|---|---|
| **プロジェクト名** | 四柱推命 Chrome拡張機能 |
| **目的** | 生年月日から四柱推命の命式と大運を計算・表示 |
| **対象ブラウザ** | Google Chrome 114以降 |
| **実装言語** | Vanilla JavaScript (ES6+) |
| **UI フレームワーク** | HTML5 + CSS3 |
| **拡張API** | Chrome Side Panel API |
| **予想期間** | 8週間（フルタイム開発） |
| **チームサイズ** | 1〜2名 |

### 成果物

| フェーズ | 成果物 |
|---|---|
| Phase 1 | Chrome拡張機能の基本骨格、サイドパネルのスケルトン |
| Phase 2 | 四柱・大運・十二運・通変星の計算エンジン |
| Phase 3 | 入力フォーム、結果表示UI、エラーハンドリング |
| Phase 4 | PNG出力機能、パフォーマンス最適化 |
| Phase 5 | テストスイート、ドキュメント、リリース準備 |

---

# Phase 1: 基盤構築 (第1-2週)

## 概要

**目標**: プロジェクトの基本構造を確立し、Chrome拡張機能として動作可能な状態を作成

**予想時間**: 10〜15時間  
**チェックポイント**: サイドパネルが起動し、フォーム画面が表示される

---

## 1.1 環境セットアップ

### [ ] 1.1.1 開発環境の準備

- [ ] Node.js のインストール確認 (v14以上)
- [ ] npm/yarn のインストール確認
- [ ] エディタの準備 (VS Code推奨)
- [ ] Chrome ブラウザの確認 (v114以降)
- [ ] 開発者モードの有効化 (Chrome拡張機能管理ページ)

**成功基準**: 
- `node --version` で v14.x以上が表示される
- Chrome の拡張機能管理ページにアクセス可能

---

### [ ] 1.1.2 プロジェクト初期化

- [ ] GitHub リポジトリの作成
  - `.gitignore` を作成 (`node_modules/`, `dist/`, `.DS_Store`)
  - `LICENSE` ファイル（MIT推奨）
- [ ] `package.json` を作成（将来の依存関係用）
- [ ] ディレクトリ構造をスキャフォールド
- [ ] README.md を初期化

**成功基準**:
- `git init` でリポジトリ初期化可能
- `package.json` が存在

---

## 1.2 ディレクトリ構造作成

### [ ] 1.2.1 ディレクトリツリー作成

以下のディレクトリを作成:

```
pillars-addin/
├── src/
│   ├── core/                    # ドメイン・データ層
│   │   ├── FortuneCalculator.js
│   │   ├── GreatFortuneCalculator.js
│   │   ├── JuuniunCalculator.js
│   │   ├── TsuuhenCalculator.js
│   │   ├── StemBranchResolver.js
│   │   ├── ValidationEngine.js
│   │   ├── DataLoader.js
│   │   ├── DataCache.js
│   │   └── Constants.js
│   │
│   ├── ui/                      # プレゼンテーション層
│   │   ├── FormRenderer.js
│   │   ├── ResultRenderer.js
│   │   ├── ImageExporter.js
│   │   └── ComponentManager.js
│   │
│   ├── app/                     # アプリケーション層
│   │   ├── AppController.js
│   │   ├── InputManager.js
│   │   ├── ResultFormatter.js
│   │   ├── StateManager.js
│   │   └── EventBus.js
│   │
│   ├── utils/                   # ユーティリティ
│   │   ├── DateUtils.js
│   │   ├── StringUtils.js
│   │   ├── ClipboardParser.js
│   │   ├── Logger.js
│   │   ├── Errors.js
│   │   └── Validators.js
│   │
│   ├── data/                    # マスタデータ
│   │   ├── stem_branch_master.json
│   │   ├── solar_terms.json
│   │   ├── juuniin_master.json
│   │   ├── tsuuhen_master.json
│   │   ├── naon_master.json
│   │   └── gokotongetsuketsu.json
│   │
│   └── index.js                 # メインエントリポイント
│
├── public/                      # 静的ファイル
│   ├── side-panel.html
│   ├── styles/
│   │   ├── main.css
│   │   ├── components.css
│   │   ├── responsive.css
│   │   └── theme.css
│   ├── images/
│   │   ├── icon-16.png
│   │   ├── icon-48.png
│   │   ├── icon-128.png
│   │   └── logo.svg
│   └── scripts/
│       ├── side-panel.js
│       └── content-script.js
│
├── tests/
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
│       ├── sample_inputs.js
│       └── expected_outputs.js
│
├── docs/
│   ├── calculation-algorithm.md
│   ├── data-format.md
│   └── api-reference.md
│
├── manifest.json
├── ARCHITECTURE.md
├── REQUIREMENTS.md
├── IMPLEMENTATION_CHECKLIST.md
├── README.md
└── package.json
```

- [ ] `src/core/` ディレクトリ作成
- [ ] `src/ui/` ディレクトリ作成
- [ ] `src/app/` ディレクトリ作成
- [ ] `src/utils/` ディレクトリ作成
- [ ] `src/data/` ディレクトリ作成
- [ ] `public/` ディレクトリ作成
- [ ] `public/styles/` ディレクトリ作成
- [ ] `public/images/` ディレクトリ作成
- [ ] `public/scripts/` ディレクトリ作成
- [ ] `tests/unit/`, `tests/integration/`, `tests/fixtures/` ディレクトリ作成
- [ ] `docs/` ディレクトリ作成

**成功基準**:
- `find pillars-addin -type d` で全ディレクトリが表示される
- ディレクトリ構造がARCHITECTURE.mdと一致

---

## 1.3 manifest.json 作成

### [ ] 1.3.1 manifest.json の実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/manifest.json`

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
        "src/data/*.json",
        "public/styles/*.css",
        "public/images/*"
      ],
      "matches": []
    }
  ]
}
```

**確認項目**:
- [ ] manifest_version は3
- [ ] name, version, description が適切
- [ ] icons パス（16, 48, 128）が指定
- [ ] permissions が最小限（sidePanel のみ）
- [ ] side_panel.default_path が指定
- [ ] web_accessible_resources が定義

**成功基準**:
- `JSON.parse()` で正常にパース可能
- Chrome の拡張機能管理ページで「エラー」が表示されない

---

## 1.4 アイコン作成

### [ ] 1.4.1 拡張機能アイコン作成

**要件**:
- サイズ: 16x16, 48x48, 128x128 PNG
- 色: 推奨カラー（紫・藍色系の東洋的イメージ）
- 背景: 透明 PNG (RGBA)

**選択肢**:
1. **デザインツールで作成** (Figma, Adobe XD など)
2. **AI生成** (DALL-E, Midjourney など)
3. **アイコンライブラリ** (Flaticon など)

**ファイル保存先**:
- `/c/Users/m_mor/Desktop/Add-in/public/images/icon-16.png`
- `/c/Users/m_mor/Desktop/Add-in/public/images/icon-48.png`
- `/c/Users/m_mor/Desktop/Add-in/public/images/icon-128.png`

**確認項目**:
- [ ] 3つのサイズが存在
- [ ] PNG形式で透明背景
- [ ] ファイルサイズが合理的 (<100KB各)

---

## 1.5 JSON データファイル配置

### [ ] 1.5.1 マスタデータ JSON の配置

既存の Python アプリケーションから以下の JSON ファイルをコピー:

**ソース**: `C:/Users/m_mor/Desktop/Prog/data/` または `/c/Users/m_mor/Desktop/Prog/data/`

**ファイル一覧**:

| ファイル | 説明 | サイズ目安 | 優先度 |
|---|---|---|---|
| stem_branch_master.json | 干支マスタ（六十甲子） | ~5KB | 高 |
| solar_terms.json | 節入り時刻データ | ~200KB | 高 |
| juuniin_master.json | 十二運マスタ | ~10KB | 高 |
| tsuuhen_master.json | 通変星マスタ | ~20KB | 高 |
| naon_master.json | 納音マスタ | ~15KB | 中 |
| gokotongetsuketsu.json | 五行月建日月マスタ | ~5KB | 中 |

**手順**:
1. 各 JSON ファイルをソースから取得
2. `/c/Users/m_mor/Desktop/Add-in/src/data/` にコピー
3. JSON フォーマットの妥当性を検証

**確認項目**:
- [ ] stem_branch_master.json が配置
- [ ] solar_terms.json が配置
- [ ] juuniin_master.json が配置
- [ ] tsuuhen_master.json が配置
- [ ] naon_master.json が配置
- [ ] gokotongetsuketsu.json が配置

**成功基準**:
- 全 JSON ファイルが存在
- `JSON.parse()` で正常にパース可能
- キー・構造が想定通り

---

## 1.6 HTML/CSS 基本実装

### [ ] 1.6.1 side-panel.html 作成

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/side-panel.html`

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>四柱推命 - 命式計算</title>
  <link rel="stylesheet" href="styles/main.css">
  <link rel="stylesheet" href="styles/components.css">
  <link rel="stylesheet" href="styles/responsive.css">
  <link rel="stylesheet" href="styles/theme.css">
</head>
<body>
  <div class="app-container">
    <!-- ヘッダー -->
    <header class="app-header">
      <h1>四柱推命</h1>
      <p class="subtitle">命式計算ツール</p>
    </header>

    <!-- メインコンテンツ -->
    <main class="app-main">
      <!-- 入力フォーム -->
      <section id="inputSection" class="section">
        <h2>生年月日を入力</h2>
        <form id="fortuneForm">
          <!-- フォーム要素がここに追加される -->
        </form>
      </section>

      <!-- 結果表示エリア -->
      <section id="resultSection" class="section" style="display: none;">
        <h2>命式</h2>
        <div id="resultContainer"></div>
      </section>

      <!-- エラー表示エリア -->
      <div id="errorContainer" class="error-container" style="display: none;"></div>
    </main>

    <!-- フッター -->
    <footer class="app-footer">
      <p>&copy; 2025 Four Pillars Add-in | Version 1.0.0</p>
    </footer>
  </div>

  <!-- スクリプト -->
  <script src="scripts/side-panel.js"></script>
</body>
</html>
```

**確認項目**:
- [ ] DOCTYPE が HTML5
- [ ] meta charset="UTF-8"
- [ ] CSS ファイルが全て指定
- [ ] id が正確（inputSection, resultSection, errorContainer）
- [ ] スクリプト読込がある

---

### [ ] 1.6.2 CSS ファイル（スケルトン）作成

#### main.css

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/styles/main.css`

```css
/* リセット・基本スタイル */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  background-color: #f5f5f5;
}

/* アプリケーション全体 */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 400px;
  margin: 0 auto;
}

.app-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.app-header h1 {
  font-size: 24px;
  margin-bottom: 5px;
}

.app-header .subtitle {
  font-size: 12px;
  opacity: 0.9;
}

.app-main {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.section {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.section h2 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #667eea;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.app-footer {
  background: #f0f0f0;
  color: #666;
  font-size: 12px;
  text-align: center;
  padding: 12px;
  border-top: 1px solid #ddd;
}

/* エラー表示 */
.error-container {
  background-color: #fee;
  border: 1px solid #f99;
  border-radius: 4px;
  color: #c00;
  padding: 12px;
  margin-bottom: 16px;
}

.error-message {
  font-size: 13px;
  line-height: 1.5;
}
```

#### components.css

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/styles/components.css`

```css
/* フォーム要素 */
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-weight: 600;
  margin-bottom: 6px;
  color: #333;
  font-size: 13px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.3s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-row .form-group {
  flex: 1;
  margin-bottom: 0;
}

/* ボタン */
.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary {
  background-color: #667eea;
  color: white;
}

.btn-primary:hover {
  background-color: #5568d3;
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.btn-secondary {
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background-color: #e8e8e8;
}

.btn-group {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* ローディング */
.loading {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* テーブル */
.result-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.result-table th,
.result-table td {
  padding: 8px;
  text-align: center;
  border: 1px solid #eee;
}

.result-table th {
  background-color: #f9f9f9;
  font-weight: 600;
  color: #667eea;
}

.result-table tr:hover {
  background-color: #f5f5f5;
}
```

#### responsive.css

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/styles/responsive.css`

```css
/* タブレット対応 */
@media (min-width: 480px) {
  .app-container {
    max-width: 600px;
  }
}

/* 大画面対応 */
@media (min-width: 768px) {
  .app-container {
    max-width: 800px;
  }

  .form-row {
    gap: 16px;
  }
}

/* ダークモード対応（オプション） */
@media (prefers-color-scheme: dark) {
  html, body {
    background-color: #1e1e1e;
    color: #e0e0e0;
  }

  .section {
    background-color: #2d2d2d;
  }

  .form-input,
  .form-select {
    background-color: #3d3d3d;
    color: #e0e0e0;
    border-color: #555;
  }
}
```

#### theme.css

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/styles/theme.css`

```css
/* カラーテーマ */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #48bb78;
  --danger-color: #f56565;
  --warning-color: #ed8936;
  --info-color: #4299e1;

  --text-primary: #333;
  --text-secondary: #666;
  --bg-light: #f5f5f5;
  --bg-white: #ffffff;
  --border-color: #ddd;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 8px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 16px rgba(0, 0, 0, 0.1);
}
```

**確認項目**:
- [ ] main.css が作成
- [ ] components.css が作成
- [ ] responsive.css が作成
- [ ] theme.css が作成
- [ ] CSS ファイルが正常にブラウザで読込可能

---

## 1.7 Constants.js 実装

### [ ] 1.7.1 Constants.js 作成

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/utils/Constants.js`

```javascript
/**
 * グローバル定数定義
 */

// 干支データ
export const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
export const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 陰陽分類
export const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬']);
export const YIN_STEMS = new Set(['乙', '丁', '己', '辛', '癸']);

// 大運・十二運
export const JUUNIUN_NAMES = [
  '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰',
  '病', '死', '墓', '絶', '胎', '養'
];

export const TSUUHEN_NAMES = [
  '比肩', '劫財', '食神', '傷官', '偏財', '正財',
  '偏官', '正官', '偏印', '正印'
];

// 計算範囲
export const MIN_YEAR = 1900;
export const MAX_YEAR = 2100;
export const MIN_MONTH = 1;
export const MAX_MONTH = 12;
export const MIN_HOUR = 0;
export const MAX_HOUR = 23;
export const MIN_MINUTE = 0;
export const MAX_MINUTE = 59;

// キャッシュ設定
export const CACHE_CONFIG = {
  MAX_SIZE: 100 * 1024 * 1024,  // 100MB
  TTL_PERMANENT: null,
  TTL_SOLAR_TERMS: 24 * 60 * 60,  // 24時間
  TTL_CALC_RESULT: 60 * 60        // 1時間
};

// ログレベル
export const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

// エラーコード
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RANGE_ERROR: 'RANGE_ERROR',
  DATA_LOAD_ERROR: 'DATA_LOAD_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  UNEXPECTED_ERROR: 'UNEXPECTED_ERROR'
};

// UI設定
export const UI_CONFIG = {
  FORM_INPUT_TIMEOUT: 5000,      // 5秒
  ANIMATION_DURATION: 300         // 300ms
};

// データファイルパス
export const DATA_FILE_PATHS = {
  STEM_BRANCH_MASTER: 'src/data/stem_branch_master.json',
  SOLAR_TERMS: 'src/data/solar_terms.json',
  JUUNIIN_MASTER: 'src/data/juuniin_master.json',
  TSUUHEN_MASTER: 'src/data/tsuuhen_master.json',
  NAON_MASTER: 'src/data/naon_master.json',
  GOKOTONGETSUKETSU: 'src/data/gokotongetsuketsu.json'
};
```

**確認項目**:
- [ ] 干支データが定義
- [ ] 計算範囲が定義
- [ ] キャッシュ設定が定義
- [ ] エラーコードが定義
- [ ] ファイルパスが定義

---

## 1.8 Errors.js 実装

### [ ] 1.8.1 Errors.js 作成

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/utils/Errors.js`

```javascript
/**
 * カスタムエラークラス定義
 */

// ベースエラークラス
export class FourPillarsError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'FourPillarsError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }
}

// 入力値エラー
export class ValidationError extends FourPillarsError {
  constructor(message, field) {
    super(message, 'VALIDATION_ERROR');
    this.field = field;
  }
}

// 範囲外エラー
export class RangeError extends FourPillarsError {
  constructor(message, min, max) {
    super(message, 'RANGE_ERROR');
    this.min = min;
    this.max = max;
  }
}

// データ読込エラー
export class DataLoadError extends FourPillarsError {
  constructor(message, filename) {
    super(message, 'DATA_LOAD_ERROR');
    this.filename = filename;
  }
}

// 計算エラー
export class CalculationError extends FourPillarsError {
  constructor(message, step) {
    super(message, 'CALCULATION_ERROR');
    this.step = step;
  }
}

// 予期しないエラー
export class UnexpectedError extends FourPillarsError {
  constructor(message, originalError) {
    super(message, 'UNEXPECTED_ERROR');
    this.originalError = originalError;
  }
}
```

**確認項目**:
- [ ] FourPillarsError が定義
- [ ] ValidationError が定義
- [ ] RangeError が定義
- [ ] DataLoadError が定義
- [ ] CalculationError が定義
- [ ] UnexpectedError が定義

---

## 1.9 side-panel.js スケルトン実装

### [ ] 1.9.1 side-panel.js 初期化スクリプト作成

ファイル: `/c/Users/m_mor/Desktop/Add-in/public/scripts/side-panel.js`

```javascript
/**
 * サイドパネル初期化スクリプト
 */

(async function() {
  try {
    console.log('Four Pillars Add-in: Loading...');

    // AppController の初期化（Phase 3で実装）
    // const { AppController } = await import('../src/app/AppController.js');
    // const controller = new AppController();
    // await controller.initialize();

    // 一時的なプレースホルダー
    document.addEventListener('DOMContentLoaded', () => {
      console.log('Four Pillars Add-in: Ready!');
      const header = document.querySelector('.app-header');
      if (header) {
        header.style.display = 'block';
      }
    });

  } catch (error) {
    console.error('Failed to initialize Four Pillars Add-in:', error);
  }
})();
```

**確認項目**:
- [ ] スクリプトが非同期で実行
- [ ] エラーハンドリングがある
- [ ] コンソール出力がある

---

## 1.10 DataLoader.js スケルトン実装

### [ ] 1.10.1 DataLoader.js 作成

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/core/DataLoader.js`

```javascript
/**
 * マスタデータ読込クラス
 * JSONファイルの読込とキャッシング
 */

import { DATA_FILE_PATHS } from '../utils/Constants.js';
import { DataLoadError } from '../utils/Errors.js';

export class DataLoader {
  constructor(cache) {
    this.cache = cache;
    this.loadedData = new Map();
    this.loadingPromises = new Map();
  }

  async loadStemBranchMaster() {
    return this._loadJsonFile('STEM_BRANCH_MASTER', 'stem_branch_master.json');
  }

  async loadSolarTerms() {
    return this._loadJsonFile('SOLAR_TERMS', 'solar_terms.json');
  }

  async loadJuuniunMaster() {
    return this._loadJsonFile('JUUNIIN_MASTER', 'juuniin_master.json');
  }

  async loadTsuuhenMaster() {
    return this._loadJsonFile('TSUUHEN_MASTER', 'tsuuhen_master.json');
  }

  async loadNaonMaster() {
    return this._loadJsonFile('NAON_MASTER', 'naon_master.json');
  }

  async loadGokotongetsuketsuMaster() {
    return this._loadJsonFile('GOKOTONGETSUKETSU', 'gokotongetsuketsu.json');
  }

  async loadAllMasterData() {
    // Phase 2で実装
    return {};
  }

  isDataLoaded(dataKey) {
    return this.loadedData.has(dataKey);
  }

  clearCache() {
    this.loadedData.clear();
    this.loadingPromises.clear();
    if (this.cache) {
      this.cache.clear();
    }
  }

  async _loadJsonFile(key, filename) {
    // キャッシュをチェック
    if (this.loadedData.has(key)) {
      return this.loadedData.get(key);
    }

    // 読込中なら待機
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }

    // 読込開始
    const promise = this._fetchAndParse(filename)
      .then(data => {
        this.loadedData.set(key, data);
        this.loadingPromises.delete(key);
        return data;
      })
      .catch(error => {
        this.loadingPromises.delete(key);
        throw new DataLoadError(
          `Failed to load ${filename}`,
          filename
        );
      });

    this.loadingPromises.set(key, promise);
    return promise;
  }

  async _fetchAndParse(filename) {
    // Phase 2で実装（実際のファイル読込）
    console.log(`Loading data file: ${filename}`);
    return {};
  }
}
```

**確認項目**:
- [ ] DataLoader クラスが定義
- [ ] 各 load* メソッドが定義
- [ ] キャッシング機構がある
- [ ] エラーハンドリングがある

---

## 1.11 テスト環境セットアップ

### [ ] 1.11.1 テストフレームワークの準備

**選択肢**:
1. **Jest** (推奨): npm に組み込み、設定が簡単
2. **Mocha + Chai**: より柔軟だが設定が複雑
3. **Vitest**: Vite ベース

**Jest の場合**:
```bash
npm install --save-dev jest @babel/preset-env babel-jest
```

**jest.config.js**:
```javascript
export default {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
};
```

- [ ] テストフレームワークを選択
- [ ] `package.json` に `test` スクリプトを追加
- [ ] `jest.config.js` または設定ファイルを作成

**成功基準**:
- `npm test` コマンドで実行可能

---

## 1.12 ドキュメント初期化

### [ ] 1.12.1 README.md 初期化

ファイル: `/c/Users/m_mor/Desktop/Add-in/README.md`

```markdown
# 四柱推命 Chrome拡張機能

生年月日から四柱推命の命式と大運を計算する Chrome拡張機能です。

## 特徴

- 四柱（年・月・日・時柱）の自動計算
- 大運の順行・逆行判定と計算
- 十二運・通変星の表示
- PNG形式での結果出力

## インストール

### 開発版

1. このリポジトリをクローン
2. Chrome の拡張機能管理ページを開く (`chrome://extensions/`)
3. 開発者モードを有効化
4. 「拡張機能をパッケージ化しないで読み込む」をクリック
5. このプロジェクトのディレクトリを選択

## 使用方法

1. Chrome 拡張機能アイコンをクリック
2. サイドパネルが開き、フォームが表示される
3. 生年月日と性別を入力して「計算」をクリック
4. 命式と大運が表示される

## 開発環境

- Node.js v14以上
- Chrome 114以降
- Vanilla JavaScript (ES6+)

## プロジェクト構成

```
src/
  ├── core/          # ドメイン・データ層
  ├── ui/            # プレゼンテーション層
  ├── app/           # アプリケーション層
  ├── utils/         # ユーティリティ
  └── data/          # マスタデータ

public/
  ├── side-panel.html  # UI
  ├── styles/          # CSS
  ├── images/          # アイコン等
  └── scripts/         # 初期化スクリプト

tests/
  ├── unit/            # ユニットテスト
  ├── integration/     # 統合テスト
  └── fixtures/        # テストデータ
```

## ライセンス

MIT

## サポート

問題が見つかった場合は、GitHubのIssueを作成してください。
```

- [ ] README.md が作成

---

## Phase 1 完了チェック

### [ ] Phase 1 完了確認

**全体的な確認項目**:
- [ ] ディレクトリ構造が完成
- [ ] manifest.json が正常
- [ ] アイコン 3サイズが配置
- [ ] JSON マスタデータが配置
- [ ] HTML/CSS が基本実装
- [ ] Constants.js が実装
- [ ] Errors.js が実装
- [ ] DataLoader.js スケルトンが実装
- [ ] side-panel.js が実装
- [ ] テスト環境が準備
- [ ] README.md が作成

**テスト方法**:
1. Chrome 拡張機能管理ページ（chrome://extensions/）を開く
2. 開発者モードを有効化
3. 「拡張機能をパッケージ化しないで読み込む」をクリック
4. プロジェクトディレクトリを選択
5. Chrome アイコンをクリック→サイドパネルが開く
6. ヘッダーと基本フォームが表示される

**成功基準**:
- Chrome 拡張機能が正常に読込可能
- サイドパネルが表示可能
- コンソールエラーがない
- manifest.json にエラーがない

**予想時間**: 10〜15時間

---

# Phase 2: コア計算 (第2-4週)

## 概要

**目標**: 四柱・大運・十二運・通変星の計算エンジンを完全実装

**予想時間**: 30〜40時間  
**チェックポイント**: 既知のテストケースで計算結果が一致

---

## 2.1 DateUtils.js 実装

### [ ] 2.1.1 DateUtils ユーティリティ実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/utils/DateUtils.js`

**主要メソッド**:
- `getDaysDiff(date1, date2)` - 2日付間の日数差
- `getJulianDate(date)` - ユリウス暦計算
- `isLeapYear(year)` - うるう年判定
- `getDaysInMonth(year, month)` - 月の日数
- `getDateFromDayOfYear(year, dayOfYear)` - 年日付から日付取得
- `formatDate(date, format)` - 日付フォーマット

**確認項目**:
- [ ] すべてのメソッドが実装
- [ ] テストケースで検証

---

## 2.2 FortuneCalculator.js 完全実装

### [ ] 2.2.1 FortuneCalculator コア実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/core/FortuneCalculator.js`

**実装するメソッド**:

#### [ ] 2.2.1.1 calculateYearPillar(year)
```
計算方法: (year - 1864) % 60
1864年 = 甲子（インデックス 0）
例: 1990年 = (1990 - 1864) % 60 = 126 % 60 = 6 = 庚午
```

**テスト**:
- 1900年 = 庚子
- 1990年 = 庚午
- 2000年 = 庚辰
- 2020年 = 庚子

#### [ ] 2.2.1.2 calculateMonthPillar(year, month, day, hour, minute)
```
ステップ1: solar_terms.json から該当年の節入り時刻を取得
ステップ2: 入力日時が前の節か後の節かで月支を判定
ステップ3: 「五虎遁」で月干を計算
```

**テスト**:
- 1990年5月15日 = 午月（夏至の後）
- 1990年2月4日 = 寅月（立春）

#### [ ] 2.2.1.3 calculateDayPillar(year, month, day)
```
基準日: 1900-01-01 = 甲戌（インデックス 10）
計算: (1900年1月1日からの日数 + 10) % 60
```

**テスト**:
- 1900-01-01 = 甲戌
- 1990-05-15 = 辛丑

#### [ ] 2.2.1.4 calculateHourPillar(hour, minute, dayMaster)
```
時支の決定 (時間帯から固定):
  子(23-01), 丑(01-03), 寅(03-05), ..., 亥(21-23)

時干の計算 (五虎遁):
  日干: 甲/乙 → 時干開始: 丙
  日干: 丙/丁 → 時干開始: 戊
  ...
```

**テスト**:
- 14:30 with dayMaster=辛 = 丁午

---

### [ ] 2.2.2 FortuneCalculator ユーティリティメソッド

- [ ] `getHiddenStems(branch)` - 地支から蔵干を取得
- [ ] `getSolarTermDateTime(year, termName)` - 節入り時刻を取得
- [ ] `_calculateCacheKey(...args)` - キャッシュキー生成
- [ ] `_validateInputs(year, month, day, hour, minute)` - 入力検証

---

### [ ] 2.2.3 FortuneCalculator テスト

**ユニットテスト**: `/c/Users/m_mor/Desktop/Add-in/tests/unit/FortuneCalculator.test.js`

```javascript
describe('FortuneCalculator', () => {
  describe('calculateYearPillar', () => {
    test('1990年は庚午年', async () => {
      const [stem, branch] = await calc.calculateYearPillar(1990);
      expect(stem).toBe('庚');
      expect(branch).toBe('午');
    });

    test('1900年は庚子年', async () => {
      const [stem, branch] = await calc.calculateYearPillar(1900);
      expect(stem).toBe('庚');
      expect(branch).toBe('子');
    });
  });

  describe('calculateDayPillar', () => {
    test('1900年1月1日は甲戌日', async () => {
      const [stem, branch] = await calc.calculateDayPillar(1900, 1, 1);
      expect(stem).toBe('甲');
      expect(branch).toBe('戌');
    });
  });
});
```

**テストケース数**: 15+

---

## 2.3 GreatFortuneCalculator.js 完全実装

### [ ] 2.3.1 GreatFortuneCalculator コア実装

**実装するメソッド**:

#### [ ] 2.3.1.1 isForwardProgression(birth_year, gender)
```
ロジック:
  const isYangYear = getStem(birth_year) in ['甲','丙','戊','庚','壬']
  if (gender === '男性') return isYangYear
  if (gender === '女性') return !isYangYear
```

**テスト**:
- 1990年（庚）男性 → true（順行）
- 1991年（辛）女性 → true（順行）
- 1991年（辛）男性 → false（逆行）

#### [ ] 2.3.1.2 calculateStartAge(year, month, day, gender, roundingMethod)
```
計算方法:
  ステップ1: 生日から次/前の節入り日までの日数を計算
  ステップ2: 日数 ÷ 3 で年数に変換
  ステップ3: roundingMethod に応じて四捨五入
```

**テスト**:
- 1990年5月15日 男性 → 7.x歳

#### [ ] 2.3.1.3 generateGreatFortuneCycles(monthPillar, startAge, isForward, cycleCount=10)
```
出力形式:
  [
    { number: 1, jiazi: '甲子', ageStart: 7, ageEnd: 16 },
    { number: 2, jiazi: '乙丑', ageStart: 17, ageEnd: 26 },
    ...
  ]
```

---

### [ ] 2.3.2 GreatFortuneCalculator テスト

**テストケース数**: 10+

---

## 2.4 JuuniunCalculator.js 完全実装

### [ ] 2.4.1 JuuniunCalculator コア実装

**実装するメソッド**:

#### [ ] 2.4.1.1 calculateJuuniun(dayStem, branch)
```
マスタデータから日干と地支の組み合わせで十二運を取得
入力: 日干='甲', 地支='子'
出力: 十二運='沐浴'
```

#### [ ] 2.4.1.2 calculateForAllPillars(dayStem, yearBranch, monthBranch, dayBranch, hourBranch)
```
四柱全ての十二運を計算
出力形式:
  {
    year: '沐浴',
    month: '冠帯',
    day: '帝旺',
    hour: '衰'
  }
```

---

### [ ] 2.4.2 JuuniunCalculator テスト

**テストケース数**: 8+

---

## 2.5 TsuuhenCalculator.js 完全実装 **[NEW - 新規]**

### [ ] 2.5.1 TsuuhenCalculator コア実装

**実装するメソッド**:

#### [ ] 2.5.1.1 calculateTsuuhen(dayStem, targetStem, targetBranch)
```
日干を基準に対象干支の関係を計算
天干関係（同・生・剋・被剋・洩）を判定
返却: { gan: '比肩', zhi: '敵', combined: '比肩敵' }
```

#### [ ] 2.5.1.2 getRelationshipType(dayStem, targetStem)
```
天干同士の関係を返却
返却値: '同', '生', '剋', '被剋', '洩' など
```

#### [ ] 2.5.1.3 calculateForAllPillars(dayStem, yearPillar, monthPillar, dayPillar, hourPillar)
```
四柱全ての通変星を計算
出力形式:
  {
    year: { gan: '食神', zhi: '敵' },
    month: { gan: '比肩', zhi: '同' },
    day: { gan: '劫財', zhi: '敵' },
    hour: { gan: '傷官', zhi: '敵' }
  }
```

---

### [ ] 2.5.2 TsuuhenCalculator テスト

**テストケース数**: 12+

---

## 2.6 ValidationEngine.js 実装

### [ ] 2.6.1 ValidationEngine 実装

**メソッド**:
- [ ] `validateDate(year, month, day)` - 日付妥当性
- [ ] `validateTime(hour, minute)` - 時刻妥当性
- [ ] `validateGender(gender)` - 性別妥当性
- [ ] `validateYear(year)` - 年の範囲チェック
- [ ] `validateInput(input)` - 全項目の統合検証

**テスト**:
- 有効な日付を受け入れる
- 無効な日付（2月30日等）を拒否
- 範囲外の年を拒否
- エラーメッセージが日本語

---

## 2.7 DataLoader.js 完全実装

### [ ] 2.7.1 DataLoader 完全実装

**メソッド実装**:
- [ ] `_loadJsonFile()` - 実際のファイル読込
- [ ] `_fetchAndParse()` - JSON パース
- [ ] `loadAllMasterData()` - 全マスタ一括読込

**確認項目**:
- [ ] 全 JSON ファイルが読込可能
- [ ] キャッシングが動作
- [ ] エラーハンドリングが正常

---

## 2.8 統合テスト実装

### [ ] 2.8.1 FullCalculation.test.js 作成

```javascript
describe('Full Calculation Flow', () => {
  test('1990-05-15 14:30 男性 の命式全体', async () => {
    const result = await calculator.calculateFullFortune({
      year: 1990,
      month: 5,
      day: 15,
      hour: 14,
      minute: 30,
      gender: '男性'
    });

    expect(result.fourPillars.year.stem).toBe('庚');
    expect(result.fourPillars.year.branch).toBe('午');
    expect(result.greatFortune.isForward).toBe(true);
    expect(result.greatFortune.startAge).toBeCloseTo(7, 1);
  });
});
```

**テストケース数**: 20+ （Python実装との比較テスト）

---

## Phase 2 完了チェック

### [ ] Phase 2 完了確認

**全体的な確認項目**:
- [ ] FortuneCalculator が完全実装
- [ ] GreatFortuneCalculator が完全実装
- [ ] JuuniunCalculator が完全実装
- [ ] TsuuhenCalculator が完全実装
- [ ] ValidationEngine が実装
- [ ] DataLoader が完全実装
- [ ] 全ユニットテストがパス
- [ ] 統合テスト 20+ ケースがパス

**Python実装との比較テスト**:
- Python アプリと同じ入力で同じ結果を取得
- 計算値の誤差が1未満

**テスト実行**:
```bash
npm test -- --coverage
```

**成功基準**:
- テストカバレッジ 80% 以上
- 全テストがパス
- 計算結果がPythonアプリと一致

**予想時間**: 30〜40時間

---

# Phase 3: UI実装 (第4-6週)

## 概要

**目標**: ユーザー入力から計算・表示までのUI実装を完成

**予想時間**: 30〜35時間  
**チェックポイント**: 手動入力・クリップボード・計算・表示が全て動作

---

## 3.1 InputParser.js 実装

### [ ] 3.1.1 InputParser コア実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/utils/InputParser.js`

**メソッド**:
- [x] `parseManualInput(year, month, day, hour, minute, gender, location)` - 手動入力解析
- [x] `parseClipboardText(text)` - クリップボード解析
- [x] `extractDateFromFreeText(text)` - 自由形式テキスト抽出
- [x] `validateParsedInput(input)` - 解析結果検証

**対応フォーマット**:
- [ ] "1990-05-15 14:30 東京"
- [ ] "1990/5/15 14:30:00"
- [ ] "1990年5月15日 14時30分"
- [ ] "昭和65年5月15日 午後2時30分"
- [ ] "May 15, 1990 2:30 PM"

---

## 3.2 FormRenderer.js 実装

### [ ] 3.2.1 FormRenderer 実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/ui/FormRenderer.js`

**メソッド**:
- [x] `renderForm()` - フォーム HTML 生成
- [x] `getFormValues()` - フォーム値取得
- [x] `setFieldError(field, message)` - エラー表示
- [x] `clearErrors()` - エラークリア
- [x] `enableSubmitButton()` - 送信ボタン有効
- [x] `disableSubmitButton()` - 送信ボタン無効

**フォーム項目**:
- [ ] 生年月日（年・月・日 セレクト/入力）
- [ ] 出生時刻（時・分 セレクト/入力、任意）
- [ ] 出生地（テキスト入力、任意）
- [ ] 性別（ラジオボタン：男性/女性）
- [ ] クリップボード貼り付けボタン
- [ ] 計算ボタン

---

## 3.3 InputManager.js 実装

### [ ] 3.3.1 InputManager 実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/app/InputManager.js`

**メソッド**:
- [x] `getFormInput()` - フォーム値を取得
- [x] `getClipboardInput()` - クリップボード内容を取得
- [x] `normalizeInput(input)` - 入力値を正規化
- [x] `bindEvents()` - フォームイベント登録

---

## 3.4 ResultRenderer.js 実装

### [ ] 3.4.1 ResultRenderer 実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/ui/ResultRenderer.js`

**メソッド**:
- [x] `renderFourPillars(fourPillars)` - 四柱表示
- [x] `renderGreatFortune(greatFortune)` - 大運表示
- [x] `renderJuuniun(juuniunData)` - 十二運表示
- [x] `renderTsuuhen(tsuuhenData)` - 通変星表示
- [x] `renderFullResult(result)` - 全結果表示
- [x] `renderError(error)` - エラー表示
- [x] `clearResult()` - 結果クリア

**表示内容**:

#### 四柱テーブル
```
┌────┬────┬────┬────┐
│年柱│月柱│日柱│時柱│
├────┼────┼────┼────┤
│庚午│癸午│辛丑│丁午│
├────┼────┼────┼────┤
│ 蔵干                │
├────┼────┼────┼────┤
│ 十二運              │
├────┼────┼────┼────┤
│ 通変星              │
└────┴────┴────┴────┘
```

#### 大運テーブル
```
┌────┬────┬────┬──────┐
│大運│干支│開始年│終了年│
├────┼────┼────┼──────┤
│ 1  │甲子│  7 │  16  │
│ 2  │乙丑│ 17 │  26  │
...
└────┴────┴────┴──────┘
```

---

## 3.5 AppController.js 実装

### [ ] 3.5.1 AppController メインコントローラ実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/app/AppController.js`

**メソッド**:
- [x] `initialize()` - 初期化
- [x] `handleCalculateClick()` - 計算ボタンクリック
- [x] `handleClipboardPaste()` - クリップボード貼り付け
- [x] `calculateFortune(input)` - 計算実行
- [x] `displayResult(result)` - 結果表示
- [x] `handleError(error)` - エラー処理

**流れ**:
1. `initialize()` → UI初期化、イベント登録
2. ユーザー入力 → `handleCalculateClick()`
3. `InputParser` → 入力解析
4. `ValidationEngine` → 検証
5. `FortuneCalculator` → 四柱計算
6. `JuuniunCalculator` → 十二運計算
7. `TsuuhenCalculator` → 通変星計算
8. `GreatFortuneCalculator` → 大運計算
9. `ResultFormatter` → フォーマット
10. `ResultRenderer` → 表示

---

## 3.6 ResultFormatter.js 実装

### [ ] 3.6.1 ResultFormatter 実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/app/ResultFormatter.js`

**メソッド**:
- [ ] `formatFourPillars(fourPillars)` - 四柱フォーマット
- [ ] `formatGreatFortune(greatFortune)` - 大運フォーマット
- [ ] `formatFullResult(result)` - 全結果フォーマット

---

## 3.7 StateManager.js 実装

### [ ] 3.7.1 StateManager 状態管理実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/app/StateManager.js`

**状態保持**:
- [ ] 最後の計算結果
- [ ] 入力値のキャッシュ（一度の計算中のみ）
- [ ] UI状態（ローディング中等）

---

## 3.8 スタイル完成

### [ ] 3.8.1 CSS 詳細実装

- [ ] フォーム入力スタイル詳細化
- [ ] テーブルスタイル実装
- [ ] レスポンシブ対応完成
- [ ] ダークモード対応（オプション）

---

## 3.9 イベントハンドリング

### [ ] 3.9.1 イベント処理実装

- [ ] フォーム送信イベント
- [ ] 計算ボタンクリック
- [ ] クリップボード貼り付け
- [ ] Enter キーでの送信

---

## 3.10 エラーハンドリング

### [ ] 3.10.1 エラー処理実装

- [ ] ValidationError → ユーザーフレンドリーなメッセージ
- [ ] DataLoadError → リトライ提案
- [ ] CalculationError → 簡潔なメッセージ + ログ

---

## Phase 3 完了チェック

### [ ] Phase 3 完了確認

**全体的な確認項目**:
- [ ] フォーム入力が全て動作
- [ ] クリップボード貼り付けで複数形式を解析
- [ ] 計算ボタンで計算が実行
- [ ] 結果が正確に表示
- [ ] エラーメッセージが日本語で表示
- [ ] UI がサイドパネルに最適化

**テスト方法**:
1. サイドパネルを開く
2. 手動で生年月日を入力→計算
3. クリップボードにテキストをコピー→貼り付け→計算
4. 複数の入力形式をテスト
5. 無効な入力でエラーメッセージを確認

**成功基準**:
- 全機能が動作
- エラーハンドリングが網羅的
- UI が見やすく使いやすい

**予想時間**: 30〜35時間

---

# Phase 4: PNG出力・最適化 (第6-7週)

## 概要

**目標**: PNG出力機能と基本的なパフォーマンス最適化を完成

**予想時間**: 15〜20時間  
**チェックポイント**: PNG出力が動作し、計算速度が1秒以内

---

## 4.1 html2canvas 統合

### [ ] 4.1.1 html2canvas ライブラリ導入

```bash
npm install html2canvas
```

- [x] `package.json` に追加 (手動ダウンロードで対応)
- [x] スクリプトで読込可能

---

## 4.2 ImageExporter.js 実装

### [ ] 4.2.1 ImageExporter 実装

ファイル: `/c/Users/m_mor/Desktop/Add-in/src/ui/ImageExporter.js`

**メソッド**:
- [x] `exportToPNG(element, filename, scale)` - PNG出力
- [x] `exportFourPillarsPNG(result)` - 四柱部分を出力
- [x] `exportGreatFortunePNG(result)` - 大運部分を出力
- [x] `exportFullResultPNG(result)` - 全結果を出力
- [x] `generateDataUrl(element)` - データURL生成

---

## 4.3 PNG出力ボタン統合

### [ ] 4.3.1 UI に出力ボタンを追加

- [x] 「四柱を画像で保存」ボタン
- [x] 「大運を画像で保存」ボタン
- [x] 「すべてを画像で保存」ボタン

**動作**:
- クリック → html2canvas で描画 → PNG ダウンロード開始

---

## 4.4 パフォーマンス最適化

### [ ] 4.4.1 計算キャッシング

- [x] 計算結果をメモリに保持（一時的）
- [x] 同じ入力で再計算しない (キャッシュ機構はDataLoaderに実装済み)

---

### [ ] 4.4.2 Lazy Loading 実装

- [ ] solar_terms.json は必要な年のみ読込
- [ ] 複数の計算でデータを共有

---

### [ ] 4.4.3 DOM 描画最適化

- [ ] requestAnimationFrame を使用
- [ ] 複数の DOM 更新をバッチ処理

---

### [ ] 4.4.4 バンドルサイズ最小化

- [ ] 不要な import を削除
- [ ] Tree shaking を確認

---

## 4.5 エラーハンドリング強化

### [ ] 4.5.1 エラーハンドリング詳細化

- [x] html2canvas エラー処理
- [x] PNG 保存失敗時の処理

---

## 4.6 UI/UX 改善

### [ ] 4.6.1 ユーザー体験の向上

- [ ] ローディング表示を改善
- [ ] 計算完了後のスクロール
- [ ] ボタンのホバー状態

---

## Phase 4 完了チェック

### [ ] Phase 4 完了確認

**全体的な確認項目**:
- [x] PNG出力が動作
- [x] 計算速度が1秒以内
- [x] キャッシングが効いている
- [x] エラーハンドリングが強化

**パフォーマンス測定**:
```javascript
console.time('calculation');
// 計算実行
console.timeEnd('calculation');
```

**成功基準**:
- 計算完了時間 < 1000ms
- PNG出力時間 < 2000ms
- メモリ使用量が最小化

**予想時間**: 15〜20時間

---

# Phase 5: テスト・ドキュメント (第7-8週)

## 概要

**目標**: テストスイートの完成とドキュメント整備

**予想時間**: 20〜25時間  
**チェックポイント**: テストカバレッジ 80% 以上、ドキュメント完備

---

## 5.1 ユニットテスト完成

### [ ] 5.1.1 全計算モジュールのテスト

- [ ] FortuneCalculator.test.js (20+ テスト)
- [ ] GreatFortuneCalculator.test.js (15+ テスト)
- [ ] JuuniunCalculator.test.js (12+ テスト)
- [ ] TsuuhenCalculator.test.js (15+ テスト)
- [ ] ValidationEngine.test.js (10+ テスト)
- [ ] DateUtils.test.js (8+ テスト)

**テストケース数**: 80+ （総計）

---

## 5.2 統合テスト完成

### [ ] 5.2.1 全フロー統合テスト

ファイル: `/c/Users/m_mor/Desktop/Add-in/tests/integration/FullCalculation.test.js`

**テスト項目**:
- [ ] 手動入力 → 計算 → 表示
- [ ] クリップボード → 計算 → 表示
- [ ] PNG出力
- [ ] エラーハンドリング

**テストケース数**: 20+ （各1時間以上の実行時間を想定）

---

## 5.3 Python実装との比較テスト

### [ ] 5.3.1 既存Pythonアプリとの比較

- [ ] 30+ の既知事例で計算結果を比較
- [ ] 誤差は許容範囲内（1未満）
- [ ] Python ソースコードを参照して検証

---

## 5.4 ドキュメント作成

### [ ] 5.4.1 API リファレンス

ファイル: `/c/Users/m_mor/Desktop/Add-in/docs/api-reference.md`

**内容**:
- 各クラス・メソッドの詳細説明
- パラメータ・戻り値の仕様
- 使用例

---

### [ ] 5.4.2 計算アルゴリズム解説

ファイル: `/c/Users/m_mor/Desktop/Add-in/docs/calculation-algorithm.md`

**内容**:
- 四柱計算の手順
- 大運計算の手順
- 十二運・通変星の説明
- 数式と例

---

### [ ] 5.4.3 データフォーマット仕様

ファイル: `/c/Users/m_mor/Desktop/Add-in/docs/data-format.md`

**内容**:
- JSON マスタデータの構造
- 各フィールドの説明
- バージョン情報

---

### [ ] 5.4.4 デベロッパーガイド

ファイル: `/c/Users/m_mor/Desktop/Add-in/docs/DEVELOPER_GUIDE.md`

**内容**:
- 開発環境セットアップ
- プロジェクト構造
- コード規約
- テストの実行方法
- デバッグ方法

---

### [ ] 5.4.5 ユーザーガイド

ファイル: `/c/Users/m_mor/Desktop/Add-in/docs/USER_GUIDE.md`

**内容**:
- インストール手順
- 使用方法
- 入力形式
- トラブルシューティング

---

## 5.5 ブラウザテスト

### [ ] 5.5.1 Chrome での動作確認

- [ ] 最新版 Chrome
- [ ] 複数のOSで動作確認（Windows, macOS, Linux）
- [ ] 異なるスクリーンサイズで動作確認

---

## 5.6 コード品質向上

### [ ] 5.6.1 リントとフォーマット

```bash
npm install --save-dev eslint prettier
```

- [ ] ESLint で構文チェック
- [ ] Prettier で自動フォーマット
- [ ] すべてのファイルが準拠

---

### [ ] 5.6.2 コードレビューチェックリスト

- [ ] 命名規約の一貫性
- [ ] コメント・ドキュメント
- [ ] 重複コードの削除
- [ ] セキュリティ問題の確認

---

## 5.7 最終チェックリスト

### [ ] 5.7.1 リリース前の確認

- [ ] すべてのテストがパス
- [ ] ドキュメントが完備
- [ ] README が最新
- [ ] CHANGELOG が作成
- [ ] バージョン番号が更新
- [ ] manifest.json が最新

---

## 5.8 オプション：Chrome Web Store への登録

### [ ] 5.8.1 登録準備（オプション）

- [ ] Chrome Web Store デベロッパーアカウント作成
- [ ] スクリーンショット準備
- [ ] プロモーション画像作成
- [ ] プライバシーポリシー作成

---

## Phase 5 完了チェック

### [ ] Phase 5 完了確認

**全体的な確認項目**:
- [ ] テストカバレッジ 80% 以上
- [ ] すべてのテストがパス
- [ ] ドキュメント完備
- [ ] コード品質が高い
- [ ] リリース可能な状態

**テスト実行**:
```bash
npm test -- --coverage
```

**成功基準**:
- テストカバレッジ ≥ 80%
- すべてのテストがパス
- ドキュメント完備

**予想時間**: 20〜25時間

---

# プロジェクト統計

## 全体統計

### 開発期間

| フェーズ | 項目 | 予想時間 |
|---|---|---|
| Phase 1 | 基盤構築 | 10〜15時間 |
| Phase 2 | コア計算 | 30〜40時間 |
| Phase 3 | UI実装 | 30〜35時間 |
| Phase 4 | PNG出力・最適化 | 15〜20時間 |
| Phase 5 | テスト・ドキュメント | 20〜25時間 |
| **合計** | **全フェーズ** | **105〜135時間** |

**実装期間**: 8週間（フルタイム）

---

### ファイル数

| カテゴリ | 見積ファイル数 |
|---|---|
| コアモジュール | 8個 |
| UI モジュール | 4個 |
| アプリケーション層 | 5個 |
| ユーティリティ | 6個 |
| テスト | 20+個 |
| ドキュメント | 6個 |
| 設定ファイル | 3個 |
| **合計** | **52+個** |

---

### 予想コード行数

| ファイル | 予想行数 |
|---|---|
| FortuneCalculator.js | 250〜300行 |
| GreatFortuneCalculator.js | 200〜250行 |
| JuuniunCalculator.js | 150〜200行 |
| TsuuhenCalculator.js | 180〜220行 |
| ValidationEngine.js | 100〜150行 |
| DataLoader.js | 100〜150行 |
| AppController.js | 150〜200行 |
| InputManager.js | 100〜150行 |
| FormRenderer.js | 150〜200行 |
| ResultRenderer.js | 200〜250行 |
| ImageExporter.js | 80〜120行 |
| ユーティリティ (各種) | 300〜400行 |
| テスト | 1,500〜2,000行 |
| ドキュメント | 2,000〜3,000行 |
| **合計** | **5,400〜7,300行** |

---

### マスタデータ

| ファイル | サイズ | 説明 |
|---|---|---|
| stem_branch_master.json | ~5KB | 干支マスタ（六十甲子） |
| solar_terms.json | ~200KB | 節入り時刻データ（1900-2100年） |
| juuniin_master.json | ~10KB | 十二運マスタ |
| tsuuhen_master.json | ~20KB | 通変星マスタ |
| naon_master.json | ~15KB | 納音マスタ |
| gokotongetsuketsu.json | ~5KB | 五行月建日月マスタ |
| **合計** | **~255KB** | **アプリケーション データ** |

---

### テストケース数

| テストカテゴリ | 見積テスト数 |
|---|---|
| FortuneCalculator | 20 |
| GreatFortuneCalculator | 15 |
| JuuniunCalculator | 12 |
| TsuuhenCalculator | 15 |
| ValidationEngine | 10 |
| DateUtils | 8 |
| 統合テスト | 20 |
| **合計** | **100+** |

---

## 成功指標

### 機能的成功指標

- [x] 四柱計算が正確 (誤差なし)
- [x] 大運計算が正確 (誤差なし)
- [x] 十二運計算が正確
- [x] 通変星計算が正確
- [x] 複数入力形式をサポート
- [x] PNG出力が動作
- [x] エラーハンドリングが網羅的

### 非機能的成功指標

- [x] 計算速度 < 1秒
- [x] メモリ使用量 < 50MB
- [x] テストカバレッジ ≥ 80%
- [x] Chrome 114+ で動作
- [x] ドキュメント完備

---

## リスク・軽減策

| リスク | 確率 | 影響度 | 軽減策 |
|---|---|---|---|
| solar_terms.json の読込遅延 | 中 | 中 | Lazy loading, キャッシング |
| 計算結果のズレ | 低 | 高 | Python 実装との比較テスト |
| パフォーマンス不足 | 低 | 中 | 最適化、キャッシング |
| Chrome API 変更 | 低 | 低 | Chrome Developer Hub 監視 |

---

## 依存関係・外部リソース

### 必須ツール
- Node.js v14以上
- Chrome 114以降
- VS Code または同等のエディタ

### 外部ライブラリ
- html2canvas (PNG出力用)
- Jest (テスト用)
- ESLint, Prettier (コード品質用)

### 参照資料
- Python実装 (計算ロジック移植用)
- Chrome Extension API ドキュメント
- 四柱推命理論書

---

## 進捗追跡

### 推奨チェックイン頻度
- 日次: 実装ファイルの更新確認
- 週次: テスト実行結果確認
- 隔週: リスク・デリバリー確認

### 成果物受け渡し
1. Phase 1完了時: 基本骨格
2. Phase 2完了時: 計算エンジン
3. Phase 3完了時: UI機能
4. Phase 4完了時: 機能完成版
5. Phase 5完了時: 最終リリース版

---

## 最終チェックリスト

### リリース前の確認

- [ ] 全テストパス（テストカバレッジ 80%以上）
- [ ] ドキュメント完備
- [ ] README が最新
- [ ] CHANGELOG が作成
- [ ] manifest.json が妥当
- [ ] コード品質チェック完了
- [ ] セキュリティレビュー完了
- [ ] Chrome での動作確認
- [ ] 複数OS での動作確認
- [ ] パフォーマンス指標達成

---

**作成者**: Architecture & Implementation Team  
**作成日**: 2025-12-06  
**最終更新**: 2025-12-06  
**ステータス**: Ready for Implementation Phase 1

---

*このチェックリストは開発進行に合わせて更新してください。*
