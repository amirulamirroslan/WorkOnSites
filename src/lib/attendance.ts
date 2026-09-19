import { supabase } from "./supabase";
import {
  enqueueAttendanceEvent,
  getQueuedAttendanceEvents,
  removeQueuedAttendanceEvent,
  type QueuedAttendanceEvent,
} from "./offlineQueue";

export type AssignedSite = {
  id: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
};

export type VerificationStatus = "verified" | "out_of_range" | "exception_override";

// Haversine distance in meters.
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// A worker's active site assignments — most workers have exactly one, but
// this returns all of them so the caller can decide (auto-pick the only one,
// or show a picker when there's more than one).
export async function getMyAssignedSites(workerId: string): Promise<AssignedSite[]> {
  const { data } = await supabase
    .from("site_assignments")
    .select("site:sites(id, name, address, latitude, longitude, geofence_radius_m)")
    .eq("worker_id", workerId)
    .eq("is_active", true);

  return ((data as unknown as { site: AssignedSite | null }[] | null) ?? [])
    .map((row) => row.site)
    .filter((s): s is AssignedSite => s !== null);
}

// Convenience wrapper for the common single-site case.
export async function getMyAssignedSite(workerId: string): Promise<AssignedSite | null> {
  const sites = await getMyAssignedSites(workerId);
  return sites[0] ?? null;
}

export function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 });
  });
}

async function uploadPhoto(workerId: string, blob: Blob): Promise<string | null> {
  const path = `${workerId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from("attendance-photos").upload(path, blob, { contentType: "image/jpeg" });
  if (error) return null;
  const { data } = supabase.storage.from("attendance-photos").getPublicUrl(path);
  return data.publicUrl;
}

type RecordParams = {
  organizationId: string;
  workerId: string;
  site: AssignedSite;
  eventType: "clock_in" | "clock_out";
  latitude: number;
  longitude: number;
  accuracy: number | null;
  photoBlob: Blob | null;
  // Set when the worker was out of range but chose to submit anyway with a
  // reason — forces verification_status to 'exception_override' regardless
  // of the computed distance, and flags it for owner/team-leader review
  // (override_by stays null: this is a self-reported override, not a
  // supervisor-approved one — see PROGRESS.md).
  overrideReason?: string | null;
};

export type RecordResult = { status: "recorded" | "queued_offline"; verificationStatus: VerificationStatus };

function resolveVerificationStatus(distance: number, radiusM: number, overrideReason?: string | null): VerificationStatus {
  if (overrideReason) return "exception_override";
  return distance <= radiusM ? "verified" : "out_of_range";
}

// Tries a real insert. On any network-shaped failure (offline, fetch
// failure), queues the event in IndexedDB instead of losing it — synced
// automatically next time syncOfflineQueue() runs (wired to the browser's
// "online" event in App.tsx).
export async function recordAttendanceEvent(params: RecordParams): Promise<RecordResult> {
  const distance = distanceMeters(params.site.latitude, params.site.longitude, params.latitude, params.longitude);
  const verificationStatus = resolveVerificationStatus(distance, params.site.geofence_radius_m, params.overrideReason);

  if (!navigator.onLine) {
    await enqueueAttendanceEvent({
      localId: crypto.randomUUID(),
      organization_id: params.organizationId,
      site_id: params.site.id,
      worker_id: params.workerId,
      event_type: params.eventType,
      occurred_at: new Date().toISOString(),
      latitude: params.latitude,
      longitude: params.longitude,
      gps_accuracy_m: params.accuracy,
      distance_from_site_m: distance,
      verification_status: verificationStatus,
      override_reason: params.overrideReason ?? null,
      photo_blob: params.photoBlob,
    });
    return { status: "queued_offline", verificationStatus };
  }

  try {
    const photoUrl = params.photoBlob ? await uploadPhoto(params.workerId, params.photoBlob) : null;
    const { error } = await supabase.from("attendance_events").insert({
      organization_id: params.organizationId,
      site_id: params.site.id,
      worker_id: params.workerId,
      event_type: params.eventType,
      latitude: params.latitude,
      longitude: params.longitude,
      gps_accuracy_m: params.accuracy,
      distance_from_site_m: distance,
      verification_status: verificationStatus,
      override_reason: params.overrideReason ?? null,
      capture_photo_url: photoUrl,
    });
    if (error) throw error;
    return { status: "recorded", verificationStatus };
  } catch {
    // Network blip mid-request — same fallback as being detected offline
    // up front.
    await enqueueAttendanceEvent({
      localId: crypto.randomUUID(),
      organization_id: params.organizationId,
      site_id: params.site.id,
      worker_id: params.workerId,
      event_type: params.eventType,
      occurred_at: new Date().toISOString(),
      latitude: params.latitude,
      longitude: params.longitude,
      gps_accuracy_m: params.accuracy,
      distance_from_site_m: distance,
      verification_status: verificationStatus,
      override_reason: params.overrideReason ?? null,
      photo_blob: params.photoBlob,
    });
    return { status: "queued_offline", verificationStatus };
  }
}

// Flushes anything queued while offline. Safe to call repeatedly — each
// event is only removed from the queue after a successful insert.
export async function syncOfflineQueue(): Promise<number> {
  if (!navigator.onLine) return 0;
  const queued = await getQueuedAttendanceEvents();
  let synced = 0;
  for (const event of queued) {
    try {
      const photoUrl = event.photo_blob ? await uploadPhoto(event.worker_id, event.photo_blob) : null;
      const { error } = await supabase.from("attendance_events").insert({
        organization_id: event.organization_id,
        site_id: event.site_id,
        worker_id: event.worker_id,
        event_type: event.event_type,
        occurred_at: event.occurred_at,
        latitude: event.latitude,
        longitude: event.longitude,
        gps_accuracy_m: event.gps_accuracy_m,
        distance_from_site_m: event.distance_from_site_m,
        verification_status: event.verification_status,
        override_reason: event.override_reason,
        capture_photo_url: photoUrl,
        synced_offline: true,
      });
      if (error) continue; // leave it queued, try again next sync
      await removeQueuedAttendanceEvent(event.localId);
      synced += 1;
    } catch {
      // Still offline or request failed — stop, leave the rest queued.
      break;
    }
  }
  return synced;
}

export type { QueuedAttendanceEvent };
