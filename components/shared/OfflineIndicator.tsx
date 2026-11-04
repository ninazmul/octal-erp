"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    let registration: ServiceWorkerRegistration | undefined;
    let hadController = false;
    let isReloadingForUpdate = false;

    const reloadForUpdatedWorker = () => {
      if (!hadController || isReloadingForUpdate) return;
      isReloadingForUpdate = true;
      window.location.reload();
    };

    const checkForWorkerUpdate = () => {
      if (document.visibilityState === "visible") {
        registration?.update().catch(() => {});
      }
    };

    // Keep long-open tabs on the same build as their Server Actions. The worker
    // activates updates immediately, so reload once it takes control.
    if ("serviceWorker" in navigator) {
      hadController = Boolean(navigator.serviceWorker.controller);
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        reloadForUpdatedWorker,
      );
      navigator.serviceWorker
        .register("/sw.js")
        .then((nextRegistration) => {
          registration = nextRegistration;
          checkForWorkerUpdate();
        })
        .catch(() => {});
      window.addEventListener("focus", checkForWorkerUpdate);
      document.addEventListener("visibilitychange", checkForWorkerUpdate);
    }

    const updateCheck = window.setInterval(checkForWorkerUpdate, 5 * 60 * 1000);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setIsOffline(true);

    return () => {
      window.clearInterval(updateCheck);
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.removeEventListener(
          "controllerchange",
          reloadForUpdatedWorker,
        );
        window.removeEventListener("focus", checkForWorkerUpdate);
        document.removeEventListener("visibilitychange", checkForWorkerUpdate);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 shadow-md">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>
        You are currently offline. Cached views are accessible, but financial transactions and record updates require server connectivity.
      </span>
    </div>
  );
}

