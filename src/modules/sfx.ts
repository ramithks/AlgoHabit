// Lightweight WebAudio-based SFX manager (no external assets)
// Usage: sfx.play('click' | 'save' | 'start' | 'end' | 'complete' | 'levelUp' | 'open' | 'close' | 'schedule' | 'cancel')

type SfxName =
  | "click"
  | "save"
  | "start"
  | "end"
  | "complete"
  | "levelUp"
  | "open"
  | "close"
  | "schedule"
  | "cancel";

let enabled = false;
try {
  enabled = localStorage.getItem("dsa-pref-sfx") === "1";
} catch {}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!enabled) return null;
  try {
    // Safari prefix safe
    // @ts-ignore
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    return ctx;
  } catch {
    return null;
  }
}

function beep(options: {
  freq: number;
  duration: number; // ms
  type?: OscillatorType;
  volume?: number; // 0..1
  attack?: number; // ms
  decay?: number; // ms
}) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = options.type ?? "sine";
  osc.frequency.value = options.freq;
  const vol = Math.min(1, Math.max(0, options.volume ?? 0.04));
  const atk = (options.attack ?? 4) / 1000;
  const dcy = (options.decay ?? 40) / 1000;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(vol, now + atk);
  const end = now + options.duration / 1000;
  gain.gain.linearRampToValueAtTime(0.0001, end + dcy);
  osc.connect(gain).connect(c.destination);
  osc.start(now);
  osc.stop(end + dcy + 0.02);
}

function chord(
  freqs: number[],
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.03
) {
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime;
  const end = now + duration / 1000;
  freqs.forEach((f, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.value = f;
    const v = volume * (1 - i * 0.15);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(v, now + 0.006);
    g.gain.linearRampToValueAtTime(0.0001, end + 0.04);
    osc.connect(g).connect(c.destination);
    osc.start(now);
    osc.stop(end + 0.05);
  });
}

export const sfx = {
  isEnabled(): boolean {
    return enabled;
  },
  setEnabled(v: boolean) {
    enabled = v;
    try {
      localStorage.setItem("dsa-pref-sfx", v ? "1" : "0");
    } catch {}
    if (v) getCtx(); // warm
  },
  play(name: SfxName) {
    if (!enabled) return;
    switch (name) {
      case "click":
        beep({ freq: 320, duration: 60, type: "triangle", volume: 0.03 });
        break;
      case "save":
        // up minor third
        beep({ freq: 660, duration: 60, type: "sine", volume: 0.03 });
        setTimeout(
          () => beep({ freq: 784, duration: 70, type: "sine", volume: 0.028 }),
          60
        );
        break;
      case "start":
        chord([420, 520, 660], 140, "sine", 0.025);
        break;
      case "end":
        // downward tone
        beep({ freq: 520, duration: 90, type: "sine", volume: 0.03 });
        setTimeout(
          () => beep({ freq: 390, duration: 120, type: "sine", volume: 0.028 }),
          90
        );
        break;
      case "complete":
        chord([660, 880], 120, "triangle", 0.03);
        break;
      case "levelUp":
        chord([523.25, 659.25, 783.99], 180, "sine", 0.03); // C5 E5 G5
        break;
      case "open":
        beep({ freq: 760, duration: 50, type: "sine", volume: 0.025 });
        break;
      case "close":
        beep({ freq: 300, duration: 60, type: "sine", volume: 0.02 });
        break;
      case "schedule":
        beep({ freq: 480, duration: 70, type: "triangle", volume: 0.025 });
        break;
      case "cancel":
        beep({ freq: 260, duration: 80, type: "square", volume: 0.02 });
        break;
    }
  },
};
