import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { StaggerItem, StaggerList, SkeletonRows } from "../../components/Motion";

type EventRow = {
  id: string;
  worker_id: string;
  event_type: "clock_in" | "clock_out";
  occurred_at: string;
  verification_status: "verified" | "out_of_range" | "exception_override";
  override_reason: string | null;
  override_by: string | null;
  worker: { full_name: string } | null;
  site: { name: string } | null;
};

type ShiftRow = {
  eventId: string;
  workerId: string;
  workerName: string;
  siteName: string;
  clockIn: string | null;
  clockOut: string | null;
  status: EventRow["verification_status"];
  overrideReason: string | null;
  overrideBy: string | null;
};

const statusStyle: Record<string, string> = {
  verified: "text-success-500",
  out_of_range: "text-danger-500",
  exception_override: "text-warning-500",
};

const statusLabel: Record<string, string> = {
  verified: "Verified",
  out_of_range: "Out of range",
  exception_override: "Exception override",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AttendancePage() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<ShiftRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const since = new Date();
    since.setDate(since.getDate() - 14);
    const { data } = await supabase
      .from("attendance_events")
      .select(
        "id, worker_id, event_type, occurred_at, verification_status, override_reason, override_by, worker:profiles(full_name), site:sites(name)"
      )
      .gte("occurred_at", since.toISOString())
      .order("occurred_at", { ascending: false });

    const rows = (data as unknown as EventRow[]) ?? [];
    // Pair each clock_in with the next clock_out for the same worker+day.
    const byWorkerDay = new Map<string, ShiftRow>();
    for (const row of [...rows].reverse()) {
      const day = row.occurred_at.slice(0, 10);
      const key = `${row.worker_id}-${day}`;
      const existing = byWorkerDay.get(key);
      if (row.event_type === "clock_in") {
        byWorkerDay.set(key, {
          eventId: row.id,
          workerId: row.worker_id,
          workerName: row.worker?.full_name ?? "Unknown",
          siteName: row.site?.name ?? "Unknown site",
          clockIn: fmtTime(row.occurred_at),
          clockOut: existing?.clockOut ?? null,
          status: row.verification_status,
          overrideReason: row.override_reason,
          overrideBy: row.override_by,
        });
      } else if (existing) {
        existing.clockOut = fmtTime(row.occurred_at);
      }
    }
    setShifts(Array.from(byWorkerDay.values()).reverse());
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function approveOverride(eventId: string) {
    if (!profile) return;
    setApproving(eventId);
    await supabase.from("attendance_events").update({ override_by: profile.id }).eq("id", eventId);
    setApproving(null);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Attendance</h1>
      <div className="card">
        {loading && <SkeletonRows trailing="text" />}
        {!loading && shifts.length === 0 && <p className="text-sm text-ink-900/50 px-4 py-4">No attendance recorded yet.</p>}
        {!loading && shifts.length > 0 && (
          <StaggerList>
            <AnimatePresence>
              {shifts.map((a) => (
                <StaggerItem key={a.eventId}>
                  <div className="list-row px-4">
                    <div>
                      <p className="font-medium text-sm">{a.workerName}</p>
                      <p className="text-xs text-ink-900/50">
                        {a.siteName} · In {a.clockIn} {a.clockOut ? `· Out ${a.clockOut}` : "· Still on site"}
                      </p>
                      {a.overrideReason && (
                        <p className="text-xs text-warning-500 mt-0.5">
                          "{a.overrideReason}" {a.overrideBy && <span className="text-success-500">· Reviewed</span>}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs ${statusStyle[a.status]}`}>{statusLabel[a.status]}</span>
                      {a.status === "exception_override" && !a.overrideBy && (
                        <button
                          onClick={() => approveOverride(a.eventId)}
                          disabled={approving === a.eventId}
                          className="block text-xs text-brand underline mt-1 disabled:opacity-40"
                        >
                          {approving === a.eventId ? "Approving…" : "Approve"}
                        </button>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerList>
        )}
      </div>
    </div>
  );
}
