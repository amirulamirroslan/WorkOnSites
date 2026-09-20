import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getMyAssignedSite, type AssignedSite } from "../../lib/attendance";

export default function WorkerProfile() {
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const [site, setSite] = useState<AssignedSite | null>(null);
  const name = profile?.full_name ?? "";

  useEffect(() => {
    if (profile) getMyAssignedSite(profile.id).then(setSite);
  }, [profile]);

  return (
    <div className="surface-dark min-h-screen pb-24 px-6 pt-10">
      <h1 className="display text-lg font-semibold mb-6">Profile</h1>

      <div className="rounded-card bg-navy-800 p-5 flex items-center gap-4 mb-6 shadow-lg shadow-black/20 border border-white/5">
        <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center font-display text-lg font-semibold shrink-0">
          {name.trim() ? name.split(" ").map((n) => n[0]).join("").slice(0, 2) : "?"}
        </div>
        <div className="min-w-0">
          <p className="font-medium truncate">{name || "Unknown"}</p>
          <p className="text-white/50 text-sm">Worker · {site?.name ?? "No site assigned"}</p>
        </div>
      </div>

      <div className="rounded-card bg-navy-800 divide-y divide-white/5 mb-6 shadow-lg shadow-black/20 border border-white/5">
        <button onClick={() => navigate("/worker/report-issue")} className="w-full flex items-center justify-between px-4 py-3 text-left">
          <span className="flex items-center gap-2.5 text-sm">
            <AlertTriangle size={16} className="text-white/40" strokeWidth={2} />
            Report an issue
          </span>
          <ChevronRight size={16} className="text-white/30" />
        </button>
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm text-white/60">Status</span>
          <span className="text-xs px-2 py-1 rounded-pill bg-success-500/20 text-success-500">Active</span>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-card bg-white/5 text-danger-500 px-6 py-3 font-display font-semibold"
      >
        <LogOut size={17} strokeWidth={2.2} />
        Sign Out
      </button>
    </div>
  );
}
