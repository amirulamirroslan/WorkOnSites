import { NavLink, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ClipboardCheck, AlertTriangle, User } from "lucide-react";

const items = [
  { to: "/worker", label: "Home", Icon: Home },
  { to: "/worker/tasks", label: "Tasks", Icon: ClipboardCheck },
  { to: "/worker/report-issue", label: "Report", Icon: AlertTriangle },
  { to: "/worker/profile", label: "Profile", Icon: User },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const activeIndex = items.findIndex((i) => (i.to === "/worker" ? pathname === i.to : pathname.startsWith(i.to)));

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-2xl lg:hidden bg-white rounded-t-3xl shadow-[0_-6px_24px_rgba(10,42,94,0.12)] flex justify-around pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] z-40">
      {items.map(({ to, label, Icon }, i) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/worker"}
          className="relative flex flex-col items-center gap-1 text-[11px] font-medium px-4 py-1.5 rounded-xl"
        >
          {({ isActive }) => (
            <>
              {isActive && i === activeIndex && (
                <motion.span
                  layoutId="bottom-nav-pill"
                  className="absolute inset-0 bg-brand-50 rounded-xl -z-10"
                  transition={{ type: "spring", stiffness: 480, damping: 34 }}
                />
              )}
              <motion.span animate={{ scale: isActive ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 420, damping: 20 }}>
                <Icon size={21} strokeWidth={isActive ? 2.4 : 2} className={isActive ? "text-brand" : "text-ink-900/40"} />
              </motion.span>
              <span className={isActive ? "text-brand" : "text-ink-900/40"}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
