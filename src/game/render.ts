/* ------------------------------------------------------------------ */
/*  Renderer — cinematic top-down pseudo-3D billiards rendering        */
/* ------------------------------------------------------------------ */

import { Ball, GameMode, Pocket, TABLE } from "./types";
import { AimPreview } from "./physics";

export interface RenderState {
  balls: Ball[];
  mode: GameMode;
  pockets: Pocket[];
  aimAngle: number;
  power: number;
  showAim: boolean;
  rolling: boolean;
  aimPreview: AimPreview | null;
}

/* ---------------------------- color utils ------------------------ */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function shade(hex: string, amt: number): string {
  const [r, g, b] = hexToRgb(hex);
  const f = (c: number) =>
    Math.max(0, Math.min(255, Math.round(amt > 0 ? c + (255 - c) * amt : c * (1 + amt))));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

/* ------------------------- table background ---------------------- */

let tableCache: { key: string; canvas: HTMLCanvasElement } | null = null;

function buildTable(
  w: number,
  h: number,
  scale: number,
  offX: number,
  offY: number,
  mode: GameMode,
  pockets: Pocket[],
): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  const ctx = c.getContext("2d")!;
  const f = TABLE.frame;
  const { W, H } = TABLE;

  const sx = (x: number) => offX + x * scale;
  const sy = (y: number) => offY + y * scale;

  // ---- soft floor shadow under the whole table
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.65)";
  ctx.shadowBlur = 60 * scale;
  ctx.shadowOffsetY = 22 * scale;
  ctx.fillStyle = "#05070d";
  roundRect(ctx, sx(-f), sy(-f), (W + 2 * f) * scale, (H + 2 * f) * scale, 14 * scale);
  ctx.fill();
  ctx.restore();

  // ---- wooden frame
  const wood = ctx.createLinearGradient(
    sx(-f),
    sy(-f),
    sx(W + f),
    sy(H + f),
  );
  wood.addColorStop(0, "#7a4a26");
  wood.addColorStop(0.25, "#9c6636");
  wood.addColorStop(0.5, "#6b3f1f");
  wood.addColorStop(0.75, "#8a5628");
  wood.addColorStop(1, "#5c3517");
  ctx.fillStyle = wood;
  roundRect(ctx, sx(-f), sy(-f), (W + 2 * f) * scale, (H + 2 * f) * scale, 12 * scale);
  ctx.fill();

  // wood sheen
  const sheen = ctx.createLinearGradient(sx(-f), sy(-f), sx(-f), sy(H + f));
  sheen.addColorStop(0, "rgba(255,225,170,0.22)");
  sheen.addColorStop(0.5, "rgba(255,255,255,0.02)");
  sheen.addColorStop(1, "rgba(0,0,0,0.34)");
  ctx.fillStyle = sheen;
  roundRect(ctx, sx(-f), sy(-f), (W + 2 * f) * scale, (H + 2 * f) * scale, 12 * scale);
  ctx.fill();

  // frame inner edge
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 2.2 * scale;
  roundRect(ctx, sx(-f + 1), sy(-f + 1), (W + 2 * f - 2) * scale, (H + 2 * f - 2) * scale, 11 * scale);
  ctx.stroke();

  // ---- cushion rails (cloth covered)
  const railW = 4.2;
  const railDark = mode === "snooker" ? "#0d5a38" : "#0f6a42";
  const railLight = mode === "snooker" ? "#177547" : "#1b8a56";
  const railGrad = ctx.createLinearGradient(sx(-railW), sy(-railW), sx(W + railW), sy(H + railW));
  railGrad.addColorStop(0, railLight);
  railGrad.addColorStop(0.5, railDark);
  railGrad.addColorStop(1, railLight);
  ctx.fillStyle = railGrad;
  roundRect(ctx, sx(-railW), sy(-railW), (W + 2 * railW) * scale, (H + 2 * railW) * scale, 6 * scale);
  ctx.fill();

  // ---- felt with overhead lighting
  const feltBase = mode === "snooker" ? "#1c7a4c" : "#1e8a5a";
  const felt = ctx.createRadialGradient(
    sx(W / 2),
    sy(H / 2 - 8),
    6 * scale,
    sx(W / 2),
    sy(H / 2),
    W * 0.62 * scale,
  );
  felt.addColorStop(0, shade(feltBase, 0.32));
  felt.addColorStop(0.45, feltBase);
  felt.addColorStop(1, shade(feltBase, -0.45));
  ctx.fillStyle = felt;
  ctx.fillRect(sx(0), sy(0), W * scale, H * scale);

  // felt nap noise
  ctx.save();
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 900; i++) {
    const rx = Math.random() * W * scale + sx(0);
    const ry = Math.random() * H * scale + sy(0);
    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(rx, ry, scale * 0.9, scale * 0.9);
  }
  ctx.restore();

  // cushion inner shadow (top edge darker)
  const innerShadow = ctx.createLinearGradient(sx(0), sy(0), sx(0), sy(14));
  innerShadow.addColorStop(0, "rgba(0,0,0,0.38)");
  innerShadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerShadow;
  ctx.fillRect(sx(0), sy(0), W * scale, 14 * scale);

  // cushion highlight line where cloth meets felt
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1.2 * scale;
  ctx.strokeRect(sx(0.4), sy(0.4), (W - 0.8) * scale, (H - 0.8) * scale);

  // ---- markings
  ctx.strokeStyle = "rgba(255,255,255,0.16)";
  ctx.lineWidth = 0.7 * scale;
  if (mode === "snooker") {
    // baulk line + D
    const bx = W * 0.2;
    ctx.beginPath();
    ctx.moveTo(sx(bx), sy(0));
    ctx.lineTo(sx(bx), sy(H));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(bx), sy(H / 2), H * 0.15 * scale, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
  } else {
    // head string + foot spot
    const hx = W * 0.25;
    ctx.beginPath();
    ctx.moveTo(sx(hx), sy(0));
    ctx.lineTo(sx(hx), sy(H));
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(sx(W * 0.75), sy(H / 2), 0.9 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- pockets
  for (const p of pockets) {
    const px = sx(p.x);
    const py = sy(p.y);
    const pr = p.r * scale;
    // leather rim
    ctx.beginPath();
    ctx.arc(px, py, pr + 1.6 * scale, 0, Math.PI * 2);
    const rim = ctx.createRadialGradient(px, py, pr * 0.6, px, py, pr + 1.6 * scale);
    rim.addColorStop(0, "#0c0d12");
    rim.addColorStop(0.75, "#16141c");
    rim.addColorStop(1, "#2b2118");
    ctx.fillStyle = rim;
    ctx.fill();
    // hole
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    const hole = ctx.createRadialGradient(
      px - pr * 0.2,
      py - pr * 0.2,
      pr * 0.1,
      px,
      py,
      pr,
    );
    hole.addColorStop(0, "#020204");
    hole.addColorStop(0.8, "#08080c");
    hole.addColorStop(1, "#101018");
    ctx.fillStyle = hole;
    ctx.fill();
    // inner highlight
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.92, Math.PI * 0.15, Math.PI * 0.85);
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1.1 * scale;
    ctx.stroke();
  }

  // ---- diamond sights on the frame
  ctx.fillStyle = "rgba(245,222,160,0.85)";
  const diamond = (x: number, y: number) => {
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), 0.85 * scale, 0, Math.PI * 2);
    ctx.fill();
  };
  const dm = f * 0.52;
  for (const frac of [1 / 8, 2 / 8, 3 / 8, 5 / 8, 6 / 8, 7 / 8]) {
    diamond(W * frac, -dm);
    diamond(W * frac, H + dm);
  }
  for (const frac of [1 / 4, 2 / 4, 3 / 4]) {
    diamond(-dm, H * frac);
    diamond(W + dm, H * frac);
  }

  return c;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* ------------------------------ balls ---------------------------- */

function drawBall(
  ctx: CanvasRenderingContext2D,
  b: Ball,
  sx: (x: number) => number,
  sy: (y: number) => number,
  scale: number,
) {
  let x = b.x;
  let y = b.y;
  let r = b.r;
  let alpha = 1;
  if (b.sink) {
    const t = Math.min(1, b.sink.t);
    x = b.x + (b.sink.x - b.x) * t;
    y = b.y + (b.sink.y - b.y) * t;
    r = b.r * (1 - t * 0.9);
    alpha = 1 - t * 0.8;
  }
  if (r <= 0.05) return;

  const px = sx(x);
  const py = sy(y);
  const pr = r * scale;

  ctx.save();
  ctx.globalAlpha = alpha;

  // shadow
  const shX = px + pr * 0.5;
  const shY = py + pr * 0.75;
  const shR = pr * 1.18;
  const sh = ctx.createRadialGradient(shX, shY, pr * 0.2, shX, shY, shR);
  sh.addColorStop(0, `rgba(0,0,0,${0.4 * alpha})`);
  sh.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.ellipse(shX, shY, shR, shR * 0.92, 0, 0, Math.PI * 2);
  ctx.fill();

  // sphere body
  const grad = ctx.createRadialGradient(
    px - pr * 0.38,
    py - pr * 0.42,
    pr * 0.12,
    px - pr * 0.15,
    py - pr * 0.15,
    pr * 1.45,
  );
  const base = b.kind === "stripe" ? "#f4f2ea" : b.color;
  grad.addColorStop(0, shade(base, 0.75));
  grad.addColorStop(0.32, shade(base, 0.18));
  grad.addColorStop(0.7, shade(base, -0.18));
  grad.addColorStop(1, shade(base, -0.62));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();

  // stripe band
  if (b.kind === "stripe") {
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.clip();
    const ang = 0.5 + (b.id % 5) * 0.22;
    ctx.translate(px, py);
    ctx.rotate(ang);
    const band = ctx.createLinearGradient(0, -pr * 0.55, 0, pr * 0.55);
    band.addColorStop(0, shade(b.color, 0.25));
    band.addColorStop(0.5, b.color);
    band.addColorStop(1, shade(b.color, -0.3));
    ctx.fillStyle = band;
    ctx.fillRect(-pr * 1.1, -pr * 0.55, pr * 2.2, pr * 1.1);
    ctx.restore();
  }

  // number badge (pool balls)
  if (
    (b.kind === "solid" || b.kind === "stripe" || b.kind === "eight" || b.kind === "nine") &&
    b.number > 0 &&
    pr > 3
  ) {
    ctx.beginPath();
    ctx.arc(px, py, pr * 0.44, 0, Math.PI * 2);
    const badge = ctx.createRadialGradient(
      px - pr * 0.15,
      py - pr * 0.15,
      pr * 0.05,
      px,
      py,
      pr * 0.44,
    );
    badge.addColorStop(0, "#ffffff");
    badge.addColorStop(1, "#d8d5c8");
    ctx.fillStyle = badge;
    ctx.fill();
    ctx.fillStyle = "#20242e";
    ctx.font = `700 ${pr * 0.52}px "Chakra Petch", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(b.number), px, py + pr * 0.02);
  }

  // specular highlight
  const spec = ctx.createRadialGradient(
    px - pr * 0.42,
    py - pr * 0.46,
    0,
    px - pr * 0.42,
    py - pr * 0.46,
    pr * 0.55,
  );
  spec.addColorStop(0, `rgba(255,255,255,${0.9 * alpha})`);
  spec.addColorStop(0.4, `rgba(255,255,255,${0.28 * alpha})`);
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(px - pr * 0.42, py - pr * 0.46, pr * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // bottom bounce light
  const bounce = ctx.createRadialGradient(
    px + pr * 0.3,
    py + pr * 0.5,
    0,
    px + pr * 0.3,
    py + pr * 0.5,
    pr * 0.5,
  );
  bounce.addColorStop(0, `rgba(255,255,255,${0.14 * alpha})`);
  bounce.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bounce;
  ctx.beginPath();
  ctx.arc(px + pr * 0.3, py + pr * 0.5, pr * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* --------------------------- main draw --------------------------- */

/** shared world→screen layout (used by renderer + input handling) */
export function computeLayout(cssW: number, cssH: number) {
  const f = TABLE.frame;
  const totalW = TABLE.W + f * 2.2;
  const totalH = TABLE.H + f * 2.2;
  const scale = Math.min(cssW / totalW, cssH / totalH);
  const offX = (cssW - TABLE.W * scale) / 2;
  const offY = (cssH - TABLE.H * scale) / 2;
  return { scale, offX, offY };
}

export function drawGame(
  ctx: CanvasRenderingContext2D,
  cssW: number,
  cssH: number,
  st: RenderState,
): void {
  const f = TABLE.frame;
  const totalW = TABLE.W + f * 2.2;
  const totalH = TABLE.H + f * 2.2;
  const scale = Math.min(cssW / totalW, cssH / totalH);
  const offX = (cssW - TABLE.W * scale) / 2;
  const offY = (cssH - TABLE.H * scale) / 2;
  const sx = (x: number) => offX + x * scale;
  const sy = (y: number) => offY + y * scale;

  ctx.clearRect(0, 0, cssW, cssH);

  // background
  const bg = ctx.createRadialGradient(
    cssW / 2,
    cssH * 0.36,
    10,
    cssW / 2,
    cssH / 2,
    Math.max(cssW, cssH) * 0.75,
  );
  bg.addColorStop(0, "#101528");
  bg.addColorStop(1, "#05070d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, cssW, cssH);

  // table (cached)
  const key = `${st.mode}:${Math.round(cssW)}x${Math.round(cssH)}`;
  if (!tableCache || tableCache.key !== key) {
    tableCache = {
      key,
      canvas: buildTable(cssW, cssH, scale, offX, offY, st.mode, st.pockets),
    };
  }
  ctx.drawImage(tableCache.canvas, 0, 0);

  const cue = st.balls.find((b) => b.id === 0);

  // trails
  for (const b of st.balls) {
    if (b.trail.length < 2 || !b.active) continue;
    for (let i = 0; i < b.trail.length; i++) {
      const t = b.trail[i];
      const a = ((i + 1) / b.trail.length) * 0.16;
      ctx.fillStyle = b.color;
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(sx(t.x), sy(t.y), b.r * scale * (0.35 + 0.6 * (i / b.trail.length)), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // aim guide (under balls)
  if (st.showAim && cue && cue.active && st.aimPreview) {
    drawAimGuide(ctx, cue, st.aimPreview, sx, sy, scale);
  }

  // balls (shadowed spheres)
  for (const b of st.balls) {
    if (!b.active && !b.sink) continue;
    drawBall(ctx, b, sx, sy, scale);
  }

  // cue stick
  if (st.showAim && cue && cue.active && !st.rolling) {
    drawCueStick(ctx, cue, st.aimAngle, st.power, sx, sy, scale);
  }

  // vignette
  const vig = ctx.createRadialGradient(
    cssW / 2,
    cssH / 2,
    Math.min(cssW, cssH) * 0.35,
    cssW / 2,
    cssH / 2,
    Math.max(cssW, cssH) * 0.72,
  );
  vig.addColorStop(0, "rgba(0,0,0,0)");
  vig.addColorStop(1, "rgba(0,0,0,0.42)");
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, cssW, cssH);
}

function drawAimGuide(
  ctx: CanvasRenderingContext2D,
  cue: Ball,
  aim: AimPreview,
  sx: (x: number) => number,
  sy: (y: number) => number,
  scale: number,
) {
  ctx.save();

  // main aim line
  ctx.setLineDash([6 * scale, 5 * scale]);
  ctx.strokeStyle = "rgba(255,255,255,0.75)";
  ctx.lineWidth = 1.1 * scale;
  ctx.beginPath();
  ctx.moveTo(sx(cue.x), sy(cue.y));
  ctx.lineTo(sx(aim.end.x), sy(aim.end.y));
  ctx.stroke();
  ctx.setLineDash([]);

  if (aim.ghost && aim.target && aim.targetDir) {
    // ghost ball
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.setLineDash([3 * scale, 3 * scale]);
    ctx.beginPath();
    ctx.arc(sx(aim.ghost.x), sy(aim.ghost.y), cue.r * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // target direction arrow
    const t = aim.target;
    const len = 9;
    const ax = t.x + aim.targetDir.x * (t.r + 1.2);
    const ay = t.y + aim.targetDir.y * (t.r + 1.2);
    const bx = t.x + aim.targetDir.x * (t.r + len);
    const by = t.y + aim.targetDir.y * (t.r + len);
    ctx.strokeStyle = "rgba(240,180,41,0.95)";
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.moveTo(sx(ax), sy(ay));
    ctx.lineTo(sx(bx), sy(by));
    ctx.stroke();
    // arrowhead
    const ang = Math.atan2(aim.targetDir.y, aim.targetDir.x);
    ctx.fillStyle = "rgba(240,180,41,0.95)";
    ctx.beginPath();
    ctx.moveTo(sx(bx), sy(by));
    ctx.lineTo(
      sx(bx - Math.cos(ang - 0.45) * 2.4),
      sy(by - Math.sin(ang - 0.45) * 2.4),
    );
    ctx.lineTo(
      sx(bx - Math.cos(ang + 0.45) * 2.4),
      sy(by - Math.sin(ang + 0.45) * 2.4),
    );
    ctx.closePath();
    ctx.fill();

    // cue ball deflection (thin, faint)
    if (aim.cueDirAfter && (aim.cueDirAfter.x !== 0 || aim.cueDirAfter.y !== 0)) {
      ctx.strokeStyle = "rgba(255,255,255,0.4)";
      ctx.lineWidth = 0.8 * scale;
      ctx.setLineDash([2.5 * scale, 2.5 * scale]);
      ctx.beginPath();
      ctx.moveTo(sx(aim.ghost.x), sy(aim.ghost.y));
      ctx.lineTo(
        sx(aim.ghost.x + aim.cueDirAfter.x * 7),
        sy(aim.ghost.y + aim.cueDirAfter.y * 7),
      );
      ctx.stroke();
      ctx.setLineDash([]);
    }
  } else {
    // cushion hit marker
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.beginPath();
    ctx.arc(sx(aim.end.x), sy(aim.end.y), 1.2 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawCueStick(
  ctx: CanvasRenderingContext2D,
  cue: Ball,
  angle: number,
  power: number,
  sx: (x: number) => number,
  sy: (y: number) => number,
  scale: number,
) {
  const dirX = Math.cos(angle);
  const dirY = Math.sin(angle);
  const pull = power * 13;
  const tipDist = cue.r + 1.6 + pull;
  const stickLen = 74;

  const tipX = cue.x - dirX * tipDist;
  const tipY = cue.y - dirY * tipDist;
  const buttX = tipX - dirX * stickLen;
  const buttY = tipY - dirY * stickLen;

  ctx.save();

  // stick shadow
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2.6 * scale;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(sx(tipX) + 1.5 * scale, sy(tipY) + 2.2 * scale);
  ctx.lineTo(sx(buttX) + 1.5 * scale, sy(buttY) + 2.2 * scale);
  ctx.stroke();

  // stick body — light wood to dark
  const grad = ctx.createLinearGradient(sx(tipX), sy(tipY), sx(buttX), sy(buttY));
  grad.addColorStop(0, "#e8cfa4");
  grad.addColorStop(0.12, "#d9b87e");
  grad.addColorStop(0.55, "#9c6b38");
  grad.addColorStop(1, "#3d2412");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.1 * scale;
  ctx.beginPath();
  ctx.moveTo(sx(tipX), sy(tipY));
  ctx.lineTo(sx(buttX), sy(buttY));
  ctx.stroke();

  // ferrule + tip
  const fx = tipX + dirX * 0.9;
  const fy = tipY + dirY * 0.9;
  ctx.strokeStyle = "#f4f1e6";
  ctx.lineWidth = 2.1 * scale;
  ctx.beginPath();
  ctx.moveTo(sx(tipX), sy(tipY));
  ctx.lineTo(sx(fx), sy(fy));
  ctx.stroke();
  ctx.strokeStyle = "#3d6ea5";
  ctx.lineWidth = 2.1 * scale;
  ctx.beginPath();
  ctx.moveTo(sx(tipX - dirX * 0.5), sy(tipY - dirY * 0.5));
  ctx.lineTo(sx(tipX), sy(tipY));
  ctx.stroke();

  // wrap highlight
  ctx.strokeStyle = "rgba(255,255,255,0.28)";
  ctx.lineWidth = 0.5 * scale;
  ctx.beginPath();
  ctx.moveTo(
    sx(tipX - dirX * stickLen * 0.35),
    sy(tipY - dirY * stickLen * 0.35),
  );
  ctx.lineTo(
    sx(tipX - dirX * stickLen * 0.9),
    sy(tipY - dirY * stickLen * 0.9),
  );
  ctx.stroke();

  ctx.restore();
}
