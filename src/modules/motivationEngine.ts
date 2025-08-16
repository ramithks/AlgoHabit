import { TopicProgress } from "./plan";
import { format } from "date-fns";
import { levelInfo } from "./state"; // leverage non-linear level curve

export interface MotivationContext {
  streak: number;
  topics: TopicProgress[];
  level: number;
  xp: number;
}

const ADVICES = [
  "Open a recently touched topic and write a one-line summary—memory anchors improve recall.",
  "Pick a pattern (Sliding Window / Two Pointers) and list 3 problems before coding; primes your brain.",
  "If you feel slow: outline brute force verbally, THEN optimize. Momentum matters.",
  "End today by scheduling tomorrow’s block. Pre-commitment doubles follow-through.",
];

export function contextualMotivation(ctx: MotivationContext) {
  const now = new Date();
  const hour = now.getHours();
  const part = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const pending = ctx.topics.filter((t) => t.status !== "complete").length;
  const pct = Math.round(
    (ctx.topics.filter((t) => t.status === "complete").length /
      ctx.topics.length) *
      100
  );
  // Deterministic daily tip: stable for a given date
  const daySeed = parseInt(format(now, "yyyyMMdd"), 10);
  const advice = ADVICES[daySeed % ADVICES.length];
  const li = levelInfo(ctx.xp);
  return [
    `Good ${part}. ${pct}% complete. ${pending} topics remain—chip one now.`,
    ctx.streak >= 3
      ? `Streak ${ctx.streak} 🔥 Keep it alive.`
      : "Build a 3-day streak: today is Day 1.",
    ctx.level > 1
      ? `Level ${li.level}: ${li.xpInto}/${li.xpForLevel} XP (${li.pct}%).`
      : "Earn XP: move one topic to In Progress.",
    advice,
    `Snapshot @ ${format(
      now,
      "HH:mm"
    )} — a 25m focus sprint beats waiting for the 'perfect' time.`,
  ];
}
