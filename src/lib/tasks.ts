import { supabase } from "./supabase";

export type TaskPhoto = { id: string; url: string; isBefore: boolean };

export type ChecklistItem = {
  id: string;
  label: string;
  requiresPhoto: boolean;
  isRequired: boolean;
  isCompleted: boolean;
};

export type Task = {
  id: string;
  title: string;
  subtitle: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  checklist: ChecklistItem[];
};

const statusSubtitle: Record<Task["status"], string> = {
  pending: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
  blocked: "Blocked",
};

type TaskRow = {
  id: string;
  title: string;
  status: Task["status"];
  task_checklist_items: {
    id: string;
    label: string;
    requires_photo: boolean;
    is_required: boolean;
    is_completed: boolean;
  }[];
};

export async function fetchMyTasksToday(workerId: string): Promise<Task[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("tasks")
    .select("id, title, status, task_checklist_items(id, label, requires_photo, is_required, is_completed)")
    .eq("worker_id", workerId)
    .eq("scheduled_date", today)
    .order("created_at", { ascending: true });

  return ((data as unknown as TaskRow[]) ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    subtitle: statusSubtitle[t.status],
    status: t.status,
    checklist: (t.task_checklist_items ?? []).map((c) => ({
      id: c.id,
      label: c.label,
      requiresPhoto: c.requires_photo,
      isRequired: c.is_required,
      isCompleted: c.is_completed,
    })),
  }));
}

export async function setChecklistItemCompleted(taskId: string, itemId: string, isCompleted: boolean) {
  await supabase
    .from("task_checklist_items")
    .update({ is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null })
    .eq("id", itemId);

  // First item checked on a still-pending task moves it to in_progress.
  if (isCompleted) {
    await supabase
      .from("tasks")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", taskId)
      .eq("status", "pending");
  }
}

export async function markTaskCompleted(taskId: string) {
  await supabase.from("tasks").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", taskId);
}

export async function fetchTaskPhotos(taskId: string): Promise<TaskPhoto[]> {
  const { data } = await supabase.from("task_photos").select("id, photo_url, is_before").eq("task_id", taskId);
  return ((data as { id: string; photo_url: string; is_before: boolean }[]) ?? []).map((p) => ({
    id: p.id,
    url: p.photo_url,
    isBefore: p.is_before,
  }));
}

export async function uploadTaskPhoto(taskId: string, uploaderId: string, blob: Blob): Promise<TaskPhoto | null> {
  const path = `${uploaderId}/${taskId}/${Date.now()}.jpg`;
  const { error: uploadErr } = await supabase.storage.from("task-photos").upload(path, blob, { contentType: "image/jpeg" });
  if (uploadErr) return null;
  const { data: urlData } = supabase.storage.from("task-photos").getPublicUrl(path);

  const { data, error } = await supabase
    .from("task_photos")
    .insert({ task_id: taskId, photo_url: urlData.publicUrl, uploaded_by: uploaderId })
    .select("id, photo_url, is_before")
    .single();
  if (error || !data) return null;
  return { id: data.id, url: data.photo_url, isBefore: data.is_before };
}
