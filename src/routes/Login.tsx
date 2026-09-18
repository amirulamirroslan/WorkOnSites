import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

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
    <div className="surface-dark min-h-screen flex flex-col justify-center items-center gap-6 px-6">
      <img src="/logo.png" alt="" width={64} height={64} className="rounded-2xl" aria-hidden />
      <h1 className="display text-xl font-semibold">WorkOnSite</h1>
      <p className="text-white/60 text-sm -mt-4">Field Operations Made Simple</p>

      <form onSubmit={handleSubmit} className="w-full max-w-xs flex flex-col gap-3">
        <input
          type="text"
          placeholder="Email or username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-card bg-navy-800 px-4 py-3 text-sm placeholder-white/30"
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-card bg-navy-800 px-4 py-3 text-sm placeholder-white/30"
          autoComplete="current-password"
        />
        {error && <p className="text-danger-500 text-xs">{error}</p>}
        <button type="submit" disabled={submitting} className="action-band disabled:opacity-40 mt-2">
          {submitting ? "Signing in…" : "Login"}
        </button>
      </form>

      <p className="text-white/50 text-xs">
        Setting up a new organization?{" "}
        <a href="/register" className="text-brand font-medium">Create an account</a>
      </p>
    </div>
  );
}
