#!/usr/bin/env node
/**
 * UI review screenshots (npm run screenshots [-- --out ../docs/ui-review/after] [--no-build]).
 *
 * Builds the app, serves dist/, seeds realistic local state (progress, a streak, saved
 * articles, highlights, solved problems) into IndexedDB, and saves 390x844 PNGs in light
 * and dark themes for every main screen.
 */
import { execSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Use the project's Playwright if installed, else the machine's global one (do not install another).
async function loadPlaywright() {
  try {
    return await import('playwright');
  } catch {
    const root = execSync('npm root -g').toString().trim();
    return createRequire(join(root, 'noop.js'))('playwright');
  }
}
const { chromium } = await loadPlaywright();

const APP = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = resolve(APP, outArg >= 0 ? args[outArg + 1] : '../docs/ui-review/after');
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
if (!args.includes('--no-build')) execSync('npm run build', { cwd: APP, stdio: 'inherit' });
mkdirSync(OUT, { recursive: true });

// ---- static server for dist/ ----
const DIST = join(APP, 'dist');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.md': 'text/markdown', '.webmanifest': 'application/manifest+json' };
const server = createServer((req, res) => {
  if (req.url.startsWith('/__seed')) {
    res.writeHead(200, { 'content-type': 'text/html' });
    return res.end('<!doctype html><title>seed</title>');
  }
  let p = join(DIST, decodeURIComponent(req.url.split('?')[0]));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html');
  res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' });
  createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// ---- realistic state from the real content index ----
const index = JSON.parse(readFileSync(join(APP, '../content/index.json'), 'utf8'));
const arts = index.articles;
const bySubject = (s) => arts.filter((a) => (a.subject ?? 'ml') === s).sort((a, b) => a.track.localeCompare(b.track) || a.track_order - b.track_order);
const dsa = bySubject('dsa');
const now = Date.now();
const iso = (daysAgo) => new Date(now - daysAgo * 86_400_000).toISOString();
const today = new Date().toISOString().slice(0, 10);
const progress = {};
dsa.slice(0, 9).forEach((a, i) => {
  progress[a.id] = { scrollPct: 1, startedAt: iso(20 - i), lastReadAt: iso(14 - i), completedAt: iso(14 - i), timeSpentSec: 600 };
});
bySubject('system-design').slice(0, 2).forEach((a, i) => {
  progress[a.id] = { scrollPct: 1, startedAt: iso(6 - i), lastReadAt: iso(5 - i), completedAt: iso(5 - i), timeSpentSec: 700 };
});
const reading = dsa[9];
progress[reading.id] = { scrollPct: 0.42, startedAt: iso(0.2), lastReadAt: iso(0.05), timeSpentSec: 300 };
const highlights = {
  [dsa[0].id]: [{ id: 'h1', start: 40, end: 120, text: 'highlight', color: 'yellow', createdAt: iso(10) }],
};
const problems = { [dsa[1].id]: (dsa[1].practice_problems ?? []).slice(0, 2).map((p) => p.url) };
const prefsBase = { theme: 'light', font: 'serif', fontSize: 19, lineHeight: 1.7, reminderTime: null, syncEnabled: false, onboarded: true, subject: 'dsa', roadmapMonths: 12 };
const state = (theme, extra = {}) => ({
  prefs: { ...prefsBase, theme, ...extra },
  progress,
  quiz: { [dsa[0].id]: { score: 3, answers: [0, 1, 2], takenAt: iso(14) } },
  saved: [dsa[12].id, bySubject('system-design')[3].id, bySubject('cp')[2].id],
  highlights,
  streak: { current: 6, best: 11, lastActiveDate: today, day: today, daySeconds: 420 },
  problems,
  meta: { lastUpdateCheck: null, dismissedVersion: null, completedTracks: [] },
});

async function seed(page, data) {
  await page.goto(BASE + '__seed');
  await page.evaluate(async (d) => {
    const db = await new Promise((ok, no) => {
      const r = indexedDB.open('paperstack');
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => ok(r.result);
      r.onerror = () => no(r.error);
    });
    await new Promise((ok, no) => {
      const tx = db.transaction('kv', 'readwrite');
      for (const [k, v] of Object.entries(d)) tx.objectStore('kv').put(v, k);
      tx.oncomplete = ok;
      tx.onerror = () => no(tx.error);
    });
    db.close();
  }, data);
}

const articleId = reading.id;
const subjects = ['dsa', 'cp', 'famous-algos', 'system-design', 'ml', 'cs-core'];
const SHOTS = [
  { name: 'onboarding', route: '#/onboarding', prefs: { onboarded: false } },
  { name: 'home', route: '#/' },
  { name: 'home-scrolled', route: '#/', scroll: 0.6 },
  ...subjects.map((s) => ({ name: `learn-${s}`, route: `#/learn?subject=${s}` })),
  { name: 'track', route: `#/track/${reading.track}` },
  { name: 'article-top', route: `#/article/${articleId}` },
  { name: 'article-middle', route: `#/article/${articleId}`, scroll: 0.45 },
  { name: 'article-end', route: `#/article/${articleId}`, scroll: 0.93 },
  { name: 'search', route: '#/search' },
  { name: 'library', route: '#/library' },
  { name: 'roadmap', route: '#/roadmap' },
  { name: 'settings', route: '#/settings' },
];

const browser = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: theme, reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = await ctx.newPage();
  for (const shot of SHOTS) {
    if (only && !only.includes(shot.name)) continue;
    await seed(page, state(theme, shot.prefs));
    await page.goto(BASE + shot.route);
    await page.waitForTimeout(1200);
    if (shot.scroll) {
      await page.evaluate((f) => {
        const el = document.scrollingElement;
        el.scrollTo(0, (el.scrollHeight - innerHeight) * f);
      }, shot.scroll);
      await page.waitForTimeout(700);
    }
    await page.screenshot({ path: join(OUT, `${shot.name}-${theme}.png`) });
    process.stdout.write(`${shot.name}-${theme} `);
  }
  await ctx.close();
}
await browser.close();
server.close();
console.log(`\nSaved to ${OUT}`);
