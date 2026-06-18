import Link from "next/link";
import Image from "next/image";
import TopbarClient from "@/components/header/TopbarClient";
import HeaderNavClient, { type NavEntry } from "@/components/header/HeaderNavClient";

type HeaderProps = {
  siteName?: string | null;
  siteSubtitle?: string | null;
  logoUrl?: string | null;
  logoDarkUrl?: string | null;
  logoLightUrl?: string | null;
  trackedProducts?: number;
  activeCities?: number;
  targetCoverage?: string;
  latestRecordedDate?: string | null;
};

const NAV_ENTRIES: ReadonlyArray<NavEntry> = [
  {
    key: "prices-group",
    label: "Fiyatlar",
    items: [
      { key: "prices", label: "Günlük Fiyatlar", href: "/fiyatlar" },
      { key: "borsa", label: "Borsa / Resmi", href: "/borsa" },
      { key: "canli-hayvan", label: "Canlı Hayvan", href: "/canli-hayvan-fiyatlari" },
      { key: "et", label: "Et (Karkas)", href: "/et-fiyatlari" },
      { key: "cities", label: "Şehirler / Haller", href: "/hal" },
      { key: "map", label: "Harita", href: "/harita" },
      { key: "index", label: "Endeks", href: "/endeks" },
      { key: "analiz", label: "Analiz", href: "/analiz" },
    ],
  },
  { key: "firms", label: "Firmalar", href: "/firmalar" },
  {
    key: "listings-group",
    label: "İlanlar",
    items: [
      { key: "listings", label: "Tüm İlanlar", href: "/ilanlar" },
      { key: "listing-create", label: "İlan Ver", href: "/ilan-ver" },
    ],
  },
  {
    key: "follow-group",
    label: "Takibim",
    items: [
      { key: "favorites", label: "Favorilerim", href: "/favoriler" },
      { key: "alerts", label: "Uyarılar", href: "/uyarilar" },
    ],
  },
  { key: "about", label: "Hakkımızda", href: "/hakkimizda" },
] as const;

/**
 * Iki katmanli sticky header.
 * Sunucu render — JS sadece TopbarClient (saat) + HeaderNavClient (active state, drawer).
 */
export default function Header({ siteName, logoUrl, logoDarkUrl, logoLightUrl, trackedProducts, activeCities, targetCoverage, latestRecordedDate }: HeaderProps) {
  const displayName = siteName || "HalDeFiyat";
  const lightThemeLogo = logoLightUrl || logoUrl;
  const darkThemeLogo = logoDarkUrl || lightThemeLogo || "";
  const logoClassName = "h-auto max-h-[64px] w-[min(238px,calc(100vw-92px))] object-contain sm:w-[250px] md:max-h-[60px] md:w-[210px] lg:w-[160px] xl:w-[178px]";

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Layer 1 — Topbar */}
      <div className="hidden md:block bg-(--color-header-top) backdrop-blur-xl border-b border-(--color-border-soft)">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TopbarClient trackedProducts={trackedProducts} activeCities={activeCities} targetCoverage={targetCoverage} latestRecordedDate={latestRecordedDate} />
        </div>
      </div>

      {/* Layer 2 — Main header */}
      <div className="relative bg-(--color-header) backdrop-blur-xl border-b border-(--color-border-soft)">
        <div className="mx-auto flex h-[78px] max-w-7xl items-center justify-between gap-3 px-4 sm:h-[82px] sm:px-6 md:h-[72px] lg:h-[68px] lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex min-w-0 flex-1 items-center lg:flex-none">
            {lightThemeLogo ? (
              <>
                <Image
                  src={lightThemeLogo}
                  alt={displayName}
                  width={250}
                  height={94}
                  className={`${logoClassName} dark:hidden`}
                  unoptimized
                />
                <Image
                  src={darkThemeLogo}
                  alt={displayName}
                  width={250}
                  height={94}
                  className={`hidden ${logoClassName} dark:block`}
                  unoptimized
                />
              </>
            ) : (
              <span className="font-display font-bold text-[18px] tracking-tight text-(--color-foreground)">
                Halde<span className="text-(--color-brand)">Fiyat</span>
              </span>
            )}
          </Link>

          {/* Client island: nav + search + CTA + mobile drawer */}
          <HeaderNavClient entries={NAV_ENTRIES} />
        </div>
      </div>
    </header>
  );
}
