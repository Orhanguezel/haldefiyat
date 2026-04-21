import type { CustomPageData } from "@/lib/api";

interface Props {
  page: CustomPageData | null;
  fallbackTitle: string;
}

export default function LegalPageContent({ page, fallbackTitle }: Props) {
  if (!page) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl font-bold text-(--color-foreground)">
          {fallbackTitle}
        </h1>
        <p className="mt-4 text-lg text-(--color-muted)">
          Bu sayfa yakında güncellenecektir.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-(--color-foreground)">
        {page.title}
      </h1>
      {page.content ? (
        <div
          className="prose prose-invert mt-8 max-w-none text-(--color-muted) [&_a]:text-(--color-brand) [&_h2]:text-(--color-foreground) [&_h3]:text-(--color-foreground) [&_strong]:text-(--color-foreground) [&_table]:w-full [&_td]:border [&_td]:border-(--color-border) [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-(--color-border) [&_th]:px-3 [&_th]:py-2 [&_th]:text-left"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      ) : (
        <p className="mt-4 text-lg text-(--color-muted)">
          Bu sayfa yakında güncellenecektir.
        </p>
      )}
    </main>
  );
}
