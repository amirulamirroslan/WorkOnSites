import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Avatar } from "./MobileScreen";

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
}: {
  label: string;
  value: string;
  Icon?: LucideIcon;
  tone?: keyof typeof tones;
  sub?: string;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      {Icon && (
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${tones[tone]}`}>
          <Icon size={20} />
        </span>
      )}
      <div>
        <p className="font-display text-xl font-bold leading-none">{value}</p>
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

export function BarRow({ label, percent }: { label: string; percent: number }) {
  const color = percent >= 90 ? "bg-success-500" : "bg-brand";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-ink-900/70 font-medium">{label}</span>
        <span className="text-ink-900/50 font-semibold">{percent}%</span>
      </div>
      <div className="h-2 rounded-pill bg-cloud-100">
        <div className={`h-2 rounded-pill ${color}`} style={{ width: `${percent}%` }} />
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
