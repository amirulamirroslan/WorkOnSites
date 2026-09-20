import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthShell, { Wordmark } from "../components/AuthShell";
import AnimatedLogo from "../components/AnimatedLogo";

export default function Login() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError(error);
      return;
    }
    // Role-aware redirect happens in <RoleRedirect /> once the profile loads.
    navigate("/");
  }

  return (
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
  );
}
