import React, { useState, useMemo } from "react";
import { TopicProgress, TopicStatus } from "../plan";

interface Props {
  week: number;
  topics: TopicProgress[];
  onStatusChange: (id: string, status: TopicStatus) => void;
  onAddNote: (id: string, note: string) => void;
}

const STATUS_ORDER: TopicStatus[] = [
  "not-started",
  "in-progress",
  "complete",
  "skipped",
];

export const WeekBoard: React.FC<Props> = ({
  week,
  topics,
  onStatusChange,
  onAddNote,
}) => {
  const [filter, setFilter] = useState<"all" | "pending" | "complete">(
    () => (localStorage.getItem("dsa-week-filter") as any) || "all"
  );
  const weekTopicsRaw = topics.filter((t) => t.week === week);
  const weekTopics = useMemo(() => {
    if (filter === "all") return weekTopicsRaw;
    if (filter === "complete")
      return weekTopicsRaw.filter((t) => t.status === "complete");
    return weekTopicsRaw.filter((t) => t.status !== "complete");
  }, [weekTopicsRaw, filter]);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});

  function playClick() {
    const audio = new Audio(
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA="
    ); // tiny silent click placeholder
    audio.volume = 0.4;
    audio.play().catch(() => {});
  }

  function cycleStatus(t: TopicProgress) {
    const idx = STATUS_ORDER.indexOf(t.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    playClick();
    onStatusChange(t.id, next);
  }

  const total = weekTopicsRaw.length;
  const done = weekTopicsRaw.filter((t) => t.status === "complete").length;
  const inProg = weekTopicsRaw.filter((t) => t.status === "in-progress").length;

  return (
    <section className="bg-gray-900 rounded-xl p-4 ring-1 ring-gray-800 overflow-hidden">
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
              Week {week} Topics
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 font-normal">
                {done}/{total}
              </span>
            </h2>
            <div className="flex gap-3 text-[10px] text-gray-500 mt-1 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Done {done}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                In Prog {inProg}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
                Total {total}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full text-[10px]">
          {["all", "pending", "complete"].map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f as any);
                localStorage.setItem("dsa-week-filter", f);
              }}
              aria-selected={filter === f}
              className={`flex-1 px-3 py-1 rounded border text-center capitalize transition font-medium tracking-wide ${
                filter === f
                  ? "bg-accent/30 border-accent/40 text-accent shadow-inner"
                  : "bg-gray-800/60 border-gray-700/60 text-gray-400 hover:text-gray-200 hover:border-gray-600"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <ul className="space-y-2">
        {weekTopics.map((t) => (
          <li
            key={t.id}
            className="flex flex-col gap-1 rounded border border-gray-800 hover:border-gray-700 transition p-3 bg-gray-950/50 focus-within:ring-1 focus-within:ring-accent/30 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div
                  className="text-base font-semibold text-accent truncate mb-0.5"
                  title={t.label}
                >
                  {t.label}
                </div>
                <div className="text-[10px] text-gray-500 truncate mb-1">
                  Ref: {t.cheatSheetRef}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => cycleStatus(t)}
                    aria-label={`Change status (current: ${labelForStatus(
                      t.status
                    )})`}
                    role="button"
                    className={`transition-all motion-safe:active:scale-95 shrink-0 w-28 text-left text-[11px] px-2 py-1 rounded font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-accent/40 relative overflow-hidden ${statusClasses(
                      t.status
                    )}`}
                  >
                    <span className="relative z-10 flex items-center gap-1">
                      {iconForStatus(t.status)} {labelForStatus(t.status)}
                    </span>
                    <span className="absolute inset-0 opacity-0 hover:opacity-15 transition bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                  </button>
                  <NoteInput
                    topicId={t.id}
                    value={noteDraft[t.id] || ""}
                    onChange={(v) => setNoteDraft((d) => ({ ...d, [t.id]: v }))}
                    onCommit={(val) => onAddNote(t.id, val)}
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] text-gray-500">
              {t.lastTouched && <div>Last: {t.lastTouched}</div>}
              {t.status === "complete" && (
                <div className="text-emerald-400/80">✓ Completed</div>
              )}
              {t.status === "in-progress" && (
                <div className="text-amber-400/80">↺ Ongoing</div>
              )}
            </div>
            {Object.entries(t.dailyNotes)
              .slice(-2)
              .map(([date, note]) => (
                <div key={date} className="text-[10px] text-gray-400">
                  {date}: {note}
                </div>
              ))}
          </li>
        ))}
        {weekTopics.length === 0 && (
          <li className="text-[11px] text-gray-500 italic px-1 pt-1">
            No topics in this view.
          </li>
        )}
      </ul>
    </section>
  );
};

function statusClasses(status: TopicStatus) {
  switch (status) {
    case "not-started":
      return "bg-gray-800 text-gray-300 hover:bg-gray-700";
    case "in-progress":
      return "bg-amber-500/20 text-amber-300 border border-amber-500/30";
    case "complete":
      return "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30";
    case "skipped":
      return "bg-rose-500/20 text-rose-300 border border-rose-500/30";
  }
}

function labelForStatus(status: TopicStatus) {
  switch (status) {
    case "not-started":
      return "Not Started";
    case "in-progress":
      return "In Progress";
    case "complete":
      return "Complete";
    case "skipped":
      return "Skipped";
  }
}

function iconForStatus(status: TopicStatus) {
  switch (status) {
    case "not-started":
      return "⏳";
    case "in-progress":
      return "⚙️";
    case "complete":
      return "✅";
    case "skipped":
      return "⤴";
  }
}

const NoteInput: React.FC<{
  topicId: string;
  value: string;
  onChange: (v: string) => void;
  onCommit: (v: string) => void;
}> = ({ value, onChange, onCommit }) => {
  const [pending, setPending] = useState(false);
  React.useEffect(() => {
    if (value === "") return; // don't auto-save empty
    setPending(true);
    const id = setTimeout(() => {
      onCommit(value);
      setPending(false);
    }, 500);
    return () => clearTimeout(id);
  }, [value, onCommit]);
  return (
    <div className="flex items-center gap-2 min-w-0 w-full">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Daily note / reflection"
        className="bg-gray-800 text-[11px] px-2 py-1 rounded outline-none flex-1 min-w-0 focus:ring-1 focus:ring-accent focus:bg-gray-750 transition border border-gray-700/60"
      />
      {pending && (
        <span className="text-[10px] text-gray-500 animate-pulse">…</span>
      )}
    </div>
  );
};
