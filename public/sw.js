const CACHE_NAME = "narrow-path-static-v6";
const SAFE_STATIC_ASSETS = [
  "/app-icon-192.png",
  "/app-icon-512.png",
  "/apple-touch-icon.png",
  "/maskable-icon-192.png",
  "/maskable-icon-512.png",
  "/app-icon-v2-192.png",
  "/app-icon-v2-512.png",
  "/apple-touch-icon-v2.png",
  "/maskable-icon-v2-192.png",
  "/maskable-icon-v2-512.png",
  "/notification-icon-192.png",
  "/notification-badge-96.png",
];
const DEFAULT_NOTIFICATION_TITLE = "The Narrow Path";
const DEFAULT_NOTIFICATION_BODY = "You have a new notification from The Narrow Path.";
const DEFAULT_NOTIFICATION_URL = "/app";
// Launcher icon filenames are versioned; push notification assets stay separate.
const NOTIFICATION_ICON = "/notification-icon-192.png";
const NOTIFICATION_BADGE = "/notification-badge-96.png";

function getStringValue(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function getSafeNotificationPath(value) {
  const rawValue = getStringValue(value);

  if (!rawValue || rawValue.startsWith("//")) {
    return DEFAULT_NOTIFICATION_URL;
  }

  try {
    const url = new URL(rawValue, self.location.origin);

    if (url.origin !== self.location.origin) {
      return DEFAULT_NOTIFICATION_URL;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return DEFAULT_NOTIFICATION_URL;
  }
}

function getPushPayload(event) {
  if (!event.data) {
    return {};
  }

  try {
    const payload = event.data.json();
    return payload && typeof payload === "object" ? payload : {};
  } catch {
    return {};
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SAFE_STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("push", (event) => {
  const payload = getPushPayload(event);
  const title = getStringValue(payload.title) || DEFAULT_NOTIFICATION_TITLE;
  const body = getStringValue(payload.body) || DEFAULT_NOTIFICATION_BODY;
  const url = getSafeNotificationPath(payload.url);

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: NOTIFICATION_ICON,
      badge: NOTIFICATION_BADGE,
      data: { url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetPath = getSafeNotificationPath(event.notification.data?.url);
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (clientList) => {
        const openTargetWindow = () => clients.openWindow(targetUrl);
        const sameOriginClients = clientList.filter((client) => {
          try {
            return new URL(client.url).origin === self.location.origin;
          } catch {
            return false;
          }
        });

        const exactClient = sameOriginClients.find((client) => {
          try {
            const clientUrl = new URL(client.url);
            return `${clientUrl.pathname}${clientUrl.search}${clientUrl.hash}` === targetPath;
          } catch {
            return false;
          }
        });

        if (exactClient) {
          try {
            return await exactClient.focus();
          } catch (error) {
            console.error("Could not focus notification target window.", error);
          }
        }

        const existingClient = sameOriginClients[0];

        if (existingClient) {
          try {
            if ("navigate" in existingClient) {
              const navigatedClient = await existingClient.navigate(targetUrl);
              return await (navigatedClient || existingClient).focus();
            }

            return await existingClient.focus();
          } catch (error) {
            console.error("Could not navigate notification target window.", error);
            return openTargetWindow();
          }
        }

        return openTargetWindow();
      })
      .catch((error) => {
        console.error("Could not handle notification click.", error);
        return clients.openWindow(targetUrl);
      })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (SAFE_STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          const responseForCache = networkResponse.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseForCache);
          });

          return networkResponse;
        });
      })
    );
    return;
  }

  event.respondWith(fetch(request));
});
