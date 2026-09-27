import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { AlertTriangle, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import MobileScreen, { Avatar } from "../../components/MobileScreen";
import { ProfileWaveArt } from "../../components/Illustrations";
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
    <MobileScreen
      header={
        <div className="relative flex items-center gap-4">
          <ProfileWaveArt className="absolute -right-2 -top-6 w-28 h-28" />
          <Avatar name={name} size={60} />
          <div className="min-w-0 relative">
            <h1 className="display text-xl font-semibold truncate">{name || "Unknown"}</h1>
            <p className="text-white/70 text-sm">Worker{site ? ` · ${site.name}` : ""}</p>
          </div>
        </div>
      }
    >
      <div className="card divide-y divide-white/50 mb-6">
        <button onClick={() => navigate("/worker/report-issue")} className="w-full flex items-center justify-between px-4 py-4 text-left">
          <span className="flex items-center gap-3 text-sm font-medium">
            <span className="icon-badge w-8 h-8 rounded-full bg-gradient-to-br from-aurora-amber to-aurora-pink">
              <AlertTriangle size={16} strokeWidth={2} />
            </span>
            Report an issue
          </span>
          <ChevronRight size={16} className="text-ink-900/25" />
        </button>
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-sm text-ink-900/60">Status</span>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-pill bg-success-500/15 text-success-600">Active</span>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 rounded-2xl glass text-danger-500 px-6 py-3.5 font-display font-semibold"
      >
        <LogOut size={17} strokeWidth={2.2} />
        Sign Out
      </button>
    </MobileScreen>
  );
}
