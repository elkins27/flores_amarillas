/* =========================
   PALETAS — mayoría amarillas, un par naranjas
========================= */
const PALETTES = {
  yellow: { light: "#fff3bf", main: "#ffd43b", dark: "#f59f00", centerLight: "#7a4b00", centerDark: "#3b2400" },
  orange: { light: "#ffe1b8", main: "#ffa94d", dark: "#e8590c", centerLight: "#6b2f00", centerDark: "#3b1500" }
};

const STEM_COLOR = "#3f7d20";
const LEAF_COLOR = "#74b816";

/* Ramo compacto por niveles, ordenado de abajo hacia arriba:
   el índice del arreglo ES el orden en que florecen (el último es el
   girasol grande de arriba, como gran final). */
const FLOWER_DEFS = [
  // nivel 1 — base del ramo
  { dx: -0.30, dy: -0.24, size: 0.085, palette: "yellow" },
  { dx: -0.10, dy: -0.26, size: 0.09, palette: "orange" },
  { dx: 0.10, dy: -0.26, size: 0.09, palette: "yellow" },
  { dx: 0.30, dy: -0.24, size: 0.085, palette: "yellow" },
  // nivel 2
  { dx: -0.36, dy: -0.42, size: 0.10, palette: "yellow" },
  { dx: -0.14, dy: -0.44, size: 0.105, palette: "yellow" },
  { dx: 0.14, dy: -0.44, size: 0.105, palette: "orange" },
  { dx: 0.36, dy: -0.42, size: 0.10, palette: "yellow" },
  // nivel 3
  { dx: -0.24, dy: -0.56, size: 0.12, palette: "yellow" },
  { dx: 0, dy: -0.60, size: 0.125, palette: "yellow" },
  { dx: 0.24, dy: -0.56, size: 0.12, palette: "orange" },
  // nivel 4
  { dx: -0.14, dy: -0.68, size: 0.13, palette: "yellow" },
  { dx: 0.14, dy: -0.68, size: 0.13, palette: "yellow" },
  // nivel 5 — gran final, arriba al centro
  { dx: 0, dy: -0.78, size: 0.15, palette: "yellow" }
];

const LEAF_DEFS = [
  { dx: -0.40, dy: -0.34, dir: -1, scale: 1.45 },
  { dx: 0.40, dy: -0.34, dir: 1, scale: 1.45 },
  { dx: -0.36, dy: -0.15, dir: -1, scale: 1.25 },
  { dx: 0.36, dy: -0.15, dir: 1, scale: 1.25 }
];

const SPRIG_DEFS = [
  { dx: -0.38, dy: -0.36, dir: -1, length: 0.4 },
  { dx: 0.4, dy: -0.38, dir: 1, length: 0.42 }
];

const SPARKLES = Array.from({ length: 14 }, () => ({
  ox: Math.random() * 2 - 1,
  oy: (Math.random() * 2 - 1) * 0.6 - 0.2,
  phase: Math.random() * Math.PI * 2,
  speed: 0.5 + Math.random() * 0.7,
  size: 2.5 + Math.random() * 3.5,
  isHeart: Math.random() < 0.45
}));

/* Duraciones de la animación de floración — larga y notoria */
const STEM_DURATION = 550;
const FLOWER_DELAY = 300;
const FLOWER_DURATION = 700;
const STAGGER = 170;

export const BLOOM_DURATION_MS = (FLOWER_DEFS.length - 1) * STAGGER + FLOWER_DELAY + FLOWER_DURATION + 150;

function clampProgress(x) {
  return Math.max(0, Math.min(1, x));
}
function easeOutCubic(x) {
  return 1 - Math.pow(1 - x, 3);
}
function easeOutBack(x) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

let bouquetRAF = null;

export function startBouquet(canvas) {
  const ctx = canvas.getContext("2d");
  const w = Math.min(window.innerWidth * 0.82, 360);
  const h = w * 1.32;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (bouquetRAF) cancelAnimationFrame(bouquetRAF);

  const t0 = performance.now();
  function frame(t) {
    const elapsed = t - t0;
    const globalSway = Math.sin((elapsed / 1000) * 0.9) * 0.02;
    drawScene(ctx, w, h, elapsed, globalSway);
    bouquetRAF = requestAnimationFrame(frame);
  }
  bouquetRAF = requestAnimationFrame(frame);
}

function drawScene(ctx, w, h, elapsed, globalSway) {
  ctx.clearRect(0, 0, w, h);
  const tieY = h * 0.87;
  const cx = w / 2;

  const progresses = FLOWER_DEFS.map((f, i) => ({
    stemP: clampProgress((elapsed - i * STAGGER) / STEM_DURATION),
    flowerP: clampProgress((elapsed - i * STAGGER - FLOWER_DELAY) / FLOWER_DURATION)
  }));
  const lastFlowerP = progresses[progresses.length - 1].flowerP;

  drawGroundShadow(ctx, w, h, tieY, lastFlowerP);
  drawLightRays(ctx, cx, tieY - h * 0.42, w * 0.95, elapsed, lastFlowerP);
  drawGlow(ctx, cx, tieY - h * 0.42, w * 0.58, elapsed, lastFlowerP);

  SPRIG_DEFS.forEach(s =>
    drawSprig(ctx, cx + s.dx * w * 0.2, tieY, s.dir, h * s.length, lastFlowerP)
  );

  FLOWER_DEFS.forEach((f, i) => {
    const tieX = cx + f.dx * w * 0.15;
    const topX = cx + f.dx * w;
    const topY = tieY + f.dy * h;
    const growth = easeOutCubic(progresses[i].stemP);
    const sway = globalSway * (0.6 + 0.4 * Math.sin(i * 1.7)) * progresses[i].flowerP;
    drawStem(ctx, tieX, tieY, topX, topY, 2.5 + f.size * 14, growth, sway);
  });

  LEAF_DEFS.forEach(l =>
    drawLeaf(ctx, cx + l.dx * w, tieY + l.dy * h, l.dir, l.scale, lastFlowerP)
  );

  FLOWER_DEFS.forEach((f, i) => {
    const tieX = cx + f.dx * w * 0.15;
    const topX = cx + f.dx * w;
    const topY = tieY + f.dy * h;
    const growth = easeOutCubic(progresses[i].stemP);
    const curX = tieX + (topX - tieX) * growth;
    const curY = tieY + (topY - tieY) * growth;
    const flowerP = progresses[i].flowerP;
    if (flowerP <= 0) return;
    const scale = easeOutBack(flowerP);
    const sway = globalSway * (0.6 + 0.4 * Math.sin(i * 1.7 + 1)) * flowerP;
    drawSunflower(ctx, curX + sway * 20, curY, f.size * w, scale, sway, PALETTES[f.palette]);
  });

  drawRibbon(ctx, cx, tieY, w, lastFlowerP);
  drawSparkles(ctx, cx, tieY - h * 0.5, w * 0.48, elapsed, lastFlowerP);
}

/* =========================
   FONDO / AMBIENTE
========================= */
function drawGroundShadow(ctx, w, h, tieY, factor) {
  if (factor <= 0) return;
  const grad = ctx.createRadialGradient(w / 2, tieY, 4, w / 2, tieY, w * 0.35);
  grad.addColorStop(0, `rgba(90,60,10,${0.2 * factor})`);
  grad.addColorStop(1, "rgba(90,60,10,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(w / 2, tieY, w * 0.32, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawLightRays(ctx, cx, cy, length, elapsed, factor) {
  if (factor <= 0) return;
  const rayCount = 10;
  const rotation = (elapsed / 1000) * 0.05;
  ctx.save();
  ctx.globalAlpha = 0.16 * factor;
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  for (let i = 0; i < rayCount; i++) {
    ctx.save();
    ctx.rotate(((Math.PI * 2) / rayCount) * i);
    const grad = ctx.createLinearGradient(0, 0, 0, -length);
    grad.addColorStop(0, "rgba(255,214,110,0.5)");
    grad.addColorStop(1, "rgba(255,214,110,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(-length * 0.05, 0);
    ctx.lineTo(length * 0.05, 0);
    ctx.lineTo(0, -length);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawGlow(ctx, cx, cy, radius, elapsed, factor) {  if (factor <= 0) return;
  const pulse = 1 + 0.06 * Math.sin((elapsed / 1000) * 0.6);
  const r = radius * pulse;
  const grad = ctx.createRadialGradient(cx, cy, 4, cx, cy, r);
  grad.addColorStop(0, `rgba(255,196,60,${0.3 * factor})`);
  grad.addColorStop(1, "rgba(255,196,60,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawMiniHeart(ctx, x, y, r) {
  ctx.beginPath();
  ctx.moveTo(x, y + r * 0.35);
  ctx.bezierCurveTo(x - r, y - r * 0.6, x - r * 1.6, y + r * 0.5, x, y + r * 1.4);
  ctx.bezierCurveTo(x + r * 1.6, y + r * 0.5, x + r, y - r * 0.6, x, y + r * 0.35);
  ctx.fill();
}

function drawSparkles(ctx, cx, cy, spread, elapsed, factor) {
  const fade = Math.max(0, Math.min(1, (factor - 0.5) / 0.5));
  if (fade <= 0) return;
  SPARKLES.forEach(s => {
    const tw = (Math.sin((elapsed / 1000) * s.speed + s.phase) + 1) / 2;
    const alpha = fade * tw * 0.85;
    if (alpha <= 0.02) return;
    const x = cx + s.ox * spread;
    const y = cy + s.oy * spread;
    ctx.save();
    ctx.globalAlpha = alpha;
    if (s.isHeart) {
      ctx.fillStyle = "#ff8fa3";
      drawMiniHeart(ctx, x, y, s.size * 0.85);
    } else {
      ctx.fillStyle = "#fff9db";
      ctx.strokeStyle = "#fff9db";
      ctx.lineWidth = s.size * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, s.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - s.size, y);
      ctx.lineTo(x + s.size, y);
      ctx.moveTo(x, y - s.size);
      ctx.lineTo(x, y + s.size);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/* =========================
   TALLOS / HOJAS / RAMITAS
========================= */
function drawStem(ctx, tieX, tieY, topX, topY, width, growth, sway) {
  if (growth <= 0) return;
  const curX = tieX + (topX - tieX) * growth;
  const curY = tieY + (topY - tieY) * growth;
  const ctrlX = (tieX + curX) / 2 + sway * 40;
  const ctrlY = (tieY + curY) / 2;
  ctx.beginPath();
  ctx.moveTo(tieX, tieY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, curX + sway * 20, curY);
  ctx.strokeStyle = STEM_COLOR;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.stroke();
}

function drawLeaf(ctx, x, y, dir, scale, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.translate(x, y);
  ctx.rotate(dir * -0.4);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(dir * 18, -9, dir * 32, 0);
  ctx.quadraticCurveTo(dir * 18, 9, 0, 0);
  ctx.fillStyle = LEAF_COLOR;
  ctx.fill();
  ctx.restore();
}

function drawSprig(ctx, x, y, dir, length, opacity) {
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity * 0.9;
  ctx.strokeStyle = LEAF_COLOR;
  ctx.lineWidth = 1.5;
  const endX = x + dir * length * 0.55;
  const endY = y - length;
  const ctrlX = x + dir * length * 0.2;
  const ctrlY = y - length * 0.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    const mt = 1 - t;
    const px = mt * mt * x + 2 * mt * t * ctrlX + t * t * endX;
    const py = mt * mt * y + 2 * mt * t * ctrlY + t * t * endY;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(dir * -0.6);
    ctx.beginPath();
    ctx.ellipse(0, 0, 3.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fillStyle = LEAF_COLOR;
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

/* =========================
   GIRASOL — pétalos puntiagudos + centro con textura
========================= */
function drawSunflower(ctx, x, y, size, scale, sway, palette) {
  if (scale <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, scale);
  ctx.translate(x, y);
  ctx.rotate(sway * 0.6);
  ctx.scale(scale, scale);

  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = ((Math.PI * 2) / count) * i;
    ctx.save();
    ctx.rotate(angle);
    const grad = ctx.createLinearGradient(0, 0, 0, size);
    grad.addColorStop(0, palette.light);
    grad.addColorStop(1, i % 2 === 0 ? palette.main : palette.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(size * 0.22, size * 0.55, 0, size);
    ctx.quadraticCurveTo(-size * 0.22, size * 0.55, 0, 0);
    ctx.fill();
    ctx.restore();
  }

  const centerGrad = ctx.createRadialGradient(0, 0, 1, 0, 0, size * 0.28);
  centerGrad.addColorStop(0, palette.centerLight);
  centerGrad.addColorStop(1, palette.centerDark);
  ctx.fillStyle = centerGrad;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.28, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "rgba(0,0,0,0.18)";
  for (let j = 0; j < 12; j++) {
    const a = ((Math.PI * 2) / 12) * j;
    const r = size * (0.1 + (j % 3) * 0.06);
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, size * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.arc(-size * 0.08, -size * 0.08, size * 0.1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================
   LAZO / CINTA DE AMARRE
========================= */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawRibbon(ctx, cx, tieY, w, factor) {
  if (factor <= 0) return;

  const bandW = w * 0.2;
  const bandH = 10;

  ctx.save();
  ctx.globalAlpha = factor;
  ctx.fillStyle = "#fffdf6";
  roundRect(ctx, cx - bandW / 2, tieY - bandH / 2, bandW, bandH, 5);
  ctx.fill();
  ctx.strokeStyle = "rgba(120,72,0,0.25)";
  ctx.lineWidth = 1;
  roundRect(ctx, cx - bandW / 2, tieY - bandH / 2, bandW, bandH, 5);
  ctx.stroke();

  ctx.strokeStyle = "#e8590c";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 4, tieY + bandH / 2);
  ctx.quadraticCurveTo(cx - 10, tieY + 26, cx - 14, tieY + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 4, tieY + bandH / 2);
  ctx.quadraticCurveTo(cx + 10, tieY + 26, cx + 14, tieY + 40);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = factor;
  ctx.translate(cx, tieY);
  ctx.scale(0.5, 0.5);
  ctx.fillStyle = "#f59f00";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-32, -20, -32, 20, 0, 4);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(32, -20, 32, 20, 0, 4);
  ctx.fill();
  ctx.fillStyle = "#ffd43b";
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
