/* ------------------------------------------------------------------ */
/*  Physics engine — integration, collisions, cushions, pockets        */
/* ------------------------------------------------------------------ */

import { Ball, Pocket, TABLE } from "./types";

export interface ShotEvents {
  potted: number[]; // ball ids in potting order
  firstContact: number | null;
  cuePotted: boolean;
  hitBall: boolean;
  hitCushion: boolean;
}

export function newShotEvents(): ShotEvents {
  return {
    potted: [],
    firstContact: null,
    cuePotted: false,
    hitBall: false,
    hitCushion: false,
  };
}

/** Advance the world by dt seconds (call once per animation frame). */
export function stepPhysics(
  balls: Ball[],
  dtRaw: number,
  pockets: Pocket[],
  ev: ShotEvents,
): void {
  const dt = Math.min(dtRaw, 0.034);
  const sub = 3;
  const h = dt / sub;

  for (let s = 0; s < sub; s++) {
    // integrate + friction
    for (const b of balls) {
      if (!b.active || b.sink) continue;
      b.x += b.vx * h;
      b.y += b.vy * h;
      const decay = Math.exp(-TABLE.frictionK * h);
      b.vx *= decay;
      b.vy *= decay;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp < TABLE.stopSpeed) {
        b.vx = 0;
        b.vy = 0;
      }
      // trail
      if (sp > 14) {
        b.trail.push({ x: b.x, y: b.y });
        if (b.trail.length > 7) b.trail.shift();
      } else if (b.trail.length > 0) {
        b.trail.shift();
      }
    }

    // pockets
    for (const b of balls) {
      if (!b.active || b.sink) continue;
      for (const p of pockets) {
        const d = Math.hypot(b.x - p.x, b.y - p.y);
        if (d < p.r) {
          b.active = false;
          b.vx = 0;
          b.vy = 0;
          b.trail = [];
          b.sink = { x: p.x, y: p.y, t: 0 };
          ev.potted.push(b.id);
          if (b.id === 0) ev.cuePotted = true;
          break;
        }
      }
    }

    // cushions
    const { W, H, cushionRestitution: R } = TABLE;
    const mouth = 6.4; // side-pocket mouth half width
    for (const b of balls) {
      if (!b.active || b.sink) continue;
      let hit = false;
      // left / right
      if (b.x < b.r && b.vx < 0) {
        b.x = b.r;
        b.vx = -b.vx * R;
        hit = true;
      } else if (b.x > W - b.r && b.vx > 0) {
        b.x = W - b.r;
        b.vx = -b.vx * R;
        hit = true;
      }
      // top / bottom (side pocket mouths in the middle)
      const inSideMouth = Math.abs(b.x - W / 2) < mouth;
      if (b.y < b.r && b.vy < 0) {
        if (!inSideMouth || b.y < -6.5) {
          b.y = Math.max(b.y, b.r - (inSideMouth ? 7.5 + b.r : 0));
          if (b.y < b.r && !inSideMouth) b.y = b.r;
          b.vy = -b.vy * R;
          hit = true;
        }
      } else if (b.y > H - b.r && b.vy > 0) {
        if (!inSideMouth || b.y > H + 6.5) {
          b.y = Math.min(b.y, H - b.r + (inSideMouth ? 7.5 + b.r : 0));
          if (b.y > H - b.r && !inSideMouth) b.y = H - b.r;
          b.vy = -b.vy * R;
          hit = true;
        }
      }
      if (hit) ev.hitCushion = true;
    }

    // ball-ball collisions
    for (let i = 0; i < balls.length; i++) {
      const a = balls[i];
      if (!a.active || a.sink) continue;
      for (let j = i + 1; j < balls.length; j++) {
        const b = balls[j];
        if (!b.active || b.sink) continue;
        const hit = collide(a, b, ev);
        if (hit) ev.hitBall = true;
      }
    }
  }

  // advance pocketing animations
  for (const b of balls) {
    if (b.sink) {
      b.sink.t += dt / 0.28;
      if (b.sink.t >= 1) b.sink = null;
    }
  }
}

function collide(a: Ball, b: Ball, ev: ShotEvents): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const min = a.r + b.r;
  const d2 = dx * dx + dy * dy;
  if (d2 >= min * min || d2 === 0) return false;

  const d = Math.sqrt(d2);
  const nx = dx / d;
  const ny = dy / d;
  const overlap = (min - d) / 2;
  a.x -= nx * overlap;
  a.y -= ny * overlap;
  b.x += nx * overlap;
  b.y += ny * overlap;

  const rvn = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (rvn > 0) return false;

  // first-contact tracking (cue ball involved only)
  if (ev.firstContact === null) {
    if (a.id === 0) ev.firstContact = b.id;
    else if (b.id === 0) ev.firstContact = a.id;
  }

  const imp = (-(1 + TABLE.ballRestitution) * rvn) / 2;
  a.vx -= imp * nx;
  a.vy -= imp * ny;
  b.vx += imp * nx;
  b.vy += imp * ny;
  return Math.abs(rvn) > 2;
}

export function anyMoving(balls: Ball[]): boolean {
  return balls.some(
    (b) => b.active && !b.sink && (b.vx !== 0 || b.vy !== 0),
  );
}

/* ------------------------- Aim ray casting ------------------------ */

export interface AimPreview {
  ghost: { x: number; y: number } | null;
  target: Ball | null;
  targetDir: { x: number; y: number } | null;
  cueDirAfter: { x: number; y: number } | null;
  end: { x: number; y: number };
  contact: boolean;
}

/** Ray from cue ball along (dx,dy): first ball or cushion hit. */
export function castAim(
  balls: Ball[],
  dirX: number,
  dirY: number,
): AimPreview {
  const cue = balls.find((b) => b.id === 0);
  const { W, H } = TABLE;
  const res: AimPreview = {
    ghost: null,
    target: null,
    targetDir: null,
    cueDirAfter: null,
    end: { x: cue?.x ?? 0, y: cue?.y ?? 0 },
    contact: false,
  };
  if (!cue || (dirX === 0 && dirY === 0)) return res;

  const len = Math.hypot(dirX, dirY);
  const dx = dirX / len;
  const dy = dirY / len;

  // cushion hit distance
  let tCushion = Infinity;
  if (dx < 0) tCushion = Math.min(tCushion, (cue.x - cue.r) / -dx);
  if (dx > 0) tCushion = Math.min(tCushion, (W - cue.r - cue.x) / dx);
  if (dy < 0) tCushion = Math.min(tCushion, (cue.y - cue.r) / -dy);
  if (dy > 0) tCushion = Math.min(tCushion, (H - cue.r - cue.y) / dy);

  // nearest ball hit
  let tBall = Infinity;
  let hit: Ball | null = null;
  for (const b of balls) {
    if (b.id === 0 || !b.active) continue;
    const rSum = b.r + cue.r;
    const ox = b.x - cue.x;
    const oy = b.y - cue.y;
    const proj = ox * dx + oy * dy;
    if (proj <= 0) continue;
    const perp2 = ox * ox + oy * oy - proj * proj;
    const r2 = rSum * rSum;
    if (perp2 > r2) continue;
    const t = proj - Math.sqrt(r2 - perp2);
    if (t > 0 && t < tBall) {
      tBall = t;
      hit = b;
    }
  }

  if (tBall < tCushion && hit) {
    const gx = cue.x + dx * tBall;
    const gy = cue.y + dy * tBall;
    const tdx = hit.x - gx;
    const tdy = hit.y - gy;
    const tl = Math.hypot(tdx, tdy) || 1;
    const tx = tdx / tl;
    const ty = tdy / tl;
    // cue ball deflection = tangential component of original direction
    const dot = dx * tx + dy * ty;
    let cx = dx - tx * dot;
    let cy = dy - ty * dot;
    const cl = Math.hypot(cx, cy);
    if (cl > 0.001) {
      cx /= cl;
      cy /= cl;
    } else {
      cx = 0;
      cy = 0;
    }
    res.ghost = { x: gx, y: gy };
    res.target = hit;
    res.targetDir = { x: tx, y: ty };
    res.cueDirAfter = { x: cx, y: cy };
    res.end = { x: gx, y: gy };
    res.contact = true;
  } else {
    res.end = {
      x: cue.x + dx * Math.max(tCushion, 0),
      y: cue.y + dy * Math.max(tCushion, 0),
    };
  }
  return res;
}

/** distance from point to segment — used for path-blocked checks */
export function segmentBlocked(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  balls: Ball[],
  ignoreIds: number[],
  radius: number,
): boolean {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby;
  for (const b of balls) {
    if (!b.active || ignoreIds.includes(b.id)) continue;
    let t = 0;
    if (ab2 > 0) t = ((b.x - ax) * abx + (b.y - ay) * aby) / ab2;
    t = Math.max(0, Math.min(1, t));
    const px = ax + abx * t;
    const py = ay + aby * t;
    if (Math.hypot(b.x - px, b.y - py) < radius) return true;
  }
  return false;
}
