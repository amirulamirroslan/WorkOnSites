// Offline queue for clock-in/out punches. When a punch can't reach
// Supabase (device offline, or the request itself fails on a network
// error), it's stored here — including the photo blob — and flushed
// automatically the next time the browser reports it's back online.

export type QueuedPunch = {
  id: string;
  kind: "clock_in" | "clock_out";
  userId: string;
  organizationId: string | null;
  siteId: string;
  openShiftId?: string;
  lat: number;
  lng: number;
  accuracy: number;
  withinGeofence: boolean | null;
  photoBlob: Blob;
  capturedAt: string;
};

const DB_NAME = "workonsite-offline";
const STORE = "punches";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function queuePunch(punch: QueuedPunch) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(punch);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedPunches(): Promise<QueuedPunch[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedPunch[]);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedPunch(id: string) {
  const db = await openDb();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
