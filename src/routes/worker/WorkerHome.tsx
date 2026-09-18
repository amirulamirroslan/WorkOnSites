import { useNavigate } from "react-router-dom";
import ProgressRing from "../../components/ProgressRing";
import StatNumber from "../../components/StatNumber";
import { useAppState } from "../../context/AppState";
import { site, worker } from "../../lib/mockData";

export default function WorkerHome() {
  const navigate = useNavigate();
  const { tasks, clockStatus } = useAppState();
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const percent = Math.round((completedCount / tasks.length) * 100);
  const currentTask = tasks.find((t) => t.status === "in_progress");

  return (
    <div className="surface-dark min-h-screen pb-24">
      <header className="px-6 pt-10 pb-6 flex items-center justify-between">
        <div>
          <p className="text-white/50 text-sm">Good Morning,</p>
          <h1 className="display text-xl font-semibold">{worker.name}</h1>
        </div>
        <span className={`text-xs px-3 py-1 rounded-pill ${clockStatus === "clocked_in" ? "bg-success-500/20 text-success-500" : "bg-white/10 text-white/50"}`}>
          {clockStatus === "clocked_in" ? "Clocked In" : "Not Clocked In"}
        </span>
      </header>

      {clockStatus === "clocked_out" ? (
        <section className="mx-6">
          <button className="action-band" onClick={() => navigate("/worker/clock-in/location")}>
            Clock In
          </button>
          <p className="text-white/40 text-xs text-center mt-2">{site.name} · Tap to verify location & face</p>
        </section>
      ) : (
        <>
          <section className="mx-6 rounded-card bg-navy-800 p-6 flex flex-col items-center gap-3">
            <ProgressRing percent={percent} />
            <StatNumber value={`${completedCount} / ${tasks.length}`} label="Tasks completed" />
          </section>

          <section className="px-6 mt-8">
            <p className="text-white/50 text-xs uppercase tracking-wide mb-3">Current task</p>
            {currentTask ? (
              <div className="rounded-card bg-navy-800 p-5">
                <p className="font-display text-lg font-semibold">{currentTask.title}</p>
                <p className="text-white/50 text-sm mb-4">In progress</p>
                <button className="action-band" onClick={() => navigate(`/worker/tasks/${currentTask.id}`)}>
                  Continue Task
                </button>
              </div>
            ) : (
              <button className="action-band" onClick={() => navigate("/worker/clock-out")}>
                All tasks done — Clock Out
              </button>
            )}
          </section>
        </>
      )}
    </div>
  );
}
