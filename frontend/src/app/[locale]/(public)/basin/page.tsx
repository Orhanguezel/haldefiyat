import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { BarChart3, Code2, FileText, Mail, Newspaper, ShieldCheck } from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

const FACTS = [
  { label: "Kapsam", value: "81 il", desc: "Türkiye geneli resmi hal fiyat verisi" },
  { label: "Güncelleme", value: "Günlük", desc: "ETL kaynaklarından otomatik veri akışı" },
  { label: "İçerik", value: "/analiz", desc: "Haftalık fiyat yorumları ve endeks raporları" },
  { label: "Erişim", value: "Ücretsiz", desc: "Kamuya açık fiyat tablosu, grafik ve API dokümantasyonu" },
];

const RESOURCES = [
  {
    icon: FileText,
    title: "Haftalık Analizler",
    desc: "Hal fiyatlarındaki haftalık artış/düşüşleri editoryal yorumla izleyin.",
    href: "/analiz",
  },
  {
    icon: BarChart3,
    title: "HaldeFiyat Endeksi",
    desc: "Sebze ve meyve sepetindeki haftalık fiyat hareketini takip edin.",
    href: "/endeks",
  },
  {
    icon: Code2,
    title: "API ve Widget",
    desc: "Yayınlar ve web siteleri için fiyat verisi ve embed widget seçenekleri.",
    href: "/api-docs",
  },
];

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("basin", {
    locale,
    pathname: "/basin",
    title: "Basın ve Medya Kiti | HaldeFiyat",
    description: "HaldeFiyat basın kiti, kısa açıklama, medya kaynakları, iletişim ve basın bülteni metinleri.",
  });
}

export default async function PressPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Basın", href: "/basin" },
      ]} />

      <section className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-3 py-1 font-bold text-brand text-xs uppercase">
            <Newspaper className="h-3.5 w-3.5" />
            Medya Kiti
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl font-display font-black text-4xl text-foreground tracking-tight sm:text-6xl">
              HaldeFiyat: Türkiye geneli ücretsiz hal fiyat platformu
            </h1>
            <p className="max-w-3xl text-lg text-muted leading-relaxed">
              HaldeFiyat, Türkiye genelindeki resmi toptancı hal fiyatlarını günlük olarak derleyen bağımsız
              bir veri platformudur. Üreticiler, tüccarlar, araştırmacılar, medya ve tüketiciler için şehir
              bazlı fiyat takibi, haftalık analizler, endeks görünümü ve API dokümantasyonu sunar.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/analiz" className="rounded-md bg-brand px-4 py-2 font-semibold text-sm text-white hover:bg-brand/90">
              Analizleri Gör
            </Link>
            <Link href="/api-docs" className="rounded-md border border-border px-4 py-2 font-semibold text-foreground text-sm hover:bg-surface">
              API Dokümanı
            </Link>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-surface/60 p-6">
          <h2 className="font-bold text-foreground text-lg">Hızlı Bilgi</h2>
          <dl className="mt-5 grid gap-4">
            {FACTS.map((fact) => (
              <div key={fact.label} className="border-border border-b pb-4 last:border-0 last:pb-0">
                <dt className="text-muted text-xs uppercase">{fact.label}</dt>
                <dd className="mt-1 font-bold text-2xl text-foreground">{fact.value}</dd>
                <p className="mt-1 text-muted text-sm">{fact.desc}</p>
              </div>
            ))}
          </dl>
        </aside>
      </section>

      <section className="grid gap-4 py-6 md:grid-cols-3">
        {RESOURCES.map((item) => (
          <Link key={item.title} href={item.href} className="rounded-xl border border-border bg-surface/40 p-5 transition hover:border-brand/40 hover:bg-surface">
            <item.icon className="h-5 w-5 text-brand" />
            <h2 className="mt-4 font-bold text-foreground">{item.title}</h2>
            <p className="mt-2 text-muted text-sm leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 py-10 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface/40 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-foreground text-xl">Basın Bülteni Özeti</h2>
          </div>
          <p className="mt-4 text-muted leading-relaxed">
            HaldeFiyat, Türkiye'nin 81 ilindeki resmi hal fiyatlarını tek ekranda izlenebilir hale getiren
            ücretsiz bir platformdur. Günlük fiyat verileri, haftalık analiz yazıları ve endeks görünümüyle
            tarım piyasasında şeffaf fiyat takibini destekler.
          </p>
          <p className="mt-4 text-muted leading-relaxed">
            Platform; üretici, tüccar, akademisyen, gazeteci ve tüketicilerin hal fiyatlarını karşılaştırmasına,
            ürün bazlı trendleri izlemesine ve veri odaklı piyasa yorumları üretmesine yardımcı olur.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface/40 p-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand" />
            <h2 className="font-bold text-foreground text-xl">Basın İletişim</h2>
          </div>
          <div className="mt-4 space-y-3 text-muted">
            <p>Basın talepleri, veri soruları ve röportaj istekleri için:</p>
            <a className="font-semibold text-brand hover:underline" href="mailto:iletisim@haldefiyat.com">
              iletisim@haldefiyat.com
            </a>
            <p className="text-sm">
              Yayınlarda HaldeFiyat'a kaynak verirken ilgili ürün, şehir veya analiz sayfasına bağlantı
              eklenmesi önerilir.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
