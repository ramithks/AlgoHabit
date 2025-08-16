import React from "react";
import { signup, login } from "../localAuth";

export const AuthScreen: React.FC<{ onAuthed: (u: any) => void }> = ({
  onAuthed,
}) => {
  const [mode, setMode] = React.useState<"login" | "signup">("signup");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [info, setInfo] = React.useState<string | null>(null);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const res: any = await signup(email.trim(), password, confirm);
        if (res?.status === "confirmation_sent") {
          setInfo("Check your inbox to confirm your email before signing in.");
          return;
        }
        onAuthed(res.user);
      } else {
        const user = await login(email.trim(), password);
        onAuthed(user);
      }
    } catch (err: any) {
      setError(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
            AlgoHabit
          </h1>
          <p className="text-[11px] text-gray-400">
            Sign in with your email. Your data is cloud‑synced and private.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="space-y-4 bg-gray-900/70 p-5 rounded-xl ring-1 ring-gray-800 shadow"
        >
          <div className="space-y-2">
            <input
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
            />
            <input
              type="password"
              required
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
            />
            {mode === "signup" && (
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-gray-800/60 rounded px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-accent placeholder-gray-500"
              />
            )}
          </div>
          {info && (
            <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/30">
              {info}
            </div>
          )}
          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30">
              {error}
            </div>
          )}
          <button
            disabled={loading}
            className="w-full text-[12px] font-medium px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 disabled:opacity-50"
          >
            {loading
              ? mode === "signup"
                ? "Creating..."
                : "Signing in..."
              : mode === "signup"
              ? "Create Account"
              : "Sign In"}
          </button>
          <div className="text-[11px] text-gray-400 text-center">
            {mode === "signup" ? (
              <>
                Already have an account? {""}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-accent hover:underline"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Need an account? {""}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-accent hover:underline"
                >
                  Create one
                </button>
              </>
            )}
          </div>
        </form>
        <div className="text-[10px] text-gray-500 text-center">
          Secure email login via Supabase.
        </div>
      </div>
    </div>
  );
};
