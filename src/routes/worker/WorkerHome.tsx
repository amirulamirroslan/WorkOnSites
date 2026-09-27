import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PopCheck, StaggerItem, StaggerList } from "../../components/Motion";
import ProgressRing from "../../components/ProgressRing";
import MobileScreen, { Avatar, SitePill } from "../../components/MobileScreen";
import { BlobField, EmptyTasksArt, LocationPinArt } from "../../components/Illustrations";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";

export function TaskStatusIcon({ status }: { status: "pending" | "in_progress" | "completed" | "blocked" }) {
  if (status === "completed") {
    return (
      <motion.span
        layout
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 420, damping: 20 }}
        className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center shrink-0 text-white"
      >
        <PopCheck size={13} strokeWidth={3} />
      </motion.span>
    );
  }
  if (status === "in_progress") {
    return (
      <span className="w-6 h-6 rounded-full border-2 border-brand flex items-center justify-center shrink-0">
        <motion.span
          className="w-2.5 h-2.5 rounded-full bg-brand"
          animate={{ scale: [1, 1.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
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
      <motion.button
        whileTap={{ scale: 0.97 }}
        whileHover={{ y: -2 }}
        onClick={() => navigate(clockedIn ? "/worker/clock-out" : "/worker/clock-in/location")}
        className="relative overflow-hidden w-full text-left rounded-2xl bg-gradient-to-br from-brand-light via-brand to-brand-dark text-white p-5 shadow-glow flex items-center gap-4 -mt-1"
      >
        <BlobField />
        <LocationPinArt className="absolute -right-3 -top-3 w-28 h-28 opacity-90" />
        <div className="flex-1 relative">
          <p className="display text-xl font-semibold">{clockedIn ? "Clock Out" : "Clock In"}</p>
          <p className="text-white/80 text-sm mt-0.5">
            {clockedIn ? `Clocked in at ${clockInTime ?? "—"}` : "Tap to verify location & face"}
          </p>
        </div>
        <motion.span
          animate={{ x: [0, 3, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-11 h-11 rounded-full bg-white/20 flex items-center justify-center"
        >
          <ArrowUpRight size={22} />
        </motion.span>
      </motion.button>

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
        <StaggerList className="card divide-y divide-white/50">
          {tasks.length === 0 && (
            <div className="flex flex-col items-center text-center px-4 py-6">
              <EmptyTasksArt className="w-36 h-auto mb-2" />
              <p className="text-ink-900/50 text-sm">No tasks assigned for today.</p>
            </div>
          )}
          {tasks.slice(0, 5).map((task) => (
            <StaggerItem key={task.id}>
              <motion.button
                whileTap={{ backgroundColor: "rgba(108,92,231,0.08)" }}
                onClick={() => navigate(`/worker/tasks/${task.id}`)}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
              >
                <AnimatePresence mode="wait">
                  <TaskStatusIcon key={task.status} status={task.status} />
                </AnimatePresence>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{task.title}</p>
                  <p className={`text-xs ${statusColor[task.status]}`}>{statusLabel[task.status]}</p>
                </div>
                <ChevronRight size={16} className="text-ink-900/25 shrink-0" />
              </motion.button>
            </StaggerItem>
          ))}
        </StaggerList>
      </section>
      </div>
    </MobileScreen>
  );
}
