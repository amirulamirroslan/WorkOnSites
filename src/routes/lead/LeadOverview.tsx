import { Outlet } from "react-router-dom";
import NavRail from "../../components/NavRail";
import { liveWorkers } from "../../lib/mockData";

const navItems = [
  { to: "/lead", label: "Overview" },
  { to: "/lead/sites", label: "Sites" },
  { to: "/lead/workers", label: "Workers" },
  { to: "/lead/attendance", label: "Attendance" },
  { to: "/lead/issues", label: "Issues" },
  { to: "/lead/reports", label: "Reports" },
];

export function LeadLayout() {
  return (
    <div className="surface-light flex min-h-screen">
      <NavRail items={navItems} />
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function LeadOverview() {
  const onSite = liveWorkers.filter((w) => w.status === "on_site").length;
  const late = 1; // wire from real attendance vs. scheduled shift start once backend is connected
  const absent = liveWorkers.filter((w) => w.status === "not_clocked_in").length;

  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Team Overview</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Total Workers" value={String(liveWorkers.length)} />
        <Stat label="On Site" value={String(onSite)} />
        <Stat label="Late" value={String(late)} tone="warning" />
        <Stat label="Absent" value={String(absent)} tone="danger" />
      </div>

      <p className="text-sm font-medium text-ink-900/60 mb-2">Live Workers</p>
      <div className="bg-white rounded-card border border-black/5">
        {liveWorkers.map((w) => (
          <div key={w.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{w.name}</p>
              <p className="text-xs text-ink-900/50">
                {w.site} {w.clockedInAt ? `· ${w.clockedInAt}` : "· Not clocked in"}
              </p>
            </div>
            <span className="text-xs text-ink-900/60">{w.tasksDone}/{w.tasksTotal} tasks</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warning" | "danger" }) {
  const color = tone === "warning" ? "text-warning-500" : tone === "danger" ? "text-danger-500" : "text-ink-900";
  return (
    <div className="bg-white rounded-card border border-black/5 p-4">
      <p className={`font-display text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-ink-900/50">{label}</p>
    </div>
  );
}
