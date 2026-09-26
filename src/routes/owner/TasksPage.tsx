import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { StaggerItem, StaggerList } from "../../components/Motion";

type Task = {
  id: string;
  title: string;
  status: "pending" | "in_progress" | "completed" | "blocked";
  scheduled_date: string;
  worker: { full_name: string } | null;
  site: { name: string } | null;
};

type Member = { id: string; full_name: string };
type Site = { id: string; name: string };
type Template = { id: string; name: string };

const statusStyle: Record<string, string> = {
  completed: "text-success-500",
  in_progress: "text-warning-500",
  pending: "text-ink-900/40",
  blocked: "text-danger-500",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("tasks")
      .select("id, title, status, scheduled_date, worker:profiles(full_name), site:sites(name)")
      .order("scheduled_date", { ascending: false })
      .limit(50);
    setTasks((data as unknown as Task[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold">Tasks</h1>
        <button onClick={() => setShowCreate(true)} className="text-xs font-medium bg-brand text-white px-3 py-2 rounded-lg">
          + Assign task
        </button>
      </div>

      <div className="card">
        {loading && <p className="text-sm text-ink-900/50 px-4 py-4">Loading…</p>}
        {!loading && tasks.length === 0 && <p className="text-sm text-ink-900/50 px-4 py-4">No tasks yet.</p>}
        {!loading && tasks.length > 0 && (
          <StaggerList>
            <AnimatePresence>
              {tasks.map((t) => (
                <StaggerItem key={t.id}>
                  <div className="list-row px-4">
                    <div>
                      <p className="font-medium text-sm">{t.title}</p>
                      <p className="text-xs text-ink-900/50">
                        {t.site?.name ?? "Unknown site"} · {t.worker?.full_name ?? "Unassigned"} · {t.scheduled_date}
                      </p>
                    </div>
                    <span className={`text-xs ${statusStyle[t.status]}`}>{t.status.replace("_", " ")}</span>
                  </div>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </StaggerList>
        )}
      </div>

      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function CreateTaskModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [title, setTitle] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [members, setMembers] = useState<Member[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      const [{ data: memberRows }, { data: siteRows }, { data: templateRows }] = await Promise.all([
        supabase.from("profiles").select("id, full_name").in("role", ["worker", "team_leader"]),
        supabase.from("sites").select("id, name"),
        supabase.from("checklist_templates").select("id, name"),
      ]);
      setMembers((memberRows as Member[]) ?? []);
      setSites((siteRows as Site[]) ?? []);
      setTemplates((templateRows as Template[]) ?? []);
    }
    loadOptions();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data: task, error: taskErr } = await supabase
      .from("tasks")
      .insert({
        title,
        organization_id: profile?.organization_id,
        worker_id: workerId,
        site_id: siteId,
        checklist_template_id: templateId || null,
        scheduled_date: date,
      })
      .select("id")
      .single();

    if (taskErr || !task) {
      setSubmitting(false);
      setError(taskErr?.message ?? "Could not create task");
      return;
    }

    // Copy the template's items onto this task, so later edits to the
    // template don't retroactively change a task already in progress.
    if (templateId) {
      const { data: templateItems } = await supabase
        .from("checklist_template_items")
        .select("id, label, requires_photo, is_required")
        .eq("template_id", templateId);

      if (templateItems && templateItems.length > 0) {
        await supabase.from("task_checklist_items").insert(
          templateItems.map((item) => ({
            task_id: task.id,
            template_item_id: item.id,
            label: item.label,
            requires_photo: item.requires_photo,
            is_required: item.is_required,
          }))
        );
      }
    }

    setSubmitting(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
      <div className="bg-white rounded-card p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-semibold mb-4">Assign task</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Task title (e.g. Lobby)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <select value={workerId} onChange={(e) => setWorkerId(e.target.value)} required className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="">Assign to…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name}</option>
            ))}
          </select>
          <select value={siteId} onChange={(e) => setSiteId(e.target.value)} required className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="">Site…</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="rounded-lg border border-black/10 px-3 py-2 text-sm">
            <option value="">No checklist template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          {error && <p className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-black/10 text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !title || !workerId || !siteId} className="flex-1 action-band disabled:opacity-40 text-sm">
              {submitting ? "Creating…" : "Assign"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
