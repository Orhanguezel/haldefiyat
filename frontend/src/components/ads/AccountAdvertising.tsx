import Link from "next/link";
import { ArrowRight, BarChart3, Megaphone, Target } from "lucide-react";
import styles from "./AccountAdvertising.module.css";
import GzlTechnologyBanner from "./GzlTechnologyBanner";

export default function AccountAdvertising() {
  return (
    <section aria-label="Reklam ve tanıtım seçenekleri" data-content-type="advertisement" className={`${styles.section} mb-8 grid items-stretch gap-4 lg:grid-cols-2`}>
      <GzlTechnologyBanner compactMobile />
      <aside aria-label="HalDeFiyat'ta reklam verin" className={`${styles.card} flex flex-col justify-center gap-5 rounded-2xl border border-dashed border-(--color-brand)/40 bg-(--color-brand)/5 p-5 sm:p-6`}>
        <div className={`${styles.heading} flex items-start gap-4`}>
          <span className={`${styles.icon} flex size-12 shrink-0 items-center justify-center rounded-xl bg-(--color-brand)/10 text-(--color-brand)`}><Megaphone size={26} aria-hidden="true" /></span>
          <div className="min-w-0">
            <h2 className="font-(family-name:--font-display) text-xl font-bold leading-snug text-(--color-foreground)"><span className="hidden lg:inline">Ürün ve hizmetlerinizi tarımla ilgilenenlere gösterin</span><span className="lg:hidden">Tarımda görünür olun</span></h2>
            <p className="hidden lg:block mt-2 text-sm leading-6 text-(--color-muted)">HalDeFiyat reklam alanlarında firmanızı ve ürünlerinizi tanıtın.</p>
          </div>
        </div>
        <div className="hidden lg:flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-(--color-muted)">
          <span className="inline-flex items-center gap-2"><Target size={16} aria-hidden="true" /> İlgili ürün sayfalarında görünürlük</span>
          <span className="inline-flex items-center gap-2"><BarChart3 size={16} aria-hidden="true" /> Gösterim ve tıklama takibi</span>
        </div>
        <Link href="/reklam-ver" className={`${styles.cta} inline-flex min-h-11 items-center justify-center gap-3 self-start rounded-xl bg-(--color-brand) px-6 py-3 text-sm font-bold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-brand)`}>Reklam verin <ArrowRight size={17} aria-hidden="true" /></Link>
      </aside>
    </section>
  );
}
