import Link from "next/link";

export default function IndexCta() {
  return (
    <section className="relative z-10 px-8 pb-20">
      <div className="mx-auto max-w-350">
        <div className="relative overflow-hidden rounded-[24px] border border-brand/25 bg-brand/8 px-8 py-12 sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(var(--brand-rgb),0.14),transparent_60%)] pointer-events-none" />

          <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand" />
                HaldeFiyat Endeksi
              </div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
                Haftalık Fiyat Endeksini Takip Edin
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">
                15 temel tarım ürününden oluşan ağırlıksız sepet endeksi. Baz haftaya göre
                fiyat seviyesini tek rakamla okuyun, trend grafiğiyle izleyin.
              </p>
            </div>

            <div className="shrink-0 flex flex-col gap-3 sm:items-end">
              <Link
                href="/endeks"
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-7 text-[14px] font-bold text-brand-fg transition-all hover:brightness-110 shadow-lg shadow-brand/20"
              >
                Endeksi İncele
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <span className="text-[12px] text-faint">Her pazartesi güncellenir</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
