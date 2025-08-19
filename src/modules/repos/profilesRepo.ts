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

export type Profile = {
  id: string;
  email?: string | null;
  username?: string | null;
  full_name?: string | null;
  is_public?: boolean | null;
};

export async function getProfileById(userId: string): Promise<Profile | null> {
  const { data } = await supabase
    .from(TABLE)
    .select("id,email,username,full_name,is_public,updated_at,created_at")
    .eq("id", userId)
    .maybeSingle();
  return (data as any) || null;
}

export async function getProfileByUsername(
  username: string
): Promise<Profile | null> {
  const { data } = await supabase
    .from(TABLE)
    .select("id,email,username,full_name,is_public,updated_at,created_at")
    .ilike("username", username)
    .maybeSingle();
  return (data as any) || null;
}

export async function updateProfile(userId: string, patch: Partial<Profile>) {
  try {
    // Debug: log outgoing patch (non-sensitive fields only)
    // eslint-disable-next-line no-console
    console.debug("updateProfile", { userId, patch });
    const { error } = await supabase.from(TABLE).update(patch).eq("id", userId);
    if (error) {
      // eslint-disable-next-line no-console
      console.error("updateProfile error", {
        message: (error as any)?.message,
        details: (error as any)?.details,
        hint: (error as any)?.hint,
        code: (error as any)?.code,
      });
    }
    return { ok: !error, error } as {
      ok: boolean;
      error: {
        message?: string;
        details?: string;
        hint?: string;
        code?: string;
      } | null;
    };
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("updateProfile exception", e);
    return { ok: false, error: { message: e?.message || String(e) } };
  }
}

export function randomUsername(seed?: string) {
  const adjectives = [
    "swift",
    "brave",
    "clever",
    "calm",
    "bright",
    "bold",
    "eager",
    "keen",
  ];
  const nouns = [
    "coder",
    "algo",
    "byte",
    "stack",
    "graph",
    "tree",
    "array",
    "heap",
  ];
  const a = adjectives[Math.floor(Math.random() * adjectives.length)];
  const n = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999)
    .toString()
    .padStart(2, "0");
  const base = `${a}-${n}-${num}`;
  return (seed ? `${base}` : base).toLowerCase();
}
