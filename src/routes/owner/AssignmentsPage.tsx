import { assignmentsList } from "../../lib/mockData";

export default function AssignmentsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Assignments</h1>
      <div className="bg-white rounded-card border border-black/5">
        {assignmentsList.map((a) => (
          <div key={a.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{a.worker}</p>
              <p className="text-xs text-ink-900/50">{a.site} · Reports to {a.teamLeader}</p>
            </div>
            <span className={`text-xs ${a.active ? "text-success-500" : "text-ink-900/40"}`}>
              {a.active ? "Active" : "Inactive"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
