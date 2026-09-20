import { useNavigate } from "react-router-dom";
import AuthShell, { Wordmark } from "../components/AuthShell";

export default function Splash() {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center mt-10">
        <img src="/logo.png" alt="" width={84} height={84} className="rounded-3xl shadow-glow mb-6" aria-hidden />
        <Wordmark />
        <p className="text-white/70 text-sm mt-2">Safer Sites. Better Work.</p>
      </div>

      <div className="mt-auto flex flex-col gap-3">
        <button className="action-band" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="action-light" onClick={() => navigate("/register")}>
          Sign Up
        </button>
        <p className="text-white/50 text-xs text-center mt-3">
          Forgot password? Ask your team leader or owner to reset it.
        </p>
      </div>
    </AuthShell>
  );
}
