import type { CustomPageData } from "@/lib/api";

interface Props {
  page: CustomPageData | null;
  fallbackTitle: string;
}

export default function LegalPageContent({ page, fallbackTitle }: Props) {
  const title = page?.title ?? fallbackTitle;
  const content = page?.content ?? null;

  return (
    <div className="mx-auto max-w-350 px-8 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-4xl font-bold text-foreground mb-8">
          {title}
        </h1>
        {content ? (
          <div
            className="
              prose max-w-none
              text-muted leading-relaxed
              [&_h2]:text-foreground [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-10 [&_h2]:mb-4
              [&_h3]:text-foreground [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-8 [&_h3]:mb-3
              [&_p]:mb-4
              [&_ul]:mb-4 [&_ul]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1
              [&_ol]:mb-4 [&_ol]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1
              [&_li]:text-muted
              [&_strong]:text-foreground [&_strong]:font-semibold
              [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2
              [&_table]:w-full [&_table]:text-[13px] [&_table]:mb-6
              [&_thead]:border-b [&_thead]:border-border
              [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
              [&_td]:px-4 [&_td]:py-2 [&_td]:border-b [&_td]:border-border/50
            "
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <p className="text-lg text-muted">Bu sayfa yakında güncellenecektir.</p>
        )}
      </div>
    </div>
  );
}
