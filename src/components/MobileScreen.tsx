import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Shared shell for every worker screen.
//
// Phone (matches the mockups): a deep-navy gradient header with a light
// rounded "sheet" sliding up over it.
// Laptop: `navSpace` screens (Home/Tasks/Report/Profile — they live inside
// the worker layout that provides the left sidebar) become a navy header
// card over a light page with the content in a wide area; standalone flows
// (clock-in, checklist, clock-out) become a centred card.
export default function MobileScreen({
  header,
  children,
  navSpace = true,
  wide = false,
  sheetClassName = "",
}: {
  header: ReactNode;
  children: ReactNode;
  navSpace?: boolean;
  wide?: boolean;
  sheetClassName?: string;
}) {
  if (navSpace) {
    return (
      <div className="min-h-screen bg-navy-950 lg:bg-cloud-50">
        <div className="mobile-bg lg:bg-none text-white min-h-screen flex flex-col md:max-w-2xl md:mx-auto lg:max-w-6xl lg:min-h-0 lg:px-8 lg:pt-8 lg:pb-10">
          <div className="px-5 pt-10 pb-7 lg:mobile-bg lg:rounded-2xl lg:px-8 lg:py-8 lg:shadow-soft">{header}</div>
          <div
            className={`flex-1 bg-cloud-50 text-ink-900 rounded-t-xl2 px-5 pt-6 pb-28 lg:flex-none lg:bg-transparent lg:rounded-none lg:px-0 lg:pt-6 lg:pb-0 ${
              wide ? "" : "lg:max-w-3xl"
            } ${sheetClassName}`}
          >
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <StandaloneFrame>
      <div className="px-5 pt-10 pb-7 md:px-8">{header}</div>
      <div className={`flex-1 bg-cloud-50 text-ink-900 rounded-t-xl2 px-5 pt-6 pb-8 md:px-8 ${sheetClassName}`}>{children}</div>
    </StandaloneFrame>
  );
}

// Centred "card" frame for standalone flows on a laptop; edge-to-edge on phones.
function StandaloneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className="bg-navy-950 md:mobile-bg min-h-screen md:flex md:items-center md:justify-center md:py-8">
      <div
        className={`mobile-bg text-white min-h-screen flex flex-col w-full md:max-w-xl md:min-h-[640px] md:rounded-3xl md:overflow-hidden md:shadow-2xl md:border md:border-white/10 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

// Dark full-height screen (no light sheet) — camera + success screens.
export function DarkScreen({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <StandaloneFrame className={className}>{children}</StandaloneFrame>;
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
