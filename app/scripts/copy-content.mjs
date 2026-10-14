// Copies /content into app/public/content so it ships inside the web build and the APK.
// content/index.json is produced by pipeline/build_index.py (which also validates everything).
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, '..', '..', 'content');
const dest = join(here, '..', 'public', 'content');

if (!existsSync(join(src, 'index.json')) || process.env.PAPERSTACK_REBUILD_INDEX === '1') {
  const py = process.platform === 'win32' ? 'python' : 'python3';
  console.log('content/index.json missing: running pipeline/build_index.py');
  const r = spawnSync(py, [join(here, '..', '..', 'pipeline', 'build_index.py')], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.error('build_index.py failed. Fix the content errors above, then run the build again.');
    process.exit(1);
  }
}

rmSync(dest, { recursive: true, force: true });
mkdirSync(dest, { recursive: true });
for (const item of ['index.json', 'tracks.json', 'papers', 'primers']) {
  if (existsSync(join(src, item))) cpSync(join(src, item), join(dest, item), { recursive: true });
}
console.log(`Copied content to ${dest}`);
