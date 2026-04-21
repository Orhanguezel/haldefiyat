import { setRequestLocale } from "next-intl/server";
import AmbientBackground from "@/components/ui/AmbientBackground";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { BarChart3, ShieldCheck, Zap, Globe2, LineChart, Cpu } from "lucide-react";
import { fetchCustomPageBySlug } from "@/lib/api";

type Props = { params: Promise<{ locale: string }> };

const STATS = [
  { label: "Şehir", value: "81", desc: "Tüm Türkiye Kapsamı" },
  { label: "Ürün", value: "250+", desc: "Geniş Ürün Yelpazesi" },
  { label: "Günlük Veri", value: "10K+", desc: "Anlık Fiyat Takibi" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Şeffaf Veri",
    desc: "Türkiye genelindeki tüm hal verilerini doğrudan kaynaktan alıyor, hiçbir manipülasyon yapmadan en şeffaf haliyle size sunuyoruz."
  },
  {
    icon: Zap,
    title: "Hızlı Erişim",
    desc: "Karmaşık listeler arasında kaybolmanıza son veriyoruz. Aradığınız ürüne veya hale saniyeler içinde ulaşmanızı sağlayan bir altyapı sunuyoruz."
  },
  {
    icon: LineChart,
    title: "Analitik Yaklaşım",
    desc: "Sadece bugünün değil, geçmişin de izini sürüyoruz. Fiyat değişimlerini ve piyasa trendlerini veriye dayalı raporlarla paylaşıyoruz."
  }
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Veritabanından sayfayı çek
  const page = await fetchCustomPageBySlug("hakkimizda", locale);

  return (
    <main className="relative min-h-screen overflow-hidden pt-24 pb-20">
      <AmbientBackground />
      
      <div className="container relative z-10 mx-auto px-4">
        <ScrollReveal>
          <div className="max-w-6xl mx-auto space-y-24">
            
            {/* Hero Section */}
            <section className="text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6">
                <Globe2 className="h-3 w-3" />
                Dijital Tarım Ekosistemi
              </div>
              <h1 className="text-4xl sm:text-6xl font-black text-foreground mb-8 tracking-tight leading-[1.1]">
                {page?.title || "Tarımda Bilgiye Erişimi Demokratikleştiriyoruz"}
              </h1>
              <p className="text-xl text-muted leading-relaxed max-w-3xl mx-auto">
                {page?.summary || "HaldeFiyat, Türkiye'nin dijital tarım dönüşümüne katkı sağlamak amacıyla kurulan bağımsız bir platformdur."}
              </p>
            </section>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {STATS.map((stat) => (
                <div key={stat.label} className="p-8 rounded-3xl bg-surface/40 backdrop-blur-md border border-border/50 text-center group hover:border-brand/40 transition-colors">
                  <div className="text-4xl font-black text-foreground mb-2 group-hover:text-brand transition-colors">{stat.value}</div>
                  <div className="text-sm font-bold text-muted uppercase tracking-wider mb-2">{stat.label}</div>
                  <p className="text-xs text-faint">{stat.desc}</p>
                </div>
              ))}
            </section>

            {/* İçerik Bölümü (Hakkımızda Metni) */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <h2 className="text-3xl font-bold text-foreground">Verinin Gücüyle Geleceği Şekillendiriyoruz</h2>
                <div className="space-y-6 text-muted leading-relaxed">
                  {page?.content ? (
                    <div dangerouslySetInnerHTML={{ __html: page.content }} />
                  ) : (
                    <>
                      <p>Geleneksel tarım ticaretinde fiyat bilgisine erişim her zaman kısıtlı ve dağınıktı...</p>
                      <p>Vizyonumuz, sadece fiyat takip edilen bir site değil; kapsamlı bir dijital ekosistem olmaktır.</p>
                    </>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-brand/20 to-success/20 rounded-[3rem] blur-2xl opacity-30" />
                <div className="relative p-10 rounded-3xl bg-surface/60 border border-border overflow-hidden">
                  <Cpu className="absolute -right-8 -bottom-8 h-48 w-48 text-brand/5 rotate-12" />
                  <div className="grid grid-cols-1 gap-6">
                    {VALUES.map((val) => (
                      <div key={val.title} className="flex gap-5">
                        <div className="flex-shrink-0 mt-1">
                          <val.icon className="h-6 w-6 text-brand" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground mb-1">{val.title}</h4>
                          <p className="text-sm text-muted">{val.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Teknoloji Section */}
            <section className="p-12 rounded-[2.5rem] bg-foreground text-background text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-rgb),0.15),transparent)] pointer-events-none" />
              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <BarChart3 className="h-12 w-12 mx-auto text-brand mb-4" />
                <h2 className="text-3xl sm:text-4xl font-bold">Teknoloji ile Tarımın Kesişme Noktası</h2>
                <p className="text-lg opacity-80 leading-relaxed">
                   Karmaşık veri madenciliği algoritmalarımız ve gerçek zamanlı bildirim altyapımızla 
                   Türkiye tarım piyasasını cebinize sığdırıyoruz. HaldeFiyat, dijital tarımın en 
                   keskin gözlemcisidir.
                </p>
                <div className="pt-4">
                  <a 
                    href="/iletisim" 
                    className="inline-flex h-14 items-center px-8 rounded-xl bg-brand text-foreground font-bold hover:brightness-110 transition-all shadow-lg shadow-brand/20"
                  >
                    Bizimle İletişime Geçin
                  </a>
                </div>
              </div>
            </section>

          </div>
        </ScrollReveal>
      </div>
    </main>
  );
}
