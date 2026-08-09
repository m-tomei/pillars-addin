# 06. データモデルとAPI

| 文書ID | BYO-DD-06 |
|--------|-----------|

## 1. ByoyakuResult（拡張後）

```text
ByoyakuResult {
  // --- 後方互換（代表診断。表示配列の先頭とは限らない） ---
  disease: DiseaseView
  medicine: MedicineView
  summary: string
  fourDisease: '雕'|'枯'|'旺'|'弱'
  fourMedicine: '損'|'益'|'生'|'長'

  // --- 複数診断 ---
  diagnoses: DiagnosisItem[]

  // --- 新增（本詳細設計） ---
  heaviestElement: string
  heaviestRatio: number
  kishou: KishouResult          // 参照 or 埋め込み
  keizen: {
    pillar: KeizenResult.pillar
    breaks: BreakItem[]
    summary: string
  }
  balance: {
    label: '病重薬重'|'病重薬軽'|'病軽薬重'|'病軽薬軽'|'病なし薬なし'
    diseaseScore: number        // 0-3
    medicineScore: number       // 0-3
    reading: string             // 表示用短文
  }
  kiki: {
    ki: Array<{ label: string, element?: string, tenGod?: string }>
    ji: Array<{ label: string, element?: string, tenGod?: string }>
    note: string
  }
  meta: {
    version: string             // 例: 'byoyaku-2.0'
    choukouAligned: boolean     // 先頭診断が調候一致か
  }
}
```

### DiagnosisItem

```text
DiagnosisItem {
  role: 'primary' | 'secondary'   // 主病 / 副病（気象など）
  source: 'keizen' | 'kishou' | 'juuju' | 'fallback'
  disease: DiseaseView
  medicine: MedicineView
  medicineSecondary?: MedicineView  // 調候併記時
  reason: string
  fourDisease?: string              // 個別に持つ場合
  fourMedicine?: string
}
```

### DiseaseView / MedicineView

```text
DiseaseView {
  name: string
  element: string|null
  causeElements?: string[]       // 気象病など、原因側が複数のとき
  deficientElements?: string[]   // 不足側。薬五行と病五行を混同しない
  tenGod: string|null
  severity: 'mild'|'moderate'|'severe'
}

MedicineView {
  name: string
  element: string|null
  elements?: string[]          // 調候で複数
  tenGod: string|null
  exists: boolean
  location: string|null
  choukouAligned?: boolean
}
```

## 2. モジュールAPI一覧

| クラス | メソッド | 入力 | 出力 |
|--------|----------|------|------|
| KishouAssessor | `assess(fortune, dist?)` | 命式 | KishouResult |
| KeizenAnalyzer | `analyze(kakkyoku, strength, tsuuhen, fortune)` | 前段結果 | KeizenResult |
| ByoyakuCalculator | `diagnose(input)` | 上記＋命式 | ByoyakuResult |

`diagnose(input)` はv2の正規APIとし、`kishouResult` と `keizenResult` を必須にする。既存の位置引数形式を残す場合は移行用アダプタに限定し、新規コード・テストでは使用しない。

## 3. ResultRenderer 契約

```text
renderByoyakuSection({
  strengthResult,
  kakkyokuResult,
  byoyakuResult
})
```

必須で読むフィールド:

- `byoyakuResult.kishou`
- `byoyakuResult.keizen.pillar`
- `byoyakuResult.diagnoses`
- `byoyakuResult.balance`
- `byoyakuResult.kiki`（任意表示）

## 4. 互換方針

| 既存利用箇所 | 方針 |
|--------------|------|
| `disease` / `medicine` | `role='primary'` の用神損傷診断を代表値とする。該当なしなら表示先頭を使用 |
| `diagnoses` | 表示順を保持。気象severe時は気象診断が先頭になりうる |
| `diagnose` の位置引数 | v2ではobject入力へ移行。必要なら互換アダプタを一時提供 |
| `DaiunHyoukaCalculator` | 代表値の非null五行だけを評価する。片側nullは片側評価、両側nullは吉凶評価をスキップ |
| 旧UI `renderKakkyokuByoyaku` | `renderByoyakuSection` へ置換 |

## 5. データファイル

| ファイル | 変更 |
|----------|------|
| `kakkyoku_rules.json` | 原則維持。condition名を Keizen と一致させる |
| `kishou_rules.json` | 任意。閾値を外出しする場合 |

## 6. バリデーション

`diagnose` 開始時:

```text
required: kakkyoku, strength, fortune, tsuuhen, kishou, keizen
missing → CalculationError('病薬判定に必要なデータが不足しています')
```

`DaiunHyoukaCalculator` へ渡す前に `disease.element` / `medicine.element` のnullを許容する。気象病の不足側を病五行へ代入して互換性を装ってはならない。
