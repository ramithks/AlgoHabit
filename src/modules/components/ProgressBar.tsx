import React from "react";

export const ProgressBar: React.FC<{ pct: number }> = ({ pct }) => (
  <div
    className="w-40 h-2 rounded bg-gray-800 overflow-hidden"
    title="Overall completion"
  >
    <div
      className="h-full bg-gradient-to-r from-accent to-fuchsia-500 transition-all"
      style={{ width: pct + "%" }}
    />
  </div>
);
