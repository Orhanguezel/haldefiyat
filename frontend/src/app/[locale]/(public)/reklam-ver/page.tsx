import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarCheck2,
  Check,
  Eye,
  FileDown,
  FileImage,
  LayoutDashboard,
  LineChart,
  Megaphone,
  MousePointerClick,
  Newspaper,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";

import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { fetchPricesOverview } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import PageContainer from "@/components/layout/PageContainer";

const MEDIA_KIT_PATH = "/files/haldefiyat-medya-kiti-2026-08.pdf";

type Props = { params: Promise<{ locale: string }> };

const PRODUCTS = [
  {
    icon: FileImage,
    title: "Görsel banner",
    text: "Markanıza ait görsel, mesaj ve yönlendirme bağlantısıyla belirlenen reklam alanında yayınlanır.",
    tags: ["Masaüstü + mobil", "Planlı yayın"],
  },
  {
    icon: Newspaper,
    title: "Sponsorlu ilan",
    text: "Seçtiğiniz ilan, ilgili liste ve içerik alanlarında sponsor etiketiyle daha görünür hâle gelir.",
    tags: ["Doğal görünüm", "İlana yönlendirme"],
  },
  {
    icon: Building2,
    title: "Firma sponsorluğu",
    text: "Komisyoncu veya işletme sayfanızı, uygun ve müsait konumlarda hedefli olarak öne çıkarın.",
    tags: ["Firma odaklı", "Bölgesel hedefleme"],
  },
  {
    icon: Sparkles,
    title: "Özel kampanya",
    text: "Ürün lansmanı, sezon kampanyası veya kurumsal iletişim için birden fazla alanı kapsayan plan oluşturun.",
    tags: ["Çoklu slot", "Özel planlama"],
  },
] as const;

const POSITIONS = [
  { name: "Ana sayfa", detail: "Yüksek görünürlüklü geniş banner ve içerik arası alanlar", tone: "En geniş erişim" },
  { name: "Fiyat ve ürün sayfaları", detail: "Kullanıcının ürün ve piyasa verisini incelediği karar anları", tone: "İlgi odaklı" },
  { name: "Analizler", detail: "Haftalık rapor, analiz içi ve yan sütun sponsorlukları", tone: "Nitelikli okur" },
  { name: "İlanlar", detail: "İlan listesi, sponsorlu ilan ve ilan detay alanları", tone: "Ticari niyet" },
  { name: "Firma sayfaları", detail: "Uygun sektör, şehir veya firma bağlamında seçili gösterim", tone: "Hedefli erişim" },
  { name: "Mobil alanlar", detail: "Küçük ekran için ayrıca kontrol edilen duyarlı kreatifler", tone: "Mobil uyumlu" },
] as const;

const STEPS = [
  ["01", "Hedefi belirleyelim", "Marka bilinirliği, site trafiği, ilan veya firma görünürlüğü hedefinizi netleştirelim."],
  ["02", "Uygun alanı kontrol edelim", "Hedef kitlenize uygun slotların tarih, cihaz ve doluluk durumunu kontrol edelim."],
  ["03", "Teklif ve kreatif onayı", "Yayın süresi, yerleşim ve materyalleri yazılı olarak onaylayalım."],
  ["04", "Yayın ve raporlama", "Kampanyayı planlanan tarihte açalım; gösterim ve tıklama sonuçlarını izleyelim."],
] as const;

const FAQ = [
  {
    q: "Reklam alanı hemen satın alınabilir mi?",
    a: "Her alanın tarih ve yerleşim doluluğu farklıdır. Talebinizden sonra uygunluk kontrol edilir ve size net bir yayın planı sunulur.",
  },
  {
    q: "Reklam görselini kim hazırlıyor?",
    a: "Hazır kreatifinizi teknik kontrole alabiliriz. İhtiyaç hâlinde HalDeFiyat görünümüne uygun banner tasarımı ayrıca planlanabilir.",
  },
  {
    q: "Performansı görebilir miyim?",
    a: "Kampanyalar için gösterim, tıklama ve tıklama oranı gibi temel performans verileri raporlanabilir. Reklamveren hesabı bulunan müşteriler kampanyalarını panelden izleyebilir.",
  },
  {
    q: "Her sayfaya reklam yerleştiriliyor mu?",
    a: "Hayır. Kullanıcı deneyimi, editoryal bağımsızlık, teknik uygunluk ve mevcut doluluk değerlendirilir. Yalnızca tanımlı reklam alanları kullanılır.",
  },
] as const;

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("reklam-ver", {
    locale,
    pathname: "/reklam-ver",
    title: "Reklam ve Sponsorluk Çözümleri | HalDeFiyat",
    description:
      "Tarım sektöründeki hedef kitlenize HalDeFiyat banner, sponsorlu ilan, firma sponsorluğu ve ölçümlenebilir kampanya çözümleriyle ulaşın.",
  });
}

export default async function AdvertisePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const overview = await fetchPricesOverview();
  const marketsByType = overview.activeMarketsByType;
  const archiveYear = overview.earliestRecordedDate
    ? new Date(overview.earliestRecordedDate).getFullYear()
    : null;

  const LIVE_STATS = [
    {
      value: overview.activeMarkets ? String(overview.activeMarkets) : "—",
      label: marketsByType
        ? `Aktif veri noktası — ${marketsByType.hal} hal, ${marketsByType.borsa} borsa`
        : "Aktif veri noktası",
    },
    { value: overview.totalProducts ? overview.totalProducts.toLocaleString("tr-TR") : "—", label: "Takip edilen ürün" },
    { value: overview.activeCities ? `${overview.activeCities} il` : "—", label: "Canlı fiyat verisi gelen şehir" },
    { value: archiveYear ? `${archiveYear}'ten` : "—", label: "Bu yana fiyat arşivi" },
  ] as const;

  return (
    <PageContainer py="sm">
      <JsonLd
        type="Service"
        data={{
          "@type": "Service",
          name: "HalDeFiyat Reklam ve Sponsorluk Çözümleri",
          provider: { "@type": "Organization", name: "HalDeFiyat", url: "https://haldefiyat.com" },
          areaServed: "TR",
          serviceType: "Dijital reklam ve sponsorluk",
          url: "https://haldefiyat.com/reklam-ver",
        }}
      />
      <Breadcrumb visible items={[
        { name: "Anasayfa", href: "/" },
        { name: "Reklam Ver", href: "/reklam-ver" },
      ]} />

      <section className="relative mt-6 overflow-hidden rounded-[28px] border border-(--color-border) bg-(--color-header) px-6 py-14 shadow-[var(--card-shadow)] sm:px-10 lg:px-16 lg:py-20">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-(--color-brand)/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-64 w-[45%] bg-[linear-gradient(135deg,transparent,color-mix(in_srgb,var(--color-brand)_8%,transparent))]" />
        <div className="relative max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-brand)/30 bg-(--color-brand)/10 px-3 py-1.5 font-(family-name:--font-mono) text-[11px] font-bold uppercase tracking-[0.14em] text-(--color-brand)">
            <Megaphone className="h-3.5 w-3.5" />
            Reklam ve sponsorluk
          </div>
          <h1 className="mt-7 max-w-4xl font-(family-name:--font-display) text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Tarım piyasasının karar anlarında{" "}
            <span className="text-(--color-brand)">görünür olun.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            Üretici, tüccar, komisyoncu ve tarım profesyonellerine; doğru içerikte,
            uygun zamanda ve ölçümlenebilir reklam alanlarıyla ulaşın.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/iletisim?subject=Reklam%20Talebi" className="inline-flex items-center gap-2 rounded-xl bg-(--color-brand) px-5 py-3 text-sm font-bold text-(--color-brand-fg) transition hover:brightness-110">
              Kampanya teklifi alın <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={MEDIA_KIT_PATH} download className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <FileDown className="h-4 w-4" /> Medya kiti (PDF)
            </a>
            <Link href="/hesabim/reklamlarim" className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              <LayoutDashboard className="h-4 w-4" /> Reklamveren paneli
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {[
          [Target, "Bağlama uygun", "Reklamlar tanımlı sayfa, içerik ve kitle bağlamında konumlandırılır."],
          [Eye, "Şeffaf etiketli", "Ücretli yerleşimler kullanıcıya açık biçimde sponsorlu olarak gösterilir."],
          [LineChart, "Ölçümlenebilir", "Gösterim, tıklama ve CTR gibi temel kampanya sonuçları takip edilir."],
          [ShieldCheck, "Kontrollü yayın", "Doluluk, ödeme, tarih ve kreatif onayı tamamlanmadan yayın başlamaz."],
        ].map(([Icon, title, text]) => {
          const FeatureIcon = Icon as typeof Target;
          return (
            <div key={title as string} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
              <FeatureIcon className="h-5 w-5 text-(--color-brand)" />
              <h2 className="mt-4 font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">{title as string}</h2>
              <p className="mt-2 text-sm leading-6 text-(--color-muted)">{text as string}</p>
            </div>
          );
        })}
      </section>

      <section className="pb-12" aria-label="Rakamlarla HalDeFiyat">
        <div className="rounded-[26px] border border-(--color-border) bg-(--color-bg-alt) p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-[0.14em] text-(--color-brand)">Rakamlarla HalDeFiyat</p>
              <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-black text-(--color-foreground)">Karar anındaki kitleye canlı veriyle ulaşın</h2>
            </div>
            <a href={MEDIA_KIT_PATH} download className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-(--color-brand) px-4 py-2.5 text-sm font-bold text-(--color-brand-fg) transition hover:brightness-110">
              <FileDown className="h-4 w-4" /> Medya kitini indirin
            </a>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {LIVE_STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
                <div className="font-(family-name:--font-display) text-3xl font-black text-(--color-brand)">{stat.value}</div>
                <p className="mt-2 text-sm leading-6 text-(--color-muted)">{stat.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 text-sm leading-6 text-(--color-muted)">
            Yukarıdaki sayılar platformun canlı verisinden gelir. Aylık ziyaret hacmi, kitle profili, arama görünürlüğü ve
            reklam alanlarının ölçülmüş tıklama performansı, tarih damgalı <a href={MEDIA_KIT_PATH} download className="font-semibold text-(--color-brand) underline underline-offset-2">medya kiti PDF&#39;inde</a> yer alır.
          </p>
        </div>
      </section>

      <section className="grid gap-4 pb-12 md:grid-cols-3" aria-label="Reklam ticari koşulları">
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">Fiyat nasıl belirlenir?</h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">Sabit veya örnek liste fiyatı yayınlamıyoruz. Tutar; format, yerleşim, hedefleme, süre, cihaz ve canlı envanter doluluğu kontrolünden sonra yazılı teklifte belirlenir.</p>
        </div>
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">Talep, rezervasyon değildir</h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">İlk faz tamamen manuel onaylıdır. Talep göndermek alanı ayırmaz; tarih, ödeme, kreatif ve yayın onayı tamamlanmadan kampanya açılmaz.</p>
        </div>
        <div className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
          <h2 className="font-(family-name:--font-display) text-lg font-bold text-(--color-foreground)">Ölçümün sınırı</h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">Gösterim, tıklama, CTR, cihaz ve dönem raporlanabilir. Satış, erişim, tıklama veya ticari sonuç garantisi verilmez; sahte müşteri logosu ve kanıtsız başarı iddiası kullanılmaz.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="max-w-3xl">
          <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-[0.14em] text-(--color-brand)">Reklam ürünleri</p>
          <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-black text-(--color-foreground) sm:text-5xl">Tek kalıp değil, hedefe uygun plan</h2>
          <p className="mt-4 text-(--color-muted)">Kampanya türünü mesajınıza, hedef sayfaya ve müsait reklam envanterine göre birlikte belirleriz.</p>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {PRODUCTS.map((product) => (
            <article key={product.title} className="group rounded-[22px] border border-(--color-border) bg-(--color-surface) p-6 transition hover:border-(--color-brand)/40">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-(--color-brand)/10 p-3 text-(--color-brand)"><product.icon className="h-6 w-6" /></div>
                <div>
                  <h3 className="font-(family-name:--font-display) text-xl font-bold text-(--color-foreground)">{product.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-(--color-muted)">{product.text}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {product.tags.map((tag) => <span key={tag} className="rounded-full bg-(--color-bg-alt) px-3 py-1 text-xs font-semibold text-(--color-muted)">{tag}</span>)}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="py-12">
        <div className="rounded-[26px] border border-(--color-border) bg-(--color-bg-alt) p-6 sm:p-9">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-[0.14em] text-(--color-brand)">Yerleşimler</p>
              <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-black text-(--color-foreground)">Mesajınız için doğru temas noktası</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-(--color-muted)">Her konum her tarihte açık olmayabilir. Dolu alanlar için alternatif tarih veya bekleme listesi sunulur.</p>
          </div>
          <div className="mt-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {POSITIONS.map((position) => (
              <div key={position.name} className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-(--color-foreground)">{position.name}</h3>
                  <span className="whitespace-nowrap rounded-full border border-(--color-brand)/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-(--color-brand)">{position.tone}</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-(--color-muted)">{position.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-10 py-12 lg:grid-cols-[1fr_1.05fr]">
        <div>
          <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-[0.14em] text-(--color-brand)">Kampanya akışı</p>
          <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-black text-(--color-foreground) sm:text-4xl">Fikirden yayına, kontrollü dört adım</h2>
          <div className="mt-8 space-y-4">
            {STEPS.map(([number, title, text]) => (
              <div key={number} className="grid grid-cols-[48px_1fr] gap-4 rounded-2xl border border-(--color-border) p-5">
                <span className="font-(family-name:--font-mono) text-sm font-bold text-(--color-brand)">{number}</span>
                <div><h3 className="font-bold text-(--color-foreground)">{title}</h3><p className="mt-1 text-sm leading-6 text-(--color-muted)">{text}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[24px] border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">
          <BarChart3 className="h-8 w-8 text-(--color-brand)" />
          <h2 className="mt-5 font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">Yayın sonunda yalnızca “göründü” demeyiz.</h2>
          <p className="mt-3 leading-7 text-(--color-muted)">Kampanya sonuçlarını anlaşılır metriklerle değerlendirir, sonraki yayın için somut veri üretiriz.</p>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {[
              [Eye, "Gösterim sayısı"],
              [MousePointerClick, "Tıklama sayısı"],
              [LineChart, "Tıklama oranı"],
              [CalendarCheck2, "Yayın süresi"],
              [LayoutDashboard, "Kampanya durumu"],
              [BarChart3, "Dönemsel rapor"],
            ].map(([Icon, label]) => {
              const MetricIcon = Icon as typeof Eye;
              return <li key={label as string} className="flex items-center gap-3 rounded-xl bg-(--color-bg-alt) p-3 text-sm font-semibold text-(--color-foreground)"><MetricIcon className="h-4 w-4 text-(--color-brand)" />{label as string}</li>;
            })}
          </ul>
          <div className="mt-7 border-t border-(--color-border) pt-6">
            <p className="flex items-start gap-3 text-sm leading-6 text-(--color-muted)"><Check className="mt-1 h-4 w-4 shrink-0 text-(--color-brand)" /> Reklamveren hesabınız varsa kampanya, kreatif değişikliği ve uzatma taleplerinizi panelden takip edebilirsiniz.</p>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <p className="font-(family-name:--font-mono) text-xs font-bold uppercase tracking-[0.14em] text-(--color-brand)">Sık sorulanlar</p>
            <h2 className="mt-3 font-(family-name:--font-display) text-3xl font-black text-(--color-foreground)">Net cevaplar</h2>
          </div>
          <div className="divide-y divide-(--color-border) border-y border-(--color-border)">
            {FAQ.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="cursor-pointer list-none pr-6 font-bold text-(--color-foreground)">{item.q}</summary>
                <p className="mt-3 text-sm leading-6 text-(--color-muted)">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="my-12 overflow-hidden rounded-[26px] bg-(--color-brand) px-6 py-10 text-(--color-brand-fg) sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
        <div>
          <h2 className="font-(family-name:--font-display) text-3xl font-black sm:text-4xl">Kampanyanız için uygun alanı bulalım.</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-(--color-brand-fg)/70">Hedefinizi, tarih aralığını ve yönlendirmek istediğiniz sayfayı iletin. Doluluk kontrolünden sonra size uygun yerleşim ve yayın planını hazırlayalım.</p>
        </div>
        <Link href="/iletisim?subject=Reklam%20Talebi" className="mt-6 inline-flex shrink-0 items-center gap-2 rounded-xl bg-(--color-header) px-5 py-3 text-sm font-bold text-(--color-header-fg) lg:mt-0">
          Teklif isteyin <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PageContainer>
  );
}
