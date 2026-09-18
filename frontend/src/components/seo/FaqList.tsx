import JsonLd from "@/components/seo/JsonLd";

export interface FaqEntry {
  question: string;
  answer: string;
}

type Props = {
  items: FaqEntry[];
  /** "plain" duz liste, "details" acilir-kapanir. Ikisi de ayni HTML omurgasini kurar. */
  variant?: "plain" | "details";
  /** FAQPage semasi bu blokla birebir ayni sorulardan uretilir; false ise sayfa kendi semasini basiyordur. */
  schema?: boolean;
  className?: string;
};

/**
 * SSS blogu — tek yerde.
 *
 * Alti sayfada alti ayri isaretleme vardi: dordu <dl>/<dt>/<dd>, ikisi
 * <details>/<summary>. Ikisi de alintilanabilirlik acisindan kotuydu:
 *
 * - Cevaplar <dd> icindeydi. Pasaj ceken motorlar <p> ve <li> okur; <dd>
 *   okumaz. Sayfanin en alintiya uygun metni hic sayilmiyordu.
 * - Sorular <dt>/<summary> idi, baslik degildi. Soru isaretiyle biten bir
 *   BASLIGIN altindaki paragraf, soru-cevap pasaji olarak taninir; <dt>
 *   altindaki taninmaz.
 *
 * Bu yuzden soru <h3>, cevap <p>. Gorunum degismedi (18 Eyl 2026).
 */
export default function FaqList({ items, variant = "plain", schema = false, className }: Props) {
  if (items.length === 0) return null;
  return (
    <>
      {schema && (
        <JsonLd
          type="FAQPage"
          data={{
            mainEntity: items.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }}
        />
      )}
      <div className={className ?? "space-y-5"}>
        {items.map((item) =>
          variant === "details" ? (
            <details key={item.question} className="group rounded-xl border border-border bg-surface overflow-hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 text-left after:text-base after:text-muted after:content-['⌄'] after:transition-transform group-open:after:rotate-180 [&::-webkit-details-marker]:hidden">
                <h3 className="text-sm font-semibold text-foreground">{item.question}</h3>
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-muted">{item.answer}</p>
            </details>
          ) : (
            <div key={item.question}>
              <h3 className="font-semibold text-foreground">{item.question}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{item.answer}</p>
            </div>
          ),
        )}
      </div>
    </>
  );
}
