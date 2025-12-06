# アーキテクチャ設計書 - クイックリファレンス

このドキュメントは `ARCHITECTURE.md` の要点をまとめたものです。詳細は完全版を参照してください。

## ファイル情報
- **ファイルパス**: `/c/Users/m_mor/Desktop/Add-in/ARCHITECTURE.md`
- **ファイルサイズ**: 58 KB
- **行数**: 1,833 行
- **言語**: 日本語（Markdown形式）
- **バージョン**: 1.0
- **作成日**: 2025-12-06

---

## 主要セクション一覧

### 1. 全体アーキテクチャ
- **4層構成**: Presentation → Application → Domain → Data
- **相互作用フロー**: ユーザー操作から結果表示までのデータフロー図
- **責務分離**: 各層が明確に役割を持つ

### 2. レイヤ構成
| レイヤ | 主要責務 | 主要コンポーネント |
|---|---|---|
| Presentation | UI表示・イベント処理 | FormRenderer, ResultRenderer |
| Application | ビジネスロジック調整 | AppController, StateManager |
| Domain | 計算ロジック実装 | FortuneCalculator, GreatFortuneCalculator |
| Data | データアクセス | DataLoader, DataCache |

### 3. ディレクトリ構造
```
src/
├── core/            # ドメイン層・データ層
├── ui/              # プレゼンテーション層
├── app/             # アプリケーション層
├── utils/           # ユーティリティ
└── data/            # マスタデータ
```

---

## クラス設計ハイライト

### FortuneCalculator（四柱計算）
```javascript
計算式:
  年柱: (year - 1864) % 60
  月柱: 節入り時刻を基準に月支を判定 + 五虎遁で月干
  日柱: (days_from_1900-01-01 + 10) % 60
  時柱: 23:00境界 + 五虎遁で時干
```

### GreatFortuneCalculator（大運計算）
```javascript
順行/逆行判定:
  男性 ∧ 陽年 → 順行
  男性 ∧ 陰年 → 逆行
  女性 ∧ 陰年 → 順行
  女性 ∧ 陽年 → 逆行

開始年齢:
  age = round(days_to_next_solar_term / 3)
```

### JuuniunCalculator（十二運計算）
- 日干と地支の組み合わせから十二運を特定
- 12種の十二運: 長生, 沐浴, 冠帯, 建禄, 帝旺, 衰, 病, 死, 墓, 絶, 胎, 養

### TsuuhenCalculator（通変星計算）**[新規実装]**
- 日干と対象干支の関係から通変星を計算
- 10種の通変星: 比肩, 劫財, 食神, 傷官, 偏財, 正財, 偏官, 正官, 偏印, 正印
- 天干の5つの関係: 同, 生, 剋, 被剋, 洩

---

## データフロー（簡略版）

```
入力 → 検証 → 計算 → フォーマット → 表示 → (PNG出力)
       ↓
    エラー → エラー表示
```

### 計算エンジンの呼び出し順序
1. FortuneCalculator.calculateFourPillars()
2. JuuniunCalculator.calculateForAllPillars()
3. TsuuhenCalculator.calculateForAllPillars()
4. GreatFortuneCalculator.calculateGreatFortune()

---

## エラーハンドリング

### Custom Error Classes
- `ValidationError`: 入力値エラー
- `RangeError`: 範囲外エラー
- `DataLoadError`: データ読込エラー
- `CalculationError`: 計算エラー
- `UnexpectedError`: 予期しないエラー

### エラー表示例
| エラー | ユーザー表示 |
|---|---|
| 無効な日付 | "無効な日付です" |
| 範囲外年 | "計算可能範囲は1900-2100年です" |
| データ未読込 | "必要なデータが見つかりません" |
| 計算失敗 | "計算に失敗しました" |

---

## パフォーマンス目標

| 処理 | 目標 | 実現方法 |
|---|---|---|
| アプリ起動 | <1.5秒 | 遅延読込 |
| 四柱計算 | <300ms | メモ化 |
| 大運計算 | <500ms | 効率的なアルゴリズム |
| 結果表示 | <200ms | バッチ更新 |
| PNG出力 | <2秒 | Canvas最適化 |

### キャッシング戦略
- **永続キャッシュ**: stem_branch_master.json など
- **セッションキャッシュ**: 計算結果
- **短期キャッシュ**: solar_terms.json（24時間）

---

## セキュリティ対策

| 対策 | 実装方法 |
|---|---|
| CSP | `script-src 'self'` |
| XSS対策 | HTML特殊文字エスケープ |
| 入力サニタイズ | validateNumber, validateDate |
| プライバシー | ローカル計算のみ、通信なし |

---

## テスト構成

```
tests/
├── unit/          # ユニットテスト（各計算器）
├── integration/   # 統合テスト（全フロー）
└── fixtures/      # テストデータ
```

**テストカバレッジ目標**: 80% 以上

---

## 実装フェーズ（合計6-8週間）

| Phase | タイムライン | 主要成果 |
|---|---|---|
| 1 | 1-2週 | プロジェクト基盤・UI骨組み |
| 2 | 2-3週 | 四柱・大運・十二運・通変星計算 |
| 3 | 2週 | 入力フォーム・結果表示 |
| 4 | 1-2週 | PNG出力・パフォーマンス最適化 |
| 5 | 1-2週 | テスト・ドキュメント完成 |

---

## マスタデータファイル

| ファイル | サイズ | 用途 |
|---|---|---|
| stem_branch_master.json | ~5KB | 干支・蔵干データ |
| solar_terms.json | ~200KB | 節入り時刻（遅延読込） |
| juuniin_master.json | ~10KB | 十二運テーブル |
| tsuuhen_master.json | ~15KB | 通変星テーブル |
| naon_master.json | ~15KB | 納音データ |
| gokotongetsuketsu.json | ~5KB | 五行月建日月 |

---

## Chrome拡張機能固有設計

**manifest.json 主要設定**:
```json
{
  "manifest_version": 3,
  "permissions": ["sidePanel"],
  "side_panel": {
    "default_path": "public/side-panel.html"
  }
}
```

**Side Panel API**: Chrome 114以降対応

---

## 実装チェックリスト

### Phase 1完了時
- [ ] manifest.json が機能している
- [ ] サイドパネルが表示される
- [ ] フォーム入力フィールドが表示される

### Phase 2完了時
- [ ] FortuneCalculator で既知のテストケースを通過
- [ ] GreatFortuneCalculator で順行/逆行が正確
- [ ] 十二運計算が正確
- [ ] 通変星計算が正確

### Phase 3完了時
- [ ] ユーザーがフォームから生年月日を入力可能
- [ ] クリップボードからのペースト機能が動作
- [ ] 計算結果が見やすく表示される

### Phase 4完了時
- [ ] PNG出力がダウンロード可能
- [ ] 計算速度が1秒以内
- [ ] パフォーマンスが最適化

### Phase 5完了時
- [ ] テストカバレッジが80%以上
- [ ] ドキュメントが完備
- [ ] リリース可能な状態

---

## 参考情報

### 既存Python実装参照先
- `C:/Users/m_mor/Desktop/Prog/src/services/calculation.py`
- `C:/Users/m_mor/Desktop/Prog/src/services/great_fortune_calc.py`
- `C:/Users/m_mor/Desktop/Prog/src/services/juuniun_calculator.py`

### 関連ドキュメント
- `/c/Users/m_mor/Desktop/Add-in/REQUIREMENTS.md` - 要件定義書
- `/c/Users/m_mor/Desktop/Add-in/ARCHITECTURE.md` - 完全版アーキテクチャ

---

**最終更新**: 2025-12-06
**作成者**: Architecture Design Team
