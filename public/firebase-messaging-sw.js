importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js"
);

// Config is passed in as query params at registration time (see
// src/messaging.js) so no values are hardcoded in this file.
const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get("apiKey"),
  authDomain: params.get("authDomain"),
  projectId: params.get("projectId"),
  storageBucket: params.get("storageBucket"),
  messagingSenderId: params.get("messagingSenderId"),
  appId: params.get("appId")
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const title =
    payload.notification?.title ||
    "EcoMeter Usage Alert";

  const body =
    payload.notification?.body ||
    "Your energy usage has crossed the selected threshold.";

  self.registration.showNotification(
    title,
    {
      body,
      icon: "/vite.svg",
      badge: "/vite.svg",
      data: {
        url: "/notifications"
      }
    }
  );
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    event.waitUntil(
      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      }).then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            client.focus();
            return client.navigate(
              "/notifications"
            );
          }
        }

        if (clients.openWindow) {
          return clients.openWindow(
            "/notifications"
          );
        }
      })
    );
  }
);