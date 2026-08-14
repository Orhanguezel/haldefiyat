import { Bell, ChartNoAxesCombined, Database, GitMerge, type LucideIcon } from "lucide-react";
import { ContentCard } from "@/components/ui/ContentCard";

interface Step {
  num: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const STEPS: ReadonlyArray<Step> = [
  {
    num: "01",
    icon: Database,
    title: "Hal Verilerini Topla",
    desc: "İstanbul, İzmir ve diğer hallerden günlük fiyat verileri otomatik çekilir.",
  },
  {
    num: "02",
    icon: GitMerge,
    title: "Normalize Et",
    desc: "Farklı formatlar standartlaştırılır. Ürün isimleri eşleştirilir (Havuç/Havuc).",
  },
  {
    num: "03",
    icon: ChartNoAxesCombined,
    title: "Analiz Et",
    desc: "Min ve maks korunur. Kaynak ortalama yayımlamıyorsa orta nokta açıkça türetilmiş olarak işaretlenir.",
  },
  {
    num: "04",
    icon: Bell,
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
          {STEPS.map((step) => {
            const Icon = step.icon;
            return (
            <ContentCard
              key={step.num}
              kind="editorial"
              className="group relative overflow-hidden rounded-[20px] p-9 transition-all duration-300 hover:-translate-y-1"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute right-5 top-4 font-(family-name:--font-display) text-[48px] font-black leading-none text-(--color-bg-alt) select-none"
              >
                {step.num}
              </span>
              <Icon className="relative mb-5 h-8 w-8 text-(--color-brand)" aria-hidden />
              <h3 className="relative mb-2 font-(family-name:--font-display) text-[17px] font-bold text-(--color-foreground)">
                {step.title}
              </h3>
              <p className="relative text-[13px] leading-[1.7] text-(--color-muted)">
                {step.desc}
              </p>
            </ContentCard>
          );})}
        </div>
      </div>
    </section>
  );
}
