import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerItem, StaggerList } from "../../components/Motion";
import ProgressRing from "../../components/ProgressRing";
import MobileScreen, { ScreenTitle, SitePill } from "../../components/MobileScreen";
import { EmptyTasksArt } from "../../components/Illustrations";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";
import { TaskStatusIcon, statusColor, statusLabel } from "./WorkerHome";

type Filter = "all" | "completed" | "pending";

export default function TaskList() {
  const { tasks } = useAppState();
  const { profile } = useAuth();
  const [site, setSite] = useState<AssignedSite | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    if (profile) getMyAssignedSite(profile.id).then(setSite);
  }, [profile]);

  const completed = tasks.filter((t) => t.status === "completed");
  const pending = tasks.filter((t) => t.status !== "completed");
  const percent = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;
  const visible = filter === "all" ? tasks : filter === "completed" ? completed : pending;
  const today = new Date().toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: tasks.length },
    { id: "completed", label: "Completed", count: completed.length },
    { id: "pending", label: "Pending", count: pending.length },
  ];

  return (
    <MobileScreen
      header={
        <div>
          <ScreenTitle title="Checklist" />
          <div className="flex items-center justify-between mt-3">
            {site ? <SitePill name={site.name} /> : <span />}
            <span className="text-white/60 text-xs">{today}</span>
          </div>
        </div>
      }
    >
      <div className="card p-5 flex items-center gap-5">
        <ProgressRing percent={percent} />
        <div>
          <p className="font-display text-xl font-bold">
            {completed.length} / {tasks.length} <span className="text-sm font-semibold">tasks</span>
          </p>
          <p className="text-ink-900/50 text-sm">Completed</p>
        </div>
      </div>

      <div className="flex gap-2 mt-5 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`relative text-xs font-semibold px-3.5 py-2 rounded-pill transition-colors ${
              filter === t.id ? "text-white" : "glass text-ink-900/60"
            }`}
          >
            {filter === t.id && (
              <motion.span
                layoutId="task-filter-pill"
                className="absolute inset-0 bg-brand rounded-pill shadow-glow -z-10"
                transition={{ type: "spring", stiffness: 460, damping: 32 }}
              />
            )}
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="flex flex-col items-center text-center py-8">
          <EmptyTasksArt className="w-40 h-auto mb-2" />
          <p className="text-ink-900/40 text-sm">No tasks here.</p>
        </div>
      )}
      {visible.length > 0 && (
        <StaggerList className="card divide-y divide-white/50">
          <AnimatePresence>
            {visible.map((task) => (
              <StaggerItem key={task.id}>
                <Link to={task.checklist.length ? `/worker/tasks/${task.id}` : "#"} className="flex items-center gap-3 px-4 py-3.5">
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{task.title}</p>
                    <p className={`text-xs ${statusColor[task.status]}`}>{task.subtitle || statusLabel[task.status]}</p>
                  </div>
                  <ChevronRight size={16} className="text-ink-900/25 shrink-0" />
                </Link>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerList>
      )}
    </MobileScreen>
  );
}
