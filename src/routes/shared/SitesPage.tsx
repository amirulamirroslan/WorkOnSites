import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { AnimatePresence } from "framer-motion";
import { ModalBackdrop, StaggerItem, StaggerList } from "../../components/Motion";

// Leaflet's default marker icons reference image files by relative path,
// which breaks under Vite's bundling — point them at CDN-hosted assets instead.
const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type Site = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
};

type Member = { id: string; full_name: string; role: string };

const DEFAULT_CENTER: [number, number] = [3.139, 101.6869]; // Kuala Lumpur

export default function SitesPage() {
  const { profile } = useAuth();
  const [sites, setSites] = useState<Site[]>([]);
  const [assignmentCounts, setAssignmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [manageSite, setManageSite] = useState<Site | null>(null);

  async function load() {
    setLoading(true);
    const { data: siteRows } = await supabase
      .from("sites")
      .select("id, name, address, latitude, longitude, geofence_radius_m")
      .order("created_at", { ascending: false });
    setSites((siteRows as Site[]) ?? []);

    const { data: assignmentRows } = await supabase
      .from("site_assignments")
      .select("site_id")
      .eq("is_active", true);
    const counts: Record<string, number> = {};
    (assignmentRows ?? []).forEach((a: { site_id: string }) => {
      counts[a.site_id] = (counts[a.site_id] ?? 0) + 1;
    });
    setAssignmentCounts(counts);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-xl font-semibold">Sites</h1>
        {profile?.role === "owner" && (
          <button onClick={() => setShowAdd(true)} className="text-xs font-medium bg-brand text-white px-3 py-2 rounded-lg">
            + Add site
          </button>
        )}
      </div>

      <div className="bg-white rounded-card border border-cloud-100 shadow-soft">
        {loading && <p className="text-sm text-ink-900/50 px-4 py-4">Loading…</p>}
        {!loading && sites.length === 0 && (
          <p className="text-sm text-ink-900/50 px-4 py-4">No sites yet — add your first one.</p>
        )}
        <StaggerList>
        {sites.map((s) => (
          <StaggerItem key={s.id}>
          <button onClick={() => setManageSite(s)} className="w-full list-row px-4 text-left">
            <div>
              <p className="font-medium text-sm">{s.name}</p>
              <p className="text-xs text-ink-900/50">{s.address || "No address set"} · Geofence {s.geofence_radius_m}m</p>
            </div>
            <div className="text-right">
              <p className="text-sm">{assignmentCounts[s.id] ?? 0} workers</p>
              <p className="text-xs text-brand">Manage ›</p>
            </div>
          </button>
          </StaggerItem>
        ))}
        </StaggerList>
      </div>

      <AnimatePresence>
      {showAdd && (
        <AddSiteModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}

      {manageSite && (
        <ManageSiteModal site={manageSite} onClose={() => setManageSite(null)} onChanged={load} isOwner={profile?.role === "owner"} />
      )}
      </AnimatePresence>
    </div>
  );
}

function LocationPicker({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function AddSiteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(50);
  const [position, setPosition] = useState<[number, number]>(DEFAULT_CENTER);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { profile } = useAuth();

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Could not get your current location.")
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!profile?.organization_id) {
      setError("Your account isn't linked to an organization yet. Please sign out and back in.");
      return;
    }
    setSubmitting(true);
    const { error: insertErr } = await supabase.from("sites").insert({
      organization_id: profile.organization_id,
      name,
      address: address || null,
      latitude: position[0],
      longitude: position[1],
      geofence_radius_m: radius,
    });
    setSubmitting(false);
    if (insertErr) {
      setError(insertErr.message);
      return;
    }
    onCreated();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-card p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-semibold mb-4">Add site</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            placeholder="Site name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />
          <input
            placeholder="Address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="rounded-lg border border-black/10 px-3 py-2 text-sm"
          />

          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-900/50">Tap the map to set the pin, or</p>
            <button type="button" onClick={useMyLocation} className="text-xs text-brand font-medium">
              Use my location
            </button>
          </div>

          <div className="h-52 rounded-lg overflow-hidden border border-black/10">
            <MapContainer center={position} zoom={15} style={{ height: "100%", width: "100%" }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <LocationPicker onPick={(lat, lng) => setPosition([lat, lng])} />
              <Marker position={position} icon={markerIcon} />
              <Circle center={position} radius={radius} pathOptions={{ color: "#2E6BFF", fillOpacity: 0.1 }} />
            </MapContainer>
          </div>

          <label className="text-xs text-ink-900/60">
            Geofence radius: <span className="font-medium">{radius}m</span>
          </label>
          <input
            type="range"
            min={20}
            max={300}
            step={10}
            value={radius}
            onChange={(e) => setRadius(Number(e.target.value))}
          />

          {error && <p className="text-danger-500 text-xs">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-black/10 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !name} className="flex-1 action-band disabled:opacity-40 text-sm">
              {submitting ? "Creating…" : "Create site"}
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}

function ManageSiteModal({
  site,
  onClose,
  onChanged,
  isOwner,
}: {
  site: Site;
  onClose: () => void;
  onChanged: () => void;
  isOwner: boolean;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [{ data: memberRows }, { data: assignmentRows }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, role").in("role", ["worker", "team_leader"]),
        supabase.from("site_assignments").select("worker_id").eq("site_id", site.id).eq("is_active", true),
      ]);
      setMembers((memberRows as Member[]) ?? []);
      setAssignedIds(new Set((assignmentRows ?? []).map((a: { worker_id: string }) => a.worker_id)));
      setLoading(false);
    }
    load();
  }, [site.id]);

  async function toggle(workerId: string, currentlyAssigned: boolean) {
    setSaving(workerId);
    if (currentlyAssigned) {
      await supabase.from("site_assignments").delete().eq("site_id", site.id).eq("worker_id", workerId);
      setAssignedIds((prev) => {
        const next = new Set(prev);
        next.delete(workerId);
        return next;
      });
    } else {
      await supabase.from("site_assignments").insert({ site_id: site.id, worker_id: workerId });
      setAssignedIds((prev) => new Set(prev).add(workerId));
    }
    setSaving(null);
    onChanged();
  }

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="bg-white rounded-card p-6 max-w-sm w-full max-h-[90vh] overflow-y-auto">
        <h2 className="font-display font-semibold mb-1">{site.name}</h2>
        <p className="text-xs text-ink-900/50 mb-4">Assign workers &amp; team leaders to this site</p>

        {loading && <p className="text-sm text-ink-900/50">Loading…</p>}
        {!loading && members.length === 0 && <p className="text-sm text-ink-900/50">No team members yet.</p>}

        <div className="divide-y divide-black/5 mb-4 max-h-64 overflow-y-auto">
          {members.map((m) => {
            const assigned = assignedIds.has(m.id);
            return (
              <label key={m.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">{m.full_name}</p>
                  <p className="text-xs text-ink-900/50">{m.role === "team_leader" ? "Team Leader" : "Worker"}</p>
                </div>
                <input
                  type="checkbox"
                  checked={assigned}
                  disabled={!isOwner || saving === m.id}
                  onChange={() => toggle(m.id, assigned)}
                  className="w-5 h-5 accent-brand"
                />
              </label>
            );
          })}
        </div>

        <button onClick={onClose} className="action-band w-full">
          Done
        </button>
      </div>
    </ModalBackdrop>
  );
}
