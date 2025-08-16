import { supabase } from "../../lib/supabaseClient";

const TABLE = "topic_daily_notes";

export type NoteRow = {
  user_id: string;
  topic_id: string;
  day: string;
  note: string;
};

export async function listNotes(userId: string): Promise<NoteRow[]> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("user_id, topic_id, day, note")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data as any;
}

export async function upsertNotes(rows: NoteRow[]) {
  if (!rows.length) return true;
  const { error } = await supabase.from(TABLE).upsert(rows, {
    onConflict: "user_id,topic_id,day",
  });
  return !error;
}
