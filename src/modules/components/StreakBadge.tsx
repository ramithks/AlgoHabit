import React from "react";

export const StreakBadge: React.FC<{ streak: number }> = ({ streak }) => (
  <div
    className="flex items-center gap-1 text-sm font-medium text-amber-400"
    title="Daily active streak"
  >
    <span className="text-lg">🔥</span>
    <span>{streak}d</span>
  </div>
);
