import { sitesList } from "../../lib/mockData";

export default function SitesPage() {
  return (
    <div>
      <h1 className="font-display text-xl font-semibold mb-6">Sites</h1>
      <div className="bg-white rounded-card border border-black/5">
        {sitesList.map((s) => (
          <div key={s.id} className="list-row px-4">
            <div>
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-ink-900/50">{s.address} · Geofence {s.geofenceRadiusM}m</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{s.performance}%</p>
              <p className="text-xs text-ink-900/50">{s.workersAssigned} workers</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
