import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import SuccessBadge from "../../components/SuccessBadge";
import { DarkScreen } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { recordAttendanceEvent } from "../../lib/attendance";

export default function ClockInSuccess() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pendingClockIn, setClockStatus, setClockInTime } = useAppState();
  const [status, setStatus] = useState<"saving" | "recorded" | "queued_offline" | "error">("saving");
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [time] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

  useEffect(() => {
    async function run() {
      if (!profile || !pendingClockIn) {
        setStatus("error");
        return;
      }
      const result = await recordAttendanceEvent({
        organizationId: profile.organization_id,
        workerId: profile.id,
        site: pendingClockIn.site,
        eventType: "clock_in",
        latitude: pendingClockIn.latitude,
        longitude: pendingClockIn.longitude,
        accuracy: pendingClockIn.accuracy,
        photoBlob: pendingClockIn.photoBlob,
        overrideReason: pendingClockIn.overrideReason,
      });
      setClockStatus("clocked_in");
      setClockInTime(time);
      setStatus(result.status);
      setVerificationStatus(result.verificationStatus);
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <DarkScreen className="px-5 pt-16 pb-8">
      <div className="card text-ink-900 px-6 pt-10 pb-7 text-center">
        <SuccessBadge />
        <h1 className="display text-xl font-bold mb-1 rise" style={{ animationDelay: "350ms" }}>Clocked In!</h1>
        <p className="font-display text-3xl font-bold text-ink-900 mb-2 rise" style={{ animationDelay: "450ms" }}>{time}</p>
        <p className="inline-flex items-center gap-1 text-brand text-sm font-semibold mb-6 rise" style={{ animationDelay: "550ms" }}>
          <MapPin size={14} /> {pendingClockIn?.site.name}
        </p>

        <div className="rounded-2xl bg-cloud-50 border border-cloud-100 p-4 space-y-3 text-sm text-left rise" style={{ animationDelay: "650ms" }}>
          <div className="flex items-center justify-between">
            <span className="text-ink-900/70">Location verified</span>
            <span className="text-success-600 font-semibold">✓</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-900/70">Face captured</span>
            <span className={pendingClockIn?.photoBlob ? "text-success-600 font-semibold" : "text-ink-900/40"}>
              {pendingClockIn?.photoBlob ? "✓" : "Skipped"}
            </span>
          </div>
        </div>

        {status === "queued_offline" && (
          <p className="text-warning-500 text-xs mt-4">
            You're offline — this clock-in was saved on your device and will sync automatically once you're back online.
          </p>
        )}
        {verificationStatus === "exception_override" && (
          <p className="text-warning-500 text-xs mt-4">
            Recorded as an out-of-range exception — flagged for your team leader/owner to review.
          </p>
        )}
        {status === "saving" && <p className="text-ink-900/40 text-xs mt-4">Saving…</p>}
        {status === "error" && (
          <p className="text-danger-500 text-xs mt-4">We couldn't record this clock-in. Please go back and try again.</p>
        )}
      </div>

      <div className="mt-auto pt-8">
        <button className="action-band" onClick={() => navigate("/worker/tasks")}>
          View Today's Tasks
        </button>
        <p className="text-white/60 text-xs text-center mt-4">You're all set. Have a great day!</p>
      </div>
    </DarkScreen>
  );
}
