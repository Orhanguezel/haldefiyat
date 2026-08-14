import { setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { getPageMetadata } from "@/lib/seo";
import PolicyLinks from "@/components/PolicyLinks";
import ApiProductNav from "@/components/api/ApiProductNav";
import PageContainer from "@/components/layout/PageContainer";

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

async function fetchAnonymousLimit(): Promise<number | null> {
  try {
    const backend = process.env.BACKEND_URL || "http://127.0.0.1:8091";
    const response = await fetch(`${backend}/api/v1/keys/plans`, { next: { revalidate: 300 } });
    if (!response.ok) return null;
    const body = await response.json() as { contract?: { anonymousPerMinute?: number } };
    return body.contract?.anonymousPerMinute ?? null;
  } catch {
    return null;
  }
}

function policyRules(anonymousLimit: number | null) {
  return [
  ["API serbest", "Herkese açık fiyat verisi için /api/v1 endpointlerini kullanabilirsiniz."],
  ["HTML scraping yasak", "Sayfa HTML'ini botla taramak yerine OpenAPI ve JSON endpointlerini kullanın."],
  ["Limit", anonymousLimit ? `Anahtarsız ortak limit dakikada ${anonymousLimit.toLocaleString("tr-TR")} istektir; anahtarlı günlük kota için API Pro sözleşmesini kullanın.` : "Güncel limiti API Dokümantasyonu ve canlı plan sözleşmesinden kontrol edin; eski rakam gösterilmez."],
  ["Cache", "Yanıtları en az 5 dakika cache'leyin; aynı sorguyu saniyelik döngüyle tekrarlamayın."],
  ["Atıf", "Yayınlarda 'Kaynak: HaldeFiyat.com, ilgili belediye/borsa/TMO kaynağı' formatını kullanın."],
  ["Kaynak hakları", "API erişimi kaynak kurum verisinin mülkiyetini veya üçüncü taraf kullanım şartlarını devretmez. Kaynak kurumun şartları ayrıca geçerlidir."],
  ["Hizmet seviyesi", "Public API olduğu gibi sunulur; kesintisiz erişim, geriye dönük eksiksizlik veya kurumsal SLA garantisi vermez."],
  ["Yasak kullanımlar", "Veriyi yanıltıcı fiyat garantisi, manipülasyon, spam, kişisel veri çıkarımı veya kaynak gizleme amacıyla kullanmayın."],
  ];
}

export default async function ApiPolicyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const rules = policyRules(await fetchAnonymousLimit());

  return (
    <PageContainer wide={false}>
      <ApiProductNav current="/api-policy" />
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
          <li><a className="text-(--color-brand) hover:underline" href="/api/docs/json">/api/docs/json</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/api-docs">/api-docs</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/data-health">/data-health</a></li>
          <li><a className="text-(--color-brand) hover:underline" href="/llms.txt">/llms.txt</a></li>
        </ul>
      </section>

      <section className="mt-8 rounded-[10px] border border-(--color-border) bg-(--color-surface) p-5 text-sm leading-6 text-(--color-muted)">
        <h2 className="font-semibold text-(--color-foreground)">Ticari veri, kurumsal rapor ve yeniden dağıtım</h2>
        <p className="mt-2">
          Yüksek hacimli erişim, veri setinin yeniden satışı, beyaz etiket dağıtım, özel SLA,
          özel teslimat veya kurumsal rapor kullanımı ayrı yazılı kapsam ve lisans gerektirir.
          Konsept görsellerindeki fiyatlar teklif değildir; gerçek fiyat ve teslimat kapsamı
          yetkili ticari onay olmadan yürürlüğe girmez.
        </p>
        <p className="mt-2">
          Raporlar belirli tarihteki kaynaklı veri görünümüdür; yatırım, alım-satım, ürün kalitesi
          veya gelecek fiyat garantisi değildir. Hata bildirimi ve sürüm düzeltmeleri için{" "}
          <Link href="/duzeltme-politikasi" className="font-semibold text-(--color-brand) hover:underline">
            Düzeltme Politikası
          </Link>
          {" "}ve <Link href="/iletisim" className="font-semibold text-(--color-brand) hover:underline">İletişim</Link> kanalı kullanılır.
        </p>
      </section>

      <PolicyLinks className="mt-8" />
    </PageContainer>
  );
}
