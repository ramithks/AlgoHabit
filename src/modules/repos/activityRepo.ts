import { supabase } from "../../lib/supabaseClient";

const TABLE = "activity_log";

export async function getActivityDays(
  userId: string
): Promise<string[] | null> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("day")
    .eq("user_id", userId)
    .order("day", { ascending: true });
  if (error) return null;
  return data?.map((r) => r.day) ?? null;
}

export async function upsertActivityDays(userId: string, days: string[]) {
  const rows = days.map((d) => ({ user_id: userId, day: d }));
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: "user_id,day",
  });
  return !error;
}
