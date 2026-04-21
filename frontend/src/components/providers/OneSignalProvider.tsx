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
 * OneSignal app ID'si spesifik bir domain'e kayıtlı. Build-time env ile
 * koru: NEXT_PUBLIC_SITE_URL haldefiyat domain'i değilse Script eklenmez,
 * useEffect erken döner (hydration-safe).
 */
const ONESIGNAL_ACTIVE =
  !!ONE_SIGNAL_APP_ID && /https?:\/\/(www\.)?haldefiyat\.com/i.test(SITE_URL);

/**
 * Module-level guard: SDK init sadece bir kez çalıştırılır. React StrictMode
 * double-mount ve user state değişimlerinde useEffect tekrar çalışsa da init
 * ikinci defa tetiklenmez — aksi halde OneSignal "SDK already initialized"
 * hatasını sonsuz retry ederek tarayıcıyı boğar.
 */
let __oneSignalInitStarted = false;

export function OneSignalProvider() {
  const { user } = useAuthSession();

  useEffect(() => {
    if (!ONESIGNAL_ACTIVE || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Init'i yalnız ilk çağrıda yap — ikinci push "already initialized" atar
    if (!__oneSignalInitStarted) {
      __oneSignalInitStarted = true;
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          await OneSignal.init({
            appId: ONE_SIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            notifyButton: { enable: false },
            allowLocalhostAsSecureOrigin: false,
          });
        } catch (err) {
          // Zaten init edilmişse sessizce geç; retry döngüsüne girmez
          console.debug("[onesignal] init skipped", err);
        }
      });
    }

    // Login/logout her user değişikliğinde çalışır — init'ten ayrı
    const targetUserId = user?.id ?? null;
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        if (targetUserId) await OneSignal.login(targetUserId);
        else await OneSignal.logout();
      } catch (err) {
        console.debug("[onesignal] identity sync skipped", err);
      }
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
