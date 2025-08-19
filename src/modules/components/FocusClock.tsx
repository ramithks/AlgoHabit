import React, { useEffect, useMemo, useRef, useState } from "react";
import { sfx } from "../sfx";

export const FocusClock: React.FC = () => {
  const workMinutes = 25;
  const breakMinutes = 5;
  const [mode, setMode] = useState<"work" | "break">("work");
  const [running, setRunning] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<number | null>(null);

  const durationMs = useMemo(
    () => (mode === "work" ? workMinutes : breakMinutes) * 60 * 1000,
    [mode, workMinutes, breakMinutes]
  );

  const remainMs = Math.max(0, (endsAt ?? 0) - now);
  const pct = endsAt
    ? Math.max(0, Math.min(100, (remainMs / durationMs) * 100))
    : 0;

  useEffect(() => {
    if (!running) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => setNow(Date.now()), 250);
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [running]);

  useEffect(() => {
    if (!running || endsAt === null) return;
    if (Date.now() >= endsAt) {
      // auto switch
      const nextMode = mode === "work" ? "break" : "work";
      setMode(nextMode);
      const nextEnd =
        Date.now() +
        (nextMode === "work" ? workMinutes : breakMinutes) * 60 * 1000;
      setEndsAt(nextEnd);
    }
  }, [now, running, endsAt, mode, workMinutes, breakMinutes]);

  function start() {
    setEndsAt(Date.now() + durationMs);
    setRunning(true);
    sfx.play("start");
  }
  function stop() {
    setRunning(false);
    setEndsAt(null);
    sfx.play("end");
  }
  function reset() {
    setRunning(false);
    setEndsAt(null);
  }
  function toggleMode() {
    const next = mode === "work" ? "break" : "work";
    setMode(next);
    setRunning(false);
    setEndsAt(null);
  }
  const mm = Math.floor(remainMs / 60000)
    .toString()
    .padStart(2, "0");
  const ss = Math.floor((remainMs % 60000) / 1000)
    .toString()
    .padStart(2, "0");

  // Keyboard shortcut removed to avoid interfering with typing in inputs

  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-200">Focus Clock</h2>
        <span
          className={`text-[10px] px-2 py-0.5 rounded border ${
            mode === "work"
              ? "border-emerald-400/40 text-emerald-300"
              : "border-sky-400/40 text-sky-300"
          }`}
        >
          {mode === "work" ? "Focus" : "Break"}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-28 h-28 rounded-full bg-gray-800/60 flex items-center justify-center">
          <svg className="absolute inset-0" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#1f2937"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke={mode === "work" ? "#10b981" : "#38bdf8"}
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(pct / 100) * 276} 276`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </svg>
          <div className="text-center">
            <div className="text-2xl font-semibold text-gray-100">
              {endsAt
                ? `${mm}:${ss}`
                : mode === "work"
                ? `${workMinutes}:00`
                : `${breakMinutes}:00`}
            </div>
            <div className="text-[10px] text-gray-500">
              {mode === "work" ? "Deep work" : "Recover"}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {!running ? (
              <button onClick={start} className="btn btn-primary !px-3 !py-1.5">
                Start
              </button>
            ) : (
              <button onClick={stop} className="btn btn-danger !px-3 !py-1.5">
                Stop
              </button>
            )}
            <button onClick={reset} className="btn btn-ghost !px-3 !py-1.5">
              Reset
            </button>
          </div>
          <div className="flex gap-2 text-[11px] text-gray-400 items-center">
            <button onClick={toggleMode} className="btn btn-ghost !px-2 !py-1">
              Switch Mode
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
