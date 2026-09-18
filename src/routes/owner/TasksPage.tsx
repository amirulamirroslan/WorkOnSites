import { orgTasksList } from "../../lib/mockData";

const statusStyle: Record<string, string> = {
  completed: "text-success-500",
  in_progress: "text-warning-500",
  pending: "text-ink-900/40",
  blocked: "text-danger-500",
};

export default function TasksPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Tasks</h1>
      <div className="bg-white rounded-card border border-black/5">
        {orgTasksList.map((t) => (
          <div key={t.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{t.title}</p>
              <p className="text-xs text-ink-900/50">{t.site} · {t.assignedTo}</p>
            </div>
            <span className={`text-xs ${statusStyle[t.status]}`}>{t.status.replace("_", " ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
