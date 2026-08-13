import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { TimeCorrectionService } from '../../js/core/TimeCorrectionService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = path.resolve(__dirname, '../..');

function read(rel) {
  return fs.readFileSync(path.join(EXT_ROOT, rel), 'utf8');
}

test('P8 release gate: version is 1.5.0', async () => {
  const pkg = JSON.parse(read('package.json'));
  const manifest = JSON.parse(read('manifest.json'));
  const html = read('sidepanel.html');
  assert.strictEqual(pkg.version, '1.5.0');
  assert.strictEqual(manifest.version, '1.5.0');
  assert.ok(html.includes('四柱推命 命式計算 v1.5.0'));
});

test('P8 release gate: Tokyo longitude offset is +19 minutes', async () => {
  const master = JSON.parse(read('data/prefecture_longitude.json'));
  const service = new TimeCorrectionService(master);
  const result = service.correct({
    year: 1990,
    month: 5,
    day: 1,
    hour: 8,
    minute: 30,
    prefectureCode: '13',
    offsetMinutes: 0,
  });
  assert.strictEqual(result.longitudeOffsetMinutes, 19);
  assert.ok(result.display.longitudeText.includes('+19分'));
  assert.ok(result.display.longitudeText.includes('東京都'));
});

test('P8 release gate: PNG capture root contains correction summary', async () => {
  const html = read('sidepanel.html');
  const app = read('js/app/AppController.js');
  const resultIdx = html.indexOf('id="result-section"');
  const summaryIdx = html.indexOf('id="time-correction-summary"');
  const fortuneIdx = html.indexOf('id="fortune-result"');
  assert.ok(resultIdx >= 0 && summaryIdx > resultIdx && fortuneIdx > summaryIdx);
  assert.ok(app.includes('exportToPNG'));
  assert.ok(app.includes('resultSection'));
});

test('P8-3 USER_GUIDE and ALGORITHM document known V1.0 diffs', async () => {
  const guide = read('docs/USER_GUIDE.md');
  const algo = read('docs/ALGORITHM.md');

  assert.ok(guide.includes('翌日の日柱'), '23時台日柱の差分');
  assert.ok(guide.includes('12:00'), '時刻なし大運12:00');
  assert.ok(guide.includes('時分') || guide.includes('補正後時刻') || guide.includes('立運'));
  assert.ok(algo.includes('resolveDayPillarDate'));
  assert.ok(algo.includes('日柱') && algo.includes('時干'));
  assert.ok(algo.includes('年柱') && algo.includes('月柱'));
  assert.ok(algo.includes('t_corrected'));
  assert.ok(algo.includes('12:00'));
  assert.ok(algo.includes('getElapsedDays') || algo.includes('小数日'));
  assert.ok(algo.includes('V1.0') && algo.includes('23時台'));
});

test('P8 UI-01〜09 smoke: form, summary, footer, and help text exist in HTML', async () => {
  const html = read('sidepanel.html');
  assert.ok(html.includes('id="prefecture"'));
  assert.ok(html.includes('id="tz-sign"') && html.includes('id="tz-hour"') && html.includes('id="tz-minute"'));
  assert.ok(html.includes('value="switch23"') && html.includes('checked'));
  assert.ok(html.includes('id="time-correction-summary"'));
  assert.ok(html.includes('id="save-png-btn"'));
  assert.ok(html.includes('v1.5.0'));
  assert.ok(html.includes('日本国内のみの場合は 0 のままで構いません'));
});
