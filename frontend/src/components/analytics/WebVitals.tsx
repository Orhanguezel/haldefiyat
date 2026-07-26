"use client";

import { useReportWebVitals } from "next/web-vitals";
import {
  isSampledWebVitalsSession,
  isSyntheticUserAgent,
  webVitalsSampleRate,
} from "@/lib/web-vitals-sampling";

const SAMPLE_STORAGE_KEY = "hf_web_vitals_sampled";

function isSampledSession(): boolean {
  return isSampledWebVitalsSession({
    storage: window.sessionStorage,
    storageKey: SAMPLE_STORAGE_KEY,
    rate: webVitalsSampleRate(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE),
  });
}

function shouldReport(): boolean {
  if (isSyntheticUserAgent(window.navigator.userAgent)) return false;
  return isSampledSession();
}

/**
 * Gerçek kullanıcı Web Vitals ölçümlerini mevcut GTM/GA4 dataLayer'ına yollar.
 * Örnekleme oturum boyunca sabittir; sentetik denetim ve bot trafiği dışlanır.
 */
export default function WebVitals() {
  useReportWebVitals((metric) => {
    if (!shouldReport()) return;

    window.dataLayer = window.dataLayer ?? [];
    window.dataLayer.push({
      event: "web_vitals",
      metric_id: metric.id,
      metric_name: metric.name,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      navigation_type: metric.navigationType,
      page_path: window.location.pathname,
      non_interaction: true,
    });
  });

  return null;
}
