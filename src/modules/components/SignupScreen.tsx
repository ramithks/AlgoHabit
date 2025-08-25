import React from "react";
import { signup } from "../localAuth";
import { useNavigate, Link } from "react-router-dom";

export const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res: any = await signup(email.trim(), password, confirm);
      if (res?.status === "confirmation_sent") {
        setEmailSent(true);
        return;
      }
      // If no email confirmation required, redirect to app
      navigate("/app", { replace: true });
    } catch (err: any) {
      setError(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center">
              <span className="text-2xl">✉️</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-200">
              Check Your Email
            </h1>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              We've sent a confirmation link to <strong>{email}</strong>. Click
              the link to verify your account and get started.
            </p>
          </div>

          <div className="bg-gray-900/70 p-4 rounded-xl ring-1 ring-gray-800 space-y-3">
            <p className="text-[11px] text-gray-300 text-center">
              After confirming your email, you'll be able to sign in and start
              your DSA journey.
            </p>
            <div className="text-center">
              <Link
                to="/login"
                className="text-[11px] text-accent hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>

          <div className="text-[10px] text-gray-500 text-center">
            Didn't receive the email? Check your spam folder.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-200 p-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-rose-400 bg-clip-text text-transparent">
            Start Your Journey
          </h1>
          <p className="text-[11px] text-gray-400">
            Create your account to begin mastering DSA
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
            <input
              type="password"
              required
              placeholder="Confirm Password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "Creating..." : "Create Account"}
          </button>

          <div className="text-[11px] text-gray-400 text-center">
            Already have an account?{" "}
            <Link to="/login" className="text-accent hover:underline">
              Sign in
            </Link>
          </div>
        </form>

        <div className="text-[10px] text-gray-500 text-center">
          Secure email signup via Supabase.
        </div>
      </div>
    </div>
  );
};
