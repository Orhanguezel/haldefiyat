import JsonLd from "@/components/seo/JsonLd";

type HomeFaqProps = {
  activeCities?: number;
  activeMarkets?: number;
  trackedProducts?: number;
  latestRecordedDate?: string | null;
};

function formatDate(value?: string | null): string | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T12:00:00Z`);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

export function buildFaqItems({
  activeCities,
  activeMarkets,
  trackedProducts,
  latestRecordedDate,
}: HomeFaqProps) {
  const latestDate = formatDate(latestRecordedDate);
  const coverage =
    activeCities && activeMarkets
      ? `${activeCities.toLocaleString("tr-TR")} ilde ${activeMarkets.toLocaleString("tr-TR")} aktif hal ve pazar`
      : "Türkiye genelindeki aktif hal ve pazarlar";
  const productCoverage = trackedProducts
    ? `${trackedProducts.toLocaleString("tr-TR")} tarım ürünü`
    : "sebze, meyve, bakliyat ve diğer tarım ürünleri";

  return [
    {
    question: "Hal fiyatları ne zaman güncellenir?",
    answer:
      `Fiyatlar her kaynağın resmi yayın takvimine göre otomatik olarak alınır; kaynaklar aynı saatte bülten yayımlamayabilir.${latestDate ? ` Platformdaki son doğrulanmış fiyat kaydı ${latestDate} tarihlidir.` : ""}`,
    },
    {
      question: "Hangi iller ve haller kapsanıyor?",
      answer:
        `${coverage} izlenmektedir. Güncel kapsam, yalnız gerçekten fiyat kaydı bulunan aktif kaynaklardan hesaplanır.`,
    },
    {
      question: "Fiyatlar resmi mi, güvenilir mi?",
      answer:
        "Veriler belediye hal müdürlükleri, hal.gov.tr ve sayfada adı gösterilen diğer kaynaklardan alınır. Kayıtlar ürün ve birim normalizasyonu ile kalite kontrollerinden geçirilir; kaynak ve veri tarihi her fiyat satırında görülebilir.",
    },
    {
      question: "Kaç ürün takip ediliyor?",
      answer:
        `${productCoverage} izlenmektedir. Kapsam yeni kaynaklar ve ürün eşleştirmeleri eklendikçe otomatik olarak güncellenir.`,
    },
    {
      question: "Geçmiş fiyat verilerine nasıl ulaşabilirim?",
      answer:
        "Her ürün sayfasında fiyat geçmişi grafik ve tablo olarak sunulur. Ayrıca belgelenmiş API üzerinden JSON formatındaki geçmiş verilere erişilebilir.",
    },
    {
      question: "Veriler ücretli mi?",
      answer:
        "Hayır. HalDeFiyat fiyat verileri, endeks ve karşılaştırma araçları kayıt gerektirmeksizin kullanılabilir.",
    },
  ];
}

export default function HomeFaq(props: HomeFaqProps) {
  const faqItems = buildFaqItems(props);
  const faqSchema = {
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  } satisfies Record<string, unknown>;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16">
      <JsonLd type="FAQPage" data={faqSchema} />
      <h2 className="mb-2 text-center font-display text-3xl font-bold text-foreground">
        Sık Sorulan Sorular
      </h2>
      <p className="mb-10 text-center text-sm text-muted">
        HalDeFiyat hakkında merak ettikleriniz
      </p>
      <div className="space-y-3">
        {faqItems.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-xl border border-border bg-surface overflow-hidden"
          >
            <summary
              className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-foreground after:text-base after:text-muted after:content-['⌄'] after:transition-transform group-open:after:rotate-180 [&::-webkit-details-marker]:hidden"
            >
              {item.question}
            </summary>
            <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
              {item.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
