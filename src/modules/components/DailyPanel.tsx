import React from "react";
import { topics } from "../plan";
import type { DailyTask } from "../schedule";

export const DailyPanel: React.FC<{
  tasks: DailyTask[];
  onToggle: (id: string) => void;
}> = ({ tasks, onToggle }) => {
  const topicMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    for (const t of topics) map[t.id] = t.label;
    return map;
  }, []);
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 space-y-3 overflow-hidden">
      <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        Today <span className="text-[10px] text-gray-500">Daily Plan</span>
      </h2>
      {tasks.length === 0 && (
        <div className="text-[11px] text-gray-400 flex items-center justify-between">
          <span>No tasks yet for today.</span>
          <button
            onClick={() =>
              window.dispatchEvent(new CustomEvent("dsa-regenerate-plan"))
            }
            className="text-[10px] px-2 py-1 rounded bg-accent/20 text-accent hover:bg-accent/30"
          >
            Generate
          </button>
        </div>
      )}
      <ul className="space-y-2">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 text-xs min-w-0">
            <button
              onClick={() => onToggle(t.id)}
              className={`w-4 h-4 rounded border flex items-center justify-center ${
                t.done
                  ? "bg-emerald-500/30 border-emerald-400"
                  : "border-gray-600"
              }`}
            >
              {t.done && "✓"}
            </button>
            <span
              className={`flex-1 truncate ${
                t.done ? "line-through text-gray-500" : "text-gray-200"
              }`}
            >
              {t.topicId && topicMap[t.topicId]
                ? `${topicMap[t.topicId]} (${t.title.replace(
                    /Learn & practice: /,
                    ""
                  )})`
                : t.title}
            </span>
            {t.prereq && !t.done && (
              <span className="text-[10px] text-amber-400 ml-auto">
                Prereq: {t.prereq}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};
