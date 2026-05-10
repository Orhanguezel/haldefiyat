import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/seo/Breadcrumb";
import { Database, Clock, ShieldCheck, RefreshCw, Globe2, FileText } from "lucide-react";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("metodoloji", {
    locale,
    pathname: "/metodoloji",
    title: "Veri Metodolojisi | HalDeFiyat",
    description:
      "HalDeFiyat'ın hal fiyatı verilerini nasıl topladığını, doğruladığını ve sunduğunu öğrenin. 16 resmi kaynak, günlük ETL, şeffaf metodoloji.",
  });
}

const SOURCES = [
  { name: "hal.gov.tr", desc: "Tarım ve Orman Bakanlığı'na bağlı ulusal hal bilgi sistemi — ulusal ortalama fiyatlar", type: "Ulusal" },
  { name: "İstanbul Büyükşehir Belediyesi", desc: "Anadolu ve Avrupa yakası hal müdürlükleri günlük fiyat bülteni", type: "İl" },
  { name: "İzmir Büyükşehir Belediyesi", desc: "İzmir hal müdürlüğü resmi fiyat verileri (JSON API)", type: "İl" },
  { name: "Ankara Büyükşehir Belediyesi", desc: "Ankara toptancı hali günlük fiyatları", type: "İl" },
  { name: "Antalya — Antkomder", desc: "Antalya Toptancı Hal Kooperatifi (antkomder.com.tr) — Merkez, Serik, Kumluca", type: "İl" },
  { name: "Bursa, Adana, Kocaeli", desc: "Belediye hal müdürlükleri resmi sistemleri", type: "İl" },
  { name: "Gaziantep, Mersin, Balıkesir, Kayseri", desc: "Belediye hal müdürlükleri resmi sistemleri", type: "İl" },
];

const articleSchema = {
  headline: "HalDeFiyat Veri Metodolojisi",
  description:
    "Türkiye hal fiyatı verilerinin nasıl toplandığı, doğrulandığı ve sunulduğuna dair kapsamlı açıklama.",
  author: { "@type": "Organization", name: "HalDeFiyat" },
  publisher: { "@type": "Organization", name: "HalDeFiyat" },
  dateModified: new Date().toISOString().split("T")[0],
  inLanguage: "tr-TR",
  about: { "@type": "Thing", name: "Hal Fiyatları Veri Metodolojisi" },
} satisfies Record<string, unknown>;

export default async function MetodolojiPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 space-y-12">
      <JsonLd type="Article" data={articleSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Metodoloji", href: "/metodoloji" },
      ]} />

      {/* Başlık */}
      <header>
        <p className="font-mono text-[11px] font-semibold uppercase tracking-widest text-brand mb-2">
          Şeffaflık & Güvenilirlik
        </p>
        <h1 className="font-display text-4xl font-bold text-foreground mb-4">
          Veri Metodolojimiz
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl">
          HalDeFiyat, Türkiye'deki hal fiyatı verilerini nasıl topladığını, işlediğini ve
          sunduğunu tam şeffaflıkla paylaşır. Bu sayfa, verilerimizin güvenilirliğini
          ve sınırlılıklarını açıklamaktadır.
        </p>
      </header>

      {/* Genel Bakış */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Globe2, label: "Kaynak Sayısı", value: "16 Resmi Kaynak" },
          { icon: Clock, label: "Güncelleme", value: "Her Gün 06:15 TSİ" },
          { icon: Database, label: "Veri Geçmişi", value: "2025'ten İtibaren" },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-5 flex items-center gap-4">
            <div className="rounded-lg bg-brand/10 p-3 text-brand">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted font-medium uppercase tracking-wider">{label}</p>
              <p className="text-sm font-bold text-foreground mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Veri Toplama Süreci */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-brand" />
          Veri Toplama Süreci
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Veriler, <strong className="text-foreground">ETL (Extract, Transform, Load)</strong> adı verilen
            otomatik bir süreçle toplanır. Her gece TSİ 03:15'te çalışan bu süreç, kaynak sistemleri
            tarayarak fiyat verilerini çeker, normalize eder ve veritabanına yazar.
          </p>
          <p>
            Bazı kaynaklar standart HTML tabloları sunarken, bazıları JSON API veya ASP.NET ViewState
            tabanlı formlar kullanır. Her kaynak için özelleştirilmiş parser yazılmıştır.
          </p>
          <p>
            Teknik engel bulunan kaynaklar (TLS/bot koruması olan siteler) için
            Scrapling tabanlı headless browser entegrasyonu kullanılmaktadır.
          </p>
        </div>
      </section>

      {/* Veri Kaynakları */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <Database className="h-5 w-5 text-brand" />
          Aktif Veri Kaynakları
        </h2>
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Kaynak</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground hidden sm:table-cell">Açıklama</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Tür</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {SOURCES.map((s) => (
                <tr key={s.name} className="bg-surface/40 hover:bg-surface/70">
                  <td className="px-4 py-3 font-medium text-foreground">{s.name}</td>
                  <td className="px-4 py-3 text-muted hidden sm:table-cell">{s.desc}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand">
                      {s.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Doğrulama & Sınırlılıklar */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand" />
          Doğrulama & Sınırlılıklar
        </h2>
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Otomatik olarak toplanan veriler, kaynak sistemlerin doğruluğuna bağlıdır.
            HalDeFiyat, kaynaklardaki veri hatalarını manuel olarak düzeltmez;
            ancak açıkça anormal değerleri (sıfır fiyat, aşırı sapma) filtreler.
          </p>
          <p>
            Bazı kaynaklarda gecikme yaşanabilir: kaynak sistem geç veri yayınlarsa,
            o günkü veri bir sonraki ETL döngüsüne kayabilir.
          </p>
          <p>
            Fiyatlar <strong className="text-foreground">toptancı hal fiyatlarıdır</strong> — perakende,
            market veya tüketici fiyatları değildir. Ürünler arası kalite farklılıkları fiyatları etkiler.
          </p>
        </div>
      </section>

      {/* Lisans */}
      <section className="rounded-xl border border-border bg-surface/50 p-6 flex items-start gap-4">
        <FileText className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
        <div className="text-sm text-muted space-y-1">
          <p className="font-semibold text-foreground">Veri Lisansı</p>
          <p>
            HalDeFiyat verileri{" "}
            <a
              href="https://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand hover:underline"
            >
              Creative Commons Atıf 4.0 (CC BY 4.0)
            </a>{" "}
            lisansı altında yayınlanmaktadır. Kaynak belirtilerek ticari ve akademik amaçlarla
            serbestçe kullanılabilir.
          </p>
        </div>
      </section>
    </main>
  );
}
