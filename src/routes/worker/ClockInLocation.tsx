import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useAppState } from "../../context/AppState";
import { getMyAssignedSites, getCurrentPosition, distanceMeters, type AssignedSite } from "../../lib/attendance";

type Phase = "loading_sites" | "picking_site" | "checking" | "verified" | "out_of_range" | "no_site" | "error";

export default function ClockInLocation() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { pendingClockIn, setPendingClockIn } = useAppState();
  const [phase, setPhase] = useState<Phase>("loading_sites");
  const [assignedSites, setAssignedSites] = useState<AssignedSite[]>([]);
  const [site, setSite] = useState<AssignedSite | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  // Step 1: find out which site(s) this worker is assigned to.
  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!profile) return;
      const sites = await getMyAssignedSites(profile.id);
      if (cancelled) return;
      if (sites.length === 0) {
        setPhase("no_site");
      } else if (sites.length === 1) {
        setAssignedSites(sites);
        setSite(sites[0]);
        setPhase("checking");
      } else {
        setAssignedSites(sites);
        setPhase("picking_site");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [profile]);

  // Step 2: once a site is chosen (auto or picked), verify GPS against it.
  useEffect(() => {
    if (phase !== "checking" || !site) return;
    let cancelled = false;
    async function run() {
      try {
        const pos = await getCurrentPosition();
        if (cancelled) return;
        const d = distanceMeters(site!.latitude, site!.longitude, pos.coords.latitude, pos.coords.longitude);
        setDistance(Math.round(d));
        const verified = d <= site!.geofence_radius_m;
        setPhase(verified ? "verified" : "out_of_range");
        setPendingClockIn({
          site: site!,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          distance: d,
          verified,
          photoBlob: null,
          overrideReason: null,
        });
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err instanceof Error ? err.message : "Could not get your location");
        setPhase("error");
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [phase, site, setPendingClockIn]);

  function submitOverride() {
    if (!pendingClockIn || !overrideReason.trim()) return;
    setPendingClockIn({ ...pendingClockIn, overrideReason: overrideReason.trim() });
    navigate("/worker/clock-in/face");
  }

  if (phase === "picking_site") {
    return (
      <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
        <h1 className="display text-lg font-semibold mb-1">Choose a Site</h1>
        <p className="text-white/50 text-sm mb-6">You're assigned to more than one site — which one are you at?</p>
        <div className="rounded-card bg-navy-800 divide-y divide-white/5">
          {assignedSites.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSite(s);
                setPhase("checking");
              }}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-white/40 text-xs">{s.address || "No address set"}</p>
              </div>
              <span className="text-white/30">›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-1">Verify Your Location</h1>
      <p className="text-white/50 text-sm mb-6">Please make sure you are at the assigned site</p>

      <div className="flex-1 rounded-card bg-navy-800 flex items-center justify-center mb-6">
        {(phase === "loading_sites" || phase === "checking") && <p className="text-white/50 text-sm">Getting your location…</p>}
        {phase === "no_site" && (
          <p className="text-white/50 text-sm text-center px-6">
            You haven't been assigned to a site yet. Ask your team leader or owner to assign you one.
          </p>
        )}
        {phase === "error" && <p className="text-danger-500 text-sm text-center px-6">{errorMsg}</p>}
        {(phase === "verified" || phase === "out_of_range") && site && (
          <div className="text-center">
            <p className="font-display text-lg font-semibold">{site.name}</p>
            <p className="text-white/50 text-sm">{distance}m from site</p>
          </div>
        )}
      </div>

      {site && (
        <div className="rounded-card bg-navy-800 p-4 mb-6 space-y-2">
          <StatusLine
            label="Location"
            ok={phase === "verified"}
            pending={phase === "checking"}
            okText={`Within allowed area (${site.geofence_radius_m} m)`}
          />
          <StatusLine label="Verified" ok={phase === "verified"} pending={phase === "checking"} okText="GPS accuracy OK" />
        </div>
      )}

      {phase === "out_of_range" && site && (
        <div className="mb-4">
          <p className="text-danger-500 text-sm mb-3">
            You are approximately {distance}m from the assigned work area. Required: ≤ {site.geofence_radius_m}m. Please
            move closer to the site.
          </p>
          {!showOverrideForm ? (
            <button className="text-brand text-xs font-medium underline" onClick={() => setShowOverrideForm(true)}>
              I'm actually here — clock in anyway
            </button>
          ) : (
            <div className="rounded-card bg-navy-800 p-4 space-y-2">
              <p className="text-white/60 text-xs">
                This will be recorded as an out-of-range exception and flagged for your team leader/owner to review.
              </p>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Reason (e.g. GPS drift, site boundary is wider than mapped)…"
                className="w-full rounded-lg bg-navy-950 p-3 text-sm text-white placeholder-white/30 resize-none"
              />
              <button
                className="w-full rounded-lg bg-warning-500 text-navy-950 px-4 py-2 text-sm font-semibold disabled:opacity-40"
                disabled={!overrideReason.trim()}
                onClick={submitOverride}
              >
                Submit override & continue
              </button>
            </div>
          )}
        </div>
      )}

      <button
        className="action-band disabled:opacity-40"
        disabled={phase !== "verified"}
        onClick={() => navigate("/worker/clock-in/face")}
      >
        Continue
      </button>
    </div>
  );
}

function StatusLine({ label, ok, pending, okText }: { label: string; ok: boolean; pending: boolean; okText: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/60">{label}</span>
      <span className={pending ? "text-white/40" : ok ? "text-success-500" : "text-danger-500"}>
        {pending ? "Checking…" : ok ? okText : "Not verified"}
      </span>
    </div>
  );
}
