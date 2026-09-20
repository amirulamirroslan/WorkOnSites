import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { CardGridSkeleton } from "../../components/Loading";

type Period = "daily" | "weekly" | "monthly";

type AttendanceRow = {
  worker_id: string;
  site_id: string;
  event_type: "clock_in" | "clock_out";
  occurred_at: string;
  verification_status: string;
};

type SiteRow = { id: string; name: string };
type MemberRow = { id: string; role: string };

function rangeFor(period: Period): { from: Date; label: string } {
  const now = new Date();
  const from = new Date(now);
  if (period === "daily") from.setHours(0, 0, 0, 0);
  if (period === "weekly") from.setDate(now.getDate() - 7);
  if (period === "monthly") from.setDate(now.getDate() - 30);
  const label = period === "daily" ? "today" : period === "weekly" ? "the last 7 days" : "the last 30 days";
  return { from, label };
}

function toCsv(rows: AttendanceRow[], siteNameById: Record<string, string>) {
  const header = "worker_id,site,event_type,occurred_at,verification_status";
  const lines = rows.map(
    (r) => `${r.worker_id},${siteNameById[r.site_id] ?? r.site_id},${r.event_type},${r.occurred_at},${r.verification_status}`
  );
  return [header, ...lines].join("\n");
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("weekly");
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [totalWorkers, setTotalWorkers] = useState(0);
  const [taskStats, setTaskStats] = useState<{ total: number; completed: number }>({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  const { from, label } = useMemo(() => rangeFor(period), [period]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const fromIso = from.toISOString();

      const [{ data: attRows }, { data: siteRows }, { data: memberRows }, { data: taskRows }] = await Promise.all([
        supabase
          .from("attendance_events")
          .select("worker_id, site_id, event_type, occurred_at, verification_status")
          .gte("occurred_at", fromIso),
        supabase.from("sites").select("id, name"),
        supabase.from("profiles").select("id, role").in("role", ["worker", "team_leader"]),
        supabase.from("tasks").select("id, status").gte("scheduled_date", fromIso.slice(0, 10)),
      ]);

      setAttendance((attRows as AttendanceRow[]) ?? []);
      setSites((siteRows as SiteRow[]) ?? []);
      setTotalWorkers(((memberRows as MemberRow[]) ?? []).length);
      const tasks = (taskRows as { id: string; status: string }[]) ?? [];
      setTaskStats({ total: tasks.length, completed: tasks.filter((t) => t.status === "completed").length });
      setLoading(false);
    }
    load();
  }, [from]);

  const siteNameById = Object.fromEntries(sites.map((s) => [s.id, s.name]));

  const distinctWorkersClockedIn = new Set(attendance.filter((a) => a.event_type === "clock_in").map((a) => a.worker_id));
  const attendanceRate = totalWorkers > 0 ? Math.round((distinctWorkersClockedIn.size / totalWorkers) * 100) : 0;
  const taskCompletionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : null;

  const perSite = sites.map((s) => {
    const siteClockIns = new Set(
      attendance.filter((a) => a.site_id === s.id && a.event_type === "clock_in").map((a) => a.worker_id)
    );
    return { site: s.name, count: siteClockIns.size };
  });
  const maxSiteCount = Math.max(1, ...perSite.map((s) => s.count));

  function exportCsv() {
    const csv = toCsv(attendance, siteNameById);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold">Reports</h1>
        <button onClick={exportCsv} disabled={attendance.length === 0} className="text-xs font-medium bg-brand text-white px-3 py-2 rounded-lg disabled:opacity-40">
          Export CSV
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {(["daily", "weekly", "monthly"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`text-xs font-medium px-3 py-2 rounded-lg capitalize ${
              period === p ? "bg-brand text-white" : "bg-white border border-cloud-100 shadow-soft text-ink-900/60"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <CardGridSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-card border border-cloud-100 shadow-soft p-4">
              <p className="font-display text-xl font-bold">{attendanceRate}%</p>
              <p className="text-xs text-ink-900/50">Attendance rate ({label})</p>
            </div>
            <div className="bg-white rounded-card border border-cloud-100 shadow-soft p-4">
              <p className="font-display text-xl font-bold">{taskCompletionRate === null ? "—" : `${taskCompletionRate}%`}</p>
              <p className="text-xs text-ink-900/50">
                {taskCompletionRate === null ? "No tasks scheduled in this period" : `Task completion (${label})`}
              </p>
            </div>
          </div>

          <p className="text-sm font-medium text-ink-900/60 mb-2">Site attendance ({label})</p>
          <div className="bg-white rounded-card border border-cloud-100 shadow-soft p-4 space-y-3">
            {perSite.length === 0 && <p className="text-sm text-ink-900/50">No sites yet.</p>}
            {perSite.map((s) => (
              <div key={s.site}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-900/70">{s.site}</span>
                  <span className="text-ink-900/50">{s.count} worker{s.count === 1 ? "" : "s"}</span>
                </div>
                <div className="h-1.5 rounded-pill bg-black/5">
                  <div className="h-1.5 rounded-pill bg-brand" style={{ width: `${(s.count / maxSiteCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
