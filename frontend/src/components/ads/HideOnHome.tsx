"use client";

import { usePathname } from "next/navigation";

// Anasayfada (/, /tr, /en ...) çocukları gizler — global üst banner hero'ya denk
// gelmesin diye. Diğer tüm sayfalarda normal render eder. BannerSlot (server) çocuk
// olarak geçer; fetch sunucuda yapılır, burada yalnızca anasayfada gizlenir.
export default function HideOnHome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isHome = /^\/([a-z]{2})?\/?$/.test(pathname);
  if (isHome) return null;
  return <>{children}</>;
}
