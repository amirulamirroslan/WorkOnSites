import { Clock3, Users, CalendarCheck2, MapPin } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementComposer } from "./announcement-composer";

export default async function OverviewPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user!.id)
    .single();

  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);

  const [openShiftsRes, todayShiftsRes, workerCountRes, weekScheduledRes, weekShiftsRes] = await Promise.all([
    supabase
      .from("shifts")
      .select("id, user_id, site_id, clock_in_at, profiles(full_name), sites(name)")
      .eq("status", "open")
      .gte("clock_in_at", `${today}T00:00:00`),
    supabase.from("shifts").select("id, status").gte("clock_in_at", `${today}T00:00:00`),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", profile?.organization_id)
      .eq("is_active", true),
    supabase
      .from("shift_schedules")
      .select("id", { count: "exact", head: true })
      .gte("scheduled_date", weekAgo)
      .lte("scheduled_date", today),
    supabase
      .from("shifts")
      .select("id, status, clock_in_at, clock_out_at")
      .gte("clock_in_at", `${weekAgo}T00:00:00`),
  ]);

  const openShifts = openShiftsRes.data ?? [];
  const clockedInNow = openShifts.length;
  const totalToday = todayShiftsRes.data?.length ?? 0;
  const workerCount = workerCountRes.count ?? 0;

  const scheduledThisWeek = weekScheduledRes.count ?? 0;
  const weekShifts = weekShiftsRes.data ?? [];
  const clockedInThisWeek = weekShifts.length;
  const completedThisWeek = weekShifts.filter((s) => s.status === "closed").length;
  const hoursThisWeek = weekShifts.reduce((sum, s) => {
    if (!s.clock_out_at) return sum;
    return sum + (new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime()) / 3_600_000;
  }, 0);

  const funnelMax = Math.max(scheduledThisWeek, clockedInThisWeek, completedThisWeek, 1);

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <h1 className="font-display text-2xl font-semibold text-ink">Overview</h1>
      <p className="mt-1 text-sm text-muted">Today, at a glance.</p>

      <div className="mt-6">
        <AnnouncementComposer />
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Clock3} label="Clocked in now" value={clockedInNow} accent="pine" />
        <StatCard icon={CalendarCheck2} label="Shifts today" value={totalToday} accent="amber" />
        <StatCard icon={Users} label="Active workers" value={workerCount} accent="ink" />
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-paper p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">This week</h2>
            <p className="text-sm text-muted">Scheduled shifts, from booking to finish.</p>
          </div>
          <p className="font-mono text-sm tabular text-pine">{hoursThisWeek.toFixed(0)} hrs logged</p>
        </div>

        <div className="mt-6 space-y-3">
          <FunnelRow label="Scheduled" value={scheduledThisWeek} max={funnelMax} color="bg-canvas" />
          <FunnelRow label="Clocked in" value={clockedInThisWeek} max={funnelMax} color="bg-amber/50" />
          <FunnelRow label="Completed" value={completedThisWeek} max={funnelMax} color="bg-pine" textColor="text-paper" />
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink">Clocked in right now</h2>
        {clockedInNow === 0 ? (
          <p className="mt-3 text-sm text-muted">No one is currently clocked in.</p>
        ) : (
          <div className="mt-3 divide-y divide-line rounded-2xl border border-line bg-paper shadow-sm">
            {openShifts.map((shift) => {
              const worker = shift.profiles as unknown as { full_name: string } | null;
              const site = shift.sites as unknown as { name: string } | null;
              const initial = worker?.full_name?.charAt(0)?.toUpperCase() ?? "?";
              return (
                <div key={shift.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-sm font-medium text-ink">
                    {initial}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-ink">{worker?.full_name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted">
                      <MapPin size={11} />
                      {site?.name}
                    </p>
                  </div>
                  <span className="font-mono text-xs tabular text-muted">
                    since{" "}
                    {new Date(shift.clock_in_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  accent: "pine" | "amber" | "ink";
}) {
  const chipClass = {
    pine: "bg-pine/10 text-pine",
    amber: "bg-amber/15 text-amber",
    ink: "bg-canvas text-ink",
  }[accent];

  return (
    <div className="rounded-2xl border border-line bg-paper p-5 shadow-sm">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${chipClass}`}>
        <Icon size={17} strokeWidth={1.75} />
      </div>
      <p className="mt-3 font-mono text-3xl font-semibold tabular text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  max,
  color,
  textColor = "text-ink",
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  textColor?: string;
}) {
  const widthPct = Math.max((value / max) * 100, value > 0 ? 8 : 0);
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-sm text-muted">{label}</span>
      <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-canvas/50">
        <div
          className={`flex h-full items-center rounded-md px-3 ${color}`}
          style={{ width: `${widthPct}%` }}
        >
          <span className={`font-mono text-sm tabular ${textColor}`}>{value}</span>
        </div>
      </div>
    </div>
  );
}
