import { sitePerformance, ownerKpis } from "../../lib/mockData";

export default function ReportsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Reports</h1>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-card border border-black/5 p-4">
          <p className="font-display text-xl font-bold">{ownerKpis.attendance}</p>
          <p className="text-xs text-ink-900/50">Attendance rate (this period)</p>
        </div>
        <div className="bg-white rounded-card border border-black/5 p-4">
          <p className="font-display text-xl font-bold">{ownerKpis.taskCompletion}</p>
          <p className="text-xs text-ink-900/50">Task completion rate (this period)</p>
        </div>
      </div>

      <p className="text-sm font-medium text-ink-900/60 mb-2">Site performance</p>
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
      {/* Real build: daily/weekly/monthly range picker + CSV export, once
          attendance_events/tasks are queried live from Supabase. */}
    </div>
  );
}
