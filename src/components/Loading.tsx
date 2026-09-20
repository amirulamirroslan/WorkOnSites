import AnimatedLogo from "./AnimatedLogo";

// Small inline spinner (buttons, map placeholders, modals).
export function Spinner({ size = 18, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      className={`orbit-spin ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      role="status"
      aria-label="Loading"
    >
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// Full-screen branded loader for the app's cold start / auth check — this
// used to render `null`, i.e. a blank screen. Fades in after 200ms so a fast
// auth check never flashes it.
export function LoadingScreen() {
  return (
    <div role="status" aria-live="polite" className="mobile-bg min-h-screen flex items-center justify-center">
      <div className="load-reveal relative flex items-center justify-center" style={{ width: 132, height: 132 }}>
        <svg className="orbit-spin absolute inset-0" viewBox="0 0 132 132" fill="none" aria-hidden>
          <circle cx="66" cy="66" r="62" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
          <circle
            cx="66"
            cy="66"
            r="62"
            stroke="#4C9BFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="110 280"
          />
        </svg>
        <span className="logo-breathe">
          <AnimatedLogo size={72} animated={false} />
        </span>
      </div>
      <span className="sr-only">Loading</span>
    </div>
  );
}

// In-layout loader (lazy routes, etc.) — keeps the sidebar visible around it.
export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="load-reveal flex items-center justify-center gap-3 py-24 text-brand">
      <Spinner size={22} />
      <span className="text-sm text-ink-900/50">{label}…</span>
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  // Tailwind orders `rounded-full` before `rounded-lg` in the generated CSS, so
  // adding both would make the default win — only apply the default radius
  // when the caller didn't pass one.
  const radius = /(^|\s)rounded/.test(className) ? "" : "rounded-lg";
  return <div aria-hidden className={`skeleton ${radius} ${className}`} />;
}

// Rows for owner / team-leader list cards (workers, sites, attendance…).
export function ListSkeleton({ rows = 4, compact = false }: { rows?: number; compact?: boolean }) {
  return (
    <div role="status" aria-busy="true" className={compact ? "space-y-3 py-1" : "px-4 py-4 space-y-4"}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}

// Rows shaped like the worker's task rows (status circle + title/subtitle).
// Returns a fragment so a parent `divide-y` card draws the separators.
export function TaskRowsSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5" aria-hidden>
          <Skeleton className="w-6 h-6 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2.5 w-1/4" />
          </div>
        </div>
      ))}
      <span className="sr-only" role="status">
        Loading tasks
      </span>
    </>
  );
}

export function CardGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-busy="true" className="grid grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-card" />
      ))}
      <span className="sr-only">Loading</span>
    </div>
  );
}
