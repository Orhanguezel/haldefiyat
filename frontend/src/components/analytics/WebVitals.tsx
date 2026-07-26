"use client";

import { useReportWebVitals } from "next/web-vitals";

const SAMPLE_STORAGE_KEY = "hf_web_vitals_sampled";
const DEFAULT_SAMPLE_RATE = 0.1;
const BOT_USER_AGENT =
  /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|google-inspectiontool/i;

function sampleRate(): number {
  const configured = Number(process.env.NEXT_PUBLIC_WEB_VITALS_SAMPLE_RATE);
  if (!Number.isFinite(configured)) return DEFAULT_SAMPLE_RATE;
  return Math.min(1, Math.max(0, configured));
}

function isSampledSession(): boolean {
  try {
    const stored = window.sessionStorage.getItem(SAMPLE_STORAGE_KEY);
    if (stored !== null) return stored === "1";

    const sampled = Math.random() < sampleRate();
    window.sessionStorage.setItem(SAMPLE_STORAGE_KEY, sampled ? "1" : "0");
    return sampled;
  } catch {
    return Math.random() < sampleRate();
  }
}

function shouldReport(): boolean {
  if (BOT_USER_AGENT.test(window.navigator.userAgent)) return false;
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
