import { attendanceLog } from "../../lib/mockData";

const statusStyle: Record<string, string> = {
  verified: "text-success-500",
  out_of_range: "text-danger-500",
  exception_override: "text-warning-500",
};

const statusLabel: Record<string, string> = {
  verified: "Verified",
  out_of_range: "Out of range",
  exception_override: "Exception override",
};

export default function AttendancePage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Attendance</h1>
      <div className="bg-white rounded-card border border-black/5">
        {attendanceLog.map((a) => (
          <div key={a.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{a.worker}</p>
              <p className="text-xs text-ink-900/50">
                {a.site} · In {a.clockIn} {a.clockOut ? `· Out ${a.clockOut}` : "· Still on site"}
              </p>
            </div>
            <span className={`text-xs ${statusStyle[a.status]}`}>{statusLabel[a.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
