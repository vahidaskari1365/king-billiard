/* ------------------------------------------------------------------ */
/*  AI opponent — shot selection with ghost-ball aiming                */
/* ------------------------------------------------------------------ */

import { Ball, GameMode, Pocket, TABLE } from "./types";
import { RulesState } from "./rules";
import { segmentBlocked } from "./physics";

export interface AIShot {
  angle: number; // radians
  power: number; // 0..1
}

export function legalTargetIds(
  mode: GameMode,
  rules: RulesState,
  balls: Ball[],
): number[] {
  const active = balls.filter((b) => b.active && b.id !== 0);
  if (mode === "8ball") {
    const shooter = rules.players[rules.current];
    if (rules.openTable)
      return active.filter((b) => b.kind !== "eight").map((b) => b.id);
    const own = active.filter((b) => b.kind === shooter.group);
    if (own.length > 0) return own.map((b) => b.id);
    return active.filter((b) => b.kind === "eight").map((b) => b.id);
  }
  if (mode === "9ball") {
    const lowest = Math.min(
      ...active.map((b) => (b.kind === "nine" ? 9 : b.number)),
    );
    return active
      .filter((b) => (b.kind === "nine" ? 9 : b.number) === lowest)
      .map((b) => b.id);
  }
  // snooker
  if (rules.snookerPhase === "red")
    return active.filter((b) => b.kind === "red").map((b) => b.id);
  if (rules.snookerPhase === "color")
    return active.filter((b) => b.kind === "color").map((b) => b.id);
  const req = rules.sequenceIndex + 1;
  return active.filter((b) => b.number === req).map((b) => b.id);
}

export function computeAIShot(
  mode: GameMode,
  rules: RulesState,
  balls: Ball[],
  pockets: Pocket[],
): AIShot {
  const cue = balls.find((b) => b.id === 0);
  if (!cue) return { angle: 0, power: 0.5 };

  const level = rules.players[rules.current].aiLevel ?? "medium";
  const noise = level === "easy" ? 0.055 : level === "hard" ? 0.008 : 0.024;

  const targets = balls.filter(
    (b) => legalTargetIds(mode, rules, balls).includes(b.id),
  );
  const cx = TABLE.W / 2;
  const cy = TABLE.H / 2;

  let best: { angle: number; power: number; score: number } | null = null;

  for (const target of targets) {
    for (const pocket of pockets) {
      // aim slightly inside the pocket mouth
      const toInX = cx - pocket.x;
      const toInY = cy - pocket.y;
      const toInLen = Math.hypot(toInX, toInY) || 1;
      const aimX = pocket.x + (toInX / toInLen) * pocket.r * 0.45;
      const aimY = pocket.y + (toInY / toInLen) * pocket.r * 0.45;

      const dpX = aimX - target.x;
      const dpY = aimY - target.y;
      const dpLen = Math.hypot(dpX, dpY);
      if (dpLen < 1) continue;
      const dirPX = dpX / dpLen;
      const dirPY = dpY / dpLen;

      // ghost ball position
      const ghostX = target.x - dirPX * (target.r + cue.r);
      const ghostY = target.y - dirPY * (target.r + cue.r);

      // ghost must be reachable (inside table, roughly)
      if (
        ghostX < -4 ||
        ghostX > TABLE.W + 4 ||
        ghostY < -4 ||
        ghostY > TABLE.H + 4
      )
        continue;

      const cgpX = ghostX - cue.x;
      const cgpY = ghostY - cue.y;
      const cgLen = Math.hypot(cgpX, cgpY);
      if (cgLen < 1) continue;
      const cgX = cgpX / cgLen;
      const cgY = cgpY / cgLen;

      const cosCut = cgX * dirPX + cgY * dirPY;
      if (cosCut < 0.32) continue; // too thin

      // paths must be clear
      if (
        segmentBlocked(cue.x, cue.y, ghostX, ghostY, balls, [0, target.id], target.r * 2 - 0.25)
      )
        continue;
      if (
        segmentBlocked(target.x, target.y, aimX, aimY, balls, [0, target.id], target.r * 2 - 0.25)
      )
        continue;

      const score =
        cosCut * cosCut * 130 -
        cgLen * 0.42 -
        dpLen * 0.38 +
        (pocket.r > 5 ? 8 : 0); // corners slightly easier

      const power = Math.min(
        1,
        0.34 + (cgLen / TABLE.W) * 0.42 + (dpLen / TABLE.W) * 0.5,
      );

      if (!best || score > best.score) {
        best = { angle: Math.atan2(cgY, cgX), power, score };
      }
    }
  }

  if (best) {
    return {
      angle: best.angle + (Math.random() - 0.5) * 2 * noise,
      power: Math.min(1, Math.max(0.18, best.power + (Math.random() - 0.5) * 0.1)),
    };
  }

  // safety: softly hit the nearest legal target
  let nearest: Ball | null = null;
  let nd = Infinity;
  for (const t of targets) {
    const d = Math.hypot(t.x - cue.x, t.y - cue.y);
    if (d < nd) {
      nd = d;
      nearest = t;
    }
  }
  if (nearest) {
    return {
      angle:
        Math.atan2(nearest.y - cue.y, nearest.x - cue.x) +
        (Math.random() - 0.5) * 2 * noise,
      power: 0.32 + Math.random() * 0.15,
    };
  }
  // nothing legal left — random soft shot
  return { angle: Math.random() * Math.PI * 2, power: 0.35 };
}
