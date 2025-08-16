import React from "react";
import { format } from "date-fns";

// GitHub-like 8-week activity heatmap based on an array of ISO dates that were active
export const StreakHeatmap: React.FC<{ days: string[] }> = ({ days }) => {
  const today = new Date();
  const cells: { date: Date; iso: string; active: boolean }[] = [];
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() - i);
    const iso = format(d, "yyyy-MM-dd");
    cells.push({ date: d, iso, active: days.includes(iso) });
  }
  const weeks: (typeof cells)[] = [];
  for (let w = 0; w < 8; w++) weeks.push(cells.slice(w * 7, w * 7 + 7));
  function tone(idx: number): string {
    return [
      "bg-gray-800 border-gray-700",
      "bg-emerald-900/60 border-emerald-700/60",
      "bg-emerald-800/60 border-emerald-600/60",
      "bg-emerald-600/60 border-emerald-500/60",
      "bg-emerald-400/60 border-emerald-300/60",
    ][idx];
  }
  const [tip, setTip] = React.useState<{
    x: number;
    y: number;
    text: string;
    visible: boolean;
  }>({ x: 0, y: 0, text: "", visible: false });
  function showTip(e: React.MouseEvent, text: string) {
    setTip({ x: e.clientX, y: e.clientY, text, visible: true });
  }
  function moveTip(e: React.MouseEvent) {
    setTip((t) => ({ ...t, x: e.clientX, y: e.clientY }));
  }
  function hideTip() {
    setTip((t) => ({ ...t, visible: false }));
  }
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        Activity
        <span className="text-[10px] text-gray-500">Last 8 Weeks</span>
      </h2>
      <div className="flex gap-1">
        {weeks.map((w, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {w.map((c, di) => {
              const active = c.active;
              let streakDepth = 0;
              if (active) {
                for (let back = 1; back <= 3; back++) {
                  const prev = new Date(c.date.getTime());
                  prev.setDate(c.date.getDate() - back);
                  const isoPrev = format(prev, "yyyy-MM-dd");
                  if (days.includes(isoPrev)) streakDepth++;
                  else break;
                }
              }
              const cls = active ? tone(Math.min(4, 1 + streakDepth)) : tone(0);
              const text = `${format(c.date, "EEE, MMM d")} • ${
                active ? "Active" : "No Activity"
              }`;
              return (
                <div key={di} className="relative w-3 h-3">
                  <div className={`w-3 h-3 rounded-sm border ${cls}`} />
                  {/* Larger invisible hover area without changing layout */}
                  <div
                    className="absolute -inset-1 cursor-default"
                    onMouseEnter={(e) => showTip(e, text)}
                    onMouseMove={moveTip}
                    onMouseLeave={hideTip}
                    aria-label={`${format(c.date, "yyyy-MM-dd")} ${
                      active ? "active" : "no activity"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 justify-end text-[9px] text-gray-500">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-3 h-3 rounded-sm border ${tone(i)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
      {tip.visible && (
        <div
          className="fixed z-50 px-2 py-1 rounded bg-gray-900 text-gray-200 text-[10px] ring-1 ring-gray-700 shadow"
          style={{ left: tip.x + 12, top: tip.y + 12 }}
        >
          {tip.text}
        </div>
      )}
    </section>
  );
};
