import React from "react";

export const StatusCluster: React.FC<{
  overallPct: number;
  streak: number;
  level: number;
  xp: number;
}> = ({ overallPct, streak, level, xp }) => {
  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-800 shadow-sm text-[11px] text-gray-300"
      title={`Overall ${Math.round(
        overallPct
      )}% · Streak ${streak}d · Level ${level} (${xp} XP)`}
    >
      <span className="flex items-center gap-1 whitespace-nowrap">
        <span className="text-gray-400">Overall</span>
        <span className="font-semibold">{Math.round(overallPct)}%</span>
      </span>
      <span className="text-gray-700">|</span>
      <span
        className="flex items-center gap-1 whitespace-nowrap"
        title="Daily active streak"
      >
        <span className="inline-block text-base leading-none align-middle translate-y-[1px]">
          🔥
        </span>
        <span className="font-medium">{streak}d</span>
      </span>
      <span className="text-gray-700">|</span>
      <span
        className="flex items-center gap-1 whitespace-nowrap"
        title={`Level ${level}`}
      >
        <span className="text-[10px] text-gray-400">Lv</span>
        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
          {level}
        </span>
        <span className="text-gray-500">·</span>
        <span className="text-gray-400">{xp} XP</span>
      </span>
    </div>
  );
};
