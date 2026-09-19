// Minimal IndexedDB queue for attendance events recorded while offline.
// Deliberately dependency-free (native indexedDB) since this only needs to
// survive a page reload and hold a handful of records at a time.

export type QueuedAttendanceEvent = {
  localId: string;
  organization_id: string;
  site_id: string;
  worker_id: string;
  event_type: "clock_in" | "clock_out";
  occurred_at: string;
  latitude: number;
  longitude: number;
  gps_accuracy_m: number | null;
  distance_from_site_m: number;
  verification_status: "verified" | "out_of_range" | "exception_override";
  override_reason: string | null;
  photo_blob: Blob | null;
};

const DB_NAME = "workonsite-offline";
const STORE = "attendance_queue";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "localId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueAttendanceEvent(event: QueuedAttendanceEvent): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(event);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getQueuedAttendanceEvents(): Promise<QueuedAttendanceEvent[]> {
  const db = await openDb();
  const result = await new Promise<QueuedAttendanceEvent[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedAttendanceEvent[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return result;
}

export async function removeQueuedAttendanceEvent(localId: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(localId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
