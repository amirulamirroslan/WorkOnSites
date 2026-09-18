import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAppState } from "../../context/AppState";
import { site } from "../../lib/mockData";

export default function ClockInSuccess() {
  const navigate = useNavigate();
  const { setClockStatus, setClockInTime } = useAppState();

  useEffect(() => {
    const now = new Date();
    setClockStatus("clocked_in");
    setClockInTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, [setClockStatus, setClockInTime]);

  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="surface-dark min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-success-500/20 flex items-center justify-center mb-6">
        <span className="text-success-500 text-3xl">✓</span>
      </div>
      <h1 className="display text-xl font-semibold mb-1">Clocked In!</h1>
      <p className="font-display text-2xl font-bold mb-1">{time}</p>
      <p className="text-white/50 text-sm mb-8">{site.name}</p>

      <div className="w-full rounded-card bg-navy-800 p-4 mb-8 space-y-2 text-sm text-left">
        <div className="flex justify-between"><span className="text-white/60">Location verified</span><span className="text-success-500">✓</span></div>
        <div className="flex justify-between"><span className="text-white/60">Face captured</span><span className="text-success-500">✓</span></div>
      </div>

      <button className="action-band" onClick={() => navigate("/worker/tasks")}>
        View Today's Tasks
      </button>
    </div>
  );
}
