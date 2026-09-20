import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import AuthShell, { Wordmark } from "../components/AuthShell";
import AnimatedLogo from "../components/AnimatedLogo";
import PdpaConsentModal from "../components/PdpaConsentModal";

// Device-level gate so returning users on the same device/browser aren't
// re-prompted every login. The actual consent record lives on the account
// (profiles.pdpa_accepted_at, written below) as the audit trail.
const PDPA_STORAGE_KEY = "workonsite_pdpa_accepted";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPdpa, setShowPdpa] = useState(() => localStorage.getItem(PDPA_STORAGE_KEY) !== "true");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (showPdpa) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    if (error) {
      setSubmitting(false);
      setError(error);
      return;
    }
    // Best-effort audit record — only writes once, the first time this
    // account ever accepts (subsequent logins on the same device don't
    // re-show the modal, so this update is a no-op after the first time).
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await supabase
        .from("profiles")
        .update({ pdpa_accepted_at: new Date().toISOString() })
        .eq("id", data.user.id)
        .is("pdpa_accepted_at", null);
    }
    setSubmitting(false);
    // Role-aware redirect happens in <RoleRedirect /> once the profile loads.
    navigate("/");
  }

  function acceptPdpa() {
    localStorage.setItem(PDPA_STORAGE_KEY, "true");
    setShowPdpa(false);
  }

  return (
    <>
      {showPdpa && <PdpaConsentModal onAccept={acceptPdpa} />}
      <AuthShell skyline="bottom" panel>
        <div className="flex flex-col items-center text-center mt-6">
          <AnimatedLogo size={64} className="mb-4" />
          <Wordmark size="text-xl" />
          <p className="text-white/70 text-sm mt-1">Welcome back — sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full mt-auto md:mt-8 flex flex-col gap-3">
          <input
            type="text"
            placeholder="Email or username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-dark"
            autoComplete="username"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-dark"
            autoComplete="current-password"
          />
          {error && <p className="text-red-300 text-xs">{error}</p>}
          <div className="text-right -mt-1">
            <Link to="/forgot-password" className="text-brand-light text-xs font-medium">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={submitting} className="action-band disabled:opacity-40 mt-1">
            {submitting ? "Signing in…" : "Login"}
          </button>
          <p className="text-white/60 text-xs text-center mt-4">
            Setting up a new organization?{" "}
            <a href="/register" className="text-brand-light font-semibold">Create an account</a>
          </p>
        </form>
      </AuthShell>
    </>
  );
}
