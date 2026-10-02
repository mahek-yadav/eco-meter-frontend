import {
  getMessaging,
  getToken,
  onMessage
} from "firebase/messaging";

import { app, firebaseConfig } from "./firebase";

export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Browser notification permission was not granted."
    );
  }

  const messaging = getMessaging(app);

  const serviceWorkerRegistration =
    await navigator.serviceWorker.register(
      `/firebase-messaging-sw.js?${new URLSearchParams(
        firebaseConfig
      )}`
    );

  const token = await getToken(messaging, {
    vapidKey:
      import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration
  });

  if (!token) {
    throw new Error(
      "FCM registration token was not generated."
    );
  }

  console.log(
    "FCM registration token:",
    token
  );

  return token;
}

export function listenForMessages(callback) {
  const messaging = getMessaging(app);

  return onMessage(
    messaging,
    (payload) => {
      console.log(
        "FCM foreground message received:",
        payload
      );

      callback(payload);
    }
  );
}