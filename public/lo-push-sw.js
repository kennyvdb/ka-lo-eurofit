self.addEventListener("push", event => {
 let data = {};
 try { data = event.data ? event.data.json() : {}; } catch {}
 event.waitUntil(self.registration.showNotification("LO App", { body: String(data.body || "Je hebt een nieuw bericht ontvangen."), icon: "/favicon.ico", badge: "/favicon.ico", data: { url: "/berichten" }, tag: "lo-bericht-" + Date.now() }));
});
self.addEventListener("notificationclick", event => {
 event.notification.close();
 event.waitUntil(clients.openWindow("/berichten"));
});
