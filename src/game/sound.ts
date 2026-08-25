/* ------------------------------------------------------------------ */
/*  Synthesized sound effects (Web Audio API — no assets needed)       */
/* ------------------------------------------------------------------ */

let audioCtx: AudioContext | null = null;
let enabled = true;

export function setSoundEnabled(v: boolean) {
  enabled = v;
}

export function isSoundEnabled() {
  return enabled;
}

function ctx(): AudioContext | null {
  if (!enabled) return null;
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function noiseBurst(
  a: AudioContext,
  duration: number,
  freq: number,
  q: number,
  gainV: number,
) {
  const len = Math.max(1, Math.floor(a.sampleRate * duration));
  const buffer = a.createBuffer(1, len, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  }
  const src = a.createBufferSource();
  src.buffer = buffer;
  const filter = a.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = a.createGain();
  gain.gain.value = gainV;
  src.connect(filter).connect(gain).connect(a.destination);
  src.start();
}

/** ball-on-ball clack — intensity 0..1 */
export function playClack(intensity: number) {
  const a = ctx();
  if (!a) return;
  const v = Math.min(1, Math.max(0.12, intensity));
  noiseBurst(a, 0.045, 2600 + v * 1800, 1.4, 0.55 * v);
  // tonal body
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "triangle";
  osc.frequency.value = 320 + v * 260;
  gain.gain.setValueAtTime(0.22 * v, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.08);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + 0.09);
}

/** cushion thud */
export function playThud(intensity: number) {
  const a = ctx();
  if (!a) return;
  const v = Math.min(1, Math.max(0.1, intensity));
  noiseBurst(a, 0.07, 420, 0.9, 0.3 * v);
}

/** pocket drop */
export function playPocket() {
  const a = ctx();
  if (!a) return;
  noiseBurst(a, 0.16, 900, 0.7, 0.4);
  const osc = a.createOscillator();
  const gain = a.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, a.currentTime);
  osc.frequency.exponentialRampToValueAtTime(90, a.currentTime + 0.18);
  gain.gain.setValueAtTime(0.3, a.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.2);
  osc.connect(gain).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + 0.22);
}

/** cue strike */
export function playCueHit(power: number) {
  const a = ctx();
  if (!a) return;
  noiseBurst(a, 0.05, 1800, 1.1, 0.28 + power * 0.3);
}
