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
      const height = Math.ceil(document.documentElement.scrollHeight);
      window.parent?.postMessage({ type: "hf-ad-preview-height", height }, window.location.origin);
    };
    send();
    const observer = new ResizeObserver(send);
    observer.observe(document.documentElement);
    const timer = setTimeout(send, 600);
    return () => { observer.disconnect(); clearTimeout(timer); };
  }, []);
  return null;
}
