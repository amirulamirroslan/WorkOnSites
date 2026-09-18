"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { inputClass } from "@/components/ui/card";

type Row = {
  id: string;
  clock_in_at: string;
  clock_out_at: string | null;
  clock_in_within_geofence: boolean | null;
  clock_out_within_geofence: boolean | null;
  user_id: string;
  profiles: { full_name: string; hourly_rate: number | null } | null;
  sites: { name: string } | null;
};

const TABS = ["attendance", "payroll"] as const;

export default function ReportsPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<(typeof TABS)[number]>("attendance");
  const [rows, setRows] = useState<Row[]>([]);
  const [workers, setWorkers] = useState<{ id: string; full_name: string }[]>([]);
  const [workerFilter, setWorkerFilter] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name")
      .then(({ data }) => setWorkers(data ?? []));
  }, []);

  useEffect(() => {
    let query = supabase
      .from("shifts")
      .select(
        "id, clock_in_at, clock_out_at, clock_in_within_geofence, clock_out_within_geofence, user_id, profiles(full_name, hourly_rate), sites(name)"
      )
      .order("clock_in_at", { ascending: false })
      .limit(500);

    if (workerFilter) query = query.eq("user_id", workerFilter);

    setLoading(true);
    query.then(({ data }) => {
      setRows((data as unknown as Row[]) ?? []);
      setLoading(false);
    });
  }, [workerFilter]);

  function hours(row: Row) {
    if (!row.clock_out_at) return 0;
    return (new Date(row.clock_out_at).getTime() - new Date(row.clock_in_at).getTime()) / 3_600_000;
  }

  function exportAttendanceCsv() {
    const header = ["Worker", "Site", "Clock in", "Clock out", "Hours", "In geofence"];
    const lines = rows.map((r) => [
      r.profiles?.full_name ?? "",
      r.sites?.name ?? "",
      r.clock_in_at,
      r.clock_out_at ?? "",
      hours(r).toFixed(1),
      r.clock_in_within_geofence ? "yes" : "no",
    ]);
    downloadCsv(header, lines, "attendance");
  }

  function payrollSummary() {
    const byWorker = new Map<string, { name: string; rate: number; hours: number }>();
    for (const r of rows) {
      if (!r.clock_out_at) continue;
      const key = r.user_id;
      const existing = byWorker.get(key) ?? {
        name: r.profiles?.full_name ?? "",
        rate: r.profiles?.hourly_rate ?? 0,
        hours: 0,
      };
      existing.hours += hours(r);
      byWorker.set(key, existing);
    }
    return Array.from(byWorker.values());
  }

  function exportPayrollCsv() {
    const header = ["Worker", "Hours", "Hourly rate", "Estimated pay"];
    const lines = payrollSummary().map((w) => [
      w.name,
      w.hours.toFixed(1),
      w.rate.toFixed(2),
      (w.hours * w.rate).toFixed(2),
    ]);
    downloadCsv(header, lines, "payroll-estimate");
  }

  function downloadCsv(header: string[], lines: string[][], name: string) {
    const csv = [header, ...lines].map((l) => l.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `workonsite-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="px-6 py-8 md:px-10 md:py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Reports</h1>
          <p className="mt-1 text-sm text-muted">Attendance, geofence compliance, and payroll estimates.</p>
        </div>
        <select
          className={`${inputClass} w-48`}
          value={workerFilter}
          onChange={(e) => setWorkerFilter(e.target.value)}
        >
          <option value="">All workers</option>
          {workers.map((w) => (
            <option key={w.id} value={w.id}>
              {w.full_name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize ${
              tab === t ? "border-b-2 border-ink text-ink" : "text-muted"
            }`}
          >
            {t === "payroll" ? "Payroll estimate" : t}
          </button>
        ))}
      </div>

      {loading ? null : tab === "attendance" ? (
        <>
          <div className="mt-4 flex justify-end">
            <Button variant="secondary" onClick={exportAttendanceCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </div>
          {rows.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No shifts recorded yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="px-4 py-2.5 font-normal">Worker</th>
                    <th className="px-4 py-2.5 font-normal">Site</th>
                    <th className="px-4 py-2.5 font-normal">Clock in</th>
                    <th className="px-4 py-2.5 font-normal">Hours</th>
                    <th className="px-4 py-2.5 font-normal">Geofence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="px-4 py-2.5 text-ink">{r.profiles?.full_name}</td>
                      <td className="px-4 py-2.5 text-muted">{r.sites?.name}</td>
                      <td className="px-4 py-2.5 font-mono tabular text-muted">
                        {new Date(r.clock_in_at).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-mono tabular text-ink">{hours(r).toFixed(1)}</td>
                      <td className="px-4 py-2.5">
                        <span className={r.clock_in_within_geofence ? "text-pine" : "text-rust"}>
                          {r.clock_in_within_geofence ? "In range" : "Out of range"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-4 text-xs text-muted">
            Estimated pay only — hourly rate × hours worked. No EPF, SOCSO, EIS, or other statutory deductions.
          </p>
          <div className="mt-3 flex justify-end">
            <Button variant="secondary" onClick={exportPayrollCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </div>
          {payrollSummary().length === 0 ? (
            <p className="mt-6 text-sm text-muted">No completed shifts in range yet.</p>
          ) : (
            <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper shadow-sm">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-muted">
                    <th className="px-4 py-2.5 font-normal">Worker</th>
                    <th className="px-4 py-2.5 font-normal">Hours</th>
                    <th className="px-4 py-2.5 font-normal">Hourly rate</th>
                    <th className="px-4 py-2.5 font-normal">Estimated pay</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {payrollSummary().map((w) => (
                    <tr key={w.name}>
                      <td className="px-4 py-2.5 text-ink">{w.name}</td>
                      <td className="px-4 py-2.5 font-mono tabular text-muted">{w.hours.toFixed(1)}</td>
                      <td className="px-4 py-2.5 font-mono tabular text-muted">{w.rate.toFixed(2)}</td>
                      <td className="px-4 py-2.5 font-mono tabular text-ink">{(w.hours * w.rate).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
