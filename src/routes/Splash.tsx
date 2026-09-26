import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import AuthShell, { Wordmark } from "../components/AuthShell";

export default function Splash() {
  const navigate = useNavigate();

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center mt-10 md:mt-0">
        <motion.img
          src="/logo.png"
          alt=""
          width={84}
          height={84}
          className="rounded-3xl shadow-glow mb-6 animate-floaty"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          aria-hidden
        />
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }}>
          <Wordmark size="text-3xl md:text-2xl" />
          <p className="text-white/70 text-sm mt-2 text-center">Safer Sites. Better Work.</p>
        </motion.div>
      </div>

      <div className="mt-auto md:mt-12 flex flex-col gap-3">
        <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="action-band" onClick={() => navigate("/login")}>
          Login
        </motion.button>
        <motion.button whileTap={{ scale: 0.96 }} whileHover={{ y: -2 }} className="action-light" onClick={() => navigate("/register")}>
          Sign Up
        </motion.button>
        <button className="text-white/60 text-xs text-center mt-3" onClick={() => navigate("/forgot-password")}>
          Forgot password?
        </button>
      </div>
    </AuthShell>
  );
}
