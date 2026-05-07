'use strict';

import { CW, CH } from '../constants.js';

// ══════════════════════════════════════════════════════════════════════════
//  KIRSCHBLÜTE — Japanese Spring (Cherry Blossom) seasonal scene
//
//  Layer order (back → front):
//    1.  Sky gradient
//    2.  Mountain silhouette         (NEW)
//    3.  Pagoda — 3 tiers + bezier roofs (UPGRADE from 2-tier trapezoid)
//    4.  Tree trunk + branches
//    5.  Blossom canopy clusters     (UPGRADE — 13 small clouds vs 5 large)
//    6.  Stone lantern (ishidōrō)    (NEW)
//    7.  Ground + grass strands
//    8.  Stone path                  (NEW)
//    9.  Fallen petals on ground     (NEW)
//    10. Sitting cat under tree      (NEW, animated tail)
//    11. Falling petals (drop-shape) (UPGRADE from 5-ellipse flower)
//    12. Vignette
// ══════════════════════════════════════════════════════════════════════════

const GOLDEN_ANGLE = 2.39996322972865;

// ── Geometry constants ────────────────────────────────────────────────────
const PAG_X    = CW * 0.78;          // pagoda center column
const PAG_BASE = CH * 0.62;          // base of bottom tier
const TRUNK_X  = CW * 0.15;
const TRUNK_TOP = CH * 0.55;
const LANTERN_X = CW * 0.62;
const LANTERN_BASE = CH * 0.80;
const CAT_X = TRUNK_X - 10;          // sitting under tree, slightly to its left
const CAT_Y = CH * 0.86;

// ── Pre-baked blossom-cluster positions (golden-angle distributed) ────────
const CANOPY = Array.from({ length: 13 }, (_, i) => {
  const a = i * GOLDEN_ANGLE;
  const radius = 30 + (i % 4) * 18;
  const cx = TRUNK_X + 20 + Math.cos(a) * (40 + (i % 3) * 22);
  const cy = CH * 0.46 + Math.sin(a) * 28 + (i % 5) * 4;
  return { cx, cy, r: radius + (i % 3) * 8 };
});

// ── Stone-path stepping stones (front-left → toward pagoda) ───────────────
const STEPSTONES = [
  { x: CW * 0.18, y: CH * 0.93, rx: 22, ry: 8 },
  { x: CW * 0.30, y: CH * 0.91, rx: 20, ry: 7.5 },
  { x: CW * 0.42, y: CH * 0.89, rx: 18, ry: 7 },
  { x: CW * 0.54, y: CH * 0.87, rx: 16, ry: 6.5 },
  { x: CW * 0.66, y: CH * 0.85, rx: 14, ry: 6 },
];

// ── Pre-baked fallen petals on ground ─────────────────────────────────────
const FALLEN_PETALS = Array.from({ length: 26 }, (_, i) => {
  const a = i * GOLDEN_ANGLE;
  return {
    x: ((a * 47.3) % 1) * CW,
    y: CH * 0.86 + ((a * 13.7) % 1) * CH * 0.13,
    r: 1.2 + (i % 4) * 0.5,
    alpha: 0.35 + (i % 5) * 0.10,
  };
});

// ── Falling petals (animated) — pre-baked seeds for stable look ───────────
const FALLING_PETALS = Array.from({ length: 18 }, (_, i) => ({
  seed: i * 137.5,
  driftSpeed: 0.5 + (i % 3) * 0.2,
  fallSpeed:  0.8 + (i % 5) * 0.1,
  size:       4 + (i % 3),
}));

// ══════════════════════════════════════════════════════════════════════════

export function draw(ctx, ts, theme) {
  drawSky(ctx);
  drawMountain(ctx);
  drawPagoda(ctx);
  drawTreeTrunk(ctx);
  drawCanopy(ctx);
  drawLantern(ctx);
  drawGround(ctx);
  drawStonePath(ctx);
  drawFallenPetals(ctx);
  drawSittingCat(ctx, ts);
  drawFallingPetals(ctx, ts);
  drawVignette(ctx);
}

// ── Layer 1: Sky ──────────────────────────────────────────────────────────
function drawSky(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, CH);
  sky.addColorStop(0,    '#FFD6E0');
  sky.addColorStop(0.50, '#FFE8D4');
  sky.addColorStop(1,    '#FFF0E8');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, CW, CH);
}

// ── Layer 2: Mountain ─────────────────────────────────────────────────────
function drawMountain(ctx) {
  // Two overlapping silhouettes for depth
  ctx.fillStyle = 'rgba(150,100,150,0.18)';
  ctx.beginPath();
  ctx.moveTo(0, CH * 0.55);
  ctx.quadraticCurveTo(CW * 0.25, CH * 0.36, CW * 0.55, CH * 0.46);
  ctx.quadraticCurveTo(CW * 0.80, CH * 0.55, CW, CH * 0.50);
  ctx.lineTo(CW, CH * 0.62);
  ctx.lineTo(0, CH * 0.62);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = 'rgba(140,90,140,0.30)';
  ctx.beginPath();
  ctx.moveTo(CW * 0.45, CH * 0.60);
  ctx.quadraticCurveTo(CW * 0.65, CH * 0.42, CW * 0.85, CH * 0.52);
  ctx.quadraticCurveTo(CW * 0.95, CH * 0.58, CW, CH * 0.56);
  ctx.lineTo(CW, CH * 0.65);
  ctx.lineTo(CW * 0.45, CH * 0.65);
  ctx.closePath();
  ctx.fill();
}

// ── Layer 3: Pagoda — 3 tiers with bezier-curved eaves ────────────────────
function drawPagoda(ctx) {
  ctx.fillStyle = 'rgba(110,70,90,0.65)';

  // Tier 1 (bottom) — body + roof
  drawPagodaTier(ctx, PAG_X, PAG_BASE, 30, 26, 18);
  // Tier 2 (middle)
  drawPagodaTier(ctx, PAG_X, PAG_BASE - 30, 24, 22, 15);
  // Tier 3 (top)
  drawPagodaTier(ctx, PAG_X, PAG_BASE - 56, 18, 16, 12);

  // Spire on top
  ctx.beginPath();
  ctx.moveTo(PAG_X, PAG_BASE - 56 - 18);
  ctx.lineTo(PAG_X - 1.5, PAG_BASE - 80);
  ctx.lineTo(PAG_X, PAG_BASE - 90);
  ctx.lineTo(PAG_X + 1.5, PAG_BASE - 80);
  ctx.closePath();
  ctx.fill();
}

// halfBodyW = half width of vertical wall under this tier's roof
// halfRoofW = half width of roof (must be > halfBodyW for swooping eaves)
// roofH     = how tall the roof is above the wall top
function drawPagodaTier(ctx, x, baseY, halfBodyW, halfRoofW, roofH) {
  // Wall body (small rectangle)
  const wallH = 14;
  ctx.fillRect(x - halfBodyW * 0.7, baseY - wallH, halfBodyW * 1.4, wallH);

  // Roof — bezier-curved eaves swooping up at the corners
  const wallTop = baseY - wallH;
  const ridgeY  = wallTop - roofH;
  ctx.beginPath();
  ctx.moveTo(x - halfRoofW, wallTop);                                  // left eave tip
  ctx.quadraticCurveTo(x - halfBodyW * 0.5, wallTop - 2,               // dip
                        x - halfBodyW * 0.6, ridgeY + 4);
  ctx.lineTo(x - 2, ridgeY);                                           // up to ridge
  ctx.lineTo(x + 2, ridgeY);
  ctx.lineTo(x + halfBodyW * 0.6, ridgeY + 4);
  ctx.quadraticCurveTo(x + halfBodyW * 0.5, wallTop - 2,
                        x + halfRoofW, wallTop);                       // right eave tip
  ctx.lineTo(x + halfRoofW - 3, wallTop + 1.5);                        // bottom edge of roof
  ctx.lineTo(x - halfRoofW + 3, wallTop + 1.5);
  ctx.closePath();
  ctx.fill();
}

// ── Layer 4: Tree trunk + branches ────────────────────────────────────────
function drawTreeTrunk(ctx) {
  ctx.fillStyle = '#5A3A30';
  ctx.fillRect(TRUNK_X, TRUNK_TOP, 14, CH * 0.35);

  ctx.strokeStyle = '#5A3A30';
  ctx.lineCap = 'round';

  // Right-side major branches
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(TRUNK_X + 7, TRUNK_TOP + CH * 0.03);
  ctx.quadraticCurveTo(TRUNK_X + 40, CH * 0.46, TRUNK_X + 80, CH * 0.49);
  ctx.stroke();

  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(TRUNK_X + 7, TRUNK_TOP + CH * 0.07);
  ctx.quadraticCurveTo(TRUNK_X + 30, CH * 0.42, TRUNK_X + 55, CH * 0.36);
  ctx.stroke();

  // Left-side branches
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(TRUNK_X + 7, TRUNK_TOP + CH * 0.05);
  ctx.quadraticCurveTo(TRUNK_X - 18, CH * 0.50, TRUNK_X - 38, CH * 0.48);
  ctx.stroke();

  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(TRUNK_X + 7, TRUNK_TOP + CH * 0.10);
  ctx.quadraticCurveTo(TRUNK_X - 10, CH * 0.55, TRUNK_X - 25, CH * 0.53);
  ctx.stroke();

  // Small twigs (random sticks)
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(TRUNK_X + 50, CH * 0.46);
  ctx.lineTo(TRUNK_X + 60, CH * 0.40);
  ctx.moveTo(TRUNK_X + 25, CH * 0.40);
  ctx.lineTo(TRUNK_X + 35, CH * 0.34);
  ctx.moveTo(TRUNK_X - 30, CH * 0.49);
  ctx.lineTo(TRUNK_X - 38, CH * 0.43);
  ctx.stroke();
}

// ── Layer 5: Blossom canopy — 13 small clusters ──────────────────────────
function drawCanopy(ctx) {
  for (const c of CANOPY) {
    const g = ctx.createRadialGradient(c.cx, c.cy, c.r * 0.1, c.cx, c.cy, c.r);
    g.addColorStop(0,   'rgba(255,255,255,0.95)');
    g.addColorStop(0.5, 'rgba(255,214,224,0.85)');
    g.addColorStop(1,   'rgba(255,183,197,0.0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(c.cx, c.cy, c.r, c.r * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Layer 6: Stone lantern (ishidōrō) — 4 stacked elements ────────────────
function drawLantern(ctx) {
  const x = LANTERN_X;
  const y = LANTERN_BASE;
  ctx.save();

  // Subtle shadow under base
  ctx.fillStyle = 'rgba(60,40,30,0.18)';
  ctx.beginPath();
  ctx.ellipse(x, y + 2, 12, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const stoneFill   = '#8a7a6a';
  const stoneShadow = '#6e5e4e';

  // Sockel — square base
  ctx.fillStyle = stoneShadow;
  ctx.fillRect(x - 8, y - 8, 16, 8);
  ctx.fillStyle = stoneFill;
  ctx.fillRect(x - 8, y - 8, 16, 4);

  // Kelch — narrowing trapezoid
  ctx.fillStyle = stoneFill;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 8);
  ctx.lineTo(x + 7, y - 8);
  ctx.lineTo(x + 5, y - 16);
  ctx.lineTo(x - 5, y - 16);
  ctx.closePath();
  ctx.fill();

  // Lichtkammer — light chamber with opening
  ctx.fillStyle = stoneShadow;
  ctx.fillRect(x - 7, y - 30, 14, 14);
  ctx.fillStyle = stoneFill;
  ctx.fillRect(x - 7, y - 30, 14, 3);
  // Opening (lit window)
  ctx.fillStyle = 'rgba(255,210,140,0.55)';
  ctx.fillRect(x - 4, y - 26, 8, 8);
  // Tiny glow dot
  ctx.fillStyle = 'rgba(255,235,180,0.85)';
  ctx.beginPath();
  ctx.arc(x, y - 22, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Dach — pyramidal with spike
  ctx.fillStyle = stoneShadow;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 30);
  ctx.lineTo(x + 9, y - 30);
  ctx.lineTo(x + 5, y - 38);
  ctx.lineTo(x - 5, y - 38);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = stoneFill;
  ctx.beginPath();
  ctx.moveTo(x - 0.8, y - 38);
  ctx.lineTo(x + 0.8, y - 38);
  ctx.lineTo(x, y - 42);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ── Layer 7: Ground + grass ───────────────────────────────────────────────
function drawGround(ctx) {
  const grad = ctx.createLinearGradient(0, CH * 0.86, 0, CH);
  grad.addColorStop(0, 'rgba(140,140,90,0.10)');
  grad.addColorStop(1, 'rgba(110,120,70,0.45)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, CH * 0.86, CW, CH * 0.14);

  // Subtle grass strands — pre-baked, scattered
  ctx.strokeStyle = 'rgba(100,130,70,0.45)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 36; i++) {
    const a = i * GOLDEN_ANGLE;
    const gx = ((a * 31.7) % 1) * CW;
    const gy = CH * 0.87 + ((a * 11.3) % 1) * CH * 0.12;
    const len = 2 + (i % 3) * 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + (i % 2 === 0 ? -1 : 1), gy - len);
    ctx.stroke();
  }
}

// ── Layer 8: Stone path ───────────────────────────────────────────────────
function drawStonePath(ctx) {
  for (const s of STEPSTONES) {
    // Soft shadow
    ctx.fillStyle = 'rgba(50,40,30,0.20)';
    ctx.beginPath();
    ctx.ellipse(s.x + 1, s.y + 2, s.rx * 1.05, s.ry * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stone with subtle gradient
    const g = ctx.createRadialGradient(s.x - s.rx * 0.3, s.y - s.ry * 0.4, 0, s.x, s.y, s.rx);
    g.addColorStop(0, '#c2b8a8');
    g.addColorStop(1, '#8a7e6e');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Layer 9: Fallen petals on ground ──────────────────────────────────────
function drawFallenPetals(ctx) {
  for (const p of FALLEN_PETALS) {
    ctx.fillStyle = `rgba(255,183,197,${p.alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Layer 10: Sitting cat — animated tail ─────────────────────────────────
function drawSittingCat(ctx, ts) {
  const x = CAT_X;
  const y = CAT_Y;
  const tailWag = Math.sin(ts * 0.0035) * 5;

  ctx.save();

  // Shadow
  ctx.fillStyle = 'rgba(50,30,20,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y + 12, 14, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  const furBase = '#f3e6c8';
  const furShade = '#d8c098';

  // Tail — curved, with wag
  ctx.strokeStyle = furBase;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x + 10, y + 8);
  ctx.quadraticCurveTo(x + 22 + tailWag, y - 2, x + 26 + tailWag, y - 14);
  ctx.stroke();
  ctx.strokeStyle = furShade;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Body — pear shape (haunches)
  const bodyGrad = ctx.createLinearGradient(x - 12, y - 10, x + 12, y + 12);
  bodyGrad.addColorStop(0, furBase);
  bodyGrad.addColorStop(1, furShade);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = furBase;
  ctx.beginPath();
  ctx.arc(x - 2, y - 18, 9, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = furShade;
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 24);
  ctx.lineTo(x - 6, y - 30);
  ctx.lineTo(x - 3, y - 24);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 24);
  ctx.lineTo(x + 2, y - 30);
  ctx.lineTo(x + 5, y - 24);
  ctx.closePath();
  ctx.fill();

  // Inner-ear blush
  ctx.fillStyle = 'rgba(220,150,150,0.55)';
  ctx.beginPath();
  ctx.moveTo(x - 8, y - 25);
  ctx.lineTo(x - 6, y - 28);
  ctx.lineTo(x - 4, y - 25);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 0, y - 25);
  ctx.lineTo(x + 2, y - 28);
  ctx.lineTo(x + 4, y - 25);
  ctx.closePath();
  ctx.fill();

  // Eyes — closed (content) — short curved lines
  ctx.strokeStyle = '#3a2820';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(x - 5, y - 18, 1.5, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 1, y - 18, 1.5, Math.PI * 0.1, Math.PI * 0.9);
  ctx.stroke();

  // Nose
  ctx.fillStyle = '#c97a8a';
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 14);
  ctx.lineTo(x - 4, y - 16);
  ctx.lineTo(x, y - 16);
  ctx.closePath();
  ctx.fill();

  // Front paws
  ctx.fillStyle = furBase;
  ctx.beginPath();
  ctx.ellipse(x - 6, y + 12, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 12, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Layer 11: Falling petals (drop-shape, animated) ───────────────────────
function drawFallingPetals(ctx, ts) {
  for (const fp of FALLING_PETALS) {
    const x = ((fp.seed + ts * 0.02 * fp.driftSpeed) % (CW + 40)) - 20;
    const y = ((fp.seed * 0.7 + ts * 0.04 * fp.fallSpeed) % (CH + 40)) - 20;
    const rot = (ts * 0.002 + fp.seed) % (Math.PI * 2);
    drawSakuraPetal(ctx, x, y, fp.size, rot);
  }
}

function drawSakuraPetal(ctx, x, y, size, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(255,183,197,0.85)';
  ctx.beginPath();
  // Tropfen with notched top — single petal silhouette
  ctx.moveTo(0, size);                                                        // bottom point
  ctx.quadraticCurveTo(size * 0.55, size * 0.30, size * 0.40, -size * 0.40);  // right side up
  ctx.quadraticCurveTo(size * 0.32, -size * 0.85, 0, -size * 0.72);           // top-right curve into notch
  ctx.quadraticCurveTo(-size * 0.32, -size * 0.85, -size * 0.40, -size * 0.40); // notch into top-left curve
  ctx.quadraticCurveTo(-size * 0.55, size * 0.30, 0, size);                   // left side back to bottom
  ctx.closePath();
  ctx.fill();
  // Subtle vein down the middle
  ctx.strokeStyle = 'rgba(220,140,160,0.40)';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.85);
  ctx.lineTo(0, -size * 0.50);
  ctx.stroke();
  ctx.restore();
}

// ── Layer 12: Vignette ────────────────────────────────────────────────────
function drawVignette(ctx) {
  const v = ctx.createRadialGradient(CW / 2, CH / 2, CW * 0.3, CW / 2, CH / 2, CW * 0.75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(60,30,50,0.20)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, CW, CH);
}
