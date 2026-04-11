interface Step {
  num: string;
  icon: string;
  title: string;
  desc: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    num: "01",
    icon: "🌐",
    title: "Hal Verilerini Topla",
    desc: "İstanbul, İzmir ve diğer hallerden günlük fiyat verileri otomatik çekilir.",
  },
  {
    num: "02",
    icon: "🧹",
    title: "Normalize Et",
    desc: "Farklı formatlar standartlaştırılır. Ürün isimleri eşleştirilir (Havuç/Havuc).",
  },
  {
    num: "03",
    icon: "📊",
    title: "Analiz Et",
    desc: "Min, max, ortalama hesaplanır. Trend yüzdeleri ve değişim oranları belirlenir.",
  },
  {
    num: "04",
    icon: "🔔",
    title: "Bildir",
    desc: "Fiyat alarmlı kullanıcılara Telegram ve e-posta bildirimi gönderilir.",
  },
];

/**
 * Nasil calisir bolumu (server component).
 *
 * NEDEN: id="nasil-calisir" hero'daki anchor link icin gerekli. Tamamen statik
 * icerik, RSC olarak kalir.
 */
export default function HowItWorks() {
  return (
    <section
      id="nasil-calisir"
      className="relative z-10 px-8 py-20"
    >
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-12">
          <div className="mb-2 font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
            Başlangıç Rehberi
          </div>
          <h2 className="font-(family-name:--font-display) text-[28px] font-extrabold tracking-[-0.03em] text-(--color-foreground) sm:text-[32px]">
            Nasıl Çalışır?
          </h2>
        </header>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <article
              key={step.num}
              className="group relative overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) p-9 transition-all duration-300 hover:-translate-y-1 hover:bg-(--color-bg-alt)"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-4 font-(family-name:--font-display) text-[48px] font-black leading-none text-(--color-bg-alt) select-none"
              >
                {step.num}
              </span>
              <span className="relative mb-5 block text-[32px]">
                {step.icon}
              </span>
              <h3 className="relative mb-2 font-(family-name:--font-display) text-[17px] font-bold text-(--color-foreground)">
                {step.title}
              </h3>
              <p className="relative text-[13px] leading-[1.7] text-(--color-muted)">
                {step.desc}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
