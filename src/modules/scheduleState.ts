import { generateDailyPlan, DailyTask } from "./schedule";
// import { formatISO } from "date-fns";

const TASK_KEY = "dsa-habit-daily-plan-v1";

function loadTasks(): DailyTask[] {
  try {
    const raw = localStorage.getItem(TASK_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return generateDailyPlan(new Date());
}

let tasks: DailyTask[] = loadTasks();
const listeners = new Set<(t: DailyTask[]) => void>();

function emit() {
  listeners.forEach((l) => l(tasks));
}
function persist() {
  localStorage.setItem(TASK_KEY, JSON.stringify(tasks));
}

export function subscribeTasks(l: (t: DailyTask[]) => void) {
  listeners.add(l);
  l(tasks);
  return () => listeners.delete(l);
}

export function toggleTask(id: string) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  persist();
  emit();
}

export function regeneratePlan(start = new Date()) {
  tasks = generateDailyPlan(start);
  persist();
  emit();
}

// Hydrate tasks from an external source (e.g., cloud). Persists and notifies subscribers.
export function hydrateTasks(newTasks: DailyTask[]) {
  tasks = newTasks;
  persist();
  emit();
}
