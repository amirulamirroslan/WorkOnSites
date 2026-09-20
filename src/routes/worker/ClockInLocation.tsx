import { useNavigate } from "react-router-dom";
import { Suspense, lazy, useEffect, useState } from "react";
import { Check, ChevronRight, MapPin } from "lucide-react";
import MobileScreen, { ScreenTitle, StepTracker } from "../../components/MobileScreen";
import { useAuth } from "../../context/AuthContext";
import { useAppState } from "../../context/AppState";
import { getMyAssignedSites, getCurrentPosition, distanceMeters, type AssignedSite } from "../../lib/attendance";
import { Spinner } from "../../components/Loading";

const SiteMap = lazy(() => import("../../components/SiteMap"));

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

  const header = (
    <ScreenTitle title="Clock In" back="/worker" />
  );

  if (phase === "picking_site") {
    return (
      <MobileScreen header={header} navSpace={false}>
        <StepTracker current={0} />
        <h2 className="font-display font-semibold text-lg mt-6 mb-1">Choose a Site</h2>
        <p className="text-ink-900/50 text-sm mb-4">You're assigned to more than one site — which one are you at?</p>
        <div className="card divide-y divide-cloud-100">
          {assignedSites.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setSite(s);
                setPhase("checking");
              }}
              className="w-full flex items-center gap-3 px-4 py-4 text-left"
            >
              <span className="w-9 h-9 rounded-full bg-brand-50 text-brand flex items-center justify-center shrink-0">
                <MapPin size={17} />
              </span>
              <div className="flex-1">
                <p className="font-semibold text-sm">{s.name}</p>
                <p className="text-ink-900/40 text-xs">{s.address || "No address set"}</p>
              </div>
              <ChevronRight size={16} className="text-ink-900/25" />
            </button>
          ))}
        </div>
      </MobileScreen>
    );
  }

  const verified = phase === "verified";
  const checking = phase === "loading_sites" || phase === "checking";

  return (
    <MobileScreen header={header} navSpace={false}>
      <StepTracker current={0} />

      <div
        className={`mt-5 flex items-center gap-2 text-sm font-semibold ${
          verified ? "text-success-600" : checking ? "text-ink-900/50" : "text-danger-500"
        }`}
      >
        {verified && (
          <span className="w-5 h-5 rounded-full bg-success-500 flex items-center justify-center">
            <Check size={12} color="white" strokeWidth={3} />
          </span>
        )}
        {verified && "You're at the assigned location"}
        {checking && "Getting your location…"}
        {phase === "out_of_range" && "You're outside the assigned location"}
        {phase === "no_site" && "No site assigned"}
        {phase === "error" && "Couldn't verify location"}
      </div>

      <div className="card overflow-hidden mt-3 h-48 relative bg-brand-50">
        {site && (
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center text-brand">
                <Spinner size={22} />
              </div>
            }
          >
            <SiteMap
              latitude={site.latitude}
              longitude={site.longitude}
              radius={site.geofence_radius_m}
              userLat={pendingClockIn?.latitude}
              userLng={pendingClockIn?.longitude}
            />
          </Suspense>
        )}
        {!site && (
          <div className="h-full flex items-center justify-center text-ink-900/50 text-sm text-center px-6">
            {phase === "no_site"
              ? "You haven't been assigned to a site yet. Ask your team leader or owner to assign you one."
              : phase === "error"
              ? errorMsg
              : "Getting your location…"}
          </div>
        )}
      </div>

      {site && (
        <div className="card p-4 mt-4 flex items-start gap-3">
          <span className="w-9 h-9 rounded-full bg-brand-50 text-brand flex items-center justify-center shrink-0">
            <MapPin size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">{site.name}</p>
            <p className="text-ink-900/40 text-xs">
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)}
            </p>
            <p className="text-xs text-ink-900/60 mt-1.5">
              Distance {distance != null ? `${distance} m` : "—"}
              {pendingClockIn?.accuracy != null && <> · Accuracy {Math.round(pendingClockIn.accuracy)} m</>}
            </p>
          </div>
          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-pill shrink-0 ${
              verified
                ? "bg-success-500/15 text-success-600"
                : checking
                ? "bg-cloud-100 text-ink-900/40"
                : "bg-danger-500/10 text-danger-500"
            }`}
          >
            {verified ? "Within range" : checking ? "Checking…" : `Limit ${site.geofence_radius_m} m`}
          </span>
        </div>
      )}

      {phase === "out_of_range" && site && (
        <div className="mt-4">
          <p className="text-danger-500 text-sm mb-3">
            You are approximately {distance}m from the assigned work area. Required: ≤ {site.geofence_radius_m}m. Please
            move closer to the site.
          </p>
          {!showOverrideForm ? (
            <button className="text-brand text-xs font-semibold underline" onClick={() => setShowOverrideForm(true)}>
              I'm actually here — clock in anyway
            </button>
          ) : (
            <div className="card p-4 space-y-2">
              <p className="text-ink-900/60 text-xs">
                This will be recorded as an out-of-range exception and flagged for your team leader/owner to review.
              </p>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={2}
                placeholder="Reason (e.g. GPS drift, site boundary is wider than mapped)…"
                className="w-full rounded-xl bg-cloud-50 border border-cloud-100 p-3 text-sm text-ink-900 placeholder-ink-900/30 resize-none outline-none focus:border-brand"
              />
              <button
                className="w-full rounded-xl bg-warning-500 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-40"
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
        className="action-band disabled:opacity-40 disabled:shadow-none mt-6"
        disabled={!verified}
        onClick={() => navigate("/worker/clock-in/face")}
      >
        Continue
      </button>
    </MobileScreen>
  );
}

