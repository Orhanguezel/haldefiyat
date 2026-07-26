import type { ReactNode } from "react";

type AnswerBlockProps = {
  id: string;
  title: string;
  children: ReactNode;
  meta?: ReactNode;
};

export default function AnswerBlock({ id, title, children, meta }: AnswerBlockProps) {
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
      <div className="mt-2 text-sm leading-relaxed text-muted">{children}</div>
      {meta && (
        <div className="mt-3 border-t border-border-soft pt-3 text-xs leading-relaxed text-muted">
          {meta}
        </div>
      )}
    </section>
  );
}
