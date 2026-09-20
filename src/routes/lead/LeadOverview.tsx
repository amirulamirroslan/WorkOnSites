import { Outlet } from "react-router-dom";
import { Users, UserCheck, Clock, UserX } from "lucide-react";
import NavRail from "../../components/NavRail";
import { BarRow, DateChip, PersonRow, Panel, StatCard, greeting } from "../../components/DashboardBits";
import { useAuth } from "../../context/AuthContext";
import { liveWorkers, sitePerformance } from "../../lib/mockData";

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
    <div className="surface-light lg:flex min-h-screen">
      <NavRail items={navItems} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default function LeadOverview() {
  const { profile } = useAuth();
  const onSite = liveWorkers.filter((w) => w.status === "on_site").length;
  const late = 1; // wire from real attendance vs. scheduled shift start once backend is connected
  const absent = liveWorkers.filter((w) => w.status === "not_clocked_in").length;
  const first = profile?.full_name?.split(" ")[0] ?? "Team";

  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold">{greeting()}, {first}</h1>
          <p className="text-sm text-ink-900/50 mt-1">Here's what's happening across your sites today</p>
        </div>
        <DateChip />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Total Workers" value={String(liveWorkers.length)} Icon={Users} tone="brand" />
        <StatCard label="On Site" value={String(onSite)} Icon={UserCheck} tone="success" />
        <StatCard label="Late" value={String(late)} Icon={Clock} tone="warning" />
        <StatCard label="Absent" value={String(absent)} Icon={UserX} tone="danger" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Panel title="Site Performance">
          <div className="space-y-4">
            {sitePerformance.map((s) => (
              <BarRow key={s.site} label={s.site} percent={s.percent} />
            ))}
          </div>
        </Panel>
        <Panel title="Live Workers">
          {liveWorkers.map((w) => (
            <PersonRow
              key={w.id}
              name={w.name}
              online={w.status === "on_site"}
              sub={`${w.site} ${w.clockedInAt ? `· ${w.clockedInAt}` : "· Not clocked in"}`}
              right={`${w.tasksDone}/${w.tasksTotal} tasks`}
            />
          ))}
        </Panel>
      </div>
    </div>
  );
}
