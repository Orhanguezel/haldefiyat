"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
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
// Init basarili mi? OneSignal dashboard'i farkli host'a kayitliysa (or. www) init
// throw eder; ardindan login/logout cekirdek init olmadigi icin "Cannot read
// properties of undefined" zincir hatasi atar. Bu flag o zinciri keser.
let __oneSignalReady = false;

export function OneSignalProvider() {
  const { user } = useAuthSession();
  const pathname = usePathname();
  const deferForLanding = pathname?.endsWith("/canli-hal-fiyatlari") || pathname === "/canli-hal-fiyatlari";

  useEffect(() => {
    if (!ONESIGNAL_ACTIVE || deferForLanding || typeof window === "undefined") return;

    window.OneSignalDeferred = window.OneSignalDeferred || [];

    // Init'i yalnız ilk çağrıda yap — ikinci push "already initialized" atar
    if (!__oneSignalInitStarted) {
      __oneSignalInitStarted = true;
      window.OneSignalDeferred.push(async (OneSignal) => {
        try {
          OneSignal?.Debug?.setLogLevel?.("none");
        } catch {
          /* setLogLevel yoksa sorun degil */
        }
        try {
          await OneSignal.init({
            appId: ONE_SIGNAL_APP_ID,
            serviceWorkerPath: "/OneSignalSDKWorker.js",
            notifyButton: { enable: false },
            allowLocalhostAsSecureOrigin: false,
          });
          __oneSignalReady = true;
        } catch (err) {
          // Origin uyusmazligi / zaten init — sessizce gec, retry dongusune girmez
          console.debug("[onesignal] init skipped", err);
        }
      });
    }

    // Login/logout her user değişikliğinde çalışır — init başarılıysa
    const targetUserId = user?.id ?? null;
    window.OneSignalDeferred.push(async (OneSignal) => {
      if (!__oneSignalReady) return; // init başarısızsa zincir hatayı önle
      try {
        if (targetUserId) await OneSignal.login(targetUserId);
        else await OneSignal.logout();
      } catch (err) {
        console.debug("[onesignal] identity sync skipped", err);
      }
    });
  }, [deferForLanding, user?.id]);

  if (!ONESIGNAL_ACTIVE || deferForLanding) return null;

  return (
    <Script
      id="onesignal-sdk"
      src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
      strategy="lazyOnload"
    />
  );
}
