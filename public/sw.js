const VERSION = "v2";
const STATIC_CACHE = `static-${VERSION}`;
const OFFLINE_URL = "/offline";

const PRECACHE = [
  OFFLINE_URL,
  "/icon/icon-192x192.png",
  "/icon/icon-512x512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase dll. tidak disentuh
  if (url.pathname.startsWith("/api/")) return;

  // Navigasi halaman: selalu ke jaringan, fallback ke halaman offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Jangan cache chunk Next agar kode yang diperbarui tidak tertahan oleh service worker.
  if (url.pathname.startsWith("/icon/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(request, copy));
            return res;
          })
      )
    );
  }
});

// ===== Notifikasi push chat =====
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {}
  if (data.type !== "chat") return;

  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      const sedangDilihat = list.some(
        (c) => c.visibilityState === "visible" && c.focused
      );
      if (sedangDilihat) return; // chat sedang dilihat, tidak perlu notifikasi

      await self.registration.showNotification(data.title || "Pesan baru", {
        body: data.body || "",
        icon: "/icon/icon-192x192.png",
        badge: "/icon/icon-192x192.png",
        tag: data.tag,
        renotify: true,
        data: { url: data.url || "/" },
      });

      if (data.badge != null && "setAppBadge" in self.navigator) {
        await self.navigator.setAppBadge(data.badge);
      }
    })()
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      const list = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const c of list) {
        if ("focus" in c) {
          await c.focus();
          if ("navigate" in c) {
            try {
              await c.navigate(url);
            } catch {}
          }
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});