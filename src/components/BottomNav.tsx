import { NavLink } from "react-router-dom";

const items = [
  { to: "/worker", label: "Home", icon: "⌂" },
  { to: "/worker/tasks", label: "Tasks", icon: "☑" },
  { to: "/worker/report-issue", label: "Report", icon: "!" },
  { to: "/worker/profile", label: "Profile", icon: "●" },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-navy-800 border-t border-white/10 flex justify-around py-2">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/worker"}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs px-3 py-1 ${isActive ? "text-brand" : "text-white/40"}`
          }
        >
          <span>{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
