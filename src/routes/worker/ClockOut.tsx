import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition, recordAttendanceEvent } from "../../lib/attendance";

export function ClockOutConfirm() {
  const navigate = useNavigate();
  const { tasks, clockInTime } = useAppState();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const photoCount = tasks.reduce((n, t) => n + t.checklist.filter((c) => c.isCompleted && c.requiresPhoto).length, 0);

  return (
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-6">Ready to Clock Out?</h1>

      <div className="rounded-card bg-navy-800 p-5 mb-8 space-y-2 text-sm">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Today's Summary</p>
        <div className="flex justify-between"><span className="text-white/60">Tasks completed</span><span>{completedCount} / {tasks.length}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Photos uploaded</span><span>{photoCount}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Clocked in</span><span>{clockInTime ?? "—"}</span></div>
      </div>

      <button className="action-band" onClick={() => navigate("/worker/clock-out/success")}>
        Clock Out
      </button>
    </div>
  );
}

export function ClockOutSuccess() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pendingClockIn, setClockStatus, clockInTime } = useAppState();
  const [status, setStatus] = useState<"saving" | "recorded" | "queued_offline" | "error">("saving");
  const [time] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    async function run() {
      // Clock-out reuses the site captured at clock-in (same shift, same
      // site) — only the position needs re-checking, since GPS can move.
      if (!profile || !pendingClockIn) {
        setStatus("error");
        return;
      }
      try {
        const pos = await getCurrentPosition();
        const result = await recordAttendanceEvent({
          organizationId: profile.organization_id,
          workerId: profile.id,
          site: pendingClockIn.site,
          eventType: "clock_out",
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          photoBlob: null,
        });
        setStatus(result.status);
      } catch {
        setStatus("error");
      }
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="surface-dark min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-success-500/20 flex items-center justify-center mb-6">
        <span className="text-success-500 text-3xl">✓</span>
      </div>
      <h1 className="display text-xl font-semibold mb-1">Clocked Out!</h1>
      <p className="font-display text-2xl font-bold mb-1">{time}</p>
      <p className="text-white/50 text-sm mb-4">Clocked in at {clockInTime ?? "—"}</p>

      {status === "queued_offline" && (
        <p className="text-warning-500 text-xs mb-4">
          You're offline — this clock-out was saved on your device and will sync once you're back online.
        </p>
      )}

      <button
        className="action-band"
        onClick={() => {
          setClockStatus("clocked_out");
          navigate("/worker");
        }}
      >
        View Summary
      </button>
    </div>
  );
}
