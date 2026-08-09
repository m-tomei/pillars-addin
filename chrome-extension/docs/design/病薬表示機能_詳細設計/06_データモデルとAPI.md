# 06. データモデルとAPI

| 文書ID | BYO-DD-06 |
|--------|-----------|

## 1. ByoyakuResult（拡張後）

```text
ByoyakuResult {
  // --- 後方互換（先頭診断） ---
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
| `disease` / `medicine` / `diagnoses` | 維持 |
| `DaiunHyoukaCalculator` | 先頭の medicine.element / disease.element を継続利用。副薬は初版無視可 |
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
