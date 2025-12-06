# アーキテクチャドキュメント - ガイド

このディレクトリには、四柱推命 Chrome拡張機能の包括的なアーキテクチャドキュメントが含まれています。

## 提供されるドキュメント

### 1. ARCHITECTURE.md （完全版 - 58KB, 1,833行）
**対象者**: アーキテクト、シニア開発者、プロジェクトマネージャー

詳細な設計仕様書。以下を含みます：

- **全体アーキテクチャ**: 4層構成のビジュアル図
- **レイヤ構成**: 各層の責務と実装ガイド
- **ディレクトリ構造**: プロジェクト全体のファイル配置
- **クラス設計**: 8つのメインクラスの詳細設計
  - FortuneCalculator（四柱計算）
  - GreatFortuneCalculator（大運計算）
  - JuuniunCalculator（十二運計算）
  - TsuuhenCalculator（通変星計算）【新規実装】
  - DataLoader（データ管理）
  - InputParser（入力解析）
  - ResultRenderer（結果表示）
  - ImageExporter（PNG出力）
- **データフロー**: 初期化→計算→表示のプロセス図
- **エラーハンドリング**: カスタムエラークラスと戦略
- **パフォーマンス最適化**: キャッシング・遅延読込・計算最適化
- **セキュリティ**: CSP・入力サニタイズ・プライバシー対策
- **テスト可能性**: ユニット/統合/E2Eテストの構造
- **Chrome拡張機能設計**: manifest.json・Side Panel API
- **実装フェーズ**: Phase 1-5の詳細な計画（6-8週間）

**推奨用途**:
- 設計レビュー
- 開発計画の策定
- 技術意思決定
- コードレビューの参照資料

---

### 2. ARCHITECTURE_SUMMARY.md （クイックリファレンス - 7KB, 238行）
**対象者**: 開発者、テスター、新規参加者

要点を素早く把握できるサマリー版。以下を含みます：

- ドキュメントメタデータ
- 主要セクション一覧（目次）
- 4層構成の概要表
- ディレクトリ構造の簡潔版
- クラス設計のハイライト
  - 主要計算式
  - 判定ロジック
- データフロー図（簡略版）
- エラー分類と表示例
- パフォーマンス目標表
- セキュリティ対策一覧
- テスト戦略概要
- 実装フェーズ計画表
- マスタデータファイル一覧
- Chrome拡張機能の主要設定
- 実装チェックリスト（Phase別）

**推奨用途**:
- 朝礼での情報共有
- ドキュメントの軽い参照
- 新規メンバーのオンボーディング
- 進捗確認時の参照

---

### 3. REQUIREMENTS.md （要件定義書）
**対象者**: 全チーム、ステークホルダー

プロジェクトの要件仕様を定義。以下を含みます：

- プロジェクト概要と目的
- 機能要件（コア機能、入出力）
- 計算仕様（アルゴリズム、範囲）
- 非機能要件（UI/UX, パフォーマンス）
- 技術仕様（スタック、フレームワーク）
- 実装フェーズ（Phase 1-4）

**推奨用途**:
- 要件確認
- ステークホルダー説明資料
- テストケースの抽出

---

## ドキュメント間の関係

```
REQUIREMENTS.md (要件定義)
    ↓
ARCHITECTURE.md (詳細設計)
    ↓
ARCHITECTURE_SUMMARY.md (要点抜粋)
    ↓
実装コード
```

**流れ**:
1. **要件確認**: REQUIREMENTS.md で「何を作るか」を確認
2. **設計理解**: ARCHITECTURE.md で「どう作るか」を詳細に理解
3. **開発参照**: ARCHITECTURE_SUMMARY.md で開発中に要点を参照
4. **コード実装**: 設計に従ってコード実装

---

## クイックスタート

### プロジェクト概要を知りたい場合
```
1. REQUIREMENTS.md を読む（10分）
2. ARCHITECTURE_SUMMARY.md で全体像を把握（5分）
```

### 詳細設計を理解したい場合
```
1. ARCHITECTURE.md の「全体アーキテクチャ」を読む（15分）
2. 対象レイヤの詳細を読む（30分）
3. クラス設計セクションで該当クラスを確認（15分）
```

### 開発を開始したい場合
```
1. ARCHITECTURE_SUMMARY.md で実装フェーズを確認（5分）
2. 該当フェーズのタスクを確認（10分）
3. ARCHITECTURE.md の該当セクションで詳細を確認（30分）
4. コード実装を開始
```

### バグを調査したい場合
```
1. ARCHITECTURE_SUMMARY.md のデータフロー図を確認
2. 該当計算エンジン（FortuneCalculator等）の仕様確認
3. ARCHITECTURE.md のエラーハンドリングセクション確認
```

---

## キーコンセプト

### 1. 4層アーキテクチャ
```
┌─ Presentation Layer ──┐
│ (UI, HTML, CSS)       │
├───────────────────────┤
│ Application Layer     │
│ (コントローラ、調整)   │
├───────────────────────┤
│ Domain Layer          │
│ (計算ロジック)         │
├───────────────────────┤
│ Data Layer            │
│ (データアクセス)       │
└───────────────────────┘
```

### 2. 計算エンジンの階層
```
FortuneCalculator
    ↓ (四柱計算結果)
JuuniunCalculator + TsuuhenCalculator
    ↓ (補助データ付加)
GreatFortuneCalculator
    ↓ (大運計算結果)
ResultFormatter
    ↓ (表示用フォーマット)
ResultRenderer
    ↓ (HTML表示)
ImageExporter (PNG出力)
```

### 3. キーアルゴリズム

#### 年柱計算
```javascript
index = (year - 1864) % 60;
[stem, branch] = sixtyJiazi[index];
```

#### 大運判定
```javascript
isForward = (gender === '男性' && isYangYear) || 
            (gender === '女性' && !isYangYear);
```

#### 日柱計算
```javascript
daysFrom1900 = date - new Date(1900, 0, 1);
index = (daysFrom1900 + 10) % 60;
```

---

## ファイルサイズ統計

| ドキュメント | サイズ | 行数 | 用途 |
|---|---|---|---|
| ARCHITECTURE.md | 58 KB | 1,833行 | 完全版詳細設計 |
| ARCHITECTURE_SUMMARY.md | 6.9 KB | 238行 | クイックリファレンス |
| REQUIREMENTS.md | ~5 KB | 150行 | 要件定義 |
| README_ARCHITECTURE.md | このファイル | - | ガイド |

**合計**: 約70 KB の包括的ドキュメント

---

## 主要技術仕様

### 計算対象
- **年範囲**: 1900年 - 2100年
- **主要計算**: 四柱（年柱・月柱・日柱・時柱）+ 大運
- **補助データ**: 十二運・通変星

### プラットフォーム
- **ブラウザ**: Google Chrome 114以降
- **言語**: Vanilla JavaScript (ES6+)
- **API**: Chrome Extension Manifest V3, Side Panel API
- **UI**: HTML5 + CSS3

### パフォーマンス目標
- アプリ起動: < 1.5秒
- 四柱計算: < 300ms
- 結果表示: < 200ms
- PNG出力: < 2秒

---

## セキュリティ・プライバシー

- **通信**: なし（完全にローカル計算）
- **ストレージ**: セッション中のメモリのみ
- **データ送信**: データ外部送信なし
- **CSP**: `script-src 'self'` で厳格化

---

## 実装タイムライン

| フェーズ | 期間 | 主要成果 |
|---|---|---|
| Phase 1 | 1-2週 | プロジェクト基盤・UI骨組み |
| Phase 2 | 2-3週 | 計算エンジン実装 |
| Phase 3 | 2週 | UI・入力処理実装 |
| Phase 4 | 1-2週 | PNG出力・最適化 |
| Phase 5 | 1-2週 | テスト・ドキュメント |

**合計**: 6-8週間

---

## チェックリスト（実装開始前）

- [ ] REQUIREMENTS.md を読了
- [ ] ARCHITECTURE_SUMMARY.md で全体像を理解
- [ ] ARCHITECTURE.md で詳細設計を確認
- [ ] 開発環境のセットアップ
- [ ] Phase 1 タスクの詳細確認

---

## よくある質問（FAQ）

### Q: どのドキュメントから始めるべき？
**A**: REQUIREMENTS.md で要件を確認し、ARCHITECTURE_SUMMARY.md で全体像を把握してください。

### Q: 特定のクラスの詳細を知りたい
**A**: ARCHITECTURE.md の「クラス設計」セクションを参照してください。

### Q: 実装フェーズを確認したい
**A**: ARCHITECTURE_SUMMARY.md の「実装フェーズ」表、または ARCHITECTURE.md の「実装フェーズ」セクションを参照。

### Q: データフロー全体を理解したい
**A**: ARCHITECTURE.md の「データフロー」セクションの図を確認してください。

### Q: エラーハンドリングをどうすべき？
**A**: ARCHITECTURE_SUMMARY.md または ARCHITECTURE.md の「エラーハンドリング戦略」を参照。

---

## 関連リソース

### Python参照実装
```
C:/Users/m_mor/Desktop/Prog/src/services/
├── calculation.py           # 四柱計算
├── great_fortune_calc.py    # 大運計算
└── juuniun_calculator.py    # 十二運計算
```

### マスタデータ
```
src/data/
├── stem_branch_master.json    # 干支マスタ
├── solar_terms.json           # 節入り時刻データ
├── juuniin_master.json        # 十二運マスタ
├── tsuuhen_master.json        # 通変星マスタ
├── naon_master.json           # 納音マスタ
└── gokotongetsuketsu.json     # 五行月建日月マスタ
```

---

## サポート情報

**問題が発生した場合**:
1. ARCHITECTURE_SUMMARY.md のエラー分類表を確認
2. ARCHITECTURE.md の「エラーハンドリング戦略」を参照
3. クラス設計の「プライベートメソッド」で実装詳細を確認

**設計上の質問がある場合**:
1. ARCHITECTURE.md で該当セクションを検索
2. 関連するクラス設計を確認
3. データフロー図で全体を理解

---

## バージョン情報

- **ドキュメントバージョン**: 1.0
- **作成日**: 2025-12-06
- **対象プロジェクト**: 四柱推命 Chrome Extension (Pillars Add-in)
- **ステータス**: Ready for Implementation

---

## ドキュメント作成者

Architecture Design Team

---

## ライセンス

このドキュメントは、四柱推命 Chrome拡張機能プロジェクト用に作成されました。

---

**最後の確認**: このガイドとAARCHITECTURE.md、ARCHITECTURE_SUMMARY.mdを参照しながら、実装を進めてください！
