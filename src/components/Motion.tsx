import { ReactNode, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, type Variants } from "framer-motion";

// Shared easing — a gentle "arrive and settle" curve used across the app
// instead of framer's default, so every transition feels like the same hand
// drew it.
export const EASE = [0.22, 1, 0.36, 1] as const;

// Wraps a page's content so it fades/rises in on mount. Used directly by
// pages that render their own root element, and by MobileScreen/DarkScreen
// so every worker screen gets it for free. When wrapping a persistent
// <Outlet/> (owner/team-leader layouts), pass a `routeKey` (the pathname) so
// React remounts this on every navigation and the animation replays.
export function PageFade({
  children,
  className,
  routeKey,
}: {
  children: ReactNode;
  className?: string;
  routeKey?: string;
}) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } },
};
const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: EASE } },
};

// A list whose rows fade/rise in one after another — used for task lists,
// worker lists, and any other repeated-row content.
export function StaggerList({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerParent} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// A progress bar that animates its own width in from 0 on mount/update.
export function AnimatedBar({ percent, className, color }: { percent: number; className?: string; color?: string }) {
  return (
    <div className={className}>
      <motion.div
        className={`h-full rounded-pill ${color ?? ""}`}
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: EASE }}
      />
    </div>
  );
}

// A number that counts up to its target whenever the target changes.
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const rounded = useTransform(spring, (v) => `${Math.round(v)}${suffix}`);
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  return <motion.span>{rounded}</motion.span>;
}

// A checkmark that pops in with a small spring/rotate flourish — used for
// completed tasks, checklist items and success screens.
export function PopCheck({ size = 14, strokeWidth = 3 }: { size?: number; strokeWidth?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      initial={{ scale: 0, rotate: -35, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
    >
      <motion.path
        d="M4 12.5L9.5 18L20 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.28, delay: 0.05, ease: EASE }}
      />
    </motion.svg>
  );
}

// Grey shimmering placeholder block for loading states.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton-shimmer rounded-lg bg-cloud-100 ${className}`} />;
}

// A handful of shimmering placeholder rows shaped like the real list-row
// content that's about to load in — used in place of a plain "Loading…"
// line on Workers/Sites/Tasks/Attendance/Checklists. `variant="compact"`
// drops the list-row's own padding for rows already inside a modal that
// supplies its own spacing (e.g. the site-assignment / checklist-item lists).
export function SkeletonRows({
  count = 3,
  avatar = false,
  trailing = "text",
  variant = "list",
}: {
  count?: number;
  avatar?: boolean;
  trailing?: "text" | "chip" | "none";
  variant?: "list" | "compact";
}) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={variant === "list" ? "list-row px-4" : "flex items-center justify-between py-2 border-b border-black/5 last:border-0"}>
          <div className="flex items-center gap-3 min-w-0">
            {avatar && <Skeleton className="w-9 h-9 rounded-full shrink-0" />}
            <div className="min-w-0 space-y-2 py-0.5">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          {trailing !== "none" &&
            (trailing === "chip" ? (
              <Skeleton className="h-7 w-24 rounded-lg shrink-0" />
            ) : (
              <Skeleton className="h-3 w-12 shrink-0" />
            ))}
        </div>
      ))}
    </div>
  );
}

// Backdrop + panel wrapper for modals — fades the scrim and pops/slides the
// panel in. Always render this inside <AnimatePresence> at the call site so
// it can animate back out when dismissed.
export function ModalBackdrop({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ duration: 0.22, ease: EASE }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

export { motion, useMotionValue };
