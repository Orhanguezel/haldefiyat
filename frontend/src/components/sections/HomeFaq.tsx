import JsonLd from "@/components/seo/JsonLd";

const FAQ_ITEMS = [
  {
    question: "Hal fiyatları ne zaman güncellenir?",
    answer:
      "Fiyatlar her gün TSİ 06:15'te otomatik olarak güncellenir. Veriler, Türkiye genelindeki resmi hal müdürlüklerinin sistemlerinden gece ETL işlemiyle derlenir.",
  },
  {
    question: "Hangi iller ve haller kapsanıyor?",
    answer:
      "Türkiye genelinden 16 resmi ETL kaynağı izlenmektedir: İstanbul, Ankara, İzmir, Antalya, Bursa, Adana, Kocaeli, Gaziantep, Mersin, Balıkesir, Kayseri ve hal.gov.tr ulusal ortalamaları.",
  },
  {
    question: "Fiyatlar resmi mi, güvenilir mi?",
    answer:
      "Evet. Veriler doğrudan belediye hal müdürlüklerinin resmi sistemlerinden ve Tarım Bakanlığı'na bağlı hal.gov.tr'den otomatik olarak çekilmektedir. Herhangi bir manuel müdahale yapılmaz.",
  },
  {
    question: "Kaç ürün takip ediliyor?",
    answer:
      "Sebze, meyve, bakliyat ve ithal ürünler dahil 250'den fazla tarım ürünü günlük olarak izlenmektedir.",
  },
  {
    question: "Geçmiş fiyat verilerine nasıl ulaşabilirim?",
    answer:
      "Her ürün sayfasında (örn. /urun/domates) 5 yıllık fiyat geçmişi grafik ve tablo olarak sunulmaktadır. Ayrıca API üzerinden JSON formatında geçmiş veriye erişilebilir.",
  },
  {
    question: "Veriler ücretli mi?",
    answer:
      "Hayır. HalDeFiyat tamamen ücretsiz bir platformdur. Tüm fiyat verileri, endeks ve karşılaştırma araçları kayıt gerektirmeksizin kullanılabilir.",
  },
];

const faqSchema = {
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
} satisfies Record<string, unknown>;

export default function HomeFaq() {
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
        {FAQ_ITEMS.map((item, idx) => (
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
