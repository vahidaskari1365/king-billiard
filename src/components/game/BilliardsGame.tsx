"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Maximize,
  Minimize,
  Play,
  RotateCcw,
  Trophy,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import {
  Ball,
  GameMode,
  PlayerState,
  TABLE,
  pocketsFor,
  rackBalls,
} from "@/game/types";
import {
  AimPreview,
  ShotEvents,
  anyMoving,
  castAim,
  newShotEvents,
  stepPhysics,
} from "@/game/physics";
import {
  PreShotInfo,
  RulesState,
  computePreShot,
  initialRules,
  resolveShot,
} from "@/game/rules";
import { computeAIShot } from "@/game/ai";
import { computeLayout, drawGame } from "@/game/render";
import * as sound from "@/game/sound";

/* ---------------------------------------------------------------- */

type OpponentKind = "ai" | "local" | "invite";
type AILevel = "easy" | "medium" | "hard";

interface GameConfig {
  mode: GameMode;
  opponent: OpponentKind;
  aiLevel: AILevel;
  p1: string;
  p2: string;
}

const MODES: {
  id: GameMode;
  name: string;
  desc: string;
  img: string;
}[] = [
  {
    id: "8ball",
    name: "۸ توپ",
    desc: "محبوب‌ترین حالت بیلیارد — توپ‌های رنگی در برابر خط‌دار",
    img: "/images/mode-8ball.jpg",
  },
  {
    id: "9ball",
    name: "۹ توپ",
    desc: "سریع و هیجانی — همیشه باید کم‌ترین شماره زده شود",
    img: "/images/mode-9ball.jpg",
  },
  {
    id: "snooker",
    name: "اسنوکر",
    desc: "بازی حرفه‌ای با استراتژی و امتیازشماری دقیق",
    img: "/images/mode-snooker.jpg",
  },
];

const POOL_COLORS: Record<number, string> = {
  1: "#fdd835", 2: "#1e88e5", 3: "#e53935", 4: "#8e24aa", 5: "#fb8c00",
  6: "#43a047", 7: "#8d3b2e", 8: "#15171f",
};
const SNOOKER_COLORS: Record<number, string> = {
  0: "#d32f2f", 1: "#fdd835", 2: "#2e7d32", 3: "#6d4c41",
  4: "#1e88e5", 5: "#f06292", 6: "#15171f",
};

/* ================================================================= */
/*  Root                                                              */
/* ================================================================= */

export default function BilliardsGame() {
  const [screen, setScreen] = useState<"menu" | "invite" | "game">("menu");
  const [config, setConfig] = useState<GameConfig>({
    mode: "8ball",
    opponent: "ai",
    aiLevel: "medium",
    p1: "بازیکن ۱",
    p2: "شما",
  });
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteAccepted, setInviteAccepted] = useState(false);
  const [friendId, setFriendId] = useState("");

  const startGame = (cfg: GameConfig) => {
    setConfig(cfg);
    setScreen("game");
  };

  const startInvite = (cfg: GameConfig, id: string) => {
    setConfig(cfg);
    setFriendId(id);
    const code = Array.from({ length: 6 }, () =>
      "ABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 31)),
    ).join("");
    setInviteCode(code);
    setInviteAccepted(false);
    setScreen("invite");
    // simulate opponent accepting the invitation
    window.setTimeout(() => setInviteAccepted(true), 2600);
    window.setTimeout(() => setScreen("game"), 3800);
  };

  return (
    <div className="h-dvh w-full bg-bg text-ink overflow-hidden">
      {screen === "menu" && (
        <MenuScreen config={config} setConfig={setConfig} onStart={startGame} onInvite={startInvite} />
      )}
      {screen === "invite" && (
        <InviteScreen code={inviteCode} friendId={friendId} accepted={inviteAccepted} />
      )}
      {screen === "game" && (
        <GameScreen
          config={config}
          onExit={() => setScreen("menu")}
        />
      )}
    </div>
  );
}

/* ================================================================= */
/*  Menu                                                              */
/* ================================================================= */

function MenuScreen({
  config,
  setConfig,
  onStart,
  onInvite,
}: {
  config: GameConfig;
  setConfig: (c: GameConfig) => void;
  onStart: (c: GameConfig) => void;
  onInvite: (c: GameConfig, friendId: string) => void;
}) {
  const [p1, setP1] = useState(config.p1);
  const [p2, setP2] = useState(config.p2);
  const [friendId, setFriendId] = useState("");

  const levelLabel: Record<AILevel, string> = {
    easy: "آسان",
    medium: "متوسط",
    hard: "سخت",
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar">
      <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <ArrowRight className="size-4" />
            بازگشت به سایت
          </Link>
          <div className="font-latin text-xs tracking-widest text-muted">
            CUEVERSE ARENA
          </div>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl sm:text-4xl mb-2"
        >
          انتخاب <span className="text-gradient-green">بازی</span>
        </motion.h1>
        <p className="text-muted text-sm mb-8">
          حالت بازی و حریف خود را انتخاب کنید
        </p>

        {/* mode selection */}
        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {MODES.map((m, i) => (
            <motion.button
              key={m.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setConfig({ ...config, mode: m.id })}
              className={`card-3d group relative overflow-hidden rounded-2xl text-right cursor-pointer border ${
                config.mode === m.id
                  ? "border-primary shadow-glow"
                  : "border-line"
              }`}
            >
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={m.img}
                  alt={m.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
                {config.mode === m.id && (
                  <div className="absolute top-3 left-3 rounded-full bg-primary text-[#06220f] p-1.5">
                    <Check className="size-4" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="font-display text-lg mb-1">{m.name}</div>
                <div className="text-xs text-muted leading-5">{m.desc}</div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* opponent selection */}
        <h2 className="font-display text-xl mb-4">حریف</h2>
        <div className="grid gap-4 sm:grid-cols-3 mb-8">
          <button
            onClick={() => setConfig({ ...config, opponent: "ai" })}
            className={`rounded-2xl border p-5 text-right transition-all cursor-pointer ${
              config.opponent === "ai"
                ? "border-primary bg-primary/10"
                : "border-line bg-surface hover:border-muted"
            }`}
          >
            <Bot className="size-8 mb-3 text-primary" />
            <div className="font-bold mb-1">هوش مصنوعی</div>
            <div className="text-xs text-muted">مقابل کامپیوتر بازی کنید</div>
            {config.opponent === "ai" && (
              <div className="mt-4 flex gap-2">
                {(["easy", "medium", "hard"] as AILevel[]).map((l) => (
                  <span
                    key={l}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfig({ ...config, aiLevel: l });
                    }}
                    className={`rounded-full px-3 py-1 text-xs cursor-pointer transition-colors ${
                      config.aiLevel === l
                        ? "bg-primary text-[#06220f] font-bold"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {levelLabel[l]}
                  </span>
                ))}
              </div>
            )}
          </button>

          <button
            onClick={() => setConfig({ ...config, opponent: "local" })}
            className={`rounded-2xl border p-5 text-right transition-all cursor-pointer ${
              config.opponent === "local"
                ? "border-primary bg-primary/10"
                : "border-line bg-surface hover:border-muted"
            }`}
          >
            <Users className="size-8 mb-3 text-primary" />
            <div className="font-bold mb-1">دو نفره (یک دستگاه)</div>
            <div className="text-xs text-muted">پاس‌دادن گوشی بین دو نفر</div>
          </button>

          <button
            onClick={() => setConfig({ ...config, opponent: "invite" })}
            className={`rounded-2xl border p-5 text-right transition-all cursor-pointer ${
              config.opponent === "invite"
                ? "border-primary bg-primary/10"
                : "border-line bg-surface hover:border-muted"
            }`}
          >
            <UserPlus className="size-8 mb-3 text-accent" />
            <div className="font-bold mb-1">دعوت دوست</div>
            <div className="text-xs text-muted">
              با شناسه بازیکن دوستتان را دعوت کنید
            </div>
          </button>
        </div>

        {/* names */}
        <AnimatePresence mode="wait">
          {config.opponent === "local" && (
            <motion.div
              key="local"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="grid gap-4 sm:grid-cols-2 mb-8">
                <label className="block">
                  <span className="text-sm text-muted mb-2 block">نام بازیکن ۱</span>
                  <input
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                    className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-sm text-muted mb-2 block">نام بازیکن ۲</span>
                  <input
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                    className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </label>
              </div>
            </motion.div>
          )}
          {config.opponent === "invite" && (
            <motion.div
              key="invite"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl border border-line bg-surface p-5 mb-8 max-w-lg">
                <label className="block">
                  <span className="text-sm text-muted mb-2 block">
                    شناسه بازیکن (ID) حریف را وارد کنید
                  </span>
                  <input
                    value={friendId}
                    onChange={(e) => setFriendId(e.target.value)}
                    placeholder="مثلاً: CU-8241"
                    dir="ltr"
                    className="w-full rounded-xl bg-surface-2 border border-line px-4 py-3 font-latin focus:border-primary focus:outline-none text-left"
                  />
                </label>
                <p className="text-xs text-muted mt-3 leading-5">
                  بعد از ثبت شناسه، دعوت‌نامه برای حریف ارسال می‌شود و با
                  پذیرش او بازی آغاز خواهد شد.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-wrap items-center gap-4">
          {config.opponent === "invite" ? (
            <button
              onClick={() => {
                const id = friendId.trim() || "CU-" + Math.floor(1000 + Math.random() * 9000);
                onInvite(
                  { ...config, p1: p1 || "بازیکن ۱", p2: id },
                  id,
                );
              }}
              className="btn-gold"
            >
              <UserPlus className="size-5" />
              ارسال دعوت‌نامه
            </button>
          ) : (
            <button
              onClick={() =>
                onStart({
                  ...config,
                  p1: p1 || "بازیکن ۱",
                  p2:
                    config.opponent === "ai"
                      ? "هوش مصنوعی"
                      : p2 || "بازیکن ۲",
                })
              }
              className="btn-primary"
            >
              <Play className="size-5" />
              شروع بازی
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================= */
/*  Invite screen                                                     */
/* ================================================================= */

function InviteScreen({
  code,
  friendId,
  accepted,
}: {
  code: string | null;
  friendId: string;
  accepted: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="h-full flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-strong rounded-3xl p-8 sm:p-12 text-center max-w-md w-full"
      >
        <div className="relative mx-auto mb-8 size-24">
          <motion.div
            animate={{ scale: accepted ? 1 : [1, 1.5, 1], opacity: accepted ? 0.4 : [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: accepted ? 0 : Infinity }}
            className="absolute inset-0 rounded-full bg-primary/40"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            {accepted ? (
              <Check className="size-12 text-primary" />
            ) : (
              <Loader2 className="size-12 text-primary animate-spin" />
            )}
          </div>
        </div>

        <h2 className="font-display text-2xl mb-2">
          {accepted ? "دعوت پذیرفته شد!" : "در انتظار حریف…"}
        </h2>
        <p className="text-muted text-sm mb-8 leading-6">
          {accepted
            ? `${friendId} دعوت شما را قبول کرد. بازی شروع می‌شود…`
            : `دعوت‌نامه برای بازیکن ${friendId} ارسال شد`}
        </p>

        <div className="rounded-2xl bg-surface-2 border border-line p-4 mb-6">
          <div className="text-xs text-muted mb-2">کد دعوت</div>
          <div className="flex items-center justify-center gap-3">
            <span className="font-latin text-3xl tracking-[0.35em] text-gradient-gold">
              {code}
            </span>
            <button
              onClick={() => {
                if (code) {
                  void navigator.clipboard?.writeText(code);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 1500);
                }
              }}
              className="rounded-lg p-2 bg-white/5 hover:bg-white/15 transition-colors cursor-pointer"
              aria-label="کپی کد دعوت"
            >
              {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================================================================= */
/*  Game screen                                                       */
/* ================================================================= */

function GameScreen({
  config,
  onExit,
}: {
  config: GameConfig;
  onExit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Initialize balls once per mount with the correct mode
  const ballsRef = useRef<Ball[]>(rackBalls(config.mode));

  const pockets = useMemo(() => pocketsFor(config.mode), [config.mode]);

  const [rules, setRules] = useState<RulesState>(() => {
    const players: [PlayerState, PlayerState] = [
      { name: config.p1, score: 0, group: null, isAI: false },
      {
        name: config.p2,
        score: 0,
        group: null,
        isAI: config.opponent === "ai",
        aiLevel: config.aiLevel,
      },
    ];
    return initialRules(config.mode, players);
  });
  const rulesRef = useRef(rules);
  useEffect(() => {
    rulesRef.current = rules;
  }, [rules]);

  const [phase, setPhase] = useState<"aim" | "rolling">("aim");
  const phaseRef = useRef<"aim" | "rolling">("aim");
  const [aimAngle, setAimAngle] = useState(0);
  const aimRef = useRef(0);
  const [power, setPower] = useState(0);
  const powerRef = useRef(0);
  const [message, setMessage] = useState<string>("");
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [spinX, setSpinX] = useState(0); // -1 to 1 (left/right)
  const [spinY, setSpinY] = useState(0); // -1 to 1 (top/bottom)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const eventsRef = useRef<ShotEvents>(newShotEvents());
  const preShotRef = useRef<PreShotInfo | null>(null);
  const lastPotCountRef = useRef(0);
  const lastSoundRef = useRef(0);
  const aimPreviewRef = useRef<AimPreview | null>(null);
  const humanTurnRef = useRef(true);
  const spinXRef = useRef(0);
  const spinYRef = useRef(0);
  useEffect(() => { spinXRef.current = spinX; }, [spinX]);
  useEffect(() => { spinYRef.current = spinY; }, [spinY]);

  const modeName =
    config.mode === "8ball" ? "۸ توپ" : config.mode === "9ball" ? "۹ توپ" : "اسنوکر";

  /* ------------------------- shot lifecycle ------------------------ */

  const fireShot = useCallback(
    (angle: number, pow: number, spin?: { x: number; y: number }) => {
      const balls = ballsRef.current;
      if (!balls) return;
      const cue = balls.find((b) => b.id === 0);
      if (!cue || !cue.active) return;
      const speed = TABLE.maxShotSpeed * (0.08 + pow * 0.92);
      cue.vx = Math.cos(angle) * speed;
      cue.vy = Math.sin(angle) * speed;
      
      // Apply spin effect - add slight curve to the ball
      if (spin && (spin.x !== 0 || spin.y !== 0)) {
        const spinForce = 12; // strength of spin effect
        const perpX = -Math.sin(angle);
        const perpY = Math.cos(angle);
        cue.vx += perpX * spin.x * spinForce;
        cue.vy += perpY * spin.x * spinForce;
        // Top/back spin affects speed
        const speedMod = 1 + spin.y * 0.15;
        cue.vx *= speedMod;
        cue.vy *= speedMod;
      }
      
      preShotRef.current = computePreShot(
        config.mode,
        rulesRef.current,
        balls,
      );
      eventsRef.current = newShotEvents();
      lastPotCountRef.current = 0;
      phaseRef.current = "rolling";
      setPhase("rolling");
      sound.playCueHit(pow);
    },
    [config.mode],
  );

  /* --------------------------- main loop --------------------------- */

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let cssW = 0;
    let cssH = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.max(1, Math.round(cssW * dpr));
      canvas.height = Math.max(1, Math.round(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const loop = (now: number) => {
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;
      const balls = ballsRef.current!;
      const r = rulesRef.current;

      const humanTurn = r.winner === null && !r.players[r.current].isAI;
      humanTurnRef.current = humanTurn;

      if (phaseRef.current === "rolling") {
        const ev = eventsRef.current;
        stepPhysics(balls, dt, pockets, ev);
        const hitBall = ev.hitBall;
        const hitCushion = ev.hitCushion;
        ev.hitBall = false;
        ev.hitCushion = false;

        if (ev.potted.length > lastPotCountRef.current) {
          sound.playPocket();
          lastPotCountRef.current = ev.potted.length;
        }
        if (now - lastSoundRef.current > 90 && (hitBall || hitCushion)) {
          if (hitBall) sound.playClack(0.75);
          else sound.playThud(0.5);
          lastSoundRef.current = now;
        }

        if (!anyMoving(balls)) {
          const res = resolveShot(
            r,
            preShotRef.current ?? computePreShot(config.mode, r, balls),
            balls,
            ev,
          );
          for (const spot of res.respotBalls) {
            const b = balls.find((x) => x.id === spot.id);
            if (b) {
              b.active = true;
              b.x = spot.x;
              b.y = spot.y;
              b.vx = 0;
              b.vy = 0;
              b.sink = null;
              b.trail = [];
            }
          }
          rulesRef.current = res.rules;
          setRules(res.rules);
          phaseRef.current = "aim";
          setPhase("aim");
          if (res.gameOver) {
            setShowWinner(true);
          } else if (res.messages.length > 0) {
            setMessage(res.messages.join(" • "));
          }
        }
      }

      // aim preview for humans
      if (phaseRef.current === "aim" && humanTurn) {
        const cue = balls.find((b) => b.id === 0);
        if (cue && cue.active) {
          aimPreviewRef.current = castAim(
            balls,
            Math.cos(aimRef.current),
            Math.sin(aimRef.current),
          );
        }
      } else {
        aimPreviewRef.current = null;
      }

      drawGame(ctx, cssW, cssH, {
        balls,
        mode: config.mode,
        pockets,
        aimAngle: aimRef.current,
        power: powerRef.current,
        showAim: phaseRef.current === "aim" && humanTurn,
        rolling: phaseRef.current === "rolling",
        aimPreview: aimPreviewRef.current,
        spin: { x: spinXRef.current, y: spinYRef.current },
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [config.mode, pockets]);

  /* ----------------------------- AI turn --------------------------- */

  useEffect(() => {
    if (phase !== "aim" || rules.winner !== null) return;
    const p = rules.players[rules.current];
    if (!p.isAI) return;
    const t = window.setTimeout(
      () => {
        const balls = ballsRef.current;
        if (!balls) return;
        const shot = computeAIShot(config.mode, rulesRef.current, balls, pockets);
        fireShot(shot.angle, shot.power);
      },
      900 + Math.random() * 700,
    );
    return () => window.clearTimeout(t);
  }, [phase, rules, config.mode, pockets, fireShot]);

  /* ---------------------------- input ------------------------------ */

  const updateAimFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (phaseRef.current !== "aim") return;
      if (isDragging) return; // Don't update aim while dragging for power
      const r = rulesRef.current;
      if (r.winner !== null || r.players[r.current].isAI) return;
      const canvas = canvasRef.current;
      const balls = ballsRef.current;
      if (!canvas || !balls) return;
      const rect = canvas.getBoundingClientRect();
      const { scale, offX, offY } = computeLayout(rect.width, rect.height);
      const wx = (clientX - rect.left - offX) / scale;
      const wy = (clientY - rect.top - offY) / scale;
      const cue = balls.find((b) => b.id === 0);
      if (!cue) return;
      const ang = Math.atan2(wy - cue.y, wx - cue.x);
      aimRef.current = ang;
      setAimAngle(ang);
    },
    [isDragging],
  );

  /* ------------------------- drag to shoot ------------------------ */
  
  const handlePointerDown = useCallback(
    (clientX: number, clientY: number) => {
      if (phaseRef.current !== "aim") return;
      const r = rulesRef.current;
      if (r.winner !== null || r.players[r.current].isAI) return;
      
      setIsDragging(true);
      dragStartRef.current = { x: clientX, y: clientY };
      updateAimFromPointer(clientX, clientY);
    },
    [updateAimFromPointer],
  );

  const handlePointerMove = useCallback(
    (clientX: number, clientY: number) => {
      if (!isDragging) {
        updateAimFromPointer(clientX, clientY);
        return;
      }
      
      // Calculate drag distance for power
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;
      const dragDist = Math.sqrt(dx * dx + dy * dy);
      const maxDrag = 200; // pixels
      const newPower = Math.min(1, dragDist / maxDrag);
      
      setPower(newPower);
      powerRef.current = newPower;
    },
    [isDragging, updateAimFromPointer],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    
    const r = rulesRef.current;
    if (!r || r.winner !== null || phaseRef.current !== "aim") {
      setIsDragging(false);
      setPower(0);
      powerRef.current = 0;
      return;
    }
    if (r.players[r.current].isAI) {
      setIsDragging(false);
      setPower(0);
      powerRef.current = 0;
      return;
    }
    
    // Fire the shot if we have enough power
    if (powerRef.current > 0.05) {
      fireShot(aimRef.current, powerRef.current, { x: spinXRef.current, y: spinYRef.current });
    }
    
    setIsDragging(false);
    setPower(0);
    powerRef.current = 0;
  }, [isDragging, fireShot]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const r = rulesRef.current;
      if (!r || r.winner !== null || phaseRef.current !== "aim") return;
      if (r.players[r.current].isAI) return;
      const fine = e.shiftKey ? 0.25 : 1;
      if (e.key === "ArrowRight") {
        aimRef.current += 0.02 * fine;
        setAimAngle(aimRef.current);
      } else if (e.key === "ArrowLeft") {
        aimRef.current -= 0.02 * fine;
        setAimAngle(aimRef.current);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        fireShot(aimRef.current, powerRef.current);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fireShot]);

  const fire = useCallback(() => {
    const r = rulesRef.current;
    if (!r || r.winner !== null || phaseRef.current !== "aim") return;
    if (r.players[r.current].isAI) return;
    if (powerRef.current < 0.05) return;
    fireShot(aimRef.current, powerRef.current, { x: spinX, y: spinY });
  }, [fireShot, spinX, spinY]);

  /* --------------------------- fullscreen -------------------------- */

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      const anyEl = el as HTMLDivElement & {
        webkitRequestFullscreen?: () => Promise<void>;
      };
      if (el.requestFullscreen) void el.requestFullscreen().catch(() => {});
      else if (anyEl.webkitRequestFullscreen) anyEl.webkitRequestFullscreen();
    } else {
      void document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);

  /* ----------------------------- misc ------------------------------ */

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(""), 3200);
    return () => window.clearTimeout(t);
  }, [message]);

  const rematch = () => {
    ballsRef.current = rackBalls(config.mode);
    const fresh = initialRules(config.mode, [
      { ...rules.players[0], score: 0, group: null },
      { ...rules.players[1], score: 0, group: null },
    ]);
    rulesRef.current = fresh;
    setRules(fresh);
    phaseRef.current = "aim";
    setPhase("aim");
    setShowWinner(false);
    setMessage("");
    aimRef.current = 0;
    setAimAngle(0);
  };

  const current = rules.players[rules.current];
  const isHumanTurn = current && !current.isAI && rules.winner === null;

  // Show tutorial message on first game
  const [showTutorial, setShowTutorial] = useState(true);
  useEffect(() => {
    if (showTutorial) {
      const t = window.setTimeout(() => setShowTutorial(false), 5000);
      return () => window.clearTimeout(t);
    }
  }, [showTutorial]);

  const trayColors = (i: 0 | 1) =>
    rules.trays[i].map((n) =>
      config.mode === "snooker"
        ? SNOOKER_COLORS[n] ?? "#d32f2f"
        : POOL_COLORS[n > 8 ? n - 8 : n] ?? "#fff",
    );

  return (
    <div ref={containerRef} className="relative h-full w-full flex flex-col bg-bg">
      {/* header */}
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-surface/80 backdrop-blur border-b border-line z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="بازگشت"
          >
            <ChevronRight className="size-5" />
          </button>
          <span className="font-display text-sm sm:text-base">{modeName}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              const v = !soundOn;
              setSoundOn(v);
              sound.setSoundEnabled(v);
            }}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label={soundOn ? "قطع صدا" : "پخش صدا"}
          >
            {soundOn ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
          </button>
          <button
            onClick={toggleFullscreen}
            className="rounded-lg p-2 hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="تمام صفحه"
          >
            {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
          </button>
        </div>
      </div>

      {/* players bar */}
      <div className="grid grid-cols-2 gap-2 px-3 py-2 z-10">
        {([0, 1] as const).map((i) => {
          const p = rules.players[i];
          const active = rules.current === i && rules.winner === null;
          return (
            <div
              key={i}
              className={`rounded-xl px-3 py-2 border transition-all ${
                active
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-line bg-surface/70"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm truncate">
                  {p.isAI ? <Bot className="inline size-4 ml-1 -mt-1" /> : null}
                  {p.name}
                </span>
                {config.mode === "snooker" ? (
                  <span className="font-latin text-lg font-bold text-accent">
                    {p.score}
                  </span>
                ) : (
                  <span className="font-latin text-sm text-muted">
                    {rules.trays[i].length} توپ
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-1 min-h-4">
                {config.mode === "8ball" && (
                  <span className="text-[10px] text-muted">
                    {p.group
                      ? p.group === "solid"
                        ? "رنگی ۱-۷"
                        : "خط‌دار ۹-۱۵"
                      : rules.openTable
                        ? "میز باز"
                        : ""}
                  </span>
                )}
                <div className="flex flex-wrap gap-1 mr-auto">
                  {trayColors(i).map((c, k) => (
                    <span
                      key={k}
                      className="size-3 rounded-full border border-black/40"
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* table canvas */}
      <div className="relative flex-1 min-h-0">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 size-full touch-none cursor-crosshair"
          onPointerMove={(e) => handlePointerMove(e.clientX, e.clientY)}
          onPointerDown={(e) => handlePointerDown(e.clientX, e.clientY)}
          onPointerUp={() => handlePointerUp()}
          onPointerLeave={() => handlePointerUp()}
        />

        {/* message toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              key={message}
              initial={{ opacity: 0, y: 18, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 glass-strong rounded-full px-5 py-2.5 text-sm font-bold whitespace-nowrap"
            >
              {message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI thinking */}
        <AnimatePresence>
          {current.isAI && phase === "aim" && rules.winner === null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-3 left-1/2 -translate-x-1/2 z-20 glass-strong rounded-full px-5 py-2.5 text-sm font-bold flex items-center gap-2"
            >
              <Loader2 className="size-4 animate-spin text-primary" />
              {current.name} در حال فکر کردن…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tutorial overlay */}
        <AnimatePresence>
          {showTutorial && isHumanTurn && phase === "aim" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 glass-strong rounded-2xl p-6 max-w-sm mx-4 text-center pointer-events-none"
            >
              <div className="text-primary font-display text-lg mb-2">نحوه بازی</div>
              <div className="text-sm text-muted leading-7 space-y-2">
                <p>🎯 <strong>نشانه‌گیری:</strong> موس را روی میز حرکت دهید</p>
                <p>🏹 <strong>شلیک:</strong> کلیک کنید و عقب بکشید، سپس ول کنید</p>
                <p>🔄 <strong>اسپین:</strong> روی توپ سفید کوچک پایین کلیک کنید</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* winner overlay */}
        <AnimatePresence>
          {showWinner && rules.winner !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.85, y: 24 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-strong rounded-3xl p-8 text-center max-w-sm mx-4"
              >
                <Trophy className="size-16 mx-auto text-accent mb-4" />
                <h3 className="font-display text-2xl mb-2">
                  {rules.players[rules.winner].name} برنده شد!
                </h3>
                <p className="text-muted text-sm mb-6">{rules.winReason}</p>
                {config.mode === "snooker" && (
                  <div className="flex justify-center gap-6 mb-6 font-latin">
                    <div>
                      <div className="text-xs text-muted">{rules.players[0].name}</div>
                      <div className="text-2xl font-bold text-accent">{rules.players[0].score}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted">{rules.players[1].name}</div>
                      <div className="text-2xl font-bold text-accent">{rules.players[1].score}</div>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 justify-center">
                  <button onClick={rematch} className="btn-primary !py-2.5 !px-5 text-sm">
                    <RotateCcw className="size-4" />
                    بازی مجدد
                  </button>
                  <button onClick={onExit} className="btn-ghost !py-2.5 !px-5 text-sm">
                    منو
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* controls */}
      <div className="bg-surface/80 backdrop-blur border-t border-line px-4 py-3 z-20">
        <div className="flex items-center gap-4 max-w-3xl mx-auto">
          {/* Spin control */}
          <div className="flex flex-col items-center gap-1.5">
            <span className="text-[10px] text-muted">اسپین</span>
            <div className="relative size-14 rounded-full border-2 border-line bg-surface-2 shadow-inner">
              {/* Cue ball representation */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-gray-100 to-gray-300 shadow-inner" />
              {/* Hit point indicator */}
              <div
                className="absolute size-3 rounded-full bg-red-500 shadow-md border border-white/50 transition-all duration-150 cursor-pointer"
                style={{
                  left: `${50 + spinX * 35}%`,
                  top: `${50 - spinY * 35}%`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              {/* Clickable overlay for setting spin */}
              <div
                className="absolute inset-0 rounded-full cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
                  const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
                  // Clamp to circle
                  const dist = Math.sqrt(x * x + y * y);
                  const clampedX = dist > 1 ? x / dist : x;
                  const clampedY = dist > 1 ? y / dist : y;
                  setSpinX(clampedX);
                  setSpinY(clampedY);
                }}
              />
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => { setSpinX(0); setSpinY(0); }}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/15 text-muted cursor-pointer"
              >
                وسط
              </button>
            </div>
          </div>

          {/* Power indicator */}
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>قدرت ضربه</span>
              <span className="font-latin">{Math.round(power * 100)}%</span>
            </div>
            <div className="h-3 rounded-full bg-surface-2 border border-line overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${power * 100}%`,
                  background: power > 0.7
                    ? "linear-gradient(90deg, #f0b429, #e53935)"
                    : power > 0.4
                    ? "linear-gradient(90deg, #2bd576, #f0b429)"
                    : "linear-gradient(90deg, #2bd576, #2bd576)",
                }}
              />
            </div>
            <p className="text-[10px] text-muted mt-1 text-center">
              کلیک کنید و عقب بکشید تا قدرت تنظیم شود
            </p>
          </div>

          <button
            onClick={fire}
            disabled={!isHumanTurn || phase !== "aim" || power < 0.05}
            className="btn-gold !px-6 !py-3 disabled:opacity-40 disabled:cursor-not-allowed !rounded-2xl"
          >
            <Zap className="size-5" />
            <span className="hidden sm:inline">شلیک</span>
          </button>
        </div>
        <p className="text-center text-[11px] text-muted mt-2">
          نشانه‌گیری: موس روی میز — شلیک: کلیک + عقب کشیدن و ول کردن | اسپین: روی توپ سفید کوچک کلیک کنید
        </p>
      </div>
    </div>
  );
}
