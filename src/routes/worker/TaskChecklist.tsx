import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import MobileScreen, { ScreenTitle } from "../../components/MobileScreen";
import { useAppState } from "../../context/AppState";
import { useAuth } from "../../context/AuthContext";
import { Spinner } from "../../components/Loading";
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
    <MobileScreen
      navSpace={false}
      header={
        <div>
          <ScreenTitle title={task.title} back="/worker/tasks" />
          <div className="flex justify-between text-xs text-white/70 mt-5 mb-1.5">
            <span>{doneCount} / {task.checklist.length} items</span>
            <span>{checklistPercent}%</span>
          </div>
          <div className="h-2 rounded-pill bg-white/15">
            <div className="h-2 rounded-pill bg-brand-light transition-[width] duration-500 ease-out" style={{ width: `${checklistPercent}%` }} />
          </div>
        </div>
      }
    >
      <p className="font-display font-semibold mb-3">Checklist</p>
      <div className="card divide-y divide-cloud-100 mb-6">
        {task.checklist.map((item) => (
          <label key={item.id} className="press-row flex items-center gap-3 px-4 py-3.5">
            <span
              className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                item.isCompleted ? "bg-brand border-brand" : "border-ink-900/20"
              }`}
            >
              {/* Always rendered and scaled (a transition, so it never plays on first load) */}
              <Check
                size={14}
                color="white"
                strokeWidth={3}
                className={`transition-transform duration-200 ease-[cubic-bezier(0.34,1.45,0.5,1)] ${
                  item.isCompleted ? "scale-100" : "scale-0"
                }`}
              />
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={(e) => setTaskChecklistItem(task.id, item.id, e.target.checked)}
                className="sr-only"
              />
            </span>
            <span className={`text-sm flex-1 ${item.isCompleted ? "line-through text-ink-900/40" : "font-medium"}`}>
              {item.label}
              {item.requiresPhoto && (
                <span className="inline-flex items-center gap-1 text-brand text-[11px] font-semibold ml-2">
                  <Camera size={11} /> photo required
                </span>
              )}
            </span>
          </label>
        ))}
      </div>

      <p className="font-display font-semibold mb-3">Photo Evidence</p>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        {photos.map((p) => (
          <img key={p.id} src={p.url} alt="" className="aspect-square rounded-xl object-cover bg-cloud-100" />
        ))}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 flex flex-col items-center justify-center gap-1 text-brand text-[11px] font-semibold disabled:opacity-40"
        >
          {uploading ? (
            <Spinner size={20} />
          ) : (
            <>
              <Camera size={20} strokeWidth={1.8} />
              Add Photo
            </>
          )}
        </button>
      </div>

      <button className="action-band disabled:opacity-40 disabled:shadow-none" disabled={!allRequiredDone} onClick={handleComplete}>
        Done
      </button>
    </MobileScreen>
  );
}
