import React from "react";
import { login } from "../localAuth";
import { useNavigate, Link } from "react-router-dom";

export const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      // Redirect to app - the ProtectedPro wrapper will handle Pro status check
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-[11px] text-gray-400">
            Sign in to continue your DSA journey
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-gray-900/70 p-5 rounded-xl ring-1 ring-gray-800 shadow"
        >
          <div className="space-y-3">
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
          </div>

          {error && (
            <div className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/30">
              {error}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full text-[12px] font-medium px-3 py-2 rounded bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <div className="text-[11px] text-gray-400 text-center">
            Need an account?{" "}
            <Link to="/signup" className="text-accent hover:underline">
              Create one
            </Link>
          </div>
        </form>

        <div className="text-[10px] text-gray-500 text-center">
          Secure email login via Supabase.
        </div>
      </div>
    </div>
  );
};
