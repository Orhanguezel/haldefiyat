"use client";

import { useState } from "react";
import JsonLd from "@/components/seo/JsonLd";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_ITEMS = [
  {
    question: "Hal fiyatları ne zaman güncellenir?",
    answer:
      "Fiyatlar her gün TSİ 06:15'te otomatik olarak güncellenir. Veriler, Türkiye genelindeki resmi hal müdürlüklerinin sistemlerinden gece ETL işlemiyle derlenir.",
  },
  {
    question: "Hangi iller ve haller kapsanıyor?",
    answer:
      "Türkiye'nin 81 ilinden 16 resmi ETL kaynağı izlenmektedir: İstanbul, Ankara, İzmir, Antalya, Bursa, Adana, Kocaeli, Gaziantep, Mersin, Balıkesir, Kayseri ve hal.gov.tr ulusal ortalamaları.",
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
  const [open, setOpen] = useState<number | null>(null);

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
          <div
            key={idx}
            className="rounded-xl border border-border bg-surface overflow-hidden"
          >
            <button
              onClick={() => setOpen(open === idx ? null : idx)}
              className="flex w-full items-center justify-between gap-4 px-6 py-4 text-left text-sm font-semibold text-foreground"
              aria-expanded={open === idx}
            >
              {item.question}
              <ChevronDown
                className={cn(
                  "h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200",
                  open === idx && "rotate-180"
                )}
              />
            </button>
            {open === idx && (
              <p className="px-6 pb-5 text-sm leading-relaxed text-muted">
                {item.answer}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
