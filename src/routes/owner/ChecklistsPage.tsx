import { checklistTemplatesList } from "../../lib/mockData";

export default function ChecklistsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Checklist Templates</h1>
      <div className="bg-white rounded-card border border-black/5">
        {checklistTemplatesList.map((c) => (
          <div key={c.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{c.name}</p>
              <p className="text-xs text-ink-900/50">v{c.version} · {c.itemCount} items</p>
            </div>
            <button className="text-xs text-brand underline">Edit</button>
          </div>
        ))}
      </div>
      {/* Real build: template editor (add/reorder/remove items, toggle
          requires_photo/is_required) once checklist_templates is live. */}
    </div>
  );
}
