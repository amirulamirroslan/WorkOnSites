import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import { useAppState } from "../../context/AppState";

export default function TaskChecklist() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { tasks, setTaskChecklistItem } = useAppState();
  const task = tasks.find((t) => t.id === taskId);
  const [photos, setPhotos] = useState<string[]>([]);

  if (!task) return null;

  const allRequiredDone = task.checklist.every((c) => !c.isRequired || c.isCompleted);

  function addPhoto() {
    // Real build: open camera/file picker, upload to Supabase Storage,
    // insert a task_photos row.
    setPhotos((p) => [...p, `photo-${p.length + 1}`]);
  }

  return (
    <div className="surface-dark min-h-screen pb-24">
      <header className="px-6 pt-10 pb-4 flex items-center gap-3">
        <Link to="/worker/tasks" className="text-white/50">←</Link>
        <h1 className="display text-lg font-semibold">{task.title}</h1>
      </header>

      <section className="px-6 mb-6">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Checklist</p>
        <div className="rounded-card bg-navy-800 divide-y divide-white/10">
          {task.checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={(e) => setTaskChecklistItem(task.id, item.id, e.target.checked)}
                className="w-5 h-5 accent-brand"
              />
              <span className={item.isCompleted ? "line-through text-white/40" : ""}>
                {item.label}
                {item.requiresPhoto && <span className="text-warning-500 text-xs ml-2">photo required</span>}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="px-6 mb-8">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Photos (Before / After)</p>
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div key={p} className="aspect-square rounded-lg bg-navy-800" />
          ))}
          <button onClick={addPhoto} className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/40 text-2xl">
            +
          </button>
        </div>
      </section>

      <div className="px-6">
        <button
          className="action-band disabled:opacity-40"
          disabled={!allRequiredDone}
          onClick={() => navigate("/worker/tasks")}
        >
          Mark as Completed
        </button>
      </div>
    </div>
  );
}
