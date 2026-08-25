/* ------------------------------------------------------------------ */
/*  CueVerse Billiards — core types, table geometry & rack layouts     */
/* ------------------------------------------------------------------ */

export type GameMode = "8ball" | "9ball" | "snooker";

export type BallKind =
  | "cue"
  | "solid"
  | "stripe"
  | "eight"
  | "nine"
  | "red"
  | "color";

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  color: string;
  number: number; // 0 = no number (cue / red)
  kind: BallKind;
  points: number; // snooker value
  active: boolean;
  sink: { x: number; y: number; t: number } | null; // pocketing animation
  trail: { x: number; y: number }[];
}

export interface PlayerState {
  name: string;
  score: number;
  group: "solid" | "stripe" | null; // 8-ball groups
  isAI: boolean;
  aiLevel?: "easy" | "medium" | "hard";
}

export interface Pocket {
  x: number;
  y: number;
  r: number;
}

/* -------------------------- Table geometry ------------------------ */

export const TABLE = {
  W: 224, // playing surface width  (world units)
  H: 112, // playing surface height (world units)
  frame: 13, // wooden frame width
  ballR: 2.85,
  snookerBallR: 2.42,
  pocketR: 5.5,
  sidePocketR: 5.0,
  snookerPocketR: 4.6,
  snookerSidePocketR: 4.2,
  frictionK: 0.82, // exponential velocity decay per second
  cushionRestitution: 0.82,
  ballRestitution: 0.96,
  stopSpeed: 1.4,
  maxShotSpeed: 190,
};

export function pocketsFor(mode: GameMode): Pocket[] {
  const { W, H } = TABLE;
  const corner =
    mode === "snooker" ? TABLE.snookerPocketR : TABLE.pocketR;
  const side =
    mode === "snooker" ? TABLE.snookerSidePocketR : TABLE.sidePocketR;
  return [
    { x: 0, y: 0, r: corner },
    { x: W, y: 0, r: corner },
    { x: 0, y: H, r: corner },
    { x: W, y: H, r: corner },
    { x: W / 2, y: -2.2, r: side },
    { x: W / 2, y: H + 2.2, r: side },
  ];
}

/* ---------------------------- Ball colors ------------------------- */

const POOL_COLORS: Record<number, string> = {
  1: "#fdd835",
  2: "#1e88e5",
  3: "#e53935",
  4: "#8e24aa",
  5: "#fb8c00",
  6: "#43a047",
  7: "#8d3b2e",
  8: "#15171f",
  9: "#fdd835",
};

function makeBall(
  id: number,
  x: number,
  y: number,
  r: number,
  opts: Partial<Ball> = {},
): Ball {
  return {
    id,
    x,
    y,
    vx: 0,
    vy: 0,
    r,
    color: "#ffffff",
    number: 0,
    kind: "cue",
    points: 0,
    active: true,
    sink: null,
    trail: [],
    ...opts,
  };
}

/* ------------------------------ Racks ----------------------------- */

export function rackBalls(mode: GameMode): Ball[] {
  if (mode === "8ball") return rack8Ball();
  if (mode === "9ball") return rack9Ball();
  return rackSnooker();
}

function rack8Ball(): Ball[] {
  const { W, H, ballR } = TABLE;
  const balls: Ball[] = [
    makeBall(0, W * 0.25, H / 2, ballR, { kind: "cue", color: "#fdfdf6" }),
  ];
  const gap = ballR * 2 + 0.06;
  const dx = gap * 0.866;
  const footX = W * 0.72;

  // shuffled solids & stripes, 8 fixed in the middle of row 3,
  // back-row corners get one solid and one stripe
  const solids = [1, 2, 3, 4, 5, 6, 7].sort(() => Math.random() - 0.5);
  const stripes = [9, 10, 11, 12, 13, 14, 15].sort(() => Math.random() - 0.5);
  const rest = [...solids.slice(0, 6), ...stripes.slice(0, 6)].sort(
    () => Math.random() - 0.5,
  );
  const order: number[] = [];
  let ri = 0;
  for (let i = 0; i < 15; i++) {
    if (i === 4) order.push(8);
    else if (i === 10) order.push(stripes[6]); // back-row corner stripe
    else if (i === 14) order.push(solids[6]); // back-row corner solid
    else order.push(rest[ri++]);
  }

  let id = 1;
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let j = 0; j <= row; j++) {
      const x = footX + row * dx;
      const y = H / 2 + (j - row / 2) * gap;
      const n = order[idx++];
      balls.push(
        makeBall(id++, x, y, ballR, {
          number: n,
          color: POOL_COLORS[n > 8 ? n - 8 : n] ?? "#fff",
          kind: n === 8 ? "eight" : n > 8 ? "stripe" : "solid",
          points: 0,
        }),
      );
    }
  }
  return balls;
}

function rack9Ball(): Ball[] {
  const { W, H, ballR } = TABLE;
  const balls: Ball[] = [
    makeBall(0, W * 0.25, H / 2, ballR, { kind: "cue", color: "#fdfdf6" }),
  ];
  const gap = ballR * 2 + 0.06;
  const dx = gap * 0.9;
  const footX = W * 0.7;

  const rows = [1, 2, 3, 2, 1];
  const order = [1, 2, 3, 4, 9, 5, 6, 7, 8]; // 9 in the middle of the diamond
  let id = 1;
  let idx = 0;
  for (let row = 0; row < 5; row++) {
    for (let j = 0; j < rows[row]; j++) {
      const x = footX + row * dx;
      const y = H / 2 + (j - (rows[row] - 1) / 2) * gap;
      const n = order[idx++];
      balls.push(
        makeBall(id++, x, y, ballR, {
          number: n,
          color: POOL_COLORS[n] ?? "#fff",
          kind: n === 9 ? "nine" : n > 8 ? "stripe" : "solid",
          points: 0,
        }),
      );
    }
  }
  return balls;
}

const SNOOKER: Record<string, { key: string; color: string; pts: number }> = {
  yellow: { key: "yellow", color: "#fdd835", pts: 2 },
  green: { key: "green", color: "#2e7d32", pts: 3 },
  brown: { key: "brown", color: "#6d4c41", pts: 4 },
  blue: { key: "blue", color: "#1e88e5", pts: 5 },
  pink: { key: "pink", color: "#f06292", pts: 6 },
  black: { key: "black", color: "#15171f", pts: 7 },
};

export const SNOOKER_SEQUENCE = [
  "yellow",
  "green",
  "brown",
  "blue",
  "pink",
  "black",
] as const;

function rackSnooker(): Ball[] {
  const { W, H, snookerBallR: r } = TABLE;
  const balls: Ball[] = [];
  const baulkX = W * 0.2;

  balls.push(
    makeBall(0, baulkX + H * 0.055, H / 2 + H * 0.05, r, {
      kind: "cue",
      color: "#fdfdf6",
    }),
  );

  let id = 1;
  // colors on their spots — numbers follow the potting sequence (1=yellow … 6=black)
  const spots: Array<[string, number, number]> = [
    ["yellow", baulkX, H * 0.75],
    ["green", baulkX, H * 0.25],
    ["brown", baulkX, H / 2],
    ["blue", W / 2, H / 2],
    ["pink", W * 0.73, H / 2],
    ["black", W * 0.875, H / 2],
  ];
  for (const [name, x, y] of spots) {
    const c = SNOOKER[name];
    balls.push(
      makeBall(id, x, y, r, {
        id,
        number: id,
        kind: "color",
        color: c.color,
        points: c.pts,
      }),
    );
    id++;
  }

  // 15 reds in a triangle just behind pink
  const gap = r * 2 + 0.05;
  const dx = gap * 0.866;
  const apexX = W * 0.73 + gap * 1.15;
  for (let row = 0; row < 5; row++) {
    for (let j = 0; j <= row; j++) {
      const x = apexX + row * dx;
      const y = H / 2 + (j - row / 2) * gap;
      balls.push(
        makeBall(id++, x, y, r, { kind: "red", color: "#d32f2f", points: 1 }),
      );
    }
  }
  return balls;
}

export function ballLabel(b: Ball): string {
  if (b.kind === "cue") return "سفید";
  if (b.kind === "red") return "قرمز";
  if (b.kind === "eight") return "۸";
  if (b.kind === "nine") return "۹";
  return String(b.number);
}
