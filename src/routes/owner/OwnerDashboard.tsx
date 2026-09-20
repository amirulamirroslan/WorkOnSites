import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CalendarCheck, ListChecks, MapPin, AlertTriangle } from "lucide-react";
import { PageLoader } from "../../components/Loading";
import NavRail from "../../components/NavRail";
import Skyline from "../../components/Skyline";
import { BarRow, DateChip, PersonRow, Panel, StatCard } from "../../components/DashboardBits";
import { liveWorkers, sitePerformance, ownerKpis } from "../../lib/mockData";
import AnimatedLogo from "../../components/AnimatedLogo";

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
  const { pathname } = useLocation();
  return (
    <div className="surface-light lg:flex min-h-screen">
      <NavRail items={navItems} />
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
        <div key={pathname} className="page-enter">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default function OwnerDashboard() {
  return (
    <div>
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold">Operations Overview</h1>
          <p className="text-sm text-ink-900/50 mt-1">Performance across all of your sites</p>
        </div>
        <DateChip />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Attendance" value={ownerKpis.attendance} Icon={CalendarCheck} tone="brand" delay={0} />
        <StatCard label="Task Completion" value={ownerKpis.taskCompletion} Icon={ListChecks} tone="success" delay={70} />
        <StatCard label="Sites Active" value={String(ownerKpis.sitesActive)} Icon={MapPin} tone="brand" delay={140} />
        <StatCard label="High Priority Issues" value={String(ownerKpis.highPriorityIssues)} Icon={AlertTriangle} tone="danger" delay={210} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <Panel title="Site Performance">
          <div className="space-y-4">
            {sitePerformance.map((s, i) => (
              <BarRow key={s.site} label={s.site} percent={s.percent} delay={300 + i * 90} />
            ))}
          </div>
        </Panel>
        <Panel title="Live Workers">
          {liveWorkers.map((w) => (
            <PersonRow
              key={w.id}
              name={w.name}
              sub={w.site}
              online={w.status === "on_site"}
              right={<span className={w.status === "on_site" ? "text-success-600 font-medium" : ""}>{w.status === "on_site" ? "On site" : "Not clocked in"}</span>}
            />
          ))}
        </Panel>
      </div>

      <div className="relative overflow-hidden rounded-2xl mobile-bg text-white p-6 sm:p-8 h-40 flex items-center shadow-soft">
        <Skyline className="hidden sm:block absolute inset-y-0 right-28 h-full w-[52%] opacity-75" />
        <div className="relative flex items-center justify-between w-full">
          <p className="display text-xl font-bold leading-snug max-w-xs">Cleaner Sites. Safer People. Better Work.</p>
          <div className="flex items-center gap-2.5">
            <AnimatedLogo size={36} glow={false} />
            <span className="display font-extrabold">Work<span className="text-brand-light">O</span>nSite</span>
          </div>
        </div>
      </div>
    </div>
  );
}
