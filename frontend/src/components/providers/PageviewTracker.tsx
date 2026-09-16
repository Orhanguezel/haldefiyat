"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendPageviewBeacon } from "@/lib/pageviewBeacon";

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (/(?:^|\/)(?:ad-preview|reklam-onizleme)(?:\/|$)/.test(pathname ?? "")) return;
    const query = searchParams.toString();
    sendPageviewBeacon(`${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, searchParams]);

  return null;
}
