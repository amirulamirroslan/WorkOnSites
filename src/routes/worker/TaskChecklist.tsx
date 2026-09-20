import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Camera, Check } from "lucide-react";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { fetchTaskPhotos, uploadTaskPhoto, type TaskPhoto } from "../../lib/tasks";

export default function TaskChecklist() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { tasks, setTaskChecklistItem, completeTask } = useAppState();
  const task = tasks.find((t) => t.id === taskId);
  const [photos, setPhotos] = useState<TaskPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (taskId) fetchTaskPhotos(taskId).then(setPhotos);
  }, [taskId]);

  if (!task) return null;

  const allRequiredDone = task.checklist.every((c) => !c.isRequired || c.isCompleted);
  const doneCount = task.checklist.filter((c) => c.isCompleted).length;
  const checklistPercent = task.checklist.length > 0 ? Math.round((doneCount / task.checklist.length) * 100) : 0;

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !profile || !taskId) return;
    setUploading(true);
    const photo = await uploadTaskPhoto(taskId, profile.id, file);
    if (photo) setPhotos((p) => [...p, photo]);
    setUploading(false);
  }

  async function handleComplete() {
    if (!task) return;
    await completeTask(task.id);
    navigate("/worker/tasks");
  }

  return (
    <div className="surface-dark min-h-screen pb-24">
      <header className="px-6 pt-10 pb-4 flex items-center gap-3">
        <Link to="/worker/tasks" className="text-white/50">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="display text-lg font-semibold">{task.title}</h1>
      </header>

      <div className="px-6 mb-6">
        <div className="flex justify-between text-xs text-white/40 mb-1">
          <span>{doneCount} / {task.checklist.length} items</span>
          <span>{checklistPercent}%</span>
        </div>
        <div className="h-1.5 rounded-pill bg-white/10">
          <div className="h-1.5 rounded-pill bg-brand transition-all" style={{ width: `${checklistPercent}%` }} />
        </div>
      </div>

      <section className="px-6 mb-6">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-2">Checklist</p>
        <div className="rounded-card bg-navy-800 divide-y divide-white/10 shadow-lg shadow-black/20 border border-white/5">
          {task.checklist.map((item) => (
            <label key={item.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  item.isCompleted ? "bg-brand border-brand" : "border-white/20"
                }`}
              >
                {item.isCompleted && <Check size={13} color="white" strokeWidth={3} />}
                <input
                  type="checkbox"
                  checked={item.isCompleted}
                  onChange={(e) => setTaskChecklistItem(task.id, item.id, e.target.checked)}
                  className="sr-only"
                />
              </span>
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
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <img key={p.id} src={p.url} alt="" className="aspect-square rounded-lg object-cover bg-navy-800" />
          ))}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border border-dashed border-white/20 flex items-center justify-center text-white/40 disabled:opacity-40"
          >
            {uploading ? <span className="text-xs">…</span> : <Camera size={22} strokeWidth={1.8} />}
          </button>
        </div>
      </section>

      <div className="px-6">
        <button className="action-band disabled:opacity-40" disabled={!allRequiredDone} onClick={handleComplete}>
          Mark as Completed
        </button>
      </div>
    </div>
  );
}
