// One-off asset generator for launch readiness:
//   • PWA icons (192/512/maskable) + Apple touch icon — clean paw on Kittysort pink
//   • Compressed WebP splash background (2.3 MB PNG → ~150 KB)
//   • Open-Graph share image (1200×630) using the real wordmark
import sharp from 'sharp';

const PINK_TOP = '#ffd9e0';
const PINK_BOT = '#ff9eb3';

// Full-bleed paw glyph — paw spans ~57% of canvas → safe for maskable.
function pawSVG(size) {
  return Buffer.from(`<svg width="${size}" height="${size}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${PINK_TOP}"/><stop offset="1" stop-color="${PINK_BOT}"/>
    </linearGradient></defs>
    <rect width="512" height="512" fill="url(#bg)"/>
    <g fill="#fff" stroke="#e07a93" stroke-width="3" opacity="0.97">
      <ellipse cx="256" cy="326" rx="94" ry="80"/>
      <ellipse cx="146" cy="252" rx="40" ry="53"/>
      <ellipse cx="216" cy="194" rx="38" ry="55"/>
      <ellipse cx="296" cy="194" rx="38" ry="55"/>
      <ellipse cx="366" cy="252" rx="40" ry="53"/>
    </g>
  </svg>`);
}

async function icon(size, out) {
  await sharp(pawSVG(size)).resize(size, size).png().toFile(`img/${out}`);
  console.log('✓', out);
}

async function main() {
  await icon(192, 'icon-192.png');
  await icon(512, 'icon-512.png');
  await icon(512, 'icon-maskable-512.png');
  await icon(180, 'apple-touch-icon.png');

  // Compressed splash background
  const before = (await sharp('img/splash-bg.png').metadata());
  await sharp('img/splash-bg.png')
    .resize(820, 1230, { fit: 'cover' })
    .webp({ quality: 72 })
    .toFile('img/splash-bg.webp');
  console.log('✓ splash-bg.webp', before.width + 'x' + before.height, '→ 820x1230');

  // Open-Graph share image (1200×630) with the real wordmark composited on pink
  const ogBg = Buffer.from(`<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffe3ea"/><stop offset="1" stop-color="#ff9eb3"/>
    </linearGradient></defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <g fill="#fff" opacity="0.18">
      <ellipse cx="1050" cy="500" rx="70" ry="60"/>
      <ellipse cx="970" cy="445" rx="30" ry="40"/><ellipse cx="1020" cy="405" rx="29" ry="41"/>
      <ellipse cx="1085" cy="405" rx="29" ry="41"/><ellipse cx="1130" cy="445" rx="30" ry="40"/>
    </g>
  </svg>`);
  const mark = await sharp('img/logo-mark.png').resize({ width: 720 }).toBuffer();
  await sharp(ogBg)
    .composite([{ input: mark, gravity: 'centre' }])
    .jpeg({ quality: 84 })
    .toFile('img/og-image.jpg');
  console.log('✓ og-image.jpg');
}

main().catch((e) => { console.error(e); process.exit(1); });
