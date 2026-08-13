import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_ROOT = path.resolve(__dirname, '../..');

const EXPECTED_VERSION = '1.5.2';

test('UI-08 footer, package.json, and manifest are 1.5.2', async () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(EXT_ROOT, 'package.json'), 'utf8'));
  const manifest = JSON.parse(fs.readFileSync(path.join(EXT_ROOT, 'manifest.json'), 'utf8'));
  const html = fs.readFileSync(path.join(EXT_ROOT, 'sidepanel.html'), 'utf8');

  assert.strictEqual(pkg.version, EXPECTED_VERSION);
  assert.strictEqual(manifest.version, EXPECTED_VERSION);

  const footerMatch = html.match(/<footer>[\s\S]*?<\/footer>/);
  assert.ok(footerMatch, 'footer must exist');
  assert.ok(footerMatch[0].includes(`v${EXPECTED_VERSION}`), footerMatch[0]);
  assert.ok(!footerMatch[0].includes('v1.0.0'), 'footer must not keep v1.0.0');
});
