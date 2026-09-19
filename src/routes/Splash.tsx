import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  return (
    <div className="surface-dark min-h-screen flex flex-col items-center justify-center px-8 text-center">
      <img src="/logo.png" alt="" width={88} height={88} className="rounded-3xl mb-8" aria-hidden />
      <h1 className="display text-3xl font-bold mb-2">WorkOnSite</h1>
      <p className="text-white/50 text-sm mb-16">Safer Sites. Better Work.</p>

      <button className="action-band w-full max-w-xs" onClick={() => navigate("/login")}>
        Get Started
      </button>

      <p className="text-white/30 text-xs mt-10">v1.0</p>
    </div>
  );
}
