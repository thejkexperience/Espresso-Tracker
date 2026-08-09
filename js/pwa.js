/* ===========================================================
   Espresso Tracker — PWA install support
   Registers the service worker (app shell caching / offline)
   and captures the "Add to Home Screen" prompt on Android/desktop
   Chrome so pages can offer an install button if they want one.
   =========================================================== */

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
          navigator.serviceWorker.register("service-worker.js").catch((err) => {
                  console.warn("Service worker registration failed:", err);
          });
    });
}

window.deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    window.deferredInstallPrompt = e;
});
