import React from "react";

const achievementMeta: Record<
  string,
  { label: string; desc: string; icon: string }
> = {
  "first-complete": {
    label: "First Steps",
    desc: "Completed your first topic.",
    icon: "🌱",
  },
  "five-complete": {
    label: "Momentum 5",
    desc: "Five topics complete.",
    icon: "🚀",
  },
  "ten-complete": {
    label: "Double Digits",
    desc: "Ten topics complete.",
    icon: "💎",
  },
  "week1-master": {
    label: "Week 1 Master",
    desc: "All Week 1 topics done.",
    icon: "🏅",
  },
  "all-cleared": {
    label: "Full Journey",
    desc: "All topics across 8 weeks complete.",
    icon: "🏆",
  },
  "streak-7": { label: "Week Flame", desc: "7-day streak.", icon: "🔥" },
  "streak-30": { label: "Marathon", desc: "30-day streak.", icon: "👑" },
};

export const AchievementsPanel: React.FC<{ ids: string[] }> = ({ ids }) => {
  if (!ids.length) return null;
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 ring-1 ring-gray-800 border border-gray-800/50 space-y-3">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        Achievements{" "}
        <span className="text-[10px] text-accent/70">Gamified Progress</span>
      </h2>
      <ul className="grid grid-cols-2 gap-2 text-[11px]">
        {ids.map((id) => {
          const meta = achievementMeta[id];
          if (!meta) return null;
          return (
            <li
              key={id}
              className="flex items-start gap-2 bg-gray-800/40 rounded p-2 border border-gray-800 hover:border-gray-700 transition"
            >
              <span className="text-lg leading-none">{meta.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-gray-200">{meta.label}</div>
                <div className="text-gray-500 text-[10px] leading-tight">
                  {meta.desc}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
