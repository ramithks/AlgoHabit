import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { setActiveUser } from "../modules/state";
// Database types are sourced from generated file which initially re-exports minimal types.
import type { Database } from "../types";

// In Vite, env vars must be prefixed with VITE_ to be exposed to the client.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear error early in dev; avoid crashing in production builds.
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env."
  );
}

let client: SupabaseClient<Database> | null = null;

export function initSupabase() {
  if (client) return client;
  client = createClient<Database>(supabaseUrl ?? "", supabaseAnonKey ?? "");
  // Keep local active user prefix aligned with Supabase Auth session
  try {
    client.auth.onAuthStateChange(async (_event, session) => {
      const uid = session?.user?.id ?? null;
      if (uid) {
        localStorage.setItem("dsa-auth-active-user", uid);
        setActiveUser(uid);
      } else {
        localStorage.removeItem("dsa-auth-active-user");
        setActiveUser("shared");
      }
    });
  } catch {}
  return client;
}

export function getSupabase(): SupabaseClient<Database> {
  if (!client) initSupabase();
  return client as SupabaseClient<Database>;
}

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const c = getSupabase() as any;
    return c[prop as any];
  },
});
