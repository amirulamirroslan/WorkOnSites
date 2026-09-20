import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "./MobileScreen";
import { useAnimatedNumber } from "../lib/useAnimatedNumber";

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

// Counts the number inside a value like "94%" or "12" up from 0, keeping any
// prefix/suffix. Anything it can't parse (e.g. "1,240") is shown as-is.
function AnimatedValue({ value, delay }: { value: string; delay: number }) {
  const m = value.match(/^(\D*?)(\d+(?:\.\d+)?)(\D*)$/);
  const shown = useAnimatedNumber(m ? parseFloat(m[2]) : 0, { delay });
  if (!m) return <>{value}</>;
  const decimals = m[2].includes(".") ? m[2].split(".")[1].length : 0;
  return (
    <>
      {m[1]}
      {shown.toFixed(decimals)}
      {m[3]}
    </>
  );
}

export function StatCard({
  label,
  value,
  Icon,
  tone = "brand",
  sub,
  delay = 0,
}: {
  label: string;
  value: string;
  Icon?: LucideIcon;
  tone?: keyof typeof tones;
  sub?: string;
  delay?: number;
}) {
  return (
    <div className="card p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
      {Icon && (
        <span className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      )}
      <div>
        <p className="font-display text-xl font-bold leading-none">
          <AnimatedValue value={value} delay={delay} />
        </p>
        <p className="text-xs text-ink-900/50 mt-1.5">{label}</p>
        {sub && <p className="text-[11px] text-ink-900/40">{sub}</p>}
      </div>
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`card p-5 ${className}`}>
      <h2 className="font-display font-semibold mb-4">{title}</h2>
      {children}
    </section>
  );
}

export function BarRow({ label, percent, delay = 0 }: { label: string; percent: number; delay?: number }) {
  const color = percent >= 90 ? "bg-success-500" : "bg-brand";
  // Bar and number share one eased value so they fill together.
  const shown = useAnimatedNumber(percent, { duration: 900, delay });
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-ink-900/70 font-medium">{label}</span>
        <span className="text-ink-900/50 font-semibold">{Math.round(shown)}%</span>
      </div>
      <div className="h-2 rounded-pill bg-cloud-100">
        <div className={`h-2 rounded-pill ${color}`} style={{ width: `${shown}%` }} />
      </div>
    </div>
  );
}

export function PersonRow({ name, sub, right, online }: { name: string; sub: string; right: ReactNode; online?: boolean }) {
  return (
    <div className="list-row">
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
    </div>
  );
}
