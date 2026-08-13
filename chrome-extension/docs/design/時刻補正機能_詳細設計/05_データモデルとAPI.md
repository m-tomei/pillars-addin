# 05. データモデルとAPI

## 1. 経度マスタ JSON（正式）

パス: `chrome-extension/data/prefecture_longitude.json`

```json
{
  "version": "1.0",
  "referenceMeridianEast": 135.0,
  "referenceName": "明石（日本標準時子午線）",
  "longitudeUnit": "degree_east",
  "sourceNote": "都道府県庁所在地の代表経度",
  "prefectures": [
    {
      "code": "01",
      "name": "北海道",
      "longitudeEast": 141.3469
    }
  ]
}
```

- `code`: 2桁文字列、47件必須

## 2. DataLoader

```js
async loadPrefectureLongitude() {
  return await this.loadJSON('prefecture_longitude.json');
}
```

## 3. ドメイン入力（InputManager 出力）

```ts
type FortuneInput = {
  year: number;
  month: number;
  day: number;
  hour: number | null;
  minute: number | null; // hour非nullなら必ず number（空は0へ正規化）
  gender: '男性' | '女性';
  prefectureCode: string | null;
  offsetMinutes: number;
  shiMode: 'switch23' | 'switch00';
};
```

## 4. TimeCorrectionService

```js
class TimeCorrectionService {
  constructor(longitudeMaster) {
    this.master = longitudeMaster;
    this.byCode = new Map(longitudeMaster.prefectures.map(p => [p.code, p]));
  }

  correct({ year, month, day, hour, minute, prefectureCode, offsetMinutes }) {
    // applied: true（時刻あり前提）
    // マスタは this.master / this.byCode を使用
  }

  static parseOffset(sign, hour, minute) { /* number */ }
  static formatOffset(offsetMinutes) { /* "+05:30" */ }
}
```

## 5. FortuneCalculator

```js
resolveDayPillarDate(year, month, day, hour, shiMode) // private相当
calculateHourPillar(hour, minute, dayStem, shiMode = 'switch23')
calculateFortune(year, month, day, hour, minute, options = {})
// options.shiMode: 'switch23' | 'switch00'
```

## 6. GreatFortuneCalculator（時分対応・確定）

```js
calculateStartAge(birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, roundingMethod = 'round')

_getNextSolarTerm(year, month, day, hour, minute)
_getPreviousSolarTerm(year, month, day, hour, minute)

calculateCycles(birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, numCycles = 10, roundingMethod = 'round')
```

- **時刻あり:** 呼び出し側は `t_corrected` の時分を渡す（正午固定しない）
- **時刻なし:** 呼び出し側は入力年月日と **12:00** を渡す（V1.0踏襲）。Calculator 内で欠損を推測しない（AppController が明示）

## 7. AppController 連携（正式例）

```js
const input = this.inputManager.getFormInput();
let correction;
let fortune;
let cycles;
let displayYear;

if (input.hour == null) {
  correction = { applied: false, reason: 'no_time' };
  fortune = this.fortuneCalculator.calculateFortune(
    input.year, input.month, input.day, null, null, { shiMode: input.shiMode }
  );
  cycles = this.greatFortuneCalculator.calculateCycles(
    input.year, input.month, input.day, 12, 0, input.gender
  );
  displayYear = input.year;
} else {
  correction = this.timeCorrectionService.correct({
    year: input.year,
    month: input.month,
    day: input.day,
    hour: input.hour,
    minute: input.minute,
    prefectureCode: input.prefectureCode,
    offsetMinutes: input.offsetMinutes,
  });
  const { year: y, month: m, day: d, hour: h, minute: mi } = correction.corrected;
  fortune = this.fortuneCalculator.calculateFortune(
    y, m, d, h, mi, { shiMode: input.shiMode }
  );
  cycles = this.greatFortuneCalculator.calculateCycles(
    y, m, d, h, mi, input.gender
  );
  displayYear = y;
}

this.resultRenderer.showResults(
  fortune, juuniunResults, tsuuhenResults, cycles, displayYear,
  { correction, shiMode: input.shiMode }
);
```

初期化:

```js
const master = await this.dataLoader.loadPrefectureLongitude();
this.timeCorrectionService = new TimeCorrectionService(master);
this.formRenderer.populatePrefectures(master);
```

## 8. DateUtils（JST固定・確定）

```js
DateUtils.toJstEpochMillis(year, month, day, hour = 0, minute = 0) // number
DateUtils.createDate(year, month, day, hour = 0, minute = 0)       // new Date(toJstEpochMillis(...))
DateUtils.parseISOString(isoString)                                 // offset保持。new Date(isoString)
DateUtils.getElapsedDays(date1, date2)                              // (t2-t1)/86400000。小数。大運距離
DateUtils.getCalendarDaysDifference(date1, date2)                   // JST暦日の整数差。大運距離には使わない
DateUtils.addMinutes(...) / DateUtils.addDays(...)                  // 数値カレンダー
DateUtils.isValidDate(year, month, day)                             // daysInMonth ベース
```

- 既存 `getDaysDifference` は **廃止**。呼び出しは用途に応じて上記2関数へ置換する
- FortuneCalculator の節入り前後判定は epoch 比較
- GreatFortune の立運距離は **`getElapsedDays` のみ**

## 9. ResultRenderer

```js
showResults(
  fortune,
  juuniunResults,
  tsuuhenResults,
  greatFortuneCycles,
  displayYear,
  meta = {}
)
// meta.correction: TimeCorrectionResult | { applied:false, reason:'no_time' }
// meta.shiMode: 'switch23' | 'switch00'
clear() // 命式・大運・#time-correction-summary をクリア
```

- **P5:** シグネチャ拡張と AppController からの配線（描画は仮でも可）
- **P6:** サマリDOM・注記・PNG・`clear()` の完成

## 10. 定数

```js
export const SHI_MODE = {
  SWITCH_23: 'switch23',
  SWITCH_00: 'switch00',
};
export const DEFAULT_SHI_MODE = SHI_MODE.SWITCH_23;
export const JST_REFERENCE_LONGITUDE = 135.0;
export const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
export const MAX_ABS_OFFSET_MINUTES = 23 * 60 + 59;
```
