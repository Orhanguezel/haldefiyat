"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

function runWhenIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = window.requestIdleCallback(callback, { timeout: 3_000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = globalThis.setTimeout(callback, 1_500);
  return () => globalThis.clearTimeout(id);
}

export function ServiceWorkerProvider() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const cancelRegistration = runWhenIdle(() => {
      const isLocalhost =
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1";

      if (
        "serviceWorker" in navigator &&
        (window.location.protocol === "https:" || isLocalhost)
      ) {
        navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => undefined);
      }
    });

    return () => {
      cancelRegistration();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-[80] mx-auto flex max-w-md items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950 shadow-lg md:bottom-5">
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Cevrimdisisiniz. Kayitli sayfalar ve son fiyat verileri gosterilir.</span>
    </div>
  );
}
