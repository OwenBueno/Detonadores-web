const STORAGE_KEY = "detonadores-sfx-muted";

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    ctx = new AudioContext();
  } catch {
    return null;
  }
  return ctx;
}

export function isSfxMuted(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setSfxMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
}

/** Call from a click/key handler so AudioContext can start (autoplay policy). */
export function primeSfxContext(): void {
  const c = getCtx();
  if (c?.state === "suspended") void c.resume();
}

function playTone(freq: number, duration: number, type: OscillatorType, gain: number, freqEnd?: number) {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (freqEnd != null && freqEnd !== freq) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + duration);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g);
  g.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

function playNoise(duration: number, gain: number) {
  if (isSfxMuted()) return;
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const bufferSize = Math.ceil(c.sampleRate * duration);
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  src.connect(g);
  g.connect(c.destination);
  src.start(t0);
  src.stop(t0 + duration + 0.02);
}

export type MatchSfxKind = "bomb_place" | "explosion" | "pickup" | "death" | "match_end";

export function playMatchSfx(kind: MatchSfxKind): void {
  const c = getCtx();
  if (!c || isSfxMuted()) return;
  if (c.state === "suspended") return;

  switch (kind) {
    case "bomb_place":
      playTone(90, 0.08, "sine", 0.12, 55);
      break;
    case "explosion":
      playNoise(0.1, 0.08);
      playTone(120, 0.12, "square", 0.04, 40);
      break;
    case "pickup":
      playTone(660, 0.05, "sine", 0.07, 880);
      break;
    case "death":
      playTone(220, 0.18, "triangle", 0.09, 80);
      break;
    case "match_end":
      playTone(440, 0.12, "sine", 0.06);
      window.setTimeout(() => {
        if (!isSfxMuted() && getCtx()?.state === "running") playTone(330, 0.2, "sine", 0.07);
      }, 140);
      break;
    default:
      break;
  }
}
