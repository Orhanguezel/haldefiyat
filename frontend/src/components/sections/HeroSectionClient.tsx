import Link from "next/link";

interface Feature {
  icon: string;
  label: string;
}

/**
 * Hero içeriği — SAF server component (framer-motion yok).
 *
 * NEDEN framer-motion kaldırıldı: hero H2 sayfanın LCP elementiydi ve
 * `initial="hidden"` (opacity:0) ile başlayıp animasyonu JS hydrate olduktan
 * sonra çalıştığı için LCP, bundle'a bağımlı hale gelip 3.5s'e çıkıyordu
 * (FCP 0.6s iken). Ayrıca koşulsuz initial/animate, React 19 + App Router'da
 * SSR≠client style farkı üretip hydration hatası (#418) atıyordu. LCP elementi
 * asla JS ile açılan bir animasyona bağlı olmamalı → statik, anında görünür.
 */
export default function HeroSectionClient({
  activeCities,
  targetCoverage = "81 il hedef",
}: {
  activeCities?: number;
  targetCoverage?: string;
}) {
  const coverageLabel = activeCities && activeCities > 0
    ? `${activeCities.toLocaleString("tr-TR")} Aktif İl`
    : targetCoverage;
  const features: ReadonlyArray<Feature> = [
    { icon: "📊", label: "Günlük Fiyat Verileri" },
    { icon: "🏪", label: `${coverageLabel} Hal Bilgisi` },
    { icon: "📈", label: "Fiyat Grafikleri" },
    { icon: "🔔", label: "Fiyat Uyarıları" },
  ];

  return (
    <div className="mx-auto max-w-[860px]">
      <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-(--color-brand)/20 bg-(--color-brand)/10 px-[18px] py-1.5 font-(family-name:--font-mono) text-[12px] font-semibold uppercase tracking-[0.08em] text-(--color-brand)">
        <span className="live-dot-sm" aria-hidden />
        Canlı Veri Akışı · {coverageLabel}
      </div>

      {/* Masaüstü hero görseli h2: tek birincil H1 mobil hero'da (Google
          mobile-first indeksleme + trafiğin %78 mobil). Çift H1 kaldırıldı. */}
      <h2 className="font-(family-name:--font-display) text-[42px] font-black leading-[1.05] tracking-[-0.04em] text-(--color-foreground) sm:text-[52px] lg:text-[64px]">
        Türkiye Hal Fiyatları
        <br />
        <span
          className="bg-clip-text text-transparent"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--brand), #4ade80, var(--brand-light))",
          }}
        >
          Tek Ekranda
        </span>
      </h2>

      <p className="mx-auto mt-6 max-w-[600px] text-[19px] leading-[1.7] text-(--color-muted)">
        İstanbul, Ankara, İzmir ve tüm illerden günlük sebze-meyve hal
        fiyatlarını anlık takip edin. Fiyat grafikleri, trend analizleri ve
        akıllı uyarılar.
      </p>

      <div className="mx-auto mt-10 mb-16 flex w-full max-w-md flex-col items-stretch justify-center gap-3.5 sm:max-w-none sm:flex-row sm:items-center">
        <Link
          href="/fiyatlar"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-(--color-brand) px-9 py-4 font-(family-name:--font-display) text-[16px] font-bold text-(--color-brand-fg) shadow-[0_0_30px_rgba(132,240,76,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--color-brand-dark) hover:shadow-[0_0_40px_rgba(132,240,76,0.35)]"
        >
          📊 Fiyatları Keşfet
        </Link>
        <a
          href="#nasil-calisir"
          className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-(--color-border) bg-(--color-bg-alt) px-7 py-4 font-(family-name:--font-display) text-[16px] font-semibold text-(--color-muted) transition-all duration-300 hover:border-(--color-muted) hover:bg-(--color-surface) hover:text-(--color-foreground)"
        >
          Nasıl Çalışır?
        </a>
      </div>

      <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap sm:gap-10">
        {features.map((feat) => (
          <div
            key={feat.label}
            className="flex items-center gap-2.5 text-[14px] text-(--color-muted)"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) text-base">
              {feat.icon}
            </div>
            <span>{feat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
