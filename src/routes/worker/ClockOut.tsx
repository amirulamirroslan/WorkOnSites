import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import SuccessBadge from "../../components/SuccessBadge";
import MobileScreen, { DarkScreen, ScreenTitle } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { recordAttendanceEvent } from "../../lib/attendance";

export function ClockOutConfirm() {
  const navigate = useNavigate();
  const { tasks, clockInTime } = useAppState();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const photoCount = tasks.reduce((n, t) => n + t.checklist.filter((c) => c.isCompleted && c.requiresPhoto).length, 0);

  return (
    <MobileScreen navSpace={false} header={<ScreenTitle title="Clock Out" back="/worker" />}>
      <h2 className="font-display text-xl font-semibold mb-1">Ready to Clock Out?</h2>
      <p className="text-ink-900/50 text-sm mb-5">Here's a summary of your day.</p>

      <div className="card p-5 mb-8 space-y-3 text-sm">
        <div className="flex justify-between"><span className="text-ink-900/60">Tasks completed</span><span className="font-semibold">{completedCount} / {tasks.length}</span></div>
        <div className="flex justify-between"><span className="text-ink-900/60">Photos uploaded</span><span className="font-semibold">{photoCount}</span></div>
        <div className="flex justify-between"><span className="text-ink-900/60">Clocked in</span><span className="font-semibold">{clockInTime ?? "—"}</span></div>
      </div>

      <button className="action-band" onClick={() => navigate("/worker/clock-out/face")}>
        Clock Out
      </button>
    </MobileScreen>
  );
}

export function ClockOutSuccess() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pendingClockIn, pendingClockOut, setClockStatus, clockInTime } = useAppState();
  const [status, setStatus] = useState<"saving" | "recorded" | "queued_offline" | "error">("saving");
  const [time] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    async function run() {
      // Clock-out reuses the site captured at clock-in (same shift, same
      // site); position and photo come from the clock-out face-capture step
      // that just ran, so they're not re-fetched here.
      if (!profile || !pendingClockIn || !pendingClockOut || pendingClockOut.latitude == null || pendingClockOut.longitude == null) {
        setStatus("error");
        return;
      }
      try {
        const result = await recordAttendanceEvent({
          organizationId: profile.organization_id,
          workerId: profile.id,
          site: pendingClockIn.site,
          eventType: "clock_out",
          latitude: pendingClockOut.latitude,
          longitude: pendingClockOut.longitude,
          accuracy: pendingClockOut.accuracy,
          photoBlob: pendingClockOut.photoBlob,
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
    <DarkScreen className="px-5 pt-16 pb-8">
      <div className="card text-ink-900 px-6 pt-10 pb-8 text-center">
        <SuccessBadge />
        <h1 className="display text-xl font-bold mb-1 rise" style={{ animationDelay: "350ms" }}>Clocked Out!</h1>
        <p className="font-display text-3xl font-bold mb-2 rise" style={{ animationDelay: "450ms" }}>{time}</p>
        <p className="text-ink-900/50 text-sm rise" style={{ animationDelay: "550ms" }}>Clocked in at {clockInTime ?? "—"}</p>

        <div className="rounded-2xl bg-cloud-50 border border-cloud-100 p-4 mt-4 text-sm text-left rise" style={{ animationDelay: "600ms" }}>
          <div className="flex items-center justify-between">
            <span className="text-ink-900/70">Photo captured</span>
            <span className={pendingClockOut?.photoBlob ? "text-success-600 font-semibold" : "text-ink-900/40"}>
              {pendingClockOut?.photoBlob ? "✓" : "Skipped"}
            </span>
          </div>
        </div>

        {status === "queued_offline" && (
          <p className="text-warning-500 text-xs mt-4">
            You're offline — this clock-out was saved on your device and will sync once you're back online.
          </p>
        )}
        {status === "error" && (
          <p className="text-danger-500 text-xs mt-4">We couldn't record this clock-out. Please try again.</p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <button
          className="action-band"
          onClick={() => {
            setClockStatus("clocked_out");
            navigate("/worker");
          }}
        >
          Done
        </button>
      </div>
    </DarkScreen>
  );
}
