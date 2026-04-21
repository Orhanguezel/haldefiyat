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
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * OneSignal app ID'si spesifik bir domain'e kayıtlı (OneSignal dashboard
 * "Can only be used on..." kısıtı). Lokal dev'de veya preview'da SDK'yı
 * yüklediğimizde "Can only be used on ..." hatası console'a düşüyor.
 *
 * Build-time env üzerinden koru: NEXT_PUBLIC_SITE_URL haldefiyat domain'i
 * değilse Script hiç eklenmez, useEffect erken döner. Bu sunucu ve client
 * render'ı aynı sonucu ürettiği için hydration mismatch riski yok.
 */
const ONESIGNAL_ACTIVE =
  !!ONE_SIGNAL_APP_ID && /https?:\/\/(www\.)?haldefiyat\.com/i.test(SITE_URL);

export function OneSignalProvider() {
  const { user } = useAuthSession();

  useEffect(() => {
    if (!ONESIGNAL_ACTIVE || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async (OneSignal) => {
      await OneSignal.init({
        appId: ONE_SIGNAL_APP_ID,
        serviceWorkerPath: "/OneSignalSDKWorker.js",
        notifyButton: { enable: false },
        allowLocalhostAsSecureOrigin: false,
      });

      if (user?.id) {
        await OneSignal.login(user.id);
        return;
      }

      await OneSignal.logout();
    });
  }, [user?.id]);

  if (!ONESIGNAL_ACTIVE) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="afterInteractive"
    />
  );
}
