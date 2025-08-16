import { supabase } from "../../lib/supabaseClient";
import type { TopicProgress } from "../plan";

const TABLE = "topics_progress";

export type TopicRow = {
  user_id: string;
  topic_id: string;
  week: number;
  status: TopicProgress["status"];
  last_touched: string | null;
  xp_in_progress: boolean;
  xp_complete: boolean;
};

export async function listTopicProgress(userId: string): Promise<TopicRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select(
      "user_id, topic_id, week, status, last_touched, xp_in_progress, xp_complete"
    )
    .eq("user_id", userId);
  if (error || !data) return [];
  return data as any;
}

export async function upsertTopicProgress(
  userId: string,
  topics: TopicProgress[]
) {
  const rows = topics.map((t) => ({
    user_id: userId,
    topic_id: t.id,
    week: t.week,
    status: (t.status === "not-started" ? "pending" : t.status) as any,
    last_touched: t.lastTouched ?? null,
    xp_in_progress: Boolean((t as any).xpFlags?.inProgress),
    xp_complete: Boolean((t as any).xpFlags?.complete),
  }));
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: "user_id,topic_id",
  });
  return !error;
}
