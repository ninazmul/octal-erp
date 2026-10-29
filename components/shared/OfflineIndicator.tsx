"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Register service worker if supported
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) setIsOffline(true);

    return () => {
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

