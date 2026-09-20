import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { MapPin, ChevronRight } from "lucide-react";
import ProgressRing from "../../components/ProgressRing";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";

function TaskStatusIcon({ status }: { status: "pending" | "in_progress" | "completed" | "blocked" }) {
  if (status === "completed") {
    return (
      <span className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center shrink-0">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l2.5 2.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="w-6 h-6 rounded-full border-2 border-warning-500 flex items-center justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-warning-500" />
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="w-6 h-6 rounded-full bg-danger-500 flex items-center justify-center shrink-0 text-white text-xs font-bold">
        !
      </span>
    );
  }
  return <span className="w-6 h-6 rounded-full border-2 border-white/20 shrink-0" />;
}

const statusLabel: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Not Started",
  blocked: "Blocked",
};

export default function WorkerHome() {
  const navigate = useNavigate();
  const { profile, profileLoading } = useAuth();
  const { tasks, clockStatus, clockInTime } = useAppState();
  const [site, setSite] = useState<AssignedSite | null>(null);
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const percent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const today = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  useEffect(() => {
    if (profile) getMyAssignedSite(profile.id).then(setSite);
  }, [profile]);

  if (!profileLoading && !profile) {
    return (
      <div className="surface-dark min-h-screen flex flex-col items-center justify-center px-8 text-center">
        <p className="font-display text-lg font-semibold mb-2">Account not set up</p>
        <p className="text-white/50 text-sm">
          We couldn't find your worker profile. Ask your organization owner to check your account.
        </p>
      </div>
    );
  }

  return (
    <div className="surface-dark min-h-screen pb-24">
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">Good Morning,</p>
          <h1 className="display text-xl font-semibold">{profile?.full_name ?? "…"}</h1>
        </div>
        <span className="text-white/40 text-xs">{today}</span>
      </header>

      <section className="mx-6 rounded-card bg-navy-800 p-5 shadow-lg shadow-black/20 border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-start gap-2">
            <MapPin size={16} className="text-brand mt-1 shrink-0" strokeWidth={2.2} />
            <div>
              <p className="font-display font-semibold">{site?.name ?? "No site assigned"}</p>
              <p className="text-white/40 text-xs">
                {clockStatus === "clocked_in" ? `Clocked in at ${clockInTime ?? "—"}` : "Tap to verify location & face"}
              </p>
            </div>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-pill shrink-0 ${
              clockStatus === "clocked_in" ? "bg-success-500/20 text-success-500" : "bg-white/10 text-white/50"
            }`}
          >
            {clockStatus === "clocked_in" ? "Clocked In" : "Not Clocked In"}
          </span>
        </div>
        {clockStatus === "clocked_out" ? (
          <button className="action-band" onClick={() => navigate("/worker/clock-in/location")}>
            Clock In
          </button>
        ) : (
          <button
            className="w-full rounded-card bg-white/10 text-white px-6 py-3 font-display font-semibold active:scale-[0.98] transition-transform"
            onClick={() => navigate("/worker/clock-out")}
          >
            Clock Out
          </button>
        )}
      </section>

      <section className="mx-6 mt-6 rounded-card bg-navy-800 p-6 flex items-center gap-6 shadow-lg shadow-black/20 border border-white/5">
        <ProgressRing percent={percent} />
        <div>
          <p className="font-display text-lg font-semibold">Today's Progress</p>
          <p className="text-white/50 text-sm">
            {completedCount} / {tasks.length} tasks completed
          </p>
        </div>
      </section>

      <section className="px-6 mt-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/50 text-xs uppercase tracking-wide">Today's Tasks</p>
          <button className="text-brand text-xs font-medium" onClick={() => navigate("/worker/tasks")}>
            View all
          </button>
        </div>
        <div className="rounded-card bg-navy-800 divide-y divide-white/5 shadow-lg shadow-black/20 border border-white/5">
          {tasks.length === 0 && <p className="text-white/40 text-sm px-4 py-4">No tasks assigned for today.</p>}
          {tasks.slice(0, 5).map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(`/worker/tasks/${task.id}`)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
            >
              <TaskStatusIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{task.title}</p>
                <p className="text-white/40 text-xs">{statusLabel[task.status]}</p>
              </div>
              <ChevronRight size={16} className="text-white/20 shrink-0" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
