/* global importScripts, firebase, clients */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(fetch(event.request));
});

self.addEventListener(
  "notificationclick",
  (event) => {
    event.notification.close();

    const rawPath =
      event.notification.data?.path;

    const targetPath =
      typeof rawPath === "string" &&
      rawPath.startsWith("/")
        ? rawPath
        : "/";

    const targetUrl = new URL(
      targetPath,
      self.location.origin
    ).href;

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then(async (clientList) => {
          for (const client of clientList) {
            const clientUrl = new URL(
              client.url
            );

            if (
              clientUrl.origin !==
              self.location.origin
            ) {
              continue;
            }

            if ("navigate" in client) {
              await client.navigate(
                targetUrl
              );
            }

            return client.focus();
          }

          if (clients.openWindow) {
            return clients.openWindow(
              targetUrl
            );
          }

          return undefined;
        })
    );
  }
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/12.19.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBKh1nYSS0t6mTcOsFZe9YlhDsGQMId220",
  authDomain:
    "oddsnsods-a8e33.firebaseapp.com",
  projectId: "oddsnsods-a8e33",
  storageBucket:
    "oddsnsods-a8e33.firebasestorage.app",
  messagingSenderId:
    "773708213191",
  appId: "1:773708213191:web:deeb8a6e0f5e73063f87e2",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const title =
    payload.notification?.title ||
    "OddsnSods";

  const listId =
    payload.data?.listId || null;

  const options = {
    body:
      payload.notification?.body ||
      "You have a new notification.",

    data: {
      type:
        payload.data?.type || null,

      path: listId
        ? `/list/${encodeURIComponent(
            listId
          )}`
        : "/",
    },
  };

  self.registration.showNotification(
    title,
    options
  );
});
