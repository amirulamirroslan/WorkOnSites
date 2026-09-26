import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Avatar } from "./MobileScreen";
import { AnimatedBar, CountUp, EASE } from "./Motion";

export function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
}

export function DateChip() {
  const d = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
  return <span className="text-xs font-medium bg-white border border-cloud-100 rounded-pill px-3.5 py-2 text-ink-900/70 shadow-soft">{d}</span>;
}

const tones = {
  brand: "bg-brand-50 text-brand",
  success: "bg-success-500/15 text-success-600",
  warning: "bg-warning-500/15 text-warning-500",
  danger: "bg-danger-500/10 text-danger-500",
};

export function StatCard({
  label,
  value,
  Icon,
  tone = "brand",
  sub,
  index = 0,
}: {
  label: string;
  value: string;
  Icon?: LucideIcon;
  tone?: keyof typeof tones;
  sub?: string;
  index?: number;
}) {
  // A number-only value (e.g. "18", "4") counts up; a value with a symbol
  // (e.g. "94%", "8/12") is left as-is since CountUp only handles numerics.
  const numeric = /^\d+$/.test(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.06, ease: EASE }}
      whileHover={{ y: -2 }}
      className="card p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4"
    >
      {Icon && (
        <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      )}
      <div>
        <p className="font-display text-xl font-bold leading-none">
          {numeric ? <CountUp value={parseInt(value, 10)} /> : value}
        </p>
        <p className="text-xs text-ink-900/50 mt-1.5">{label}</p>
        {sub && <p className="text-[11px] text-ink-900/40">{sub}</p>}
      </div>
    </motion.div>
  );
}

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
      className={`card p-5 ${className}`}
    >
      <h2 className="font-display font-semibold mb-4">{title}</h2>
      {children}
    </motion.section>
  );
}

export function BarRow({ label, percent }: { label: string; percent: number }) {
  const color = percent >= 90 ? "bg-success-500" : "bg-brand";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-ink-900/70 font-medium">{label}</span>
        <span className="text-ink-900/50 font-semibold">
          <CountUp value={percent} suffix="%" />
        </span>
      </div>
      <AnimatedBar percent={percent} color={color} className="h-2 rounded-pill bg-cloud-100 overflow-hidden" />
    </div>
  );
}

export function PersonRow({
  name,
  sub,
  right,
  online,
  index = 0,
}: {
  name: string;
  sub: string;
  right: ReactNode;
  online?: boolean;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: EASE }}
      className="list-row"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative">
          <Avatar name={name} size={36} />
          {online != null && (
            <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${online ? "bg-success-500" : "bg-danger-500"}`} />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{name}</p>
          <p className="text-xs text-ink-900/45 truncate">{sub}</p>
        </div>
      </div>
      <div className="text-xs text-ink-900/60 shrink-0">{right}</div>
    </motion.div>
  );
}
