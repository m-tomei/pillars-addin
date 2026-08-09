# pillars-addin

四柱推命の命式計算 Chrome 拡張機能。

## ブランチ方針

| ブランチ / タグ | 内容 |
|-----------------|------|
| `main` / `v1.0.0` | V1.0 安定版（命式・大運） |
| `v2.0` | V2.0 開発（命式を本体とし、病薬表示をオプション化。設計書先行） |

## V2.0 の現状

- 実装ベース: Chrome 拡張 `chrome-extension/`（作業版 1.7.0 相当を取り込み）
- 設計書:
  - `chrome-extension/docs/design/病薬表示オプション/`
  - `chrome-extension/docs/design/病薬表示機能_詳細設計/`（レビュー用・最重要）
- 根拠資料: `資料/`（命理正宗・病薬説 / 喜忌篇 / 継善篇 / 気象篇 など）

詳細は `chrome-extension/docs/design/病薬表示機能_詳細設計/README.md` を参照。

## セットアップ（拡張の読み込み）

1. Chrome で `chrome://extensions/` を開く
2. デベロッパーモードを有効化
3. 「パッケージ化されていない拡張機能を読み込む」で `chrome-extension/` を選択
