import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

type Template = { id: string; name: string; version: number };
type TemplateItem = { id: string; label: string; sort_order: number; requires_photo: boolean; is_required: boolean };

export default function ChecklistsPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from("checklist_templates").select("id, name, version").order("created_at", { ascending: false });
    setTemplates((data as Template[]) ?? []);
    const { data: itemRows } = await supabase.from("checklist_template_items").select("template_id");
    const counts: Record<string, number> = {};
    (itemRows ?? []).forEach((r: { template_id: string }) => {
      counts[r.template_id] = (counts[r.template_id] ?? 0) + 1;
    });
    setItemCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold">Checklist Templates</h1>
        <button onClick={() => setShowCreate(true)} className="text-xs font-medium bg-brand text-white px-3 py-2 rounded-lg">
          + New template
        </button>
      </div>

      <div className="bg-white rounded-card border border-cloud-100 shadow-soft">
        {loading && <p className="text-sm text-ink-900/50 px-4 py-4">Loading…</p>}
        {!loading && templates.length === 0 && <p className="text-sm text-ink-900/50 px-4 py-4">No templates yet.</p>}
        {templates.map((t) => (
          <div key={t.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{t.name}</p>
              <p className="text-xs text-ink-900/50">v{t.version} · {itemCounts[t.id] ?? 0} items</p>
            </div>
            <button onClick={() => setEditTemplate(t)} className="text-xs text-brand underline">Edit</button>
          </div>
        ))}
      </div>

      {showCreate && (
        <CreateTemplateModal
          onClose={() => setShowCreate(false)}
          onCreated={(t) => {
            setShowCreate(false);
            load();
            setEditTemplate(t);
          }}
        />
      )}
      {editTemplate && <EditTemplateModal template={editTemplate} onClose={() => { setEditTemplate(null); load(); }} />}
    </div>
  );
}

function CreateTemplateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (t: Template) => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { data, error: insertErr } = await supabase
      .from("checklist_templates")
      .insert({ name, organization_id: profile?.organization_id })
      .select("id, name, version")
      .single();
    setSubmitting(false);
    if (insertErr || !data) {
      setError(insertErr?.message ?? "Could not create template");
      return;
    }
    onCreated(data as Template);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
      <div className="bg-white rounded-card p-6 max-w-sm w-full">
        <h2 className="font-display font-semibold mb-4">New checklist template</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Template name (e.g. Lobby Cleaning)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          {error && <p className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-black/10 text-sm">Cancel</button>
            <button type="submit" disabled={submitting || !name} className="flex-1 action-band disabled:opacity-40 text-sm">
              {submitting ? "Creating…" : "Create & add items"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditTemplateModal({ template, onClose }: { template: Template; onClose: () => void }) {
  const [items, setItems] = useState<TemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState("");
  const [newRequiresPhoto, setNewRequiresPhoto] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("checklist_template_items")
      .select("id, label, sort_order, requires_photo, is_required")
      .eq("template_id", template.id)
      .order("sort_order", { ascending: true });
    setItems((data as TemplateItem[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id]);

  async function addItem() {
    if (!newLabel.trim()) return;
    await supabase.from("checklist_template_items").insert({
      template_id: template.id,
      label: newLabel.trim(),
      sort_order: items.length,
      requires_photo: newRequiresPhoto,
    });
    setNewLabel("");
    setNewRequiresPhoto(false);
    load();
  }

  async function removeItem(id: string) {
    await supabase.from("checklist_template_items").delete().eq("id", id);
    load();
  }

  async function toggleRequired(item: TemplateItem) {
    await supabase.from("checklist_template_items").update({ is_required: !item.is_required }).eq("id", item.id);
    load();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-6 z-50">
      <div className="bg-white rounded-card p-6 max-w-sm w-full max-h-[85vh] overflow-y-auto">
        <h2 className="font-display font-semibold mb-4">{template.name}</h2>

        {loading && <p className="text-sm text-ink-900/50">Loading…</p>}
        <div className="divide-y divide-black/5 mb-4">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-2 gap-2">
              <div className="min-w-0">
                <p className="text-sm truncate">{item.label}</p>
                <div className="flex gap-2 text-xs text-ink-900/40">
                  <button onClick={() => toggleRequired(item)} className={item.is_required ? "text-brand" : ""}>
                    {item.is_required ? "Required" : "Optional"}
                  </button>
                  {item.requires_photo && <span>· Photo required</span>}
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="text-danger-500 text-xs shrink-0">Remove</button>
            </div>
          ))}
          {!loading && items.length === 0 && <p className="text-sm text-ink-900/50 py-2">No items yet.</p>}
        </div>

        <div className="rounded-lg border border-black/10 p-3 mb-4 space-y-2">
          <input
            placeholder="New checklist item"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-xs text-ink-900/60">
            <input type="checkbox" checked={newRequiresPhoto} onChange={(e) => setNewRequiresPhoto(e.target.checked)} className="accent-brand" />
            Requires photo
          </label>
          <button onClick={addItem} disabled={!newLabel.trim()} className="w-full py-2 rounded-lg bg-brand text-white text-sm disabled:opacity-40">
            Add item
          </button>
        </div>

        <button onClick={onClose} className="action-band w-full">Done</button>
      </div>
    </div>
  );
}
