import Link from "next/link";
import Image from "next/image";
import TopbarClient from "@/components/header/TopbarClient";
import HeaderNavClient, { type NavLink } from "@/components/header/HeaderNavClient";

type HeaderProps = {
  siteName?: string | null;
  siteSubtitle?: string | null;
  logoUrl?: string | null;
};

const NAV_LINKS: ReadonlyArray<NavLink> = [
  { key: "panel", label: "Panel", href: "/" },
  { key: "prices", label: "Fiyatlar", href: "/fiyatlar" },
  { key: "cities", label: "Şehirler", href: "/hal" },
  { key: "favorites", label: "Favorilerim", href: "/favoriler" },
  { key: "alerts", label: "Uyarılar", href: "/uyarilar" },
  { key: "about", label: "Hakkımızda", href: "/hakkimizda" },
] as const;

/**
 * Iki katmanli sticky header.
 * Sunucu render — JS sadece TopbarClient (saat) + HeaderNavClient (active state, drawer).
 */
export default function Header({ siteName, logoUrl }: HeaderProps) {
  const displayName = siteName || "HalDeFiyat";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Layer 1 — Topbar */}
      <div className="bg-[rgba(15,20,36,0.85)] backdrop-blur-xl border-b border-(--color-border-soft)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TopbarClient />
        </div>
      </div>

      {/* Layer 2 — Main header */}
      <div className="relative bg-[rgba(10,14,26,0.85)] backdrop-blur-xl border-b border-(--color-border-soft)">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={displayName}
                width={160}
                height={60}
                className="h-15 w-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="font-display font-bold text-[18px] tracking-tight text-(--color-foreground)">
                Halde<span className="text-(--color-brand)">Fiyat</span>
              </span>
            )}
          </Link>

          {/* Client island: nav + search + CTA + mobile drawer */}
          <HeaderNavClient links={NAV_LINKS} />
        </div>
      </div>
    </header>
  );
}
