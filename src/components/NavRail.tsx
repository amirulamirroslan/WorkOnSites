import { NavLink } from "react-router-dom";
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
};

export default function NavRail({ items }: { items: { to: string; label: string }[] }) {
  const { profile, signOut } = useAuth();

  return (
    <nav className="w-60 shrink-0 bg-gradient-to-b from-navy-800 to-navy-900 text-white h-screen sticky top-0 py-7 px-4 flex flex-col">
      <div className="flex items-center gap-2.5 px-2 mb-9">
        <img src="/logo.png" alt="" width={34} height={34} className="rounded-xl" aria-hidden />
        <span className="display text-lg font-extrabold tracking-tight">
          Work<span className="text-brand-light">O</span>nSite
        </span>
      </div>

      <div className="flex flex-col gap-1 overflow-y-auto">
        {items.map((item) => {
          const Icon = iconByLabel[item.label];
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end
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
    </nav>
  );
}
