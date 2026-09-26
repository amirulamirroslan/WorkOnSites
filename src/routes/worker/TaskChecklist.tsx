import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PopCheck, StaggerItem, StaggerList } from "../../components/Motion";
import MobileScreen, { ScreenTitle } from "../../components/MobileScreen";
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
            <div className="h-2 rounded-pill bg-brand-light transition-all" style={{ width: `${checklistPercent}%` }} />
          </div>
        </div>
      }
    >
      <p className="font-display font-semibold mb-3">Checklist</p>
      <StaggerList className="card divide-y divide-cloud-100 mb-6">
        {task.checklist.map((item) => (
          <StaggerItem key={item.id}>
            <label className="flex items-center gap-3 px-4 py-3.5">
              <motion.span
                whileTap={{ scale: 0.85 }}
                animate={{ backgroundColor: item.isCompleted ? "#1A6BFF" : "rgba(0,0,0,0)" }}
                transition={{ duration: 0.18 }}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${
                  item.isCompleted ? "border-brand" : "border-ink-900/20"
                }`}
              >
                <AnimatePresence>{item.isCompleted && <PopCheck size={14} strokeWidth={3} />}</AnimatePresence>
                <span className="text-white">
                  <input
                    type="checkbox"
                    checked={item.isCompleted}
                    onChange={(e) => setTaskChecklistItem(task.id, item.id, e.target.checked)}
                    className="sr-only"
                  />
                </span>
              </motion.span>
              <span className={`text-sm flex-1 transition-colors ${item.isCompleted ? "line-through text-ink-900/40" : "font-medium"}`}>
                {item.label}
                {item.requiresPhoto && (
                  <span className="inline-flex items-center gap-1 text-brand text-[11px] font-semibold ml-2">
                    <Camera size={11} /> photo required
                  </span>
                )}
              </span>
            </label>
          </StaggerItem>
        ))}
      </StaggerList>

      <p className="font-display font-semibold mb-3">Photo Evidence</p>
      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelected} />
      <div className="grid grid-cols-3 gap-2.5 mb-8">
        <AnimatePresence>
          {photos.map((p) => (
            <motion.img
              key={p.id}
              src={p.url}
              alt=""
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="aspect-square rounded-xl object-cover bg-cloud-100"
            />
          ))}
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-brand/40 bg-brand-50 flex flex-col items-center justify-center gap-1 text-brand text-[11px] font-semibold disabled:opacity-40"
        >
          {uploading ? (
            <span className="text-xs">…</span>
          ) : (
            <>
              <Camera size={20} strokeWidth={1.8} />
              Add Photo
            </>
          )}
        </motion.button>
      </div>

      <motion.button
        whileTap={allRequiredDone ? { scale: 0.96 } : undefined}
        className="action-band disabled:opacity-40 disabled:shadow-none"
        disabled={!allRequiredDone}
        onClick={handleComplete}
      >
        Done
      </motion.button>
    </MobileScreen>
  );
}
