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

  const options = {
    body:
      payload.notification?.body ||
      "You have a new notification.",
  };

  self.registration.showNotification(
    title,
    options
  );
});