import { assignmentsList } from "../../lib/mockData";
import { StaggerItem, StaggerList } from "../../components/Motion";

export default function AssignmentsPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Assignments</h1>
      <StaggerList className="card">
        {assignmentsList.map((a) => (
          <StaggerItem key={a.id}>
            <div className="list-row px-4">
              <div>
                <p className="font-medium text-sm">{a.worker}</p>
                <p className="text-xs text-ink-900/50">{a.site} · Reports to {a.teamLeader}</p>
              </div>
              <span className={`text-xs ${a.active ? "text-success-500" : "text-ink-900/40"}`}>
                {a.active ? "Active" : "Inactive"}
              </span>
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}
