// Local-only pseudo authentication (NOT for production security).
// Provides signup, login, logout with per-user namespaced localStorage state.
// NO server, NO third-party services.

import { setActiveUser } from "./state";

interface StoredUser {
  id: string; // slug / uuid-like (email sanitized)
  email: string;
  passHash: string; // salted SHA-256
  salt: string;
  createdAt: string;
  lastLogin?: string;
}

const USERS_KEY = "dsa-auth-users";
const ACTIVE_KEY = "dsa-auth-active-user";

function loadUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getActiveUser(): StoredUser | null {
  const id = localStorage.getItem(ACTIVE_KEY);
  if (!id) return null;
  return loadUsers().find((u) => u.id === id) || null;
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder().encode(password + salt);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signup(email: string, password: string) {
  const users = loadUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  const salt = Math.random().toString(36).slice(2, 10);
  const passHash = await hashPassword(password, salt);
  const id = email.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const user: StoredUser = {
    id,
    email,
    salt,
    passHash,
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveUsers(users);
  localStorage.setItem(ACTIVE_KEY, id);
  setActiveUser(id);
  return user;
}

export async function login(email: string, password: string) {
  const users = loadUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error("Invalid credentials");
  const passHash = await hashPassword(password, user.salt);
  if (passHash !== user.passHash) throw new Error("Invalid credentials");
  user.lastLogin = new Date().toISOString();
  saveUsers(users);
  localStorage.setItem(ACTIVE_KEY, user.id);
  setActiveUser(user.id);
  return user;
}

export function logout() {
  localStorage.removeItem(ACTIVE_KEY);
  setActiveUser("shared");
}

export function listUsers(): StoredUser[] {
  return loadUsers();
}
