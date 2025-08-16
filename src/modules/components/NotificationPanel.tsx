import React, { useEffect, useState } from "react";

export const NotificationPanel: React.FC<{
  status: NotificationPermission | "unsupported";
  onRequest: () => void;
  reminders: { id: string; time: number; title: string }[];
  onSchedule: () => string;
  onCancel: (id: string) => void;
  remMinutes: number;
  onChangeMinutes: (v: number) => void;
}> = ({
  status,
  onRequest,
  reminders,
  onSchedule,
  onCancel,
  remMinutes,
  onChangeMinutes,
}) => {
  const swReady =
    typeof navigator !== "undefined" && !!navigator.serviceWorker?.controller;
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick((v) => (v + 1) % 1000), 60000);
    return () => clearInterval(id);
  }, []);
  const [durations, setDurations] = useState<Record<string, number>>({});
  useEffect(() => {
    setDurations((prev) => {
      const next = { ...prev } as Record<string, number>;
      reminders.forEach((r) => {
        if (!next[r.id]) next[r.id] = r.time - Date.now();
      });
      Object.keys(next).forEach((id) => {
        if (!reminders.find((r) => r.id === id)) delete next[id];
      });
      return next;
    });
  }, [reminders]);
  function pctRemaining(r: { id: string; time: number }) {
    const total = durations[r.id] || r.time - Date.now();
    const remain = r.time - Date.now();
    return Math.max(0, Math.min(100, (remain / total) * 100));
  }
  return (
    <section className="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-4 ring-1 ring-gray-800 border border-gray-800/50 space-y-3">
      <h2 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
        Notifications
      </h2>
      {status === "unsupported" && (
        <div className="text-[11px] text-rose-400">
          Browser does not support Notifications API.
        </div>
      )}
      {status !== "granted" && status !== "unsupported" && (
        <button
          onClick={onRequest}
          className="text-[11px] px-3 py-1 rounded bg-accent/30 text-accent hover:bg-accent/40"
        >
          Enable Notifications
        </button>
      )}
      {status === "granted" && (
        <div className="space-y-2 text-[11px]">
          {!swReady && (
            <div className="text-[10px] text-amber-400">
              Preparing background worker… reminders may need a moment.
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={1}
                value={remMinutes}
                onChange={(e) => onChangeMinutes(parseInt(e.target.value) || 1)}
                className="w-16 bg-gray-800 rounded px-2 py-1 outline-none text-[11px]"
              />
              <span className="text-gray-400">min</span>
            </div>
            <button
              onClick={() => onSchedule()}
              className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
            >
              Schedule Reminder
            </button>
          </div>
          <ul className="space-y-1 max-h-32 overflow-auto pr-1">
            {reminders.map((r) => (
              <li
                key={r.id}
                className="group rounded-lg border border-gray-800/60 bg-gray-800/30 hover:bg-gray-800/40 transition-colors px-2 py-2 flex flex-col gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 w-14">
                    {Math.max(0, Math.round((r.time - Date.now()) / 60000))}m
                  </span>
                  <span className="flex-1 text-[11px] truncate text-gray-300">
                    {r.title}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => {
                        const mins = 5;
                        onChangeMinutes(mins);
                        onSchedule();
                        onCancel(r.id);
                      }}
                      title="Snooze 5m"
                      className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-200 hover:bg-indigo-500/40"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => onCancel(r.id)}
                      className="text-[10px] px-1 py-0.5 rounded bg-rose-500/30 text-rose-200 hover:bg-rose-500/40"
                      title="Cancel"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="h-1.5 rounded bg-gray-700/60 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-fuchsia-500 transition-[width] ease-linear"
                    style={{ width: `${pctRemaining(r)}%` }}
                  />
                </div>
              </li>
            ))}
            {reminders.length === 0 && (
              <li className="text-[10px] text-gray-500">
                No reminders scheduled.
              </li>
            )}
          </ul>
          <div className="text-[10px] text-gray-500">
            Reminders rely on page being open (no server push).
          </div>
        </div>
      )}
    </section>
  );
};
