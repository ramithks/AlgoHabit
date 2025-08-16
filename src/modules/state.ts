import {
  differenceInCalendarDays,
  formatISO,
  isToday,
  parseISO,
} from "date-fns";
import { initialProgress, TopicProgress, TopicStatus } from "./plan";
import {
  APP_STORAGE_VERSION,
  STORAGE_VERSION_KEY,
  XP_VALUES,
  STREAK_THRESHOLDS,
} from "./constants";
// Supabase client now uses Auth session; no manual header refresh needed.

let storagePrefix = "dsa-"; // updated per active user
function key(k: string) {
  return `${storagePrefix}${k}`;
}
const PROGRESS_SUFFIX = "habit-progress-v1";
const STREAK_SUFFIX = "habit-streak-v1";
const LAST_ACTIVE_SUFFIX = "habit-last-active";
const XP_SUFFIX = "habit-xp-v1";
const ACH_SUFFIX = "habit-achievements-v1";

export interface AppState {
  topics: TopicProgress[];
  streak: number;
  lastActive?: string;
  xp: number; // gamification points
  achievements?: string[]; // unlocked achievement ids
}

function applyMigrations() {
  const verRaw = localStorage.getItem(STORAGE_VERSION_KEY);
  const current = verRaw ? parseInt(verRaw, 10) : 1;
  if (current < APP_STORAGE_VERSION) {
    // Future migration hooks; currently just bump version.
    localStorage.setItem(STORAGE_VERSION_KEY, APP_STORAGE_VERSION.toString());
  } else if (!verRaw) {
    localStorage.setItem(STORAGE_VERSION_KEY, APP_STORAGE_VERSION.toString());
  }
}

function loadState(): AppState {
  try {
    applyMigrations();
    const raw = localStorage.getItem(key(PROGRESS_SUFFIX));
    const streakRaw = localStorage.getItem(key(STREAK_SUFFIX));
    const lastActive =
      localStorage.getItem(key(LAST_ACTIVE_SUFFIX)) || undefined;
    const xpRaw = localStorage.getItem(key(XP_SUFFIX));
    const achRaw = localStorage.getItem(key(ACH_SUFFIX));
    let topics: TopicProgress[] = initialProgress();
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) topics = parsed; // legacy form
      else if (parsed && Array.isArray(parsed.topics)) topics = parsed.topics; // future form
    }
    // Backfill xpFlags for legacy records lacking it
    topics = topics.map((t: any) => ({
      ...t,
      xpFlags: t.xpFlags || {},
    }));
    return {
      topics,
      streak: streakRaw ? parseInt(streakRaw, 10) : 0,
      lastActive,
      xp: xpRaw ? parseInt(xpRaw, 10) : 0,
      achievements: achRaw ? JSON.parse(achRaw) : [],
    };
  } catch {
    return { topics: initialProgress(), streak: 0, xp: 0, achievements: [] };
  }
}

function persist(state: AppState) {
  // store combined object for forward compatibility
  localStorage.setItem(
    key(PROGRESS_SUFFIX),
    JSON.stringify({ topics: state.topics })
  );
  localStorage.setItem(key(STREAK_SUFFIX), state.streak.toString());
  if (state.lastActive)
    localStorage.setItem(key(LAST_ACTIVE_SUFFIX), state.lastActive);
  localStorage.setItem(key(XP_SUFFIX), state.xp.toString());
  localStorage.setItem(
    key(ACH_SUFFIX),
    JSON.stringify(state.achievements || [])
  );
}

export type Listener = (s: AppState) => void;

class Store {
  private state: AppState = loadState();
  private listeners: Set<Listener> = new Set();
  private onExternalChange?: (s: AppState) => void;

  subscribe(l: Listener) {
    this.listeners.add(l);
    l(this.state);
    return () => this.listeners.delete(l);
  }

  private emit() {
    persist(this.state);
    this.listeners.forEach((l) => l(this.state));
    if (this.onExternalChange) this.onExternalChange(this.state);
  }

  updateTopic(id: string, patch: Partial<TopicProgress>) {
    this.state.topics = this.state.topics.map((t) => {
      if (t.id !== id) return t;
      const prevStatus = t.status;
      const nextStatus = (patch.status ?? t.status) as TopicStatus;
      const next: TopicProgress = {
        ...t,
        ...patch,
        status: nextStatus,
      } as TopicProgress;
      // Ensure xpFlags exists
      if (!next.xpFlags)
        next.xpFlags = { ...((t as any).xpFlags || {}) } as any;
      const xpFlags = (next.xpFlags = next.xpFlags || ({} as any));
      const today = formatISO(new Date(), { representation: "date" });
      // Award on entering statuses (first time)
      if (
        prevStatus !== "in-progress" &&
        nextStatus === "in-progress" &&
        !xpFlags.inProgress
      ) {
        this.state.xp += XP_VALUES.IN_PROGRESS_AWARD;
        xpFlags.inProgress = true;
        next.lastTouched = today;
      }
      if (
        prevStatus !== "complete" &&
        nextStatus === "complete" &&
        !xpFlags.complete
      ) {
        this.state.xp += XP_VALUES.COMPLETE_AWARD;
        xpFlags.complete = true;
        next.lastTouched = today;
      }
      // Handle undo: leaving statuses should remove previously granted XP
      if (
        prevStatus === "in-progress" &&
        nextStatus !== "in-progress" &&
        xpFlags.inProgress
      ) {
        this.state.xp = Math.max(
          0,
          this.state.xp - XP_VALUES.IN_PROGRESS_AWARD
        );
        xpFlags.inProgress = false;
        next.lastTouched = today;
      }
      if (
        prevStatus === "complete" &&
        nextStatus !== "complete" &&
        xpFlags.complete
      ) {
        this.state.xp = Math.max(0, this.state.xp - XP_VALUES.COMPLETE_AWARD);
        xpFlags.complete = false;
        next.lastTouched = today;
      }
      return next;
    });
    this.evaluateAchievements();
    this.touchActivity();
    this.emit();
  }

  setStatus(id: string, status: TopicStatus) {
    this.updateTopic(id, { status });
  }

  addDailyNote(id: string, note: string) {
    const today = formatISO(new Date(), { representation: "date" });
    const topic = this.state.topics.find((t) => t.id === id);
    if (!topic) return;
    topic.dailyNotes[today] = note;
    topic.lastTouched = today;
    this.touchActivity();
    this.emit();
  }

  private touchActivity() {
    const today = formatISO(new Date(), { representation: "date" });
    if (this.state.lastActive) {
      const last = parseISO(this.state.lastActive);
      if (!isToday(last)) {
        const gap = differenceInCalendarDays(new Date(), last);
        if (gap === 1) {
          this.state.streak += 1;
        } else if (gap > 1) {
          this.state.streak = 1; // reset streak
        }
      }
    } else {
      this.state.streak = 1;
    }
    this.state.lastActive = today;
  }

  addXP(amount: number) {
    this.state.xp += amount;
    this.emit();
  }

  private hasAchievement(id: string) {
    return this.state.achievements?.includes(id);
  }

  private unlock(id: string) {
    if (!this.state.achievements) this.state.achievements = [];
    if (!this.hasAchievement(id)) {
      this.state.achievements.push(id);
      this.addXP(XP_VALUES.ACHIEVEMENT_BONUS); // bonus XP
    }
  }

  private evaluateAchievements() {
    const completed = this.state.topics.filter((t) => t.status === "complete");
    if (completed.length >= 1) this.unlock("first-complete");
    if (completed.length >= 5) this.unlock("five-complete");
    if (completed.length >= 10) this.unlock("ten-complete");
    const allWeek1 = this.state.topics
      .filter((t) => t.week === 1)
      .every((t) => t.status === "complete");
    if (allWeek1) this.unlock("week1-master");
    const all = this.state.topics.every((t) => t.status === "complete");
    if (all) this.unlock("all-cleared");
    if (this.state.streak >= STREAK_THRESHOLDS.STREAK_7)
      this.unlock("streak-7");
    if (this.state.streak >= STREAK_THRESHOLDS.STREAK_30)
      this.unlock("streak-30");
  }

  // Switch active user context; reload state from that user's prefixed keys
  switchUser(userId: string) {
    storagePrefix = `dsa-${userId}-`;
    this.state = loadState();
    this.emit();
  }

  // Clear all persisted data for current user (retain account record)
  resetUserData() {
    try {
      localStorage.removeItem(key(PROGRESS_SUFFIX));
      localStorage.removeItem(key(STREAK_SUFFIX));
      localStorage.removeItem(key(LAST_ACTIVE_SUFFIX));
      localStorage.removeItem(key(XP_SUFFIX));
      localStorage.removeItem(key(ACH_SUFFIX));
    } catch {}
    this.state = {
      topics: initialProgress(),
      streak: 0,
      xp: 0,
      achievements: [],
    };
    this.emit();
  }

  // Replace current state with provided (e.g., from cloud). Persists and notifies.
  hydrate(next: AppState) {
    this.state = next;
    this.emit();
  }

  // Minimal JSON for upload (topics + streak + lastActive + xp + achievements)
  serialize(): AppState {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Allow cloud module to subscribe to local changes
  onChange(cb: (s: AppState) => void) {
    this.onExternalChange = cb;
  }
}

export const store = new Store();

// External API to set active user (used by auth layer)
export function setActiveUser(userId: string) {
  store.switchUser(userId);
}

export function resetCurrentUserData() {
  store.resetUserData();
}

export function computeWeekStats(week: number, topics: TopicProgress[]) {
  const weekTopics = topics.filter((t) => t.week === week);
  const total = weekTopics.length;
  const complete = weekTopics.filter((t) => t.status === "complete").length;
  const inProgress = weekTopics.filter(
    (t) => t.status === "in-progress"
  ).length;
  const skipped = weekTopics.filter((t) => t.status === "skipped").length;
  return {
    total,
    complete,
    inProgress,
    skipped,
    pct: total ? Math.round((complete / total) * 100) : 0,
  };
}

export function overallProgress(topics: TopicProgress[]) {
  const total = topics.length;
  const complete = topics.filter((t) => t.status === "complete").length;
  return {
    total,
    complete,
    pct: total ? Math.round((complete / total) * 100) : 0,
  };
}

// Non-linear level curve: each level threshold grows by ~25%
// Returns just level for backward compatibility
export function levelFromXP(xp: number) {
  let level = 1;
  let threshold = 60; // XP needed for current level up
  let remaining = xp;
  while (remaining >= threshold) {
    remaining -= threshold;
    level += 1;
    threshold = Math.round(threshold * 1.25);
  }
  return level;
}

export interface LevelInfo {
  level: number; // current level
  xpInto: number; // xp gained within current level
  xpForLevel: number; // total xp required to finish current level (threshold)
  pct: number; // percentage progress within current level
  totalXP: number; // original xp
  nextLevelAt: number; // cumulative XP at which next level starts
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  let threshold = 60; // starting requirement
  let remaining = xp;
  let cumulative = 0;
  while (remaining >= threshold) {
    remaining -= threshold;
    cumulative += threshold;
    level += 1;
    threshold = Math.round(threshold * 1.25);
  }
  const pct = Math.min(100, (remaining / threshold) * 100);
  return {
    level,
    xpInto: remaining,
    xpForLevel: threshold,
    pct: Math.round(pct),
    totalXP: xp,
    nextLevelAt: cumulative + threshold,
  };
}

export function pendingTopicsForReview(
  currentWeek: number,
  topics: TopicProgress[],
  limit = 3
) {
  const candidates = topics.filter(
    (t) => t.week < currentWeek && t.status !== "complete"
  );
  return candidates.slice(0, limit);
}
