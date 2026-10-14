// Renders the PaperStack mark (stacked paper sheets forming a "P") into every
// source image the web app and @capacitor/assets need. Run: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const resources = join(here, '..', 'resources');
const pub = join(here, '..', 'public');
mkdirSync(resources, { recursive: true });

const ORANGE = '#FF6719';

// The mark on a 64x64 grid, drawn in `ink` on top of `paper` sheets.
const mark = (paper, ink, backOpacity = 0.45) => `
  <rect x="10" y="14" width="40" height="44" rx="9" fill="${paper}" opacity="${backOpacity}"/>
  <rect x="14" y="8" width="40" height="44" rx="9" fill="${paper}"/>
  <path d="M27 40V20h9.5a6.5 6.5 0 0 1 0 13H27" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;

// Full icon: orange tile, white sheets, orange P. `scale` shrinks the mark inside the tile.
const fullIcon = (size, scale = 0.62, radius = 0) => {
  const s = (size * scale) / 64;
  const off = (size - 64 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="${ORANGE}"/>
    <g transform="translate(${off} ${off + s * 1}) scale(${s})">${mark('#FFFFFF', ORANGE, 0.5)}</g>
  </svg>`;
};

// Adaptive icon foreground: transparent, mark inside the 66% safe zone.
const foreground = (size) => {
  const s = (size * 0.56) / 64;
  const off = (size - 64 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <g transform="translate(${off} ${off + s})">${mark('#FFFFFF', ORANGE, 0.5)}</g>
  </svg>`;
};

const splash = (size, bg) => {
  const s = (size * 0.16) / 64;
  const off = (size - 64 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bg}"/>
    <g transform="translate(${off} ${off})">${mark(ORANGE, '#FFFFFF', 0.35)}</g>
  </svg>`;
};

const png = (svg, file) => sharp(Buffer.from(svg)).png().toFile(file);

await Promise.all([
  png(fullIcon(1024, 0.78), join(resources, 'icon-only.png')),
  png(foreground(1024), join(resources, 'icon-foreground.png')),
  png(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${ORANGE}"/></svg>`, join(resources, 'icon-background.png')),
  png(splash(2732, '#FFFFFF'), join(resources, 'splash.png')),
  png(splash(2732, '#111111'), join(resources, 'splash-dark.png')),
  png(fullIcon(192, 0.78, 0), join(pub, 'pwa-192.png')),
  png(fullIcon(512, 0.78, 0), join(pub, 'pwa-512.png')),
  png(fullIcon(180, 0.78, 0), join(pub, 'apple-touch-icon.png')),
]);

writeFileSync(join(pub, 'icon.svg'), fullIcon(64, 0.7, 14));

// Monochrome status-bar icon for notifications (white on transparent), as an Android vector drawable.
const drawable = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp" android:height="24dp" android:viewportWidth="64" android:viewportHeight="64">
  <path android:strokeColor="#FFFFFFFF" android:strokeWidth="4" android:fillColor="#00000000"
      android:pathData="M10,20 L10,49 A9,9 0,0 0,19 58 L44,58"/>
  <path android:strokeColor="#FFFFFFFF" android:strokeWidth="4.5" android:fillColor="#00000000"
      android:pathData="M23,8h22a9,9 0,0 1,9 9v26a9,9 0,0 1,-9 9h-22a9,9 0,0 1,-9 -9v-26a9,9 0,0 1,9 -9z"/>
  <path android:strokeColor="#FFFFFFFF" android:strokeWidth="5" android:strokeLineCap="round"
      android:strokeLineJoin="round" android:fillColor="#00000000"
      android:pathData="M27,40V20h9.5a6.5,6.5 0,0 1,0 13H27"/>
</vector>
`;
const drawableDir = join(here, '..', 'android', 'app', 'src', 'main', 'res', 'drawable');
try {
  mkdirSync(drawableDir, { recursive: true });
  writeFileSync(join(drawableDir, 'ic_stat_paperstack.xml'), drawable);
} catch {
  /* android/ not created yet */
}
console.log('Icons written to resources/ and public/');
