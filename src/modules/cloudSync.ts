// Supabase-backed sync for AlgoHabit
// Keeps localStorage as source of truth when offline, but mirrors to cloud when online.

import { store } from "./state";
import { hydrateTasks, subscribeTasks } from "./scheduleState";
import { listTasks, upsertTasksBulk } from "./repos/tasksRepo";
import { getActivityDays, upsertActivityDays } from "./repos/activityRepo";
import { hydrateActivityDays, subscribeActivity } from "./activity";
import { hasProfile } from "./repos/profilesRepo";
import { listTopicProgress, upsertTopicProgress } from "./repos/topicsRepo";
import { getMetrics, upsertMetrics } from "./repos/metricsRepo";

// Tables we will use in Supabase (you need to create these):
// - profiles: { id text, email text, created_at timestamptz }
// - progress: { user_key text primary key, payload jsonb, updated_at timestamptz }
// - tasks: { user_key text primary key, items jsonb, updated_at timestamptz }

// Resolve current user id from Supabase Auth session stored by supabase client init
function getCurrentUserId(): string | null {
  try {
    const id = localStorage.getItem("dsa-auth-active-user");
    return id || null;
  } catch {
    return null;
  }
}

export async function pullAll() {
  const userId = getCurrentUserId();
  if (!userId) return;
  // Ensure profile exists (trigger should have created it)
  const ok = await hasProfile(userId);
  if (!ok) return;
  // Pull metrics
  const m = await getMetrics(userId);
  if (m) {
    const current = store.serialize();
    store.hydrate({
      ...current,
      streak: m.streak ?? current.streak,
      lastActive: m.last_active ?? current.lastActive,
      xp: m.xp ?? current.xp,
    } as any);
  }
  // Pull topics progress
  const tp = await listTopicProgress(userId);
  if (tp && tp.length) {
    const next = store.serialize();
    next.topics = next.topics.map((t) => {
      const row = tp.find((r) => r.topic_id === t.id);
      if (!row) return t;
      const normStatus =
        (row.status as unknown as string) === "pending"
          ? "not-started"
          : (row.status as unknown as string);
      return {
        ...t,
        status: normStatus as any,
        lastTouched: row.last_touched ?? undefined,
        xpFlags: {
          inProgress: row.xp_in_progress,
          complete: row.xp_complete,
        },
      } as any;
    });
    store.hydrate(next as any);
  }
  // Pull tasks
  const t = await listTasks(userId);
  if (t) hydrateTasks(t);
  // Pull activity days
  const a = await getActivityDays(userId);
  if (a) hydrateActivityDays(a);
}

export async function pushAll() {
  const userId = getCurrentUserId();
  if (!userId) return;
  const state = store.serialize();
  await upsertTopicProgress(userId, state.topics as any);
  await upsertMetrics(userId, state.xp, state.streak, state.lastActive);
}

export function startAutoSync(intervalMs = 15000) {
  // Push on every local change
  store.onChange(() => {
    // fire and forget
    pushAll();
  });
  // Push tasks whenever they change
  const unsubTasks = subscribeTasks(async (items) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const ok = await upsertTasksBulk(userId, items);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error("Failed to push tasks for user", userId);
    }
  });
  // Push activity whenever it changes
  const unsubActivity = subscribeActivity(async (days) => {
    const userId = getCurrentUserId();
    if (!userId) return;
    const ok = await upsertActivityDays(userId, days);
    if (!ok) {
      // eslint-disable-next-line no-console
      console.error("Failed to push activity for user", userId);
    }
  });
  // Periodic pull to reconcile
  const id = setInterval(() => {
    pullAll();
  }, intervalMs);
  return () => {
    clearInterval(id);
    unsubTasks?.();
    unsubActivity?.();
  };
}
