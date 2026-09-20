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
    <nav className="fixed bottom-0 inset-x-0 bg-navy-800/95 backdrop-blur border-t border-white/10 flex justify-around py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))]">
      {items.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/worker"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-[11px] px-4 py-1.5 rounded-xl transition-colors ${
              isActive ? "text-brand" : "text-white/40"
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
