import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(__dirname, '../../docs');

function readDoc(name) {
  return fs.readFileSync(path.join(DOCS, name), 'utf8');
}

test('P7-T2 USER_GUIDE covers Tokyo +19, shi-mode, no-time 12:00, and PNG summary', async () => {
  const guide = readDoc('USER_GUIDE.md');
  assert.ok(guide.includes('v1.5.2') || guide.includes('1.5.2') || guide.includes('1.5.0'));
  assert.ok(guide.includes('+19分'), 'Tokyo longitude offset');
  assert.ok(guide.includes('東経135'));
  assert.ok(guide.includes('23時切替'));
  assert.ok(guide.includes('0時切替'));
  assert.ok(guide.includes('翌日の日柱'));
  assert.ok(guide.includes('12:00'), 'no-time 大運 uses 12:00');
  assert.ok(guide.includes('時柱も出しません') || guide.includes('時柱なし'));
  assert.ok(guide.includes('時刻不明'));
  assert.ok(guide.includes('手動'));
  assert.ok(guide.includes('夏時間'));
  assert.ok(guide.includes('子平法'));
});

test('P7-T2 ALGORITHM covers correction formula, resolveDayPillarDate scope, and 大運 time', async () => {
  const algo = readDoc('ALGORITHM.md');
  assert.ok(algo.includes('Math.round(4 * (lon - 135))') || algo.includes('round(4'));
  assert.ok(algo.includes('+19分'));
  assert.ok(algo.includes('resolveDayPillarDate'));
  assert.ok(algo.includes('日柱'));
  assert.ok(algo.includes('時干'));
  assert.ok(algo.includes('年柱') && algo.includes('月柱'));
  assert.ok(algo.includes('非適用') || algo.includes('使いません'));
  assert.ok(algo.includes('getElapsedDays') || algo.includes('小数日'));
  assert.ok(algo.includes('12:00'));
  assert.ok(algo.includes('t_corrected'));
  assert.ok(algo.includes('子平法'));
});
