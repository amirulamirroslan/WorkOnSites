import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import AuthShell from "../components/AuthShell";

// One page, two situations:
//  - "recovery": an owner followed the emailed reset link (/reset-password).
//    Supabase signs them in from the link's token; they choose a new password.
//  - "forced": a team leader/worker signed in with a temporary password given
//    by their owner/leader (/set-password) and must replace it before using
//    the app.
export default function SetPassword({ mode }: { mode: "recovery" | "forced" }) {
  const navigate = useNavigate();
  const { session, loading, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) navigate("/", { replace: true });
  }, [done, navigate]);

  if (loading) return null;

  // Not signed in and no valid recovery session: the link is missing,
  // expired, or already used.
  if (!session) {
    if (mode === "forced") return <Navigate to="/login" replace />;
    return (
      <AuthShell skyline="none">
        <div className="flex flex-col items-center text-center mt-16">
          <h1 className="display text-xl font-semibold mb-2">Reset link expired</h1>
          <p className="text-white/70 text-sm mb-8">
            This password reset link is invalid or has already been used. Request a new one and try again.
          </p>
          <Link to="/forgot-password" className="action-band text-center">
            Request a new link
          </Link>
        </div>
      </AuthShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setSubmitting(true);
    const { error: updateErr } = await supabase.auth.updateUser({
      password,
      data: { must_change_password: false },
    });
    setSubmitting(false);
    if (updateErr) {
      setError(updateErr.message);
      return;
    }
    setDone(true);
  }

  return (
    <AuthShell skyline="none">
      <div className="flex flex-col items-center text-center mb-8 mt-4">
        <img src="/logo.png" alt="" width={56} height={56} className="rounded-2xl shadow-glow mb-3" aria-hidden />
        <h1 className="display text-xl font-semibold">
          {mode === "forced" ? "Choose a new password" : "Set a new password"}
        </h1>
        <p className="text-white/60 text-sm mt-1">
          {mode === "forced"
            ? "You signed in with a temporary password. Pick your own to continue."
            : "Enter a new password for your account."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="password"
          placeholder="New password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-dark"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="input-dark"
          autoComplete="new-password"
          required
        />
        {error && <p className="text-red-300 text-xs">{error}</p>}
        <button type="submit" disabled={submitting} className="action-band disabled:opacity-40 mt-2">
          {submitting ? "Saving…" : "Save password"}
        </button>
      </form>

      {mode === "forced" && (
        <button onClick={signOut} className="text-white/50 text-xs text-center mt-6">
          Sign out
        </button>
      )}
    </AuthShell>
  );
}
