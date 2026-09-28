let deferredInstallPrompt = null;
let initialised = false;

const notifyInstallStateChanged = () => {
  window.dispatchEvent(
    new Event("oddsnsods-install-state-change")
  );
};

const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches ||
  window.navigator.standalone === true;

const isIos = () =>
  /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export const initialisePwa = () => {
  if (initialised) {
    return;
  }

  initialised = true;

  if ("serviceWorker" in navigator) {
    window.addEventListener(
      "load",
      () => {
        navigator.serviceWorker
          .register("/firebase-messaging-sw.js", {
            scope: "/",
          })
          .catch((error) => {
            console.error(
              "OddsnSods service worker registration failed:",
              error
            );
          });
      },
      { once: true }
    );
  }

  window.addEventListener(
    "beforeinstallprompt",
    (event) => {
      event.preventDefault();
      deferredInstallPrompt = event;
      notifyInstallStateChanged();
    }
  );

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    notifyInstallStateChanged();
  });
};

export const getPwaInstallState = () => ({
  installed: isStandalone(),
  canPrompt: Boolean(deferredInstallPrompt),
  ios: isIos(),
});

export const promptPwaInstall = async () => {
  if (!deferredInstallPrompt) {
    return {
      success: false,
      outcome: "unavailable",
    };
  }

  const promptEvent = deferredInstallPrompt;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;

  if (choice.outcome === "accepted") {
    deferredInstallPrompt = null;
  }

  notifyInstallStateChanged();

  return {
    success: choice.outcome === "accepted",
    outcome: choice.outcome,
  };
};
