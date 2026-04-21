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
            href="https://guzelwebdesign.com"
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
