import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";
import JsonLd from "@/components/seo/JsonLd";
import PageContainer from "@/components/layout/PageContainer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("pro", {
    locale,
    pathname: "/pro",
    title: "HaldeFiyat Pro — Yüksek Hacim API",
    description:
      "10.000 istek/gün, öncelikli destek, ticari kullanım. API key ile tier-bazlı rate limit. Aylık 99 TL.",
  });
}

interface Plan {
  tier: "free" | "pro";
  dailyLimit: number;
  priceMonthlyTL: number;
  features: string[];
}

interface PlansResponse {
  plans: Plan[];
}

async function fetchPlans(): Promise<Plan[] | null> {
  try {
    const base = process.env.BACKEND_URL || "http://127.0.0.1:8091";
    const res = await fetch(`${base}/api/v1/keys/plans`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as PlansResponse;
    return data.plans;
  } catch {
    return null;
  }
}

function fmtNumber(n: number): string {
  return n.toLocaleString("tr-TR");
}

export default async function ProPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const plans = (await fetchPlans()) ?? [
    {
      tier: "free",
      dailyLimit: 100,
      priceMonthlyTL: 0,
      features: ["100 istek/gün", "Tüm public endpoint'ler", "API key ile yüksek limit"],
    },
    {
      tier: "pro",
      dailyLimit: 10000,
      priceMonthlyTL: 99,
      features: [
        "10.000 istek/gün",
        "Öncelikli destek",
        "Yüksek hacim için fiyat indirimi (manuel görüşme)",
      ],
    },
  ];
  const free = plans.find((p) => p.tier === "free")!;
  const pro = plans.find((p) => p.tier === "pro")!;

  return (
    <PageContainer>
      <JsonLd
        type="Product"
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "HaldeFiyat Pro API",
          description:
            "Türkiye hal fiyatları için yüksek hacim REST API erişimi.",
          offers: {
            "@type": "Offer",
            price: pro.priceMonthlyTL.toString(),
            priceCurrency: "TRY",
            availability: "https://schema.org/InStock",
            url: "https://haldefiyat.com/pro",
          },
        }}
      />

      <header className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">HaldeFiyat Pro</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Türkiye hal fiyatları için yüksek hacim API erişimi. Ticari uygulamalar,
          ERP entegrasyonları ve veri analitiği için tasarlandı.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="rounded-2xl border border-border bg-card p-8">
          <h2 className="text-2xl font-semibold mb-1">Ücretsiz</h2>
          <p className="text-3xl font-bold mb-1">0 ₺</p>
          <p className="text-sm text-muted-foreground mb-6">Aylık</p>
          <ul className="space-y-2 mb-6">
            {free.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span className="text-emerald-500">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/api-docs`}
            className="block text-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition"
          >
            API Dokümantasyonu
          </Link>
        </div>

        <div className="rounded-2xl border-2 border-emerald-500 bg-card p-8 relative">
          <span className="absolute -top-3 right-6 bg-emerald-500 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            Önerilen
          </span>
          <h2 className="text-2xl font-semibold mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-1">{pro.priceMonthlyTL} ₺</p>
          <p className="text-sm text-muted-foreground mb-6">Aylık (KDV dahil)</p>
          <ul className="space-y-2 mb-6">
            {pro.features.map((f) => (
              <li key={f} className="flex gap-2 text-sm">
                <span className="text-emerald-500">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Link
            href={`/${locale}/iletisim?subject=Pro%20Plan%20Talebi`}
            className="block text-center rounded-lg bg-emerald-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-600 transition"
          >
            Pro&apos;ya Geç
          </Link>
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">Nasıl çalışır?</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              n: 1,
              t: "Hesap aç",
              d: "Ücretsiz kaydolun (sadece e-posta), Free tier ile anında erişim alın.",
            },
            {
              n: 2,
              t: "API key oluştur",
              d: "Hesap panelinizden API anahtarınızı oluşturun. Maksimum 3 aktif anahtar.",
            },
            {
              n: 3,
              t: "Header ile gönder",
              d: "X-API-Key header'ı ile istek atın. Yanıtta tier ve kalan limit görünür.",
            },
          ].map((s) => (
            <div key={s.n} className="rounded-xl border border-border bg-card p-5">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white grid place-items-center font-bold text-sm mb-3">
                {s.n}
              </div>
              <h3 className="font-semibold mb-1">{s.t}</h3>
              <p className="text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-4">Örnek kullanım</h2>
        <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">{`# Yeni anahtar oluştur (JWT auth gerekli)
curl -X POST https://haldefiyat.com/api/v1/keys \\
  -H "Authorization: Bearer $JWT" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Production"}'

# Yanıt:
# {"key": {"rawKey": "hf_a1b2c3d4...", "tier": "free", "dailyLimit": 100, ...}}

# API çağrısı:
curl https://haldefiyat.com/api/v1/prices/trending \\
  -H "X-API-Key: hf_a1b2c3d4..."

# Yanıt header'ları:
#   x-ratelimit-tier: pro
#   x-ratelimit-limit: ${fmtNumber(pro.dailyLimit)}
#   x-ratelimit-remaining: ${fmtNumber(pro.dailyLimit - 1)}`}</pre>
      </section>

      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Sık sorulan</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-1">Daha yüksek limit istiyorum, mümkün mü?</h3>
            <p className="text-sm text-muted-foreground">
              Evet — Pro&apos;nun {fmtNumber(pro.dailyLimit)} günlük limiti dışında hacimli kullanım
              için manuel anlaşma yapılır. <Link href={`/${locale}/iletisim`} className="text-emerald-600 underline">İletişime geçin</Link>.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-1">Hangi endpoint&apos;ler dahil?</h3>
            <p className="text-sm text-muted-foreground">
              Tüm public REST endpoint&apos;ler: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/prices</code>,{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/markets</code>,{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/trending</code>,{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/widget</code>,{" "}
              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">/city-map</code>.{" "}
              <Link href={`/${locale}/api-docs`} className="text-emerald-600 underline">Tam liste</Link>.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-1">İptal var mı?</h3>
            <p className="text-sm text-muted-foreground">
              Aylık abonelik, istediğiniz zaman iptal — kalan günler için ücret alınmaz.
            </p>
          </div>
          <div className="rounded-xl border border-border p-5">
            <h3 className="font-semibold mb-1">Limit aşılırsa ne olur?</h3>
            <p className="text-sm text-muted-foreground">
              HTTP 429 döner. <code className="text-xs bg-muted px-1.5 py-0.5 rounded">x-ratelimit-*</code> header&apos;ları
              ile durumu önceden görebilirsiniz. Limit her gece UTC 00:00&apos;da sıfırlanır.
            </p>
          </div>
        </div>
      </section>

      <section className="text-center bg-muted rounded-2xl py-10 px-4">
        <h2 className="text-2xl font-semibold mb-2">Başlamaya hazır mısınız?</h2>
        <p className="text-muted-foreground mb-6">
          Free tier ücretsiz. Pro talebi için tek tıkla iletişim.
        </p>
        <div className="flex gap-3 justify-center">
          <Link
            href={`/${locale}/kayit`}
            className="rounded-lg bg-emerald-500 text-white px-6 py-2.5 text-sm font-medium hover:bg-emerald-600 transition"
          >
            Ücretsiz Başla
          </Link>
          <Link
            href={`/${locale}/iletisim?subject=Pro%20Plan%20Talebi`}
            className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted transition"
          >
            Pro Talebi
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}
