import { supabase } from "../../lib/supabaseClient";

const TABLE = "profiles";

export async function hasProfile(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  return !!data?.id;
}
