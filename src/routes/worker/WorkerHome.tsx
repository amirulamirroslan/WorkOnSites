import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import ProgressRing from "../../components/ProgressRing";
import MobileScreen, { Avatar, SitePill } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";
import { TaskRowsSkeleton } from "../../components/Loading";

export function TaskStatusIcon({ status }: { status: "pending" | "in_progress" | "completed" | "blocked" }) {
  if (status === "completed") {
    return (
      <span className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center shrink-0">
        <Check size={13} color="white" strokeWidth={3} />
      </span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="w-6 h-6 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-brand" />
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
  return <span className="w-6 h-6 rounded-full border-2 border-ink-900/15 shrink-0" />;
}

export const statusLabel: Record<string, string> = {
  completed: "Completed",
  in_progress: "In Progress",
  pending: "Not Started",
  blocked: "Blocked",
};

export const statusColor: Record<string, string> = {
  completed: "text-success-600",
  in_progress: "text-brand",
  pending: "text-ink-900/40",
  blocked: "text-danger-500",
};

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

export default function WorkerHome() {
  const navigate = useNavigate();
  const { profile, profileLoading } = useAuth();
  const { tasks, tasksLoading, clockStatus, clockInTime } = useAppState();
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
        <p className="text-white/60 text-sm">
          We couldn't find your worker profile. Ask your organization owner to check your account.
        </p>
      </div>
    );
  }

  const clockedIn = clockStatus === "clocked_in";

  return (
    <MobileScreen
      wide
      header={
        <div className="flex items-center gap-3">
          <Avatar name={profile?.full_name ?? ""} size={52} />
          <div className="flex-1 min-w-0">
            <p className="text-white/70 text-sm">{greeting()},</p>
            <h1 className="display text-xl font-semibold truncate">{profile?.full_name ?? "…"}</h1>
            <div className="mt-1.5">{site && <SitePill name={site.name} />}</div>
          </div>
          <span className="text-white/60 text-xs self-start mt-1">{today}</span>
        </div>
      }
    >
      <div className="lg:grid lg:grid-cols-2 lg:gap-6 lg:items-start">
      <div>
      <button
        onClick={() => navigate(clockedIn ? "/worker/clock-out" : "/worker/clock-in/location")}
        className="w-full text-left rounded-2xl bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white p-5 shadow-glow flex items-center gap-4 active:scale-[0.99] transition-transform -mt-1"
      >
        <div className="flex-1">
          <p className="display text-xl font-semibold">{clockedIn ? "Clock Out" : "Clock In"}</p>
          <p className="text-white/80 text-sm mt-0.5">
            {clockedIn ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" aria-hidden />
                Clocked in at {clockInTime ?? "—"}
              </span>
            ) : (
              "Tap to verify location & face"
            )}
          </p>
        </div>
        <span className="relative w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
          {!clockedIn && <span className="cta-ping" aria-hidden />}
          <ArrowUpRight size={22} />
        </span>
      </button>

      <section className="card mt-5 p-5">
        <p className="text-sm font-semibold text-ink-900/70 mb-3">Today's Progress</p>
        <div className="flex items-center gap-5">
          <ProgressRing percent={percent} />
          <div>
            <p className="font-display text-xl font-bold">
              {completedCount} / {tasks.length} <span className="text-base font-semibold">tasks</span>
            </p>
            <p className="text-ink-900/50 text-sm">Completed</p>
          </div>
        </div>
      </section>

      </div>

      <section className="mt-6 lg:mt-0">
        <div className="flex items-center justify-between mb-3">
          <p className="font-display font-semibold">Today's Tasks</p>
          <button className="text-brand text-xs font-semibold" onClick={() => navigate("/worker/tasks")}>
            View all
          </button>
        </div>
        <div className="card divide-y divide-cloud-100">
          {tasksLoading && tasks.length === 0 && <TaskRowsSkeleton />}
          {!tasksLoading && tasks.length === 0 && (
            <p className="text-ink-900/40 text-sm px-4 py-4">No tasks assigned for today.</p>
          )}
          {tasks.slice(0, 5).map((task) => (
            <button
              key={task.id}
              onClick={() => navigate(`/worker/tasks/${task.id}`)}
              className="press-row w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <TaskStatusIcon status={task.status} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{task.title}</p>
                <p className={`text-xs ${statusColor[task.status]}`}>{statusLabel[task.status]}</p>
              </div>
              <ChevronRight size={16} className="text-ink-900/25 shrink-0" />
            </button>
          ))}
        </div>
      </section>
      </div>
    </MobileScreen>
  );
}
