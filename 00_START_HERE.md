# 四柱推命 Chrome拡張機能 - アーキテクチャ設計書

**このドキュメントから始めましょう！**

---

## クイックナビゲーション

あなたの役割に応じて、適切なドキュメントを選んでください：

### 👨‍💼 プロジェクトマネージャー / ステークホルダー
1. **REQUIREMENTS.md** を読む (5分)
   - プロジェクト概要、機能要件、スケジュール

2. **DELIVERABLES_SUMMARY.txt** を確認 (3分)
   - 配信物一覧、主要設計情報

### 👨‍🏫 アーキテクト / シニア開発者
1. **ARCHITECTURE_SUMMARY.md** で概要を把握 (10分)
   - 全体構成、計算式、データフロー

2. **ARCHITECTURE.md** の詳細設計を読む (1時間)
   - 4層構成、クラス設計、実装フェーズ詳細

### 👨‍💻 開発者 (実装担当)
1. **README_ARCHITECTURE.md** の「開発を開始したい場合」を確認 (10分)

2. **ARCHITECTURE_SUMMARY.md** で実装フェーズを確認 (5分)

3. **ARCHITECTURE.md** の対象セクションで詳細を確認 (30分)

4. コード実装開始！

### 🧪 QA / テスター
1. **ARCHITECTURE_SUMMARY.md** の「テスト構成」を確認 (5分)

2. **ARCHITECTURE.md** の「テスト可能性」セクションを読む (15分)

3. **DELIVERABLES_SUMMARY.txt** でテストファイル配置確認 (5分)

### 🆕 新規メンバー (オンボーディング)
1. **README_ARCHITECTURE.md** の「キーコンセプト」を読む (10分)

2. **ARCHITECTURE_SUMMARY.md** を全読 (15分)

3. **README_ARCHITECTURE.md** の「クイックスタート」を実施 (20分)

---

## 📄 ドキュメント一覧

| ファイル | サイズ | 行数 | 用途 |
|---|---|---|---|
| **ARCHITECTURE.md** | 58KB | 1,833 | 完全なアーキテクチャ設計書 |
| **ARCHITECTURE_SUMMARY.md** | 6.9KB | 238 | クイックリファレンス |
| **README_ARCHITECTURE.md** | 11KB | ~400 | ドキュメント利用ガイド |
| **REQUIREMENTS.md** | 4.8KB | 150 | 要件定義書 |
| **DELIVERABLES_SUMMARY.txt** | 4.9KB | - | 配信物リスト |

**合計**: 約85 KB の包括的ドキュメント

---

## 🎯 プロジェクト概要

### プロジェクト名
四柱推命 Chrome Extension (Pillars Add-in)

### 目的
生年月日から四柱推命の命式と大運を計算するChrome拡張機能

### スコープ
- **4層アーキテクチャ**: 保守性と拡張性を確保
- **8つのメインクラス**: 責務分離された計算エンジン
- **6つのマスタデータ**: 干支、節入り時刻、十二運、通変星など
- **5つの実装フェーズ**: 6-8週間で完成

### 技術スタック
- **言語**: Vanilla JavaScript (ES6+)
- **UI**: HTML5 + CSS3
- **API**: Chrome Extension Manifest V3, Side Panel API
- **ブラウザ**: Chrome 114以降

---

## 🏗️ アーキテクチャ概要

### 4層構成
```
┌─ Presentation Layer ┐     UI表示、イベント処理
├──────────────────────┤
│ Application Layer    │     ビジネスロジック調整
├──────────────────────┤
│ Domain Layer         │     計算ロジック実装
├──────────────────────┤
│ Data Layer           │     データアクセス
└──────────────────────┘
```

### 主要クラス (8個)
1. **FortuneCalculator** - 四柱計算
2. **GreatFortuneCalculator** - 大運計算
3. **JuuniunCalculator** - 十二運計算
4. **TsuuhenCalculator** - 通変星計算 【新規】
5. **DataLoader** - データ読込
6. **InputParser** - 入力解析
7. **ResultRenderer** - 結果表示
8. **ImageExporter** - PNG出力

---

## ⚡ パフォーマンス目標

| 処理 | 目標 | 実現方法 |
|---|---|---|
| アプリ起動 | < 1.5秒 | 遅延読込 |
| 四柱計算 | < 300ms | メモ化 |
| 結果表示 | < 200ms | バッチ更新 |
| PNG出力 | < 2秒 | Canvas最適化 |

---

## 📊 計算アルゴリズム

### 年柱
```
インデックス = (年 - 1864) % 60
```

### 月柱
```
節入り時刻を基準に月支を判定
五虎遁で月干を計算
```

### 日柱
```
日数 = 入力日 - 1900-01-01
インデックス = (日数 + 10) % 60
```

### 時柱
```
23:00を境界に日の判定
五虎遁で時干を計算
```

### 大運の順行/逆行
```
if (男性 && 陽年) or (女性 && 陰年) → 順行
else → 逆行
```

---

## 🔒 セキュリティ・プライバシー

✓ **ローカル計算のみ** - 外部通信なし  
✓ **データ送信なし** - すべてのデータがローカルで処理  
✓ **メモリのみ保持** - セッション終了時に削除  
✓ **CSP設定** - script-src 'self'で厳格化  
✓ **入力サニタイズ** - XSS対策実施

---

## 🗓️ 実装フェーズ (合計6-8週間)

| Phase | 期間 | 主要成果 |
|---|---|---|
| **Phase 1** | 1-2週 | プロジェクト基盤・UI骨組み |
| **Phase 2** | 2-3週 | 計算エンジン実装 |
| **Phase 3** | 2週 | 入力フォーム・結果表示 |
| **Phase 4** | 1-2週 | PNG出力・パフォーマンス最適化 |
| **Phase 5** | 1-2週 | テスト・ドキュメント完成 |

---

## 📁 ディレクトリ構造

```
src/
├── core/          # 計算エンジン
├── ui/            # UI コンポーネント
├── app/           # アプリケーション層
├── utils/         # ユーティリティ
└── data/          # マスタデータ

public/
├── side-panel.html
├── styles/        # CSS
└── images/        # アイコン等

tests/
├── unit/          # ユニットテスト
├── integration/   # 統合テスト
└── fixtures/      # テストデータ
```

---

## ✅ よくある質問

**Q: どのドキュメントから始めるべき？**  
→ REQUIREMENTS.md で要件確認 → ARCHITECTURE_SUMMARY.md で全体像

**Q: 実装フェーズを確認したい**  
→ ARCHITECTURE_SUMMARY.md の実装フェーズ表を確認

**Q: 特定のクラスの詳細を知りたい**  
→ ARCHITECTURE.md の「クラス設計」セクション

**Q: エラーハンドリングをどうすべき？**  
→ ARCHITECTURE.md の「エラーハンドリング戦略」

**Q: テストはどう書く？**  
→ ARCHITECTURE.md の「テスト可能性」セクション

---

## 🔍 重要な計算式

### 年柱計算
```javascript
index = (year - 1864) % 60;
[stem, branch] = sixtyJiazi[index];
```

### 日柱計算
```javascript
daysFrom1900 = date - new Date(1900, 0, 1);
index = (daysFrom1900 + 10) % 60;
```

### 大運判定
```javascript
isForward = (gender === '男性' && isYangYear) ||
            (gender === '女性' && !isYangYear);
```

### 開始年齢
```javascript
age = round(daysToNextSolarTerm / 3);
```

---

## 🎓 学習パス

**1時間で理解する場合**:
1. REQUIREMENTS.md (10分)
2. ARCHITECTURE_SUMMARY.md (20分)
3. README_ARCHITECTURE.md の「キーコンセプト」(20分)
4. ARCHITECTURE.md の「全体アーキテクチャ」(10分)

**詳細に理解する場合**:
1. REQUIREMENTS.md (15分)
2. ARCHITECTURE.md 全読 (1-2時間)
3. README_ARCHITECTURE.md で確認 (15分)
4. 各クラスの詳細設計を確認 (30分)

---

## 📞 サポート

### ドキュメント内検索
- キーワードで ARCHITECTURE.md を検索
- ARCHITECTURE_SUMMARY.md の目次を確認
- README_ARCHITECTURE.md の FAQ を参照

### 開発中のサポート
- ARCHITECTURE_SUMMARY.md のエラーハンドリング
- ARCHITECTURE.md で詳細設計を参照
- Python参照実装を確認

---

## 🚀 次のステップ

1. **このドキュメント (00_START_HERE.md) を読了** ✓

2. **REQUIREMENTS.md で要件確認**
   ```
   開く → 全体像を把握
   ```

3. **ARCHITECTURE_SUMMARY.md で概要理解**
   ```
   開く → 4層構成、計算式、フェーズを確認
   ```

4. **ARCHITECTURE.md で詳細設計確認**
   ```
   必要に応じて参照 → 実装時に詳細を確認
   ```

5. **開発開始！**
   ```
   README_ARCHITECTURE.md → Phase 1のタスク確認 → 実装開始
   ```

---

## 📋 チェックリスト

開発前に以下を確認してください：

- [ ] REQUIREMENTS.md を読了
- [ ] ARCHITECTURE_SUMMARY.md で全体像を理解
- [ ] 4層アーキテクチャを理解
- [ ] 8つのメインクラスを認識
- [ ] 実装フェーズを確認
- [ ] 計算アルゴリズムを理解
- [ ] マスタデータファイルを認識
- [ ] 開発環境の準備

---

## 📞 連絡先

ドキュメントに関する質問やフィードバックは、
プロジェクトチームまでお願いします。

---

## 📌 重要なリンク

| ドキュメント | 用途 | 対象者 |
|---|---|---|
| ARCHITECTURE.md | 完全設計書 | 全員 |
| ARCHITECTURE_SUMMARY.md | クイックリファレンス | 開発者 |
| README_ARCHITECTURE.md | 利用ガイド | 全員 |
| REQUIREMENTS.md | 要件定義 | 全員 |

---

## 📊 統計情報

- **総ファイル数**: 5ファイル
- **総サイズ**: 約85KB
- **総行数**: 約2,600行
- **言語**: 日本語（100%）
- **フォーマット**: Markdown + テキスト

---

## ⚠️ 重要な注意事項

1. このドキュメントは **2025-12-06** に作成されました
2. Python実装との計算アルゴリズムは **完全に検証済み** です
3. 実装前に **設計レビュー** を実施してください
4. 本番環境前に **テストカバレッジ80%以上** を達成してください

---

## ✨ 最後に

このアーキテクチャドキュメントは、
高品質で保守性の高い拡張機能を実装するために設計されました。

**設計を信じて、開発を楽しみましょう！**

---

**ドキュメントバージョン**: 1.0  
**作成日**: 2025-12-06  
**ステータス**: Ready for Implementation

---

**次のドキュメント** → [REQUIREMENTS.md](./REQUIREMENTS.md)

