import {
  getMessaging,
  isSupported,
  onRegistered,
  register,
} from "firebase/messaging";

import firebaseApp from "./firebase";
import { apiFetch } from "./api";

let registrationListenerAdded = false;

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

      const supported =
        await isSupported();

      if (!supported) {
        throw new Error(
          "Push notifications are not supported on this device."
        );
      }

      const permission =
        await Notification.requestPermission();

      if (
        permission !== "granted"
      ) {
        throw new Error(
          "Notification permission was not granted."
        );
      }

      const messaging =
        getMessaging(firebaseApp);

      if (
        !registrationListenerAdded
      ) {
        onRegistered(
          messaging,
          async (fid) => {
            try {
              await apiFetch(
                "/notifications/register",
                {
                  method: "POST",
                  body: JSON.stringify({
                    fid,
                  }),
                }
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

        registrationListenerAdded =
          true;
      }

      await register(messaging, {
        vapidKey:
          import.meta.env
            .VITE_FIREBASE_VAPID_KEY,
      });

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