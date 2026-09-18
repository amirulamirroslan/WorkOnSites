import { useNavigate } from "react-router-dom";
import { useAppState } from "../../context/AppState";

export function ClockOutConfirm() {
  const navigate = useNavigate();
  const { tasks, clockInTime } = useAppState();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const photoCount = tasks.reduce((n, t) => n + t.checklist.filter((c) => c.isCompleted && c.requiresPhoto).length, 0);

  return (
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-6">Ready to Clock Out?</h1>

      <div className="rounded-card bg-navy-800 p-5 mb-8 space-y-2 text-sm">
        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Today's Summary</p>
        <div className="flex justify-between"><span className="text-white/60">Tasks completed</span><span>{completedCount} / {tasks.length}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Photos uploaded</span><span>{photoCount}</span></div>
        <div className="flex justify-between"><span className="text-white/60">Clocked in</span><span>{clockInTime ?? "—"}</span></div>
      </div>

      <button className="action-band" onClick={() => navigate("/worker/clock-out/success")}>
        Clock Out
      </button>
    </div>
  );
}

export function ClockOutSuccess() {
  const navigate = useNavigate();
  const { setClockStatus, clockInTime } = useAppState();
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="surface-dark min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-success-500/20 flex items-center justify-center mb-6">
        <span className="text-success-500 text-3xl">✓</span>
      </div>
      <h1 className="display text-xl font-semibold mb-1">Clocked Out!</h1>
      <p className="font-display text-2xl font-bold mb-1">{time}</p>
      <p className="text-white/50 text-sm mb-8">Clocked in at {clockInTime ?? "—"}</p>

      <button
        className="action-band"
        onClick={() => {
          setClockStatus("clocked_out");
          navigate("/worker");
        }}
      >
        View Summary
      </button>
    </div>
  );
}
