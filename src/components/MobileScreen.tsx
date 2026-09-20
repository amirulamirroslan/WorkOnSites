import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Shared shell for every worker (mobile) screen, matching the mockups: a
// deep-navy gradient header area with the page title, and a light rounded
// "sheet" sliding up over it that holds the content. On a wide screen the
// whole thing is centred in a phone-width column.
export default function MobileScreen({
  header,
  children,
  navSpace = true,
  sheetClassName = "",
}: {
  header: ReactNode;
  children: ReactNode;
  navSpace?: boolean;
  sheetClassName?: string;
}) {
  return (
    <div className="bg-navy-950 min-h-screen">
      <div className="mobile-bg text-white min-h-screen max-w-md mx-auto flex flex-col shadow-2xl">
        <div className="px-5 pt-10 pb-7">{header}</div>
        <div
          className={`flex-1 bg-cloud-50 text-ink-900 rounded-t-xl2 px-5 pt-6 ${
            navSpace ? "pb-28" : "pb-8"
          } ${sheetClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Dark full-height screen (no light sheet) — camera + success screens.
export function DarkScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="bg-navy-950 min-h-screen">
      <div className={`mobile-bg text-white min-h-screen max-w-md mx-auto flex flex-col shadow-2xl ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function ScreenTitle({
  title,
  back,
  right,
}: {
  title: string;
  back?: boolean | string;
  right?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-3">
      {back && (
        <button
          onClick={() => (typeof back === "string" ? navigate(back) : navigate(-1))}
          className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center text-white/90 active:bg-white/10"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="display text-lg font-semibold flex-1">{title}</h1>
      {right}
    </div>
  );
}

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name.trim()
    ? name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";
  return (
    <div
      className="rounded-full bg-gradient-to-br from-brand-light to-brand flex items-center justify-center font-display font-semibold text-white shrink-0 ring-2 ring-white/20"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {initials}
    </div>
  );
}

export function SitePill({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs bg-white/10 border border-white/15 rounded-pill px-2.5 py-1 text-white/90">
      <span className="w-1.5 h-1.5 rounded-full bg-brand-light" />
      {name}
    </span>
  );
}

export function StepTracker({ current, dark = false }: { current: 0 | 1 | 2; dark?: boolean }) {
  const steps = ["Location", "Face", "Confirm"];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-5 h-5 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                  done || active
                    ? "bg-brand text-white"
                    : dark
                    ? "bg-white/10 text-white/50 border border-white/20"
                    : "bg-cloud-100 text-ink-900/40"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  active ? (dark ? "text-white" : "text-ink-900") : dark ? "text-white/50" : "text-ink-900/40"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && <span className={`flex-1 h-px ${dark ? "bg-white/15" : "bg-cloud-100"}`} />}
          </div>
        );
      })}
    </div>
  );
}
