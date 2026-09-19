import { useEffect, useState } from "react";
import { syncOfflineQueue } from "../lib/attendance";

// Matches mockup screen 11 ("OFFLINE — your data will sync when connection
// is restored"). Shows a slim top banner app-wide when the browser goes
// offline, plus a short "back online" confirmation when it returns.
//
// Real build: pair this with an IndexedDB queue for clock-in/out + checklist
// writes made while offline, and a `pendingCount` here instead of the
// placeholder — see PROGRESS.md.
export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    // Also try a sync on mount — covers the case where items were queued in
    // a previous session and the app is reloaded already back online (the
    // "online" event alone wouldn't fire in that case).
    syncOfflineQueue();

    function handleOnline() {
      setOnline(true);
      setJustReconnected(true);
      syncOfflineQueue();
      const t = setTimeout(() => setJustReconnected(false), 3000);
      return () => clearTimeout(t);
    }
    function handleOffline() {
      setOnline(false);
    }
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online && !justReconnected) return null;

  return (
    <div
      className={`fixed top-0 inset-x-0 z-50 px-4 py-2 text-xs font-medium text-center ${
        online ? "bg-success-500 text-white" : "bg-warning-500 text-navy-950"
      }`}
    >
      {online ? "Back online — syncing…" : "You're offline. Your data will sync when connection is restored."}
    </div>
  );
}
