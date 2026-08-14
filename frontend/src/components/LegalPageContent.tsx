import type { CustomPageData } from "@/lib/api";
import Breadcrumb from "@/components/seo/Breadcrumb";
import PolicyLinks from "@/components/PolicyLinks";
import { formatDateTr } from "@/lib/date-format";
import { prepareLegalDocument } from "@/lib/legal-document";

interface Props {
  page: CustomPageData | null;
  fallbackTitle: string;
  pathname: string;
  corporateDetails?: {
    legalEntity: string;
    responsiblePublisher: string;
    technicalContact: string;
    email: string;
  };
}

export default function LegalPageContent({ page, fallbackTitle, pathname, corporateDetails }: Props) {
  const title = page?.title ?? fallbackTitle;
  const content = page?.content ?? null;
  const prepared = content ? prepareLegalDocument(content) : null;
  const updated = formatDateTr(page?.updated_at ?? page?.created_at);
  const hasTableOfContents = Boolean(prepared && prepared.headings.length >= 2);

  return (
    <main className="mx-auto max-w-350 px-5 py-12 print:max-w-none print:px-0 print:py-0 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Breadcrumb visible items={[
          { name: "Anasayfa", href: "/" },
          { name: title, href: pathname },
        ]} />
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-(--color-brand)">Şeffaflık ve politika</p>
        <h1 className="mb-4 font-display text-4xl font-bold text-foreground">
          {title}
        </h1>
        {updated ? <p className="mb-8 text-sm text-(--color-muted)">Son güncelleme: <time dateTime={(page?.updated_at ?? page?.created_at) || undefined}>{updated}</time></p> : null}
        <div className={hasTableOfContents ? "grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]" : "grid"}>
          {hasTableOfContents && prepared ? (
            <nav aria-label="Sayfa içeriği" className="h-fit rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-4 print:hidden lg:sticky lg:top-28">
              <h2 className="text-sm font-bold text-(--color-foreground)">İçindekiler</h2>
              <ol className="mt-3 space-y-2 text-xs text-(--color-muted)">{prepared.headings.map((heading) => <li key={heading.id} className={heading.level === 3 ? "pl-3" : ""}><a href={`#${heading.id}`} className="hover:text-(--color-brand)">{heading.label}</a></li>)}</ol>
            </nav>
          ) : null}
          <article id="policy-content" className="min-w-0 rounded-[10px] border border-(--color-border) bg-(--color-surface) p-5 print:border-0 print:p-0 sm:p-8">
            {prepared ? (
              <div
                className="
                  prose max-w-none text-muted leading-relaxed
                  [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:scroll-mt-28 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground
                  [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:scroll-mt-28 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground
                  [&_p]:mb-4
                  [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5
                  [&_ol]:mb-4 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5
                  [&_li]:text-muted
                  [&_strong]:font-semibold [&_strong]:text-foreground
                  [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2
                  [&_table]:mb-6 [&_table]:w-full [&_table]:text-[13px]
                  [&_thead]:border-b [&_thead]:border-border
                  [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground
                  [&_td]:border-b [&_td]:border-border/50 [&_td]:px-4 [&_td]:py-2
                "
                dangerouslySetInnerHTML={{ __html: prepared.html }}
              />
            ) : (
              <p className="text-lg text-muted">Bu sayfa yakında güncellenecektir.</p>
            )}
            {corporateDetails ? (
              <section className="mt-10 rounded-[8px] border border-(--color-border) bg-(--color-bg-alt) p-5">
                <h2 className="text-lg font-bold text-(--color-foreground)">Güncel kurumsal kayıt</h2>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  <div><dt className="text-(--color-muted)">İşletmeci</dt><dd className="font-semibold text-(--color-foreground)">{corporateDetails.legalEntity}</dd></div>
                  <div><dt className="text-(--color-muted)">Sorumlu yayıncı</dt><dd className="font-semibold text-(--color-foreground)">{corporateDetails.responsiblePublisher}</dd></div>
                  <div><dt className="text-(--color-muted)">Teknik sorumlu</dt><dd className="font-semibold text-(--color-foreground)">{corporateDetails.technicalContact}</dd></div>
                  <div><dt className="text-(--color-muted)">Kurumsal iletişim</dt><dd><a className="font-semibold text-(--color-brand) underline" href={`mailto:${corporateDetails.email}`}>{corporateDetails.email}</a></dd></div>
                </dl>
              </section>
            ) : null}
          </article>
        </div>
        <PolicyLinks className="mt-10 print:hidden" currentPath={pathname} />
      </div>
    </main>
  );
}
