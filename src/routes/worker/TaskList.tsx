import { Link } from "react-router-dom";
import { ChevronRight, Check } from "lucide-react";
import { useAppState } from "../../context/AppState";

const statusColor: Record<string, string> = {
  completed: "text-success-500",
  in_progress: "text-warning-500",
  pending: "text-white/40",
  blocked: "text-danger-500",
};

function StatusDot({ status }: { status: string }) {
  if (status === "completed") {
    return (
      <span className="w-6 h-6 rounded-full bg-success-500 flex items-center justify-center shrink-0">
        <Check size={13} color="white" strokeWidth={3} />
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

export default function TaskList() {
  const { tasks } = useAppState();
  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="surface-dark min-h-screen pb-24">
      <header className="px-6 pt-10 pb-4">
        <h1 className="display text-lg font-semibold">Today's Tasks</h1>
        <p className="text-white/50 text-sm">{completedCount} / {tasks.length} completed</p>
      </header>

      <div className="px-6">
        {tasks.length === 0 && <p className="text-white/40 text-sm py-6">No tasks assigned for today.</p>}
        {tasks.length > 0 && (
          <div className="rounded-card bg-navy-800 divide-y divide-white/5 shadow-lg shadow-black/20 border border-white/5">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={task.checklist.length ? `/worker/tasks/${task.id}` : "#"}
                className="flex items-center gap-3 px-4 py-3"
              >
                <StatusDot status={task.status} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{task.title}</p>
                  <p className={`text-xs ${statusColor[task.status]}`}>{task.subtitle}</p>
                </div>
                <ChevronRight size={16} className="text-white/20 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
