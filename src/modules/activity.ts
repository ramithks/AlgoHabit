// Activity tracking utilities: record daily active days for heatmap
import { format } from "date-fns";

const KEY = "dsa-habit-active-days-v1";

function load(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr.filter((d) => typeof d === "string");
    return [];
  } catch {
    return [];
  }
}



export function getActivityDays(): string[] {
  return load();
}

export function recordActivity(date: Date = new Date()) {
  try {
    const iso = format(date, "yyyy-MM-dd");
    const set = new Set(load());
    if (!set.has(iso)) {
      set.add(iso);
      localStorage.setItem(KEY, JSON.stringify(Array.from(set).sort()));
    }
  } catch {
    // ignore
  }
}
