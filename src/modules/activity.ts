// Activity tracking utilities: record daily active days for heatmap
import { format } from "date-fns";

const KEY = "dsa-habit-active-days-v1";

let days: string[] = load();
const listeners = new Set<(d: string[]) => void>();

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
  return days;
}

function emit() {
  listeners.forEach((l) => l(days));
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(days));
  } catch {}
}

export function subscribeActivity(listener: (d: string[]) => void) {
  listeners.add(listener);
  listener(days);
  return () => listeners.delete(listener);
}

export function recordActivity(date: Date = new Date()) {
  try {
    const iso = format(date, "yyyy-MM-dd");
    const set = new Set(days);
    if (!set.has(iso)) {
      set.add(iso);
      days = Array.from(set).sort();
      persist();
      emit();
    }
  } catch {
    // ignore
  }
}

// Replace activity days from external source (e.g., cloud)
export function hydrateActivityDays(newDays: string[]) {
  days = Array.from(new Set(newDays)).sort();
  persist();
  emit();
}
