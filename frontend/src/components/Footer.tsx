import Link from "next/link";
import Image from "next/image";

type FooterProps = {
  siteName?: string | null;
  logoUrl?: string | null;
  locale?: string;
  contactEmail?: string | null;
  contactPhone?: string | null;
  socialFacebook?: string | null;
  socialInstagram?: string | null;
  socialTwitter?: string | null;
  socialLinkedin?: string | null;
  socialYoutube?: string | null;
};

interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: ReadonlyArray<FooterLink>;
}

const COLUMNS: ReadonlyArray<FooterColumn> = [
  {
    title: "PLATFORM",
    links: [
      { label: "Hal Fiyatları", href: "/fiyatlar" },
      { label: "Karşılaştır", href: "/karsilastirma" },
      { label: "Trend", href: "/fiyatlar?range=7d" },
    ],
  },
  {
    title: "KURUMSAL",
    links: [
      { label: "Hakkımızda", href: "/hakkimizda" },
      { label: "Metodoloji", href: "/metodoloji" },
      { label: "API Dokümantasyonu", href: "/api-docs" },
      { label: "İletişim", href: "/iletisim" },
    ],
  },
  {
    title: "YASAL",
    links: [
      { label: "Gizlilik Politikası", href: "/gizlilik-politikasi" },
      { label: "Kullanım Koşulları", href: "/kullanim-kosullari" },
      { label: "KVKK Aydınlatma", href: "/kvkk" },
    ],
  },
] as const;

/**
 * Footer — HTML tasarim referansina uyumlu.
 *
 * NEDEN: 4 sutunlu grid (brand + 3 link kolonu) ve alt bar. Renkler semantic
 * tokenlar uzerinden, ASLA hard-coded gri/mor yok. Brand kismi 80-10-10
 * kuralina uyumlu — neutral background, lime accent.
 */
export default function Footer({
  siteName,
  logoUrl,
  socialInstagram,
  socialTwitter,
  socialYoutube,
}: FooterProps) {
  const displayName = siteName || "HaldeFiyat";
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-(--color-border) bg-(--color-header) px-8 py-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-7 grid grid-cols-1 gap-12 border-b border-(--color-border) pb-12 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Sutun 1 — Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={displayName}
                  width={180}
                  height={68}
                  className="h-13 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <span className="font-(family-name:--font-display) text-[20px] font-bold tracking-tight text-(--color-foreground)">
                  Halde<span className="text-(--color-brand)">Fiyat</span>
                </span>
              )}
            </Link>
            <p className="max-w-[320px] text-[14px] leading-relaxed text-(--color-muted)">
              Türkiye&apos;nin hal fiyatları platformu. Günlük sebze ve meyve
              fiyatlarını takip et.
            </p>
            {(socialTwitter || socialInstagram || socialYoutube) && (
              <div className="flex items-center gap-3 pt-1">
                {socialTwitter && (
                  <a href={socialTwitter} target="_blank" rel="noopener noreferrer" aria-label="Twitter/X"
                    className="text-(--color-muted) hover:text-(--color-brand) transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                )}
                {socialInstagram && (
                  <a href={socialInstagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                    className="text-(--color-muted) hover:text-(--color-brand) transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                )}
                {socialYoutube && (
                  <a href={socialYoutube} target="_blank" rel="noopener noreferrer" aria-label="YouTube"
                    className="text-(--color-muted) hover:text-(--color-brand) transition-colors">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Sutun 2-4 — Link gruplari */}
          {COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-foreground)">
                {column.title}
              </h3>
              <ul className="space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-(--color-muted) transition-colors hover:text-(--color-brand)"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Alt bar */}
        <div className="flex flex-col items-center justify-between gap-3 text-[13px] sm:flex-row">
          <p className="text-(--color-muted)">
            &copy; {year} {displayName}. Tüm hakları saklıdır.
          </p>
          <a
            href="https://guezelwebdesign.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-(--color-muted) transition-colors hover:text-(--color-brand)"
          >
            Tasarım Dizayn GWD
          </a>
        </div>
      </div>
    </footer>
  );
}
