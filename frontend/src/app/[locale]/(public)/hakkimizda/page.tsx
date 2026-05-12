import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import ScrollReveal from "@/components/ui/ScrollReveal";
import { BarChart3, ShieldCheck, Zap, Globe2, LineChart, Cpu, Users, BookOpen, TrendingUp, Leaf } from "lucide-react";
import { fetchCustomPageBySlug } from "@/lib/api";
import { getPageMetadata } from "@/lib/seo";
import Breadcrumb from "@/components/seo/Breadcrumb";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("hakkimizda", {
    locale,
    pathname: "/hakkimizda",
    title: "Hakkımızda | HaldeFiyat",
    description: "HalDeFiyat, Türkiye'nin 81 ilindeki resmi hal müdürlüklerinden günlük fiyat verisi derleyen bağımsız bir açık veri platformudur. Metodoloji, veri kalitesi ve misyonumuz hakkında.",
  });
}

const STATS = [
  { label: "İl", value: "81", desc: "Tüm Türkiye Kapsamı" },
  { label: "Ürün", value: "250+", desc: "Sebze, Meyve, Bakliyat" },
  { label: "Günlük Kayıt", value: "10K+", desc: "Her Gün Güncellenir" },
  { label: "ETL Kaynağı", value: "16", desc: "Resmi Belediye Sistemi" },
];

const VALUES = [
  {
    icon: ShieldCheck,
    title: "Şeffaf Veri",
    desc: "Türkiye genelindeki tüm hal verilerini doğrudan resmi kaynaklardan alıyor, hiçbir manipülasyon yapmadan sunuyoruz. Hangi kaynaktan ne aldığımızı metodoloji sayfamızda açıklıyoruz.",
  },
  {
    icon: Zap,
    title: "Hızlı Erişim",
    desc: "Çiftçiden komisyoncuya, araştırmacıdan tüketiciye — herkes aradığı fiyata saniyeler içinde ulaşabilir. Şehir ve kategori bazında filtreleme, karşılaştırma ve dışa aktarma ücretsizdir.",
  },
  {
    icon: LineChart,
    title: "Tarihi Analiz",
    desc: "Sadece bugünün değil, 2025'ten bu yana biriken verinin izini sürüyoruz. Sezonluk karşılaştırmalar, yıllık trend grafikleri ve haftalık sepet endeksiyle piyasayı anlık okuyun.",
  },
];

const WHO_USES = [
  { icon: Leaf, title: "Çiftçi ve Üreticiler", desc: "Ürünlerini hangi hale, hangi fiyatla götüreceklerine karar verirken anlık piyasa verisine ihtiyaç duyarlar." },
  { icon: TrendingUp, title: "Tüccar ve Komisyoncular", desc: "Şehirler arası fiyat farklarını analiz ederek alım-satım kararlarını optimize ederler." },
  { icon: BookOpen, title: "Araştırmacı ve Analistler", desc: "Tarım ekonomisi üzerine çalışan akademisyen ve analistler tarihsel veri setlerine API üzerinden erişir." },
  { icon: Users, title: "Tüketici ve Medya", desc: "Marketlerdeki fiyatların toptancı fiyatıyla karşılaştırılması, tüketici bilinçlenmesine katkı sağlar." },
];

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const page = await fetchCustomPageBySlug("hakkimizda", locale);

  return (
    <div className="mx-auto max-w-350 px-8 py-12">
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Hakkımızda", href: "/hakkimizda" },
      ]} />
      <ScrollReveal>
        <div className="space-y-20">

          {/* Hero */}
          <section className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-bold uppercase tracking-widest mb-6">
              <Globe2 className="h-3 w-3" />
              Bağımsız Veri Platformu
            </div>
            <h1 className="font-display text-4xl sm:text-6xl font-black text-foreground mb-8 tracking-tight leading-[1.1]">
              {page?.title ?? "Tarımda Bilgiye Erişimi Demokratikleştiriyoruz"}
            </h1>
            <p className="text-xl text-muted leading-relaxed max-w-3xl mx-auto">
              {page?.summary ?? "HalDeFiyat, Türkiye'nin 81 ilindeki toptancı hal fiyatlarını günlük olarak derleyip şeffaf biçimde sunan bağımsız bir veri platformudur."}
            </p>
          </section>

          {/* Stats */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="p-6 rounded-2xl bg-surface/40 backdrop-blur-md border border-border/50 text-center group hover:border-brand/40 transition-colors"
              >
                <div className="text-3xl font-black text-foreground mb-1 group-hover:text-brand transition-colors">{stat.value}</div>
                <div className="text-xs font-bold text-muted uppercase tracking-wider mb-1">{stat.label}</div>
                <p className="text-[11px] text-muted/70">{stat.desc}</p>
              </div>
            ))}
          </section>

          {/* Platform Hakkında — uzun form içerik */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            <div className="space-y-6 text-[15px] text-muted leading-relaxed">
              <h2 className="font-display text-3xl font-bold text-foreground">
                Neden HalDeFiyat?
              </h2>
              {page?.content ? (
                <div dangerouslySetInnerHTML={{ __html: page.content }} />
              ) : (
                <>
                  <p>
                    Türkiye, yılda 70 milyar TL'yi aşkın toptancı hal ticareti hacmiyle dünyanın önde gelen
                    tarım ekonomilerinden biridir. Ancak bu devasa piyasada fiyat bilgisi uzun yıllar boyunca
                    dağınık, erişilmesi zor ve çoğu zaman gecikmeli kaldı.
                  </p>
                  <p>
                    HalDeFiyat bu sorunu çözmek için kuruldu. 2025 yılında yayına giren platform, Türkiye'nin
                    81 ilindeki resmi hal müdürlüklerinden günlük olarak otomatik veri derliyor; sebze, meyve
                    ve bakliyat fiyatlarını herkesin anlayabileceği sade bir arayüzde sunuyor.
                  </p>
                  <p>
                    Platform tamamen bağımsızdır. Hiçbir ticari kuruluşa veya belediyeye bağlı değiliz.
                    Veriler olduğu gibi sunulur; fiyatlar manipüle edilmez, pazara yön verme amacı taşınmaz.
                    Şeffaflık, HalDeFiyat'ın temel değeridir.
                  </p>
                  <p>
                    Teknik altyapı, modern web scraping ve ETL (Extract, Transform, Load) teknolojileriyle
                    inşa edilmiştir. Bazı kaynaklar için özel headless browser çözümleri, bazıları için JSON
                    API entegrasyonları kullanılmaktadır. Tüm bu süreç her sabah otomatik olarak çalışır;
                    insan müdahalesi gerektirmez.
                  </p>
                  <p>
                    HalDeFiyat'ın sunduğu veriler yalnızca anlık fiyatlardan ibaret değildir: 2025'ten bu
                    yana biriken tarihsel veri seti, sezonluk karşılaştırmalar ve haftalık sepet endeksiyle
                    piyasanın uzun vadeli seyri de izlenebilmektedir.
                  </p>
                </>
              )}
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-linear-to-r from-brand/20 to-success/20 rounded-[3rem] blur-2xl opacity-30" />
              <div className="relative p-8 rounded-3xl bg-surface/60 border border-border overflow-hidden">
                <Cpu className="absolute -right-8 -bottom-8 h-48 w-48 text-brand/5 rotate-12" />
                <div className="grid grid-cols-1 gap-6">
                  {VALUES.map((val) => (
                    <div key={val.title} className="flex gap-5">
                      <div className="shrink-0 mt-1">
                        <val.icon className="h-5 w-5 text-brand" />
                      </div>
                      <div>
                        <h3 className="font-bold text-foreground mb-1 text-sm">{val.title}</h3>
                        <p className="text-sm text-muted">{val.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Kimler Kullanır */}
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground text-center">
              Kimler Kullanıyor?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {WHO_USES.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="rounded-xl border border-border bg-surface/40 p-5 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-brand" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">{title}</h3>
                  <p className="text-xs text-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Nasıl Çalışır */}
          <section className="rounded-2xl border border-border bg-surface/30 p-8 space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Veriler Nasıl Toplanıyor?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm text-muted leading-relaxed">
              <div className="space-y-2">
                <p className="font-bold text-foreground text-base">1. Veri Çekme</p>
                <p>
                  Her gece TSİ 03:15'te otomatik ETL süreci başlar. 16 resmi kaynak —
                  belediye hal sistemleri, antkomder.com.tr ve hal.gov.tr — sistematik
                  olarak taranır.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-foreground text-base">2. Normalize Etme</p>
                <p>
                  Farklı formatlardaki veriler (HTML tablo, JSON API, ASP.NET form)
                  standart bir şemaya dönüştürülür. Ürün adları, birimler ve kategoriler
                  merkezi sözlükle eşleştirilir.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-bold text-foreground text-base">3. Yayınlama</p>
                <p>
                  Temizlenen veriler veritabanına yazılır; API ve web arayüzü üzerinden
                  TSİ 06:15'e kadar erişime açılır. Geçmiş veriler silinmez, tarihsel
                  analiz için saklanır.
                </p>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/metodoloji" className="text-sm font-semibold text-brand hover:underline">
                Tam metodoloji belgesi →
              </Link>
            </div>
          </section>

          {/* Veri Kalitesi ve Güvenilirlik */}
          <section className="space-y-6">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Veri Kalitesi ve Güvenilirlik
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 text-[15px] text-muted leading-relaxed">
              <div className="space-y-4">
                <p>
                  HalDeFiyat'ta her fiyat kaydı, kaynağını ve tarihini taşır. Hangi belediyeden,
                  hangi günkü veriden geldiği kayıt altındadır. Bu şeffaflık sayesinde kullanıcılar
                  veriyi bağımsız olarak doğrulayabilir.
                </p>
                <p>
                  Veri kalitesini korumak için birkaç katmanlı filtre kullanılır: Aynı ürün için
                  aynı günde yüzde 90'ı aşan fiyat sıçramaları "anomali" olarak işaretlenir; sıfır
                  veya negatif değerler sistem tarafından otomatik olarak ayıklanır; eksik birim
                  bilgileri merkezi ürün sözlüğünden tamamlanır.
                </p>
                <p>
                  Ulusal ortalama veriler hal.gov.tr (T.C. Tarım ve Orman Bakanlığı'na bağlı Hal
                  Bilgi Sistemi) üzerinden alınır. Bölgesel veriler ise ilgili büyükşehir ve il
                  belediyelerinin resmi sistemlerinden çekilir.
                </p>
              </div>
              <div className="space-y-4">
                <p>
                  ETL (Veri Çekme, Dönüştürme, Yükleme) süreci her gece TSİ 03:15'te başlar ve
                  tüm kaynakları sırayla tarar. Bir kaynakta hata oluşursa sistem bir sonraki
                  denemeye kadar önceki günün verisini saklı tutar; böylece kullanıcı hiçbir zaman
                  boş sayfa görmez.
                </p>
                <p>
                  Tüm ETL çalışmaları kayıt altına alınır. Hangi kaynağın kaç satır veri
                  eklediği, kaç hata ürettiği ve ne kadar sürede tamamlandığı admin
                  panelinden izlenebilir. Bu izlenebilirlik, olası veri sorunlarını hızla tespit
                  etmeyi sağlar.
                </p>
                <p>
                  <Link href="/metodoloji" className="text-brand font-semibold hover:underline">
                    Tam metodoloji belgesini incelemek →
                  </Link>
                </p>
              </div>
            </div>
          </section>

          {/* Geliştirici API */}
          <section className="rounded-2xl border border-brand/20 bg-brand/5 p-8 space-y-4">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Açık Veri API — Geliştiriciler İçin
            </h2>
            <p className="text-[15px] text-muted leading-relaxed max-w-3xl">
              HalDeFiyat verilerine REST API üzerinden programatik erişim ücretsizdir. Araştırma
              projelerinizde, mobil uygulamalarınızda veya iş zekası tablolarınızda günlük hal
              fiyatı verisini kullanabilirsiniz.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-muted">
              <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-1">
                <p className="font-mono text-xs text-brand font-semibold">GET /api/v1/prices</p>
                <p>Tüm ürünlerin güncel hal fiyatları; şehir, kategori ve tarih aralığı filtreleri desteklenir.</p>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-1">
                <p className="font-mono text-xs text-brand font-semibold">GET /api/v1/prices/history/{"{slug}"}</p>
                <p>Belirli bir ürünün 5 yıla kadar günlük fiyat geçmişi; sezonsal analiz ve trend hesaplamaları için.</p>
              </div>
              <div className="rounded-xl border border-border bg-surface/60 p-4 space-y-1">
                <p className="font-mono text-xs text-brand font-semibold">GET /api/v1/index/latest</p>
                <p>15 temel ürünün ağırlıklı ortalamasından oluşan HalDeFiyat Endeksi'nin son değeri.</p>
              </div>
            </div>
            <div className="pt-2">
              <Link href="/api-docs" className="text-sm font-semibold text-brand hover:underline">
                API dokümantasyonuna git →
              </Link>
            </div>
          </section>

          {/* Misyon */}
          <section className="space-y-4 text-[15px] text-muted leading-relaxed">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Misyonumuz
            </h2>
            <p>
              Türkiye'de tarım ürünü fiyatlarına erişim; dijitalleşmeden önce çoğunlukla ağızdan
              ağza, komisyoncu aracılığıyla veya gecikmeli gazete ilanlarıyla gerçekleşirdi. Bu
              bilgi asimetrisi, üreticinin ürününün gerçek değerini bilmeden satmasına, tüketicinin
              ise piyasa fiyatını sorgulamadan kabullanmasına yol açıyordu.
            </p>
            <p>
              HalDeFiyat, bu asimetriyi kırmak için kurulmuştur. Resmi kaynaklardan derlenen
              günlük fiyat verisi, herkesin özgürce erişebileceği açık bir platformda sunulduğunda
              denge değişir: Üretici nereye satacağını, alıcı ne kadar ödeyeceğini bağımsız
              olarak değerlendirebilir.
            </p>
            <p>
              Uzun vadede HalDeFiyat'ı; tarım ekonomisi araştırmacılarının, belediye
              politika yapıcılarının ve sektör gazetecilerinin başvurduğu güvenilir referans
              veri kaynağı hâline getirmeyi hedefliyoruz. Bunun için veri kalitesi, şeffaflık
              ve erişilebilirlik her kararımızın merkezindedir.
            </p>
          </section>

          {/* CTA */}
          <section className="p-12 rounded-[2.5rem] bg-brand/10 border border-brand/25 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(var(--brand-rgb),0.12),transparent)] pointer-events-none" />
            <div className="relative z-10 max-w-3xl mx-auto space-y-6">
              <BarChart3 className="h-12 w-12 mx-auto text-brand" />
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                Teknoloji ile Tarımın Kesişme Noktası
              </h2>
              <p className="text-lg text-muted leading-relaxed">
                Araştırmacısından çiftçisine, komisyoncusundan tüketicisine — Türkiye tarım
                piyasasını anlayan herkes için doğru veri, doğru anda.
              </p>
              <div className="pt-2 flex flex-wrap gap-3 justify-center">
                <a
                  href="/fiyatlar"
                  className="inline-flex h-12 items-center px-6 rounded-xl bg-brand text-brand-fg font-bold hover:brightness-110 transition-all shadow-lg shadow-brand/20 text-sm"
                >
                  Fiyatları İncele
                </a>
                <a
                  href="/iletisim"
                  className="inline-flex h-12 items-center px-6 rounded-xl border border-border text-foreground font-semibold hover:border-brand/40 transition-all text-sm"
                >
                  Bizimle İletişime Geçin
                </a>
              </div>
            </div>
          </section>

        </div>
      </ScrollReveal>
    </div>
  );
}
