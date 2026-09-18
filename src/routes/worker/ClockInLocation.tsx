import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { site, distanceMeters } from "../../lib/mockData";

export default function ClockInLocation() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"checking" | "verified" | "out_of_range">("checking");
  const [distance, setDistance] = useState<number | null>(null);

  useEffect(() => {
    // Real build: navigator.geolocation.getCurrentPosition(...). Here we
    // simulate a worker standing well within the geofence.
    const simulated = distanceMeters(site.latitude, site.longitude, site.latitude + 0.00002, site.longitude);
    const t = setTimeout(() => {
      setDistance(Math.round(simulated));
      setStatus(simulated <= site.geofenceRadiusM ? "verified" : "out_of_range");
    }, 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="surface-dark min-h-screen flex flex-col px-6 pt-10 pb-8">
      <h1 className="display text-lg font-semibold mb-1">Verify Your Location</h1>
      <p className="text-white/50 text-sm mb-6">Please make sure you are at the assigned site</p>

      <div className="flex-1 rounded-card bg-navy-800 flex items-center justify-center mb-6">
        {status === "checking" && <p className="text-white/50 text-sm">Getting your location…</p>}
        {status !== "checking" && (
          <div className="text-center">
            <p className="font-display text-lg font-semibold">{site.name}</p>
            <p className="text-white/50 text-sm">{distance}m from site</p>
          </div>
        )}
      </div>

      <div className="rounded-card bg-navy-800 p-4 mb-6 space-y-2">
        <StatusLine label="Location" ok={status === "verified"} pending={status === "checking"} okText="Within allowed area (50 m)" />
        <StatusLine label="Verified" ok={status === "verified"} pending={status === "checking"} okText={`Accuracy: ~8 m`} />
      </div>

      {status === "out_of_range" && (
        <p className="text-danger-500 text-sm mb-4">
          You are approximately {distance}m from the assigned work area. Required: ≤ {site.geofenceRadiusM}m. Please move closer to the site.
        </p>
      )}

      <button
        className="action-band disabled:opacity-40"
        disabled={status !== "verified"}
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
