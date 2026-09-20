import { NavLink, matchPath, useLocation } from "react-router-dom";
import { Home, ClipboardCheck, AlertTriangle, User } from "lucide-react";

const items = [
  { to: "/worker", label: "Home", Icon: Home },
  { to: "/worker/tasks", label: "Tasks", Icon: ClipboardCheck },
  { to: "/worker/report-issue", label: "Report", Icon: AlertTriangle },
  { to: "/worker/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const activeIndex = items.findIndex(({ to }) => matchPath({ path: to, end: true }, pathname));

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-2xl lg:hidden bg-white rounded-t-3xl shadow-[0_-6px_24px_rgba(10,42,94,0.12)] px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40">
      {/* Equal-width columns so the sliding highlight is just translateX(index * 100%). */}
      <div className="relative grid grid-cols-4">
        {activeIndex >= 0 && (
          <span
            aria-hidden
            className="nav-pill absolute inset-y-0 left-0 w-1/4 px-1 pointer-events-none"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <span className="block h-full w-full rounded-2xl bg-brand-50" />
          </span>
        )}
        {items.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `relative z-10 flex flex-col items-center gap-1 text-[11px] py-2 rounded-2xl transition-[color,transform] duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
                isActive ? "text-brand font-semibold" : "text-ink-900/40 font-medium"
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Re-keyed on activation so the pop plays once each time it's selected. */}
                <span key={isActive ? "on" : "off"} className={`inline-flex ${isActive ? "nav-icon-pop" : ""}`}>
                  <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
