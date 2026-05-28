"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { sendPageviewBeacon } from "@/lib/pageviewBeacon";

export function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    sendPageviewBeacon(`${pathname}${query ? `?${query}` : ""}`);
  }, [pathname, searchParams]);

  return null;
}
