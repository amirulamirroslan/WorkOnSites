import { NavLink } from "react-router-dom";

export default function NavRail({ items }: { items: { to: string; label: string }[] }) {
  return (
    <nav className="w-56 shrink-0 border-r border-black/5 bg-white h-screen sticky top-0 py-8 px-4">
      <p className="font-display text-lg font-semibold text-ink-900 px-2 mb-8">WorkOnSite</p>
      <div className="flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end
            className={({ isActive }) =>
              `px-3 py-2 rounded-lg text-sm ${isActive ? "bg-brand/10 text-brand font-medium" : "text-ink-900/60 hover:bg-black/5"}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
