import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setSubmitting(true);

    // 1) Create the auth user.
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (signUpErr || !signUpData.user) {
      setSubmitting(false);
      setError(signUpErr?.message ?? "Could not create account");
      return;
    }

    // If email confirmation is required, there's no active session yet — the
    // org/profile inserts below need auth.uid(), so we can't finish until
    // they confirm and sign in. Point that out clearly instead of failing silently.
    if (!signUpData.session) {
      setSubmitting(false);
      setError(
        "Account created — check your email to confirm it, then log in. " +
          "(Your organization will be set up automatically on first login.)"
      );
      return;
    }

    // 2) Create the organization. Generate the id client-side and insert it
    // explicitly — chaining .select() here would read the row back under
    // RLS immediately after insert, and at this exact moment the user has
    // no profile yet, so current_org_id() is null and that read-back would
    // fail RLS, which Supabase reports as if the INSERT itself violated the
    // policy (it didn't — only the follow-up read would have).
    const orgId = crypto.randomUUID();
    const { error: orgErr } = await supabase.from("organizations").insert({ id: orgId, name: orgName });

    if (orgErr) {
      setSubmitting(false);
      setError(orgErr.message);
      return;
    }

    // 3) Create the owner profile (allowed by the bootstrap RLS policy since
    //    this brand-new org has no profiles yet).
    const { error: profileErr } = await supabase.from("profiles").insert({
      id: signUpData.user.id,
      organization_id: orgId,
      role: "owner",
      full_name: fullName,
    });

    setSubmitting(false);
    if (profileErr) {
      setError(profileErr.message);
      return;
    }

    navigate("/");
  }

  return (
    <AuthShell skyline="none">
      <div className="flex flex-col items-center text-center mb-8">
        <img src="/logo.png" alt="" width={56} height={56} className="rounded-2xl shadow-glow mb-3" aria-hidden />
        <h1 className="display text-xl font-semibold">Create your organization</h1>
        <p className="text-white/60 text-sm mt-1">Set up WorkOnSite for your team</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
        <input
          type="text"
          placeholder="Organization name"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          required
          className="input-dark"
        />
        <input
          type="text"
          placeholder="Your full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="input-dark"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="input-dark"
        />
        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
          className="input-dark"
        />
        {error && <p className="text-red-300 text-xs">{error}</p>}
        <button type="submit" disabled={submitting} className="action-band disabled:opacity-40 mt-2">
          {submitting ? "Creating…" : "Create account"}
        </button>
      </form>

      <p className="text-white/60 text-xs text-center mt-6">
        Already have an account? <a href="/login" className="text-brand-light font-semibold">Log in</a>
      </p>
    </AuthShell>
  );
}
