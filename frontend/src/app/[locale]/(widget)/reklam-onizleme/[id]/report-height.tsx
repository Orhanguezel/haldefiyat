"use client";

import { useEffect } from "react";

/**
 * Önizleme yüksekliğini panele bildirir.
 *
 * Sabit iframe yüksekliği yan sütun reklamlarını kesiyordu; afiş boyu şablona ve
 * içeriğe göre değişiyor. Ölçüyü içerik kendisi söyler.
 */
export default function ReportHeight() {
  useEffect(() => {
    const send = () => {
      const content = document.querySelector("[data-banner-preview]");
      if (!content) return;
      const height = Math.ceil(content.getBoundingClientRect().height);
      window.parent?.postMessage({ type: "hf-ad-preview-height", height }, window.location.origin);
    };
    send();
    const observer = new ResizeObserver(send);
    const content = document.querySelector("[data-banner-preview]");
    if (content) observer.observe(content);
    const timer = setTimeout(send, 600);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);
  return null;
}
