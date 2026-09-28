import {
  getMessaging,
  isSupported,
  onMessage,
  onRegistered,
  register,
} from "firebase/messaging";

import firebaseApp from "./firebase";
import { apiFetch } from "./api";

const FID_STORAGE_KEY =
  "oddsnsodsNotificationFid";

let registrationListenerAdded = false;
let foregroundListenerAdded = false;
let registrationInProgress = null;

// ------------------------------------
// SAVE FIREBASE INSTALLATION TO USER
// ------------------------------------

const addRegistrationListener = (
  messaging
) => {
  if (registrationListenerAdded) {
    return;
  }

  onRegistered(
    messaging,
    async (fid) => {
      try {
        const previousFid =
          localStorage.getItem(
            FID_STORAGE_KEY
          );

        await apiFetch(
          "/notifications/register",
          {
            method: "POST",
            body: JSON.stringify({
              fid,
              previousFid:
                previousFid &&
                previousFid !== fid
                  ? previousFid
                  : null,
            }),
          }
        );

        localStorage.setItem(
          FID_STORAGE_KEY,
          fid
        );

        console.log(
          "Notification installation registered."
        );
      } catch (error) {
        console.error(
          "Failed to save Firebase installation:",
          error
        );
      }
    }
  );

  registrationListenerAdded = true;
};

// ------------------------------------
// HANDLE FOREGROUND NOTIFICATIONS
// ------------------------------------

const addForegroundListener = (
  messaging
) => {
  if (foregroundListenerAdded) {
    return;
  }

  onMessage(
    messaging,
    (payload) => {
      console.log(
        "Foreground notification received:",
        payload
      );

      const title =
        payload.notification?.title ||
        "OddsnSods";

      const body =
        payload.notification?.body ||
        "You have a new notification.";

      window.dispatchEvent(
        new CustomEvent(
          "oddsnsods-notification",
          {
            detail: {
              title,
              body,
              type:
                payload.data?.type ||
                null,
              listId:
                payload.data?.listId ||
                null,
            },
          }
        )
      );
    }
  );

  foregroundListenerAdded = true;
};

// ------------------------------------
// REGISTER THIS BROWSER WITH FCM
// ------------------------------------

const registerBrowser = async (
  messaging
) => {
  if (registrationInProgress) {
    return registrationInProgress;
  }

  registrationInProgress = register(
    messaging,
    {
      vapidKey:
        import.meta.env
          .VITE_FIREBASE_VAPID_KEY,
    }
  ).finally(() => {
    registrationInProgress = null;
  });

  return registrationInProgress;
};

// ------------------------------------
// PREPARE FIREBASE MESSAGING
// ------------------------------------

const prepareMessaging = async () => {
  const supported =
    await isSupported();

  if (!supported) {
    throw new Error(
      "Push notifications are not supported on this device."
    );
  }

  const messaging =
    getMessaging(firebaseApp);

  addRegistrationListener(
    messaging
  );

  addForegroundListener(
    messaging
  );

  return messaging;
};

// ------------------------------------
// USER CLICKS ENABLE NOTIFICATIONS
// ------------------------------------

export const enableNotifications =
  async () => {
    try {
      if (
        !("Notification" in window)
      ) {
        throw new Error(
          "Notifications are not supported by this browser."
        );
      }

      const permission =
        await Notification
          .requestPermission();

      if (
        permission !== "granted"
      ) {
        throw new Error(
          "Notification permission was not granted."
        );
      }

      const messaging =
        await prepareMessaging();

      await registerBrowser(
        messaging
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "Notification setup failed:",
        error
      );

      return {
        success: false,
        message: error.message,
      };
    }
  };

// ------------------------------------
// AUTO-SYNC ALREADY ALLOWED BROWSERS
// ------------------------------------

export const syncNotificationsIfAllowed =
  async () => {
    try {
      if (
        !("Notification" in window)
      ) {
        return;
      }

      if (
        Notification.permission !==
        "granted"
      ) {
        return;
      }

      const messaging =
        await prepareMessaging();

      await registerBrowser(
        messaging
      );
    } catch (error) {
      console.error(
        "Notification sync failed:",
        error
      );
    }
  };

// ------------------------------------
// REMOVE THIS BROWSER FROM USER
// ------------------------------------

export const unregisterNotifications =
  async () => {
    const fid =
      localStorage.getItem(
        FID_STORAGE_KEY
      );

    if (!fid) {
      return {
        success: true,
      };
    }

    try {
      await apiFetch(
        "/notifications/unregister",
        {
          method: "DELETE",
          body: JSON.stringify({
            fid,
          }),
        }
      );

      localStorage.removeItem(
        FID_STORAGE_KEY
      );

      return {
        success: true,
      };
    } catch (error) {
      console.error(
        "Notification unregister failed:",
        error
      );

      return {
        success: false,
        message: error.message,
      };
    }
  };
