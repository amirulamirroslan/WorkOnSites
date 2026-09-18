import { Outlet } from "react-router-dom";
import NavRail from "../../components/NavRail";
import { liveWorkers, sitePerformance, ownerKpis } from "../../lib/mockData";

const navItems = [
  { to: "/owner", label: "Dashboard" },
  { to: "/owner/sites", label: "Sites" },
  { to: "/owner/workers", label: "Workers" },
  { to: "/owner/assignments", label: "Assignments" },
  { to: "/owner/tasks", label: "Tasks" },
  { to: "/owner/checklists", label: "Checklists" },
  { to: "/owner/attendance", label: "Attendance" },
  { to: "/owner/issues", label: "Issues" },
  { to: "/owner/reports", label: "Reports" },
  { to: "/owner/settings", label: "Settings" },
];

export function OwnerLayout() {
  return (
    <div className="surface-light flex min-h-screen">
      <NavRail items={navItems} />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function OwnerDashboard() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Operations Overview</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Attendance" value={ownerKpis.attendance} />
        <Stat label="Task Completion" value={ownerKpis.taskCompletion} />
        <Stat label="Sites Active" value={String(ownerKpis.sitesActive)} />
        <Stat label="High Priority Issues" value={String(ownerKpis.highPriorityIssues)} tone="danger" />
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div>
          <p className="text-sm font-medium text-ink-900/60 mb-2">Site Performance</p>
          <div className="bg-white rounded-card border border-black/5 p-4 space-y-3">
            {sitePerformance.map((s) => (
              <div key={s.site}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-900/70">{s.site}</span>
                  <span className="text-ink-900/50">{s.percent}%</span>
                </div>
                <div className="h-1.5 rounded-pill bg-black/5">
                  <div className="h-1.5 rounded-pill bg-brand" style={{ width: `${s.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-ink-900/60 mb-2">Live Workers</p>
          <div className="bg-white rounded-card border border-black/5">
            {liveWorkers.map((w) => (
              <div key={w.id} className="list-row px-4">
                <div>
                  <p className="font-medium text-sm">{w.name}</p>
                  <p className="text-xs text-ink-900/50">{w.site}</p>
                </div>
                <span className={`text-xs ${w.status === "on_site" ? "text-success-500" : "text-ink-900/40"}`}>
                  {w.status === "on_site" ? "On site" : "Not clocked in"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  const color = tone === "danger" ? "text-danger-500" : "text-ink-900";
  return (
    <div className="bg-white rounded-card border border-black/5 p-4">
      <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-ink-900/50">{label}</p>
    </div>
  );
}
