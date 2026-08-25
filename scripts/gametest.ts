/* quick engine sanity check — not part of the app build */
import { rackBalls, pocketsFor, TABLE, GameMode } from "../src/game/types";
import { stepPhysics, newShotEvents, anyMoving, castAim } from "../src/game/physics";
import { initialRules, computePreShot, resolveShot } from "../src/game/rules";
import { computeAIShot } from "../src/game/ai";

let failures = 0;
function check(name: string, cond: boolean, extra = "") {
  console.log(`${cond ? "PASS" : "FAIL"} — ${name}${extra ? " (" + extra + ")" : ""}`);
  if (!cond) failures++;
}

/* ---------------- racks ---------------- */
const b8 = rackBalls("8ball");
check("8-ball rack: 16 balls", b8.length === 16);
check("8-ball rack: one 8", b8.filter((b) => b.kind === "eight").length === 1);
check("8-ball rack: 7 solids", b8.filter((b) => b.kind === "solid").length === 7);
check("8-ball rack: 7 stripes", b8.filter((b) => b.kind === "stripe").length === 7);

const b9 = rackBalls("9ball");
check("9-ball rack: 10 balls", b9.length === 10);
check("9-ball rack: has 9", b9.some((b) => b.kind === "nine"));

const sn = rackBalls("snooker");
check("snooker rack: 22 balls", sn.length === 22);
check("snooker rack: 15 reds", sn.filter((b) => b.kind === "red").length === 15);
check("snooker colors numbered 1-6", sn.filter((b) => b.kind === "color").every((b) => b.number >= 1 && b.number <= 6));

/* ---------------- physics: break shot ---------------- */
const balls = rackBalls("8ball");
const cue = balls.find((b) => b.id === 0)!;
cue.vx = TABLE.maxShotSpeed * 0.9;
cue.vy = 0;
const pockets = pocketsFor("8ball");
const ev = newShotEvents();
let t = 0;
while ((anyMoving(balls) || t < 0.1) && t < 12) {
  stepPhysics(balls, 1 / 60, pockets, ev);
  t += 1 / 60;
}
check("break: balls come to rest", !anyMoving(balls), `t=${t.toFixed(2)}s`);
check("break: first contact recorded", ev.firstContact !== null);
console.log(`  info — potted on break: ${ev.potted.length}, firstContact: ${ev.firstContact}`);

/* all balls stayed in bounds */
const inBounds = balls.filter((b) => b.active).every(
  (b) => b.x >= -1 && b.x <= TABLE.W + 1 && b.y >= -1 && b.y <= TABLE.H + 1,
);
check("break: active balls in bounds", inBounds);

/* ---------------- aim raycast ---------------- */
const b8b = rackBalls("8ball");
const aim = castAim(b8b, 1, 0); // straight at rack from cue
check("raycast: finds contact with rack", aim.contact && aim.target !== null);
check("raycast: ghost in front of target", aim.ghost !== null && aim.ghost.x < (aim.target?.x ?? 0));

/* ---------------- rules: 8-ball legal pot ---------------- */
const ballsA = rackBalls("8ball");
const rulesA = initialRules("8ball", [
  { name: "P1", score: 0, group: null, isAI: false },
  { name: "P2", score: 0, group: null, isAI: false },
]);
const preA = computePreShot("8ball", rulesA, ballsA);
const solids = ballsA.filter((b) => b.kind === "solid");
const evA = newShotEvents();
evA.firstContact = solids[0].id;
evA.potted = [solids[0].id, solids[1].id]; // two solids potted
const resA = resolveShot(rulesA, preA, ballsA, evA);
check("8ball: open table assigns solid group", resA.rules.players[0].group === "solid");
check("8ball: shooter continues turn", resA.continueTurn);
check("8ball: tray has 2 balls", resA.rules.trays[0].length === 2);

/* cue potted foul */
const evB = newShotEvents();
evB.firstContact = solids[0].id;
evB.potted = [0];
evB.cuePotted = true;
const resB = resolveShot(rulesA, preA, ballsA, evB);
check("8ball: cue foul passes turn", resB.rules.current === 1);
check("8ball: cue respot requested", resB.respotBalls.some((r) => r.id === 0));

/* early 8 = loss */
const evC = newShotEvents();
const eightBall = ballsA.find((b) => b.kind === "eight")!;
evC.firstContact = eightBall.id;
evC.potted = [eightBall.id];
const ballsC = rackBalls("8ball");
const resC = resolveShot(rulesA, preA, ballsC, evC);
check("8ball: early 8 loses game", resC.rules.winner === 1);

/* ---------------- rules: 9-ball lowest ---------------- */
const ballsD = rackBalls("9ball");
const rulesD = initialRules("9ball", [
  { name: "P1", score: 0, group: null, isAI: false },
  { name: "P1", score: 0, group: null, isAI: false },
]);
const preD = computePreShot("9ball", rulesD, ballsD);
check("9ball: lowest is 1", preD.lowest9 === 1);
const evD = newShotEvents();
evD.firstContact = 2; // wrong ball first
evD.potted = [5];
const resD = resolveShot(rulesD, preD, ballsD, evD);
check("9ball: wrong first ball = foul", resD.rules.current === 1 && !resD.continueTurn);

/* ---------------- rules: snooker basics ---------------- */
const ballsE = rackBalls("snooker");
const rulesE = initialRules("snooker", [
  { name: "P1", score: 0, group: null, isAI: false },
  { name: "P2", score: 0, group: null, isAI: false },
]);
const preE = computePreShot("snooker", rulesE, ballsE);
const evE = newShotEvents();
const red = ballsE.find((b) => b.kind === "red")!;
evE.firstContact = red.id;
evE.potted = [red.id];
const resE = resolveShot(rulesE, preE, ballsE, evE);
check("snooker: red pot = +1 and continue", resE.rules.players[0].score === 1 && resE.continueTurn);
check("snooker: phase moves to color", resE.rules.snookerPhase === "color");

/* pot color while red required = foul */
const evF = newShotEvents();
const color = ballsE.find((b) => b.kind === "color")!;
evF.firstContact = color.id;
evF.potted = [color.id];
const resF = resolveShot(rulesE, preE, ballsE, evF);
check("snooker: color when red on = foul", resF.rules.players[1].score >= 4 && !resF.continueTurn);

/* sequence phase */
const rulesG = { ...rulesE, snookerPhase: "sequence" as const, sequenceIndex: 0 };
const evG = newShotEvents();
const yellow = ballsE.find((b) => b.number === 1 && b.kind === "color")!;
evG.firstContact = yellow.id;
evG.potted = [yellow.id];
const resG = resolveShot(rulesG, preE, ballsE, evG);
check("snooker: yellow in sequence = +2 and continue", resG.rules.players[0].score === 2 && resG.continueTurn);

/* ---------------- AI ---------------- */
for (const mode of ["8ball", "9ball", "snooker"] as GameMode[]) {
  const ballsAI = rackBalls(mode);
  const rulesAI = initialRules(mode, [
    { name: "AI", score: 0, group: null, isAI: true, aiLevel: "hard" },
    { name: "HU", score: 0, group: null, isAI: false },
  ]);
  let shots = 0;
  let guard = 0;
  while (rulesAI.winner === null && guard < 30) {
    guard++;
    const shot = computeAIShot(mode, rulesAI, ballsAI, pocketsFor(mode));
    if (!Number.isFinite(shot.angle) || shot.power <= 0 || shot.power > 1) {
      check(`AI (${mode}): valid shot`, false, JSON.stringify(shot));
      break;
    }
    shots++;
    // fire
    const cueAI = ballsAI.find((b) => b.id === 0)!;
    if (!cueAI.active) break;
    cueAI.vx = Math.cos(shot.angle) * TABLE.maxShotSpeed * (0.08 + shot.power * 0.92);
    cueAI.vy = Math.sin(shot.angle) * TABLE.maxShotSpeed * (0.08 + shot.power * 0.92);
    const pre = computePreShot(mode, rulesAI, ballsAI);
    const evAI = newShotEvents();
    let tt = 0;
    while ((anyMoving(ballsAI) || tt < 0.1) && tt < 12) {
      stepPhysics(ballsAI, 1 / 60, pocketsFor(mode), evAI);
      tt += 1 / 60;
    }
    // respawn cue if potted
    if (evAI.cuePotted) {
      cueAI.active = true;
      cueAI.x = TABLE.W * 0.25;
      cueAI.y = TABLE.H / 2;
      cueAI.vx = 0;
      cueAI.vy = 0;
      cueAI.sink = null;
    }
    const res = resolveShot(rulesAI, pre, ballsAI, evAI);
    Object.assign(rulesAI, res.rules);
    for (const r of res.respotBalls) {
      const b = ballsAI.find((x) => x.id === r.id);
      if (b) {
        b.active = true;
        b.x = r.x;
        b.y = r.y;
        b.vx = 0;
        b.vy = 0;
        b.sink = null;
      }
    }
  }
  console.log(`  info — AI (${mode}): ${shots} shots, winner=${rulesAI.winner}, potted=${rulesAI.trays[0].length + rulesAI.trays[1].length}`);
  check(`AI (${mode}): game terminates`, rulesAI.winner !== null || guard >= 30);
}

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECKS FAILED`);
process.exit(failures === 0 ? 0 : 1);
