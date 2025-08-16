import { supabase } from "../../lib/supabaseClient";
import type { DailyTask } from "../schedule";

const TABLE = "tasks";

export async function listTasks(userId: string): Promise<DailyTask[] | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, date, kind, title, topic_id, prereq, done")
    .eq("user_id", userId)
    .order("date", { ascending: true });
  if (error) return null;
  return (
    data?.map((r) => ({
      id: r.id,
      date: r.date,
      kind: r.kind as DailyTask["kind"],
      title: r.title,
      topicId: r.topic_id ?? undefined,
      prereq: r.prereq ?? undefined,
      done: r.done,
    })) ?? null
  );
}

export async function upsertTasksBulk(userId: string, items: DailyTask[]) {
  const rows = items.map((t) => ({
    id: t.id,
    user_id: userId,
    date: t.date,
    kind: t.kind,
    title: t.title,
    topic_id: t.topicId ?? null,
    prereq: t.prereq ?? null,
    done: t.done,
  }));
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: "id",
  });
  return !error;
}
