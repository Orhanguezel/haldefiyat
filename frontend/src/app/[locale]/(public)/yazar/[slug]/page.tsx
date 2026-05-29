import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import PageContainer from "@/components/layout/PageContainer";
import Breadcrumb from "@/components/seo/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { fetchAuthor } from "@/lib/api";

type Props = { params: Promise<{ locale: string; slug: string }> };

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const author = await fetchAuthor(slug);
  if (!author) notFound();

  const title = `${author.fullName}${author.title ? ` — ${author.title}` : ""} | HaldeFiyat`;
  const description = author.bio || `${author.fullName} tarafından hazırlanan hal fiyatları ve piyasa analizleri.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/yazar/${author.slug}` },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${SITE_URL}/yazar/${author.slug}`,
      ...(author.avatarUrl ? { images: [toAbsoluteUrl(author.avatarUrl)] } : {}),
    },
  };
}

export default async function AuthorPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const author = await fetchAuthor(slug);
  if (!author) notFound();

  const profileUrl = `${SITE_URL}/yazar/${author.slug}`;
  const imageUrl = author.avatarUrl ? toAbsoluteUrl(author.avatarUrl) : null;
  const personSchema = {
    "@type": "Person",
    name: author.fullName,
    url: profileUrl,
    jobTitle: author.title ?? undefined,
    description: author.bio ?? author.credentials ?? undefined,
    knowsAbout: author.expertise,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(author.credentials ? { hasCredential: author.credentials } : {}),
  };
  const profilePageSchema = {
    "@type": "ProfilePage",
    url: profileUrl,
    name: `${author.fullName} | HaldeFiyat Yazar Profili`,
    mainEntity: personSchema,
  };

  return (
    <PageContainer>
      <JsonLd type="ProfilePage" data={profilePageSchema} />
      <Breadcrumb items={[
        { name: "Anasayfa", href: "/" },
        { name: "Yazarlar", href: "/analiz" },
        { name: author.fullName, href: `/yazar/${author.slug}` },
      ]} />

      <section className="mt-8 grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6">
            <div className="aspect-square overflow-hidden rounded-[14px] border border-(--color-border-soft) bg-(--color-bg-alt)">
              {author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-(family-name:--font-display) text-[56px] font-bold text-(--color-brand)">
                  {author.fullName.slice(0, 1)}
                </div>
              )}
            </div>
            <h1 className="mt-5 font-(family-name:--font-display) text-[28px] font-bold leading-tight text-(--color-foreground)">
              {author.fullName}
            </h1>
            {author.title && <p className="mt-2 text-[15px] font-medium text-(--color-brand)">{author.title}</p>}
            {author.credentials && (
              <p className="mt-4 rounded-[12px] border border-(--color-border-soft) bg-(--color-bg-alt) p-3 text-[13px] leading-5 text-(--color-muted)">
                {author.credentials}
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0">
          <section className="rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">
            <div className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
              HaldeFiyat Yazar Profili
            </div>
            <h2 className="mt-3 font-(family-name:--font-display) text-[30px] font-bold leading-tight text-(--color-foreground)">
              {author.fullName} analizleri
            </h2>
            {author.bio && <p className="mt-4 max-w-3xl text-[16px] leading-7 text-(--color-muted)">{author.bio}</p>}
            {author.expertise.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {author.expertise.map((item) => (
                  <span key={item} className="rounded-full bg-(--color-brand)/10 px-3 py-1 text-[12px] font-semibold text-(--color-brand)">
                    {item}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-[20px] border border-(--color-border) bg-(--color-surface) p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-(family-name:--font-display) text-[22px] font-bold text-(--color-foreground)">
                Yayınlanan Yazılar
              </h2>
              <span className="text-[13px] text-(--color-muted)">{author.articles.length} yazı</span>
            </div>
            {author.articles.length === 0 ? (
              <p className="text-[14px] text-(--color-muted)">Bu yazara bağlı yayınlanmış analiz henüz yok.</p>
            ) : (
              <ul className="grid gap-4" role="list">
                {author.articles.map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/analiz/${article.slug}`}
                      className="block rounded-[14px] border border-(--color-border-soft) bg-(--color-bg-alt) p-4 transition-colors hover:border-(--color-brand)/40"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-(--color-muted)">
                        <time dateTime={article.tarih}>{formatDate(article.tarih)}</time>
                        {article.etiketler.slice(0, 3).map((tag) => (
                          <span key={tag} className="rounded-full bg-(--color-surface) px-2 py-0.5">{tag}</span>
                        ))}
                      </div>
                      <h3 className="mt-2 text-[17px] font-bold leading-snug text-(--color-foreground)">
                        {article.baslik}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-(--color-muted)">{article.ozet}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </main>
      </section>
    </PageContainer>
  );
}

function toAbsoluteUrl(value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  return `${SITE_URL}${value.startsWith("/") ? value : `/${value}`}`;
}

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
