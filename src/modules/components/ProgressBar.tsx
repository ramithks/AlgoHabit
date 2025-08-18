import React from "react";

type Props = {
  pct: number;
  label?: string;
  title?: string;
  className?: string;
};

export const ProgressBar: React.FC<Props> = ({
  pct,
  label,
  title = label,
  className,
}) => (
  <div className={`flex items-center gap-2 ${className || ""}`}>
    {label && (
      <span className="text-[10px] text-gray-400 whitespace-nowrap">
        {label}
      </span>
    )}
    <div
      className="w-40 h-2 rounded bg-gray-800 overflow-hidden"
      title={title || undefined}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-gradient-to-r from-accent to-fuchsia-500 transition-all"
        style={{ width: pct + "%" }}
      />
    </div>
    <span className="text-[10px] text-gray-500 w-8 text-right">
      {Math.round(pct)}%
    </span>
  </div>
);
