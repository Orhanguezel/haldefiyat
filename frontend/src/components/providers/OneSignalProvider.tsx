"use client";

import Script from "next/script";
import { useEffect } from "react";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

declare global {
  interface Window {
    OneSignalDeferred?: Array<(sdk: any) => void | Promise<void>>;
  }
}

const ONE_SIGNAL_APP_ID = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID?.trim() ?? "";

export function OneSignalProvider() {
  const { user } = useAuthSession();

  useEffect(() => {
    if (!ONE_SIGNAL_APP_ID || typeof window === "undefined") return;

    const host = window.location.hostname;
    const isProdHost = host === "www.haldefiyat.com" || host === "haldefiyat.com";
    if (!isProdHost) return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: window.location.hostname === "localhost",
      });

      if (user?.id) {
        await OneSignal.login(user.id);
        return;
      }

      await OneSignal.logout();
    });
  }, [user?.id]);

  if (!ONE_SIGNAL_APP_ID) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
