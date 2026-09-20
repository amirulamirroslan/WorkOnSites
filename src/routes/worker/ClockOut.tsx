import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import MobileScreen, { DarkScreen, ScreenTitle } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getCurrentPosition, recordAttendanceEvent } from "../../lib/attendance";

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

      <button className="action-band" onClick={() => navigate("/worker/clock-out/success")}>
        Clock Out
      </button>
    </MobileScreen>
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
    <DarkScreen className="px-5 pt-16 pb-8">
      <div className="card text-ink-900 px-6 pt-10 pb-8 text-center">
        <div className="w-24 h-24 rounded-full bg-success-500 mx-auto flex items-center justify-center shadow-[0_10px_30px_rgba(34,197,94,0.4)] mb-6">
          <Check size={48} color="white" strokeWidth={3.5} />
        </div>
        <h1 className="display text-xl font-bold mb-1">Clocked Out!</h1>
        <p className="font-display text-3xl font-bold mb-2">{time}</p>
        <p className="text-ink-900/50 text-sm">Clocked in at {clockInTime ?? "—"}</p>

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
