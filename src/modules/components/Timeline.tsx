import React from "react";
import { TOTAL_WEEKS } from "../plan";
import { TopicProgress } from "../plan";

interface Props {
  activeWeek: number;
  onSelectWeek: (w: number) => void;
  topics: TopicProgress[];
}

export const Timeline: React.FC<Props> = ({
  activeWeek,
  onSelectWeek,
  topics: progress,
}) => {
  const weekCompletion = (w: number) => {
    const wTopics = progress.filter((t) => t.week === w);
    if (!wTopics.length) return 0;
    return Math.round(
      (wTopics.filter((t) => t.status === "complete").length / wTopics.length) *
        100
    );
  };
  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800">
      <h2 className="text-sm font-semibold text-gray-300 mb-3">
        8-Week Roadmap
      </h2>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((week) => {
          const pct = weekCompletion(week);
          return (
            <button
              key={week}
              onClick={() => onSelectWeek(week)}
              className={`group relative flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs transition ${
                week === activeWeek
                  ? "border-accent bg-gray-800"
                  : "border-gray-800 hover:border-gray-700"
              }`}
            >
              <span className="font-medium">W{week}</span>
              <div className="w-full h-1.5 rounded bg-gray-800 overflow-hidden">
                <div
                  className="h-full bg-accent transition-all"
                  style={{ width: pct + "%" }}
                />
              </div>
              <span className="text-[10px] text-gray-400">{pct}%</span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
