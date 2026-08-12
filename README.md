# pillars-addin

四柱推命の命式計算 Chrome 拡張機能。

## ブランチ方針

| ブランチ / タグ | 内容 |
|-----------------|------|
| `main` / `v1.0.0` | V1.0 安定版（命式・大運） |
| `v2.0` / `2.0.0` | V2.0（命式・大運＋病薬表示オプション） |

## V2.0 の現状

- **バージョン**: `chrome-extension/manifest.json` / `package.json` → **2.0.0**
- **実装**: Chrome 拡張 `chrome-extension/`（Sprint B3 完了・病薬パイプライン接続済み）
- **主な追加機能**:
  - 病薬診断オプション（既定 OFF）
  - 気象・主軸・身旺弱・四病四薬・喜忌の表示
  - 病薬 ON 時の大運吉凶色分け
- **設計書**:
  - `chrome-extension/docs/design/病薬表示オプション/`
  - `chrome-extension/docs/design/病薬表示機能_詳細設計/`（詳細設計・受入シナリオ）
- **根拠資料**: `資料/`（命理正宗・病薬説 / 喜忌篇 / 継善篇 / 気象篇 など）
- **ユーザーガイド**: `chrome-extension/docs/USER_GUIDE.md`

詳細は `chrome-extension/docs/design/病薬表示機能_詳細設計/README.md` を参照。

## セットアップ（拡張の読み込み）

1. Chrome で `chrome://extensions/` を開く
2. デベロッパーモードを有効化
3. 「パッケージ化されていない拡張機能を読み込む」で `chrome-extension/` を選択

## テスト

```bash
cd chrome-extension
npm test
```
