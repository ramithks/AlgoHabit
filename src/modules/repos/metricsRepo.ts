import { supabase } from "../../lib/supabaseClient";

const TABLE = "user_metrics";

export async function getMetrics(userId: string) {
  const { data } = await supabase
    .from(TABLE)
    .select("xp, streak, last_active")
    .eq("user_id", userId)
    .maybeSingle();
  return data || null;
}

export async function upsertMetrics(
  userId: string,
  xp: number,
  streak: number,
  lastActive?: string
) {
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      xp,
      streak,
      last_active: lastActive ?? null,
    },
    { onConflict: "user_id" }
  );
  return !error;
}
