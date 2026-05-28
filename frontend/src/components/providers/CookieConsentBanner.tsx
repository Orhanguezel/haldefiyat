"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { captureAttribution } from "@/lib/attribution";

const CONSENT_KEY = "hf_cookie_consent";
type ConsentValue = "accepted" | "rejected";

function updateGoogleConsent(granted: boolean) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  const value = granted ? "granted" : "denied";
  window.gtag("consent", "update", {
    ad_storage: value,
    analytics_storage: value,
    ad_user_data: value,
    ad_personalization: value,
  });
}

function persistConsent(value: ConsentValue) {
  localStorage.setItem(CONSENT_KEY, value);
  document.cookie = `${CONSENT_KEY}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!localStorage.getItem(CONSENT_KEY));
  }, []);

  function accept() {
    persistConsent("accepted");
    updateGoogleConsent(true);
    captureAttribution();
    setVisible(false);
  }

  function reject() {
    persistConsent("rejected");
    updateGoogleConsent(false);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-3 bottom-3 z-[300] mx-auto max-w-4xl rounded-lg border border-(--color-border) bg-(--color-surface) p-4 shadow-2xl sm:inset-x-6 sm:bottom-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-[13px] leading-5 text-(--color-muted)">
          <strong className="text-(--color-foreground)">Çerez tercihi:</strong>{" "}
          Analytics ve reklam ölçüm çerezleri için onayınızı alıyoruz. Zorunlu çerezler hizmetin çalışması için kullanılır.
          <Link href="/gizlilik-politikasi" className="ml-1 font-semibold text-(--color-brand) hover:underline">
            Detaylar
          </Link>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={reject}
            className="h-10 rounded-lg border border-(--color-border) px-4 text-[13px] font-semibold text-(--color-foreground) hover:bg-(--color-bg-alt)"
          >
            Reddet
          </button>
          <button
            type="button"
            onClick={accept}
            className="h-10 rounded-lg bg-(--color-brand) px-4 text-[13px] font-bold text-(--color-navy) hover:bg-(--color-brand-dark)"
          >
            Kabul Et
          </button>
        </div>
      </div>
    </div>
  );
}
