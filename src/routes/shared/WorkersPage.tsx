import { workersList } from "../../lib/mockData";

const roleLabel: Record<string, string> = { worker: "Worker", team_leader: "Team Leader" };

export default function WorkersPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Workers</h1>
      <div className="bg-white rounded-card border border-black/5">
        {workersList.map((w) => (
          <div key={w.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{w.name}</p>
              <p className="text-xs text-ink-900/50">{roleLabel[w.role]} · {w.site}</p>
            </div>
            <span className="text-xs text-ink-900/60">{w.mobile}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
