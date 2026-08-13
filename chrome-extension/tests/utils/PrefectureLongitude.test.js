import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { JST_REFERENCE_LONGITUDE } from '../../js/utils/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MASTER_PATH = path.resolve(__dirname, '../../data/prefecture_longitude.json');

test('prefecture longitude master has 47 prefectures and Tokyo', async () => {
    const master = JSON.parse(fs.readFileSync(MASTER_PATH, 'utf8'));
    assert.strictEqual(master.referenceMeridianEast, JST_REFERENCE_LONGITUDE);
    assert.strictEqual(master.prefectures.length, 47, 'should contain 47 prefectures');
    const tokyo = master.prefectures.find((p) => p.code === '13');
    assert.ok(tokyo, 'Tokyo code 13 should exist');
    assert.strictEqual(tokyo.name, '東京都');
    assert.strictEqual(tokyo.longitudeEast, 139.6917);
    const codes = new Set(master.prefectures.map((p) => p.code));
    assert.strictEqual(codes.size, 47, 'prefecture codes should be unique');
});
