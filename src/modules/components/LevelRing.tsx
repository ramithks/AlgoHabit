import React from "react";

type Props = {
  level: number;
  pct: number; // 0-100 progress within current level
  totalXP?: number;
  size?: number; // px
  stroke?: number; // px
  pulse?: boolean;
};

export const LevelRing: React.FC<Props> = ({
  level,
  pct,
  totalXP,
  size = 44,
  stroke = 5,
  pulse,
}) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(100, Math.max(0, pct)) / 100) * c;
  const gap = c - dash;
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        pulse ? "animate-pulse-slow" : ""
      }`}
      title={`Level ${level} — ${Math.round(pct)}% ${
        totalXP != null ? `(${totalXP} XP)` : ""
      }`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#1f2937"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#lvlgrad)"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="lvlgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="50%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#fb7185" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="text-[10px] leading-none text-gray-400">Lv</span>
        <span className="text-sm font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent -mt-0.5">
          {level}
        </span>
      </div>
    </div>
  );
};
