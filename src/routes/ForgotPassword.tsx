import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthShell, { Wordmark } from "../components/AuthShell";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const looksLikeUsername = email.trim() !== "" && !email.includes("@");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (looksLikeUsername) return;
    setSubmitting(true);
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setSubmitting(false);
    // Only surface real failures (e.g. rate limit). An unknown address gets
    // the same "sent" message, so the form can't be used to discover which
    // emails have accounts.
    if (resetErr && /rate|too many|limit/i.test(resetErr.message)) {
      setError("Too many requests — please wait a few minutes and try again.");
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell skyline="none" panel>
      <div className="flex flex-col items-center text-center mt-6 mb-8">
        <img src="/logo.png" alt="" width={56} height={56} className="rounded-2xl shadow-glow mb-3" aria-hidden />
        <Wordmark size="text-xl" />
        <p className="text-white/70 text-sm mt-2">Forgot your password?</p>
      </div>

      {sent ? (
        <div className="text-center">
          <p className="text-white/90 text-sm mb-2">
            If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset link is on its way.
          </p>
          <p className="text-white/60 text-xs mb-8">Check your inbox (and spam folder). The link opens a page where you can choose a new password.</p>
          <Link to="/login" className="action-light block text-center">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <p className="text-white/60 text-xs mb-1">
            Enter the email you registered with and we'll send you a reset link.
          </p>
          <input
            type="text"
            inputMode="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
            autoComplete="email"
            required
          />
          {looksLikeUsername && (
            <p className="text-amber-300 text-xs">
              That looks like a username. Workers and team leaders don't have a reset email — ask your team leader or
              owner to reset your password for you.
            </p>
          )}
          {error && <p className="text-red-300 text-xs">{error}</p>}
          <button type="submit" disabled={submitting || looksLikeUsername} className="action-band disabled:opacity-40 mt-2">
            {submitting ? "Sending…" : "Send reset link"}
          </button>
          <Link to="/login" className="text-white/60 text-xs text-center mt-4">
            Back to login
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
