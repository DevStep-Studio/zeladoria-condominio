// Service Worker - Zeladoria Condomínio PWA & Web Push
const CACHE_NAME = "zeladoria-pwa-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Listener para notificações Push Nativas do navegador / celular
self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: "Zeladoria Condomínio", body: event.data.text() };
    }
  }

  const title = data.title || "Nova Notificação — Zeladoria";
  const options = {
    body: data.body || "Você tem uma nova atualização no condomínio.",
    icon: data.icon || "/favicon.png",
    badge: "/favicon-32x32.png",
    data: {
      url: data.url || "/painel",
      timestamp: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: "open", title: "Abrir no App" },
      { action: "close", title: "Dispensar" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Ao tocar na notificação, abre a rota correta do chamado / painel
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const targetUrl = event.notification.data?.url || "/painel";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(targetUrl) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});
