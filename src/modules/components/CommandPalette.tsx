import React from "react";
import { TOTAL_WEEKS, topics } from "../plan";

type PaletteItem = {
  type: "week" | "topic";
  week: number;
  label: string;
  hint: string;
  keywords: string;
};

export const CommandPalette: React.FC<{
  onClose: () => void;
  onJumpWeek: (w: number) => void;
}> = ({ onClose, onJumpWeek }) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [query, setQuery] = React.useState("");
  const weekItems: PaletteItem[] = React.useMemo(
    () =>
      Array.from({ length: TOTAL_WEEKS }, (_, i) => ({
        type: "week" as const,
        week: i + 1,
        label: `Week ${i + 1}`,
        hint: "Jump to roadmap week",
        keywords: `week ${i + 1} ${i + 1}`,
      })),
    []
  );
  const topicItems: PaletteItem[] = React.useMemo(
    () =>
      topics.map((t) => ({
        type: "topic" as const,
        week: t.week,
        label: t.label,
        hint: `Week ${t.week}`,
        keywords: `${t.label.toLowerCase()} week ${t.week}`,
      })),
    []
  );
  const allItems: PaletteItem[] = React.useMemo(
    () => [...weekItems, ...topicItems],
    [weekItems, topicItems]
  );
  const filtered = React.useMemo(() => {
    if (!query.trim()) return allItems.slice(0, 80);
    const q = query.toLowerCase();
    return allItems.filter((i) => i.keywords.includes(q)).slice(0, 80);
  }, [query, allItems]);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter") {
        const first = filtered[0];
        if (first) {
          onJumpWeek(first.week);
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtered, onClose, onJumpWeek]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-[560px] rounded-xl overflow-hidden ring-1 ring-gray-700 bg-gray-900 shadow-xl">
        <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search weeks or topics... (⏎ to jump)"
            className="flex-1 bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
          />
          <span className="text-[10px] text-gray-500 hidden sm:inline">
            Esc / ⌘K
          </span>
        </div>
        <ul className="max-h-80 overflow-auto divide-y divide-gray-800 text-sm">
          {filtered.length === 0 && (
            <li className="px-4 py-6 text-center text-xs text-gray-500">
              No matches
            </li>
          )}
          {filtered.map((item, idx) => (
            <li key={idx}>
              <button
                onClick={() => {
                  onJumpWeek(item.week);
                  onClose();
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-800/60 flex items-center gap-3 group"
              >
                <span className="text-gray-300 truncate flex-1">
                  {item.label}
                </span>
                <span className="text-[10px] text-gray-500 group-hover:text-gray-400">
                  {item.hint}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="px-4 py-2 bg-gray-800/40 text-[10px] flex items-center gap-4 text-gray-500">
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              ⌘K
            </kbd>{" "}
            toggle
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              Esc
            </kbd>{" "}
            close
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-gray-700 rounded border border-gray-600 text-[9px]">
              Enter
            </kbd>{" "}
            first
          </span>
        </div>
      </div>
    </div>
  );
};
