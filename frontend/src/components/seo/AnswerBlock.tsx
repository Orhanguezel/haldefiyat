import type { ReactNode } from "react";

type AnswerBlockProps = {
  id: string;
  title: string;
  children: ReactNode;
  meta?: ReactNode;
  /**
   * Govde birden fazla paragraf iceriyorsa "div". Varsayilan "p" cunku bu blok
   * alintilanmak icin var: alintilanabilirlik olcen motorlar (Tanitio dahil)
   * yalniz <p> ve <li> ogelerini pasaj sayar. Govde <div> oldugu surece
   * sayfanin en alintiya uygun metni hic pasaj olarak gorulmuyordu —
   * /hal/bursa'da olculen pasaj sayisi 0'di (18 Eyl 2026).
   */
  bodyAs?: "p" | "div";
};

export default function AnswerBlock({ id, title, children, meta, bodyAs = "p" }: AnswerBlockProps) {
  const Body = bodyAs;
  return (
    <section
      id={id}
      aria-labelledby={`${id}-baslik`}
      className="scroll-mt-24 rounded-xl border border-brand/25 bg-brand/5 px-6 py-5"
    >
      <h2
        id={`${id}-baslik`}
        className="font-(family-name:--font-display) text-lg font-bold text-foreground"
      >
        {title}
      </h2>
      <Body className="mt-2 text-sm leading-relaxed text-muted">{children}</Body>
      {meta && (
        <div className="mt-3 border-t border-border-soft pt-3 text-xs leading-relaxed text-muted">
          {meta}
        </div>
      )}
    </section>
  );
}
