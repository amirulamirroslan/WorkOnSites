import { Link } from "react-router-dom";
import { useAppState } from "../../context/AppState";

const statusColor: Record<string, string> = {
  completed: "text-success-500",
  in_progress: "text-warning-500",
  pending: "text-white/40",
  blocked: "text-danger-500",
};

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
        {tasks.map((task) => (
          <Link
            key={task.id}
            to={task.checklist.length ? `/worker/tasks/${task.id}` : "#"}
            className="list-row border-b-white/10"
          >
            <div>
              <p className="font-medium">{task.title}</p>
              <p className={`text-xs ${statusColor[task.status]}`}>{task.subtitle}</p>
            </div>
            <span className="text-white/30">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
