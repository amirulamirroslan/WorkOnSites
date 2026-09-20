import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { NavLink, matchPath, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MapPin,
  Users,
  UserCog,
  ClipboardList,
  ListChecks,
  Clock,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Avatar } from "./MobileScreen";
import AnimatedLogo from "./AnimatedLogo";

const iconByLabel: Record<string, LucideIcon> = {
  Overview: LayoutDashboard,
  Dashboard: LayoutDashboard,
  Sites: MapPin,
  Workers: Users,
  Assignments: UserCog,
  Tasks: ClipboardList,
  Checklists: ListChecks,
  Attendance: Clock,
  Issues: AlertTriangle,
  Reports: BarChart3,
  Settings: Settings,
  Home: Home,
  Report: AlertTriangle,
  Profile: User,
};

export default function NavRail({ items }: { items: { to: string; label: string }[] }) {
  const { profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  // Sliding "selected" pill: one element that glides (with a little spring
  // overshoot) to whichever item is active, instead of each item fading its
  // own background in and out.
  const { pathname } = useLocation();
  const activeIndex = items.findIndex((item) => matchPath({ path: item.to, end: true }, pathname));
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [pill, setPill] = useState<{ top: number; height: number } | null>(null);

  const measure = useCallback(() => {
    const el = itemRefs.current[activeIndex];
    // display:none (e.g. the worker sidebar on a phone) measures as 0 — skip it.
    if (!el || el.offsetHeight === 0) {
      setPill(null);
      return;
    }
    const next = { top: el.offsetTop, height: el.offsetHeight };
    setPill((prev) => (prev && prev.top === next.top && prev.height === next.height ? prev : next));
  }, [activeIndex]);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    // Re-measure when the sidebar appears (breakpoint change) or fonts settle.
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  return (
    <>
      {/* Phone / tablet: slim top bar with a menu button; the sidebar becomes a drawer */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-navy-800 text-white px-4 py-3 shadow-soft">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 -ml-1 rounded-lg hover:bg-white/10">
          <Menu size={22} />
        </button>
        <AnimatedLogo size={28} glow={false} />
        <span className="display font-extrabold tracking-tight">
          Work<span className="text-brand-light">O</span>nSite
        </span>
      </header>
      {open && <div className="lg:hidden fixed inset-0 bg-black/50 z-40" onClick={() => setOpen(false)} />}

      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:sticky lg:top-0 lg:z-auto lg:w-60 lg:shrink-0 lg:h-screen bg-gradient-to-b from-navy-800 to-navy-900 text-white py-7 px-4 flex flex-col`}
      >
        <div className="flex items-center gap-2.5 px-2 mb-9">
          <AnimatedLogo size={34} glow={false} />
          <span className="display text-lg font-extrabold tracking-tight flex-1">
            Work<span className="text-brand-light">O</span>nSite
          </span>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="lg:hidden p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div ref={listRef} className="relative flex flex-col gap-1 overflow-y-auto">
          {pill && (
            <span
              aria-hidden
              className="nav-pill absolute left-0 right-0 top-0 rounded-xl bg-brand shadow-glow pointer-events-none"
              style={{ height: pill.height, transform: `translateY(${pill.top}px)` }}
            />
          )}
          {items.map((item, i) => {
            const Icon = iconByLabel[item.label];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                ref={(el) => {
                  itemRefs.current[i] = el;
                }}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `relative z-10 flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-light ${
                    isActive ? "text-white font-semibold" : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {Icon && (
                      // Re-keyed on activation so the pop plays once each time it's selected.
                      <span key={isActive ? "on" : "off"} className={`inline-flex ${isActive ? "nav-icon-pop" : ""}`}>
                        <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                      </span>
                    )}
                    {item.label}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-3 px-1">
          <Avatar name={profile?.full_name ?? ""} size={36} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium truncate">{profile?.full_name ?? ""}</p>
            <p className="text-[11px] text-white/50 capitalize">{profile?.role?.replace("_", " ")}</p>
          </div>
          <button onClick={signOut} title="Sign out" aria-label="Sign out" className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10">
            <LogOut size={17} />
          </button>
        </div>
      </nav>
    </>
  );
}
