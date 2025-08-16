import React from "react";

export const LevelBadge: React.FC<{
  level: number;
  xpInto: number;
  xpFor: number;
  pct: number;
  totalXP: number;
  pulse?: boolean;
}> = ({ level, xpInto, xpFor, pct, totalXP, pulse }) => {
  return (
    <div
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-gray-900/80 ring-1 ring-gray-800 shadow ${
        pulse ? "animate-pulse-slow" : ""
      }`}
      title={`Level ${level} — ${xpInto}/${xpFor} XP`}
    >
      <span className="text-[10px] text-gray-400">Lv</span>
      <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
        {level}
      </span>
      <div className="w-20 h-1.5 rounded bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[10px] text-gray-500 whitespace-nowrap">
        {totalXP} XP
      </span>
    </div>
  );
};
