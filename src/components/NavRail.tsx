import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  const { pathname } = useLocation();

  return (
    <>
      {/* Phone / tablet: slim top bar with a menu button; the sidebar becomes a drawer */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center gap-3 bg-navy-800 text-white px-4 py-3 shadow-soft">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="p-1 -ml-1 rounded-lg hover:bg-white/10">
          <Menu size={22} />
        </button>
        <img src="/logo.png" alt="" width={28} height={28} className="rounded-lg" aria-hidden />
        <span className="display font-extrabold tracking-tight">
          Work<span className="text-brand-light">O</span>nSite
        </span>
      </header>
      <AnimatePresence>
        {open && (
          <motion.div
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.nav
        initial={false}
        animate={{ x: open ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="fixed inset-y-0 left-0 z-50 w-64 lg:!translate-x-0 lg:static lg:!transform-none lg:sticky lg:top-0 lg:z-auto lg:w-60 lg:shrink-0 lg:h-screen bg-gradient-to-b from-navy-800 to-navy-900 text-white py-7 px-4 flex flex-col"
      >
        <div className="flex items-center gap-2.5 px-2 mb-9">
          <img src="/logo.png" alt="" width={34} height={34} className="rounded-xl" aria-hidden />
          <span className="display text-lg font-extrabold tracking-tight flex-1">
            Work<span className="text-brand-light">O</span>nSite
          </span>
          <button onClick={() => setOpen(false)} aria-label="Close menu" className="lg:hidden p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-1 overflow-y-auto">
          {items.map((item) => {
            const Icon = iconByLabel[item.label];
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${
                    isActive
                      ? "bg-brand text-white font-semibold shadow-glow"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                {Icon && <Icon size={18} strokeWidth={2} />}
                {item.label}
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
      </motion.nav>
    </>
  );
}
