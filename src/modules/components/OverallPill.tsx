import React from "react";

export const OverallPill: React.FC<{ pct: number }> = ({ pct }) => {
  return (
    <div
      className="px-2.5 py-1.5 rounded-full bg-gray-900/80 ring-1 ring-gray-800 text-[11px] text-gray-300 flex items-center gap-2"
      title="Overall completion"
    >
      <span className="text-gray-400">Overall</span>
      <span className="font-semibold">{Math.round(pct)}%</span>
    </div>
  );
};
