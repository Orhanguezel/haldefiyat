"use client";

/**
 * CTA huni olcumu (birinci taraf).
 *
 * Neden gtag yetmiyor: sitede yalnizca Google Ads etiketi (AW-...) yuklu, GA4 yok.
 * `trackConversion` de sadece BASARILI kayitta atesleniyor. Yani "kac kisi CTA'yi gordu,
 * kaci yazmaya basladi" hic bilinmiyordu — 11 abonenin nerede kaybedildigi olculemiyordu.
 *
 * Huni: impression -> focus -> submit -> success
 *
 * Gosterim IntersectionObserver ile, gercekten ekrana girince sayilir; sayfa altindaki
 * bir CTA'yi kimse gormeden "gosterildi" saymak orani yalancı sekilde iyilestirirdi.
 * Ayni sekmede ayni yerlesim icin bir kez gonderilir (sessionStorage) — sticky CTA her
 * scroll'da tekrar tetiklenip veriyi sismesin.
 */

import { useEffect, useRef, type RefObject } from "react";

export type CtaPlacement = "mobile_home_sticky" | "home_bottom" | "price_list_strip" | "live_price";
export type CtaEvent = "impression" | "focus" | "submit" | "success" | "invalid" | "error";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

function device(): "mobile" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  return window.matchMedia("(max-width: 767px)").matches ? "mobile" : "desktop";
}

export function trackCta(placement: CtaPlacement, event: CtaEvent): void {
  if (typeof window === "undefined") return;

  const payload = JSON.stringify({
    placement,
    event,
    path: window.location.pathname.slice(0, 255),
    device: device(),
  });

  // sendBeacon: sayfa kapanirken bile gider ve isteği bloklamaz. Yoksa keepalive fetch.
  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon?.(`${API_BASE}/track/cta`, blob)) return;
  } catch {
    /* asagidaki fetch'e dus */
  }

  void fetch(`${API_BASE}/track/cta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    /* olcum, olctugu isi cokertmemeli */
  });
}

/**
 * Form gorunur olunca bir kez `impression` gonderir ve olay yollayan bir fonksiyon dondurur.
 * Donen `ref` CTA'nin kok elemanina baglanmali.
 */
export function useCtaTracking<T extends HTMLElement = HTMLElement>(
  placement: CtaPlacement,
): { ref: RefObject<T | null>; track: (event: CtaEvent) => void } {
  const ref = useRef<T | null>(null);
  const seen = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || seen.current) return;

    const key = `hf_cta_seen_${placement}`;
    try {
      if (sessionStorage.getItem(key)) {
        seen.current = true;
        return;
      }
    } catch {
      /* sessionStorage kapali olabilir — olcum yine calissin */
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.current) continue;

          // "Gorulmus" esigi: ekrana giren yukseklik, elemanin ve ekranin
          // KUCUK olaninin yarisi kadar olmali.
          //
          // Duz `intersectionRatio >= 0.5` yanlisti: anasayfa alt CTA'si (py-24)
          // telefon ekranindan daha UZUN, oran hicbir zaman 0,5'e ulasamaz ve
          // gosterim asla sayilmazdi. Kucuk CTA'larda ise oran kurali dogru
          // calisir — ikisini birlikte karsilayan olcut bu.
          const visible = entry.intersectionRect.height;
          const limit = Math.min(entry.boundingClientRect.height, window.innerHeight) * 0.5;
          if (visible < limit) continue;
          seen.current = true;
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            /* onemli degil */
          }
          trackCta(placement, "impression");
          io.disconnect();
        }
      },
      // Uzun elemanlarda 0,5 esigi hic tetiklenmeyecegi icin 0 da dinlenir;
      // asil karar yukaridaki yukseklik karsilastirmasinda veriliyor.
      { threshold: [0, 0.25, 0.5] },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [placement]);

  return { ref, track: (event: CtaEvent) => trackCta(placement, event) };
}
