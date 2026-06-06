import { setRequestLocale } from "next-intl/server";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("api_policy", {
    locale,
    pathname: "/api-policy",
    title: "API Kullanım Politikası | HaldeFiyat",
    description: "HaldeFiyat açık veri API kullanım şartları, atıf, cache ve scraping kuralları.",
  });
}

const rules = [
  ["API serbest", "Herkese açık fiyat verisi için /api/v1 endpointlerini kullanabilirsiniz."],
  ["HTML scraping yasak", "Sayfa HTML'ini botla taramak yerine OpenAPI ve JSON endpointlerini kullanın."],
  ["Limit", "Varsayılan adil kullanım limiti dakikada 120 istektir; yüksek hacim için API anahtarı isteyin."],
  ["Cache", "Yanıtları en az 5 dakika cache'leyin; aynı sorguyu saniyelik döngüyle tekrarlamayın."],
  ["Atıf", "Yayınlarda 'Kaynak: HaldeFiyat.com, ilgili belediye/borsa/TMO kaynağı' formatını kullanın."],
  ["Yasak kullanımlar", "Veriyi yanıltıcı fiyat garantisi, manipülasyon, spam, kişisel veri çıkarımı veya kaynak gizleme amacıyla kullanmayın."],
];

export default async function ApiPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <p className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
        Açık Veri
      </p>
      <h1 className="mt-2 font-(family-name:--font-display) text-3xl font-bold text-(--color-foreground)">
        API Kullanım Politikası
      </h1>
      <p className="mt-4 text-sm leading-7 text-(--color-muted)">
        HalDeFiyat, tarım fiyatı verisini doğrulanabilir API yüzeyleriyle paylaşır. AI ajanlar, uygulamalar ve araştırmacılar HTML scraping yerine JSON API, OpenAPI ve veri sağlığı endpointlerini kullanmalıdır.
      </p>

      <div className="mt-8 grid gap-3">
        {rules.map(([title, body]) => (
          <section key={title} className="rounded-[10px] border border-(--color-border) bg-(--color-surface) p-5">
            <h2 className="text-base font-semibold text-(--color-foreground)">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-(--color-muted)">{body}</p>
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-[10px] border border-(--color-brand)/25 bg-(--color-brand)/8 p-5 text-sm leading-6 text-(--color-muted)">
        <h2 className="font-semibold text-(--color-foreground)">AI ajanlar için önerilen girişler</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li><a className="text-(--color-brand) hover:underline" href="/openapi.json">/openapi.json</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/api-docs">/api-docs</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/data-health">/data-health</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/llms.txt">/llms.txt</a></li>
        </ul>
      </section>
    </main>
  );
}
