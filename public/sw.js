// Minimal service worker: makes the app installable and lets push
// notifications show up even when the tab isn't focused. It does not
// cache or serve pages while offline — offline support for clock-in/out
// is handled separately via the IndexedDB queue in src/lib/offline-queue.ts,
// since punches need to work in a real "airplane mode inside a building"
// scenario, not just a cached shell.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  const { title, body } = event.data.json();
  event.waitUntil(
    self.registration.showNotification(title || "WorkOnSite", {
      body: body || "",
      icon: "/icon-192.png",
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
