import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { issuesList as initialIssues, IssueRecord } from "../../lib/mockData";
import { StaggerItem, StaggerList } from "../../components/Motion";

const statusStyle: Record<string, string> = {
  open: "text-danger-500",
  acknowledged: "text-warning-500",
  resolved: "text-success-500",
};

export default function IssuesPage() {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);

  function advance(id: string) {
    setIssues((prev) =>
      prev.map((i) =>
        i.id !== id ? i : { ...i, status: i.status === "open" ? "acknowledged" : "resolved" }
      )
    );
  }

  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Issues</h1>
      <StaggerList className="card">
        <AnimatePresence>
          {issues.map((i) => (
            <StaggerItem key={i.id}>
              <div className="list-row px-4 items-start">
                <div>
                  <p className="font-medium text-sm">{i.category} · {i.site}</p>
                  <p className="text-xs text-ink-900/50">{i.description}</p>
                  <p className="text-xs text-ink-900/40 mt-1">Reported by {i.reportedBy}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-xs ${statusStyle[i.status]}`}>{i.status}</span>
                  {i.status !== "resolved" && (
                    <button onClick={() => advance(i.id)} className="text-xs text-brand underline">
                      {i.status === "open" ? "Acknowledge" : "Resolve"}
                    </button>
                  )}
                </div>
              </div>
            </StaggerItem>
          ))}
        </AnimatePresence>
      </StaggerList>
    </div>
  );
}
