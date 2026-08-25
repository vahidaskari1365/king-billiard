/* ------------------------------------------------------------------ */
/*  Rules engine — 8-ball, 9-ball & simplified snooker                 */
/* ------------------------------------------------------------------ */

import {
  Ball,
  GameMode,
  PlayerState,
  SNOOKER_SEQUENCE,
  TABLE,
} from "./types";
import type { ShotEvents } from "./physics";

export interface RulesState {
  mode: GameMode;
  players: [PlayerState, PlayerState];
  current: 0 | 1;
  openTable: boolean; // 8-ball: table open
  snookerPhase: "red" | "color" | "sequence";
  sequenceIndex: number;
  trays: [number[], number[]]; // potted ball numbers per player (display)
  winner: number | null;
  winReason: string;
}

export interface PreShotInfo {
  ownRemaining8: number; // shooter's group balls left (8-ball)
  lowest9: number; // lowest active number (9-ball)
  redsBefore: number; // reds on table before the shot (snooker)
}

export interface ResolveResult {
  rules: RulesState;
  respotCue: boolean;
  respotBalls: { id: number; x: number; y: number }[];
  messages: string[];
  continueTurn: boolean;
  gameOver: boolean;
}

export function initialRules(
  mode: GameMode,
  players: [PlayerState, PlayerState],
): RulesState {
  return {
    mode,
    players,
    current: 0,
    openTable: mode === "8ball",
    snookerPhase: "red",
    sequenceIndex: 0,
    trays: [[], []],
    winner: null,
    winReason: "",
  };
}

export function computePreShot(
  mode: GameMode,
  rules: RulesState,
  balls: Ball[],
): PreShotInfo {
  const active = balls.filter((b) => b.active && b.id !== 0);
  const shooter = rules.players[rules.current];

  let ownRemaining8 = 0;
  if (mode === "8ball" && !rules.openTable && shooter.group) {
    ownRemaining8 = active.filter(
      (b) => b.kind === shooter.group,
    ).length;
  }

  let lowest9 = 1;
  if (mode === "9ball") {
    lowest9 = Math.min(
      ...active.map((b) => (b.kind === "nine" ? 9 : b.number)),
    );
  }

  return {
    ownRemaining8,
    lowest9,
    redsBefore: mode === "snooker" ? active.filter((b) => b.kind === "red").length : 0,
  };
}

/** which balls may be hit first by the current shooter */
export function legalFirstKinds(
  mode: GameMode,
  rules: RulesState,
  balls: Ball[],
): Ball["kind"][] {
  const shooter = rules.players[rules.current];
  if (mode === "8ball") {
    if (rules.openTable)
      return ["solid", "stripe", "nine", "red", "color"];
    const ownLeft = balls.some(
      (b) => b.active && b.kind === shooter.group,
    );
    return ownLeft ? [shooter.group as Ball["kind"]] : ["eight"];
  }
  if (mode === "9ball") {
    const active = balls.filter((b) => b.active && b.id !== 0);
    const lowest = Math.min(
      ...active.map((b) => (b.kind === "nine" ? 9 : b.number)),
    );
    return active.find(
      (b) => (b.kind === "nine" ? 9 : b.number) === lowest,
    )
      ? [active.find((b) => (b.kind === "nine" ? 9 : b.number) === lowest)!.kind]
      : ["solid", "stripe", "nine"];
  }
  // snooker
  if (rules.snookerPhase === "red") return ["red"];
  if (rules.snookerPhase === "color") return ["color"];
  return ["color"]; // sequence — specific color checked in resolve
}

function findFreeSpot(
  balls: Ball[],
  x: number,
  y: number,
  r: number,
): { x: number; y: number } {
  const clear = (px: number, py: number) =>
    !balls.some(
      (b) => b.active && Math.hypot(b.x - px, b.y - py) < b.r + r + 0.4,
    );
  if (clear(x, y)) return { x, y };
  for (let ring = 1; ring <= 14; ring++) {
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const px = Math.min(
        TABLE.W - r,
        Math.max(r, x + Math.cos(ang) * ring * (r * 1.6)),
      );
      const py = Math.min(
        TABLE.H - r,
        Math.max(r, y + Math.sin(ang) * ring * (r * 1.6)),
      );
      if (clear(px, py)) return { x: px, y: py };
    }
  }
  return { x: TABLE.W / 2, y: TABLE.H / 2 };
}

const groupName = (g: "solid" | "stripe") =>
  g === "solid" ? "توپ‌های رنگی (۱-۷)" : "توپ‌های خط‌دار (۹-۱۵)";

export function resolveShot(
  rules: RulesState,
  pre: PreShotInfo,
  balls: Ball[],
  ev: ShotEvents,
): ResolveResult {
  const { mode } = rules;
  const byId = new Map(balls.map((b) => [b.id, b]));
  const potted = ev.potted.map((id) => byId.get(id)!).filter(Boolean);
  const nonCue = potted.filter((b) => b.id !== 0);
  const first = ev.firstContact !== null ? byId.get(ev.firstContact) ?? null : null;

  const players: [PlayerState, PlayerState] = [
    { ...rules.players[0], group: rules.players[0].group },
    { ...rules.players[1], group: rules.players[1].group },
  ];
  let current = rules.current;
  let openTable = rules.openTable;
  let snookerPhase = rules.snookerPhase;
  let sequenceIndex = rules.sequenceIndex;
  const trays: [number[], number[]] = [
    [...rules.trays[0]],
    [...rules.trays[1]],
  ];
  let winner: number | null = null;
  let winReason = "";
  const messages: string[] = [];
  const respotBalls: { id: number; x: number; y: number }[] = [];
  let respotCue = false;
  let continueTurn = false;

  const shooter = players[current];
  const opponent = players[1 - current];
  const ballNumberLabel = (b: Ball) => (b.kind === "red" ? "قرمز" : String(b.number));

  /* ------------------------------ 8-BALL ------------------------------ */
  if (mode === "8ball") {
    const potted8 = nonCue.some((b) => b.kind === "eight");
    const legalKinds = legalFirstKinds(mode, rules, balls);
    const foul =
      ev.cuePotted ||
      !first ||
      !legalKinds.includes(first.kind) ||
      (first.kind === "eight" && openTable);

    // group assignment on first legal pot
    if (openTable && !foul && !potted8 && nonCue.length > 0) {
      const firstPot = nonCue[0];
      const g = firstPot.kind === "stripe" ? "stripe" : "solid";
      shooter.group = g;
      opponent.group = g === "solid" ? "stripe" : "solid";
      openTable = false;
      messages.push(`گروه ${groupName(g)} به شما اختصاص یافت`);
    }

    if (potted8) {
      const clearedBefore =
        !openTable &&
        shooter.group !== null &&
        pre.ownRemaining8 === 0 &&
        !nonCue.some((b) => b.kind === shooter.group);
      if (!foul && clearedBefore) {
        winner = current;
        winReason = "توپ ۸ را با موفقیت انداخت!";
      } else {
        winner = 1 - current;
        winReason = "توپ ۸ در زمان اشتباه انداخته شد";
      }
    } else {
      const ownPotted = openTable
        ? nonCue
        : nonCue.filter((b) => shooter.group !== null && b.kind === shooter.group);
      if (foul) {
        if (ev.cuePotted) messages.push("خطا! توپ سفید داخل پاکت افتاد");
        else if (!first) messages.push("خطا! هیچ توپی لمس نشد");
        else messages.push("خطا! اولین توپ تماس مجاز نبود");
        current = (1 - current) as 0 | 1;
        respotCue = ev.cuePotted;
      } else if (ownPotted.length > 0) {
        // legal pot — keep shooting
        continueTurn = true;
        messages.push(`${ownPotted.length} توپ انداختید — ادامه بدهید!`);
      } else {
        current = (1 - current) as 0 | 1;
        messages.push("توپی از گروه خودتان نیفتاد");
      }
      // all balls physically potted by the shooter go to their tray
      nonCue.forEach((b) => trays[rules.current].push(b.number));
    }

    if (respotCue) {
      const spot = findFreeSpot(balls, TABLE.W * 0.25, TABLE.H / 2, TABLE.ballR);
      respotBalls.push({ id: 0, ...spot });
    }
  }

  /* ------------------------------ 9-BALL ------------------------------ */
  if (mode === "9ball") {
    const nineBall = nonCue.find((b) => b.kind === "nine");
    const potted9 = nineBall !== undefined;
    const foul =
      ev.cuePotted || !first || first.number !== pre.lowest9;

    if (potted9 && !foul) {
      winner = current;
      winReason = "توپ ۹ را انداختید و برنده شدید!";
    } else {
      if (potted9 && foul && nineBall) {
        const spot = findFreeSpot(balls, TABLE.W * 0.72, TABLE.H / 2, TABLE.ballR);
        respotBalls.push({ id: nineBall.id, ...spot });
      }
      if (foul) {
        if (ev.cuePotted) messages.push("خطا! توپ سفید داخل پاکت افتاد");
        else if (!first) messages.push("خطا! هیچ توپی لمس نشد");
        else messages.push(`خطا! باید اول توپ ${pre.lowest9} زده می‌شد`);
        current = (1 - current) as 0 | 1;
      } else if (nonCue.length > 0) {
        continueTurn = true;
        messages.push("توپ انداختید — ادامه بدهید!");
      } else {
        current = (1 - current) as 0 | 1;
        messages.push("توپی نیفتاد");
      }
      nonCue.forEach((b) => trays[rules.current].push(b.number));
      if (ev.cuePotted) {
        respotCue = true;
        const spot = findFreeSpot(balls, TABLE.W * 0.25, TABLE.H / 2, TABLE.ballR);
        respotBalls.push({ id: 0, ...spot });
      }
    }
  }

  /* ------------------------------ SNOOKER ----------------------------- */
  if (mode === "snooker") {
    const redsLeftNow = balls.filter((b) => b.active && b.kind === "red").length;
    const pottedReds = nonCue.filter((b) => b.kind === "red");
    const pottedColors = nonCue.filter((b) => b.kind === "color");
    const colorName = (b: Ball) =>
      ({
        yellow: "زرد",
        green: "سبز",
        brown: "قهوه‌ای",
        blue: "آبی",
        pink: "صورتی",
        black: "مشکی",
      })[SNOOKER_SEQUENCE[b.number - 1]] ?? "رنگی";

    // required first ball
    let requiredOk = true;
    let requiredLabel = "";
    if (snookerPhase === "red") {
      requiredOk = first?.kind === "red";
      requiredLabel = "قرمز";
    } else if (snookerPhase === "color") {
      requiredOk = first?.kind === "color";
      requiredLabel = "رنگی";
    } else {
      requiredOk = first?.kind === "color" && first.number === sequenceIndex + 1;
      requiredLabel = colorName({ number: sequenceIndex + 1 } as Ball);
    }

    const foul =
      ev.cuePotted || !first || !requiredOk ||
      (snookerPhase === "red" && pottedColors.length > 0) ||
      (snookerPhase !== "red" && pottedReds.length > 0);

    const foulValue = Math.max(
      4,
      first?.points ?? 0,
      ...pottedColors.map((b) => b.points),
      0,
    );

    if (foul) {
      opponent.score += foulValue;
      messages.push(
        `خطا! باید اول توپ ${requiredLabel} زده می‌شد (+${foulValue} حریف)`,
      );
      current = (1 - current) as 0 | 1;
      // colors potted on a foul are re-spotted
      for (const c of pottedColors) {
        const orig = originalSpot(c);
        const spot = findFreeSpot(balls, orig.x, orig.y, c.r);
        respotBalls.push({ id: c.id, ...spot });
      }
      if (ev.cuePotted) {
        respotCue = true;
        const spot = findFreeSpot(balls, TABLE.W * 0.2 + TABLE.H * 0.05, TABLE.H / 2, c_r());
        respotBalls.push({ id: 0, ...spot });
      }
    } else if (snookerPhase === "red") {
      if (pottedReds.length > 0) {
        shooter.score += pottedReds.length;
        pottedReds.forEach((b) => trays[current].push(0));
        snookerPhase = "color";
        continueTurn = true;
        messages.push(`${pottedReds.length} قرمز (+${pottedReds.length}) — حالا یک توپ رنگی`);
      } else {
        current = (1 - current) as 0 | 1;
        messages.push("توپ قرمز نیفتاد");
      }
    } else if (snookerPhase === "color") {
      if (pottedColors.length === 1) {
        const c = pottedColors[0];
        shooter.score += c.points;
        trays[current].push(c.number);
        if (redsLeftNow > 0) {
          const orig = originalSpot(c);
          const spot = findFreeSpot(balls, orig.x, orig.y, c.r);
          respotBalls.push({ id: c.id, ...spot });
          snookerPhase = "red";
          messages.push(`توپ ${colorName(c)} (+${c.points}) — دوباره قرمز`);
        } else {
          snookerPhase = "sequence";
          sequenceIndex = 0;
          messages.push(`توپ ${colorName(c)} (+${c.points}) — شروع توالی رنگ‌ها`);
        }
        continueTurn = true;
      } else if (pottedColors.length > 1) {
        opponent.score += 4;
        current = (1 - current) as 0 | 1;
        messages.push("خطا! فقط یک توپ رنگی مجاز است (+۴ حریف)");
        for (const c of pottedColors) {
          const orig = originalSpot(c);
          const spot = findFreeSpot(balls, orig.x, orig.y, c.r);
          respotBalls.push({ id: c.id, ...spot });
        }
      } else {
        current = (1 - current) as 0 | 1;
        messages.push("توپ رنگی نیفتاد");
      }
    } else {
      // sequence — pot colors in order yellow → black
      const reqNum = sequenceIndex + 1;
      const pottedReq = pottedColors.find((b) => b.number === reqNum);
      if (pottedReq) {
        shooter.score += pottedReq.points;
        trays[current].push(pottedReq.number);
        sequenceIndex += 1;
        messages.push(`توپ ${colorName(pottedReq)} (+${pottedReq.points})`);
        if (sequenceIndex >= SNOOKER_SEQUENCE.length) {
          winner =
            players[0].score === players[1].score
              ? null
              : players[0].score > players[1].score
                ? 0
                : 1;
          winReason = "همه توپ‌ها تمام شد";
        } else {
          continueTurn = true;
        }
      } else {
        current = (1 - current) as 0 | 1;
        messages.push(`باید توپ ${colorName({ number: reqNum } as Ball)} انداخته می‌شد`);
      }
      // wrongly potted colors in sequence get re-spotted
      for (const c of pottedColors) {
        if (c.number !== reqNum) {
          const orig = originalSpot(c);
          const spot = findFreeSpot(balls, orig.x, orig.y, c.r);
          respotBalls.push({ id: c.id, ...spot });
        }
      }
    }

    // all balls gone (e.g. sequence finished)
    if (winner === null) {
      const anyLeft = balls.some((b) => b.active && b.id !== 0);
      if (!anyLeft) {
        winner =
          players[0].score === players[1].score
            ? null
            : players[0].score > players[1].score
              ? 0
              : 1;
        winReason = "میز خالی شد";
      }
    }
  }

  const nextRules: RulesState = {
    ...rules,
    players,
    current,
    openTable,
    snookerPhase,
    sequenceIndex,
    trays,
    winner,
    winReason,
  };
  if (winner !== null) {
    messages.unshift(`${players[winner].name} برنده شد!`);
  }
  return {
    rules: nextRules,
    respotCue,
    respotBalls,
    messages,
    continueTurn: continueTurn && winner === null,
    gameOver: winner !== null,
  };
}

function c_r() {
  return TABLE.snookerBallR;
}

function originalSpot(b: Ball): { x: number; y: number } {
  const { W, H } = TABLE;
  const spots: Record<number, { x: number; y: number }> = {
    1: { x: W * 0.2, y: H * 0.75 }, // yellow
    2: { x: W * 0.2, y: H * 0.25 }, // green
    3: { x: W * 0.2, y: H / 2 }, // brown
    4: { x: W / 2, y: H / 2 }, // blue
    5: { x: W * 0.73, y: H / 2 }, // pink
    6: { x: W * 0.875, y: H / 2 }, // black
  };
  return spots[b.number] ?? { x: W / 2, y: H / 2 };
}
