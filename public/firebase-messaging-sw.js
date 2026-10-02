importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.1.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyAZYJBSB5QsUKSpJfOAsbAWVrwKhFBrliM",
  authDomain: "eco-meter-957ab.firebaseapp.com",
  projectId: "eco-meter-957ab",
  storageBucket: "eco-meter-957ab.firebasestorage.app",
  messagingSenderId: "117885500072",
  appId: "1:117885500072:web:84af3be8b3358f5728609d"
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