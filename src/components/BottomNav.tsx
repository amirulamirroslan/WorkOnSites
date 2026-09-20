import { NavLink } from "react-router-dom";
import { Home, ClipboardCheck, AlertTriangle, User } from "lucide-react";

const items = [
  { to: "/worker", label: "Home", Icon: Home },
  { to: "/worker/tasks", label: "Tasks", Icon: ClipboardCheck },
  { to: "/worker/report-issue", label: "Report", Icon: AlertTriangle },
  { to: "/worker/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white rounded-t-3xl shadow-[0_-6px_24px_rgba(10,42,94,0.12)] flex justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/worker"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] font-medium px-4 py-1.5 rounded-xl transition-colors ${
              isActive ? "text-brand" : "text-ink-900/40"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={21} strokeWidth={isActive ? 2.4 : 2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
