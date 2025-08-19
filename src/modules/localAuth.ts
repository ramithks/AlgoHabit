// Supabase Email Auth wrappers + validation
import { getSupabase } from "../lib/supabaseClient";
import { setActiveUser } from "./state";

export type ActiveUser = { id: string; email?: string | null };

const ACTIVE_KEY = "dsa-auth-active-user";

function validateEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) throw new Error("Enter a valid email address");
}

export function validatePassword(password: string) {
  if (!password || password.length < 8)
    throw new Error("Min 8 characters required");
  if (!/[a-z]/.test(password)) throw new Error("Include a lowercase letter");
  if (!/[A-Z]/.test(password)) throw new Error("Include an uppercase letter");
  if (!/[0-9]/.test(password)) throw new Error("Include a digit");
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password))
    throw new Error("Include a symbol");
}

export function getActiveUser(): ActiveUser | null {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (!id) return null;
  return { id };
}

export async function signup(
  email: string,
  password: string,
  confirm?: string
) {
  email = email.trim();
  validateEmail(email);
  validatePassword(password);
  if (confirm != null && password !== confirm)
    throw new Error("Passwords do not match");
  const supabase = getSupabase();
  const { error, data } = await supabase.auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // If email confirmation is enabled, data.session will be null.
  if (!data.session) {
    // Username will be auto-assigned on first login after confirmation.
    return { status: "confirmation_sent" as const };
  }
  const uid = data.session.user.id;
  localStorage.setItem(ACTIVE_KEY, uid);
  setActiveUser(uid);
  return {
    status: "ok" as const,
    user: { id: uid, email } satisfies ActiveUser,
  };
}

export async function login(email: string, password: string) {
  email = email.trim();
  validateEmail(email);
  if (!password) throw new Error("Password is required");
  const supabase = getSupabase();
  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(error.message);
  const uid = data.user?.id;
  if (uid) {
    localStorage.setItem(ACTIVE_KEY, uid);
    setActiveUser(uid);
  }
  return { id: uid || "", email } satisfies ActiveUser;
}

export async function logout() {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  localStorage.removeItem(ACTIVE_KEY);
  setActiveUser("shared");
}
