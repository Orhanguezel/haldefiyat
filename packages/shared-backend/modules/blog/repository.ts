import { db } from '../../db/client';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { blogPosts, blogPostsI18n } from './schema';

const publishedCond = and(
  eq(blogPosts.status, 'published'),
  eq(blogPosts.is_active, 1),
  sql`${blogPosts.published_at} IS NOT NULL`,
);

export async function repoListPublishedBlogPosts(
  locale: string,
  opts: { category?: string; limit: number; offset: number },
) {
  const where = opts.category
    ? and(publishedCond, eq(blogPosts.category, opts.category))
    : publishedCond;

  return db
    .select({
      id: blogPosts.id,
      category: blogPosts.category,
      author: blogPosts.author,
      image_url: blogPosts.image_url,
      published_at: blogPosts.published_at,
      display_order: blogPosts.display_order,
      title: blogPostsI18n.title,
      slug: blogPostsI18n.slug,
      excerpt: blogPostsI18n.excerpt,
      meta_title: blogPostsI18n.meta_title,
      meta_description: blogPostsI18n.meta_description,
      created_at: blogPosts.created_at,
      updated_at: blogPosts.updated_at,
    })
    .from(blogPosts)
    .innerJoin(
      blogPostsI18n,
      and(eq(blogPostsI18n.blog_post_id, blogPosts.id), eq(blogPostsI18n.locale, locale)),
    )
    .where(where)
    .orderBy(desc(blogPosts.published_at), asc(blogPosts.display_order))
    .limit(opts.limit)
    .offset(opts.offset);
}

export async function repoCountPublishedBlogPosts(locale: string, category?: string) {
  const where = category
    ? and(publishedCond, eq(blogPosts.category, category))
    : publishedCond;

  const [row] = await db
    .select({ n: sql<number>`COUNT(*)` })
    .from(blogPosts)
    .innerJoin(
      blogPostsI18n,
      and(eq(blogPostsI18n.blog_post_id, blogPosts.id), eq(blogPostsI18n.locale, locale)),
    )
    .where(where);
  return Number(row?.n ?? 0);
}

export async function repoGetPublishedBlogPostBySlug(slug: string, locale: string) {
  const rows = await db
    .select({
      id: blogPosts.id,
      category: blogPosts.category,
      author: blogPosts.author,
      image_url: blogPosts.image_url,
      published_at: blogPosts.published_at,
      title: blogPostsI18n.title,
      slug: blogPostsI18n.slug,
      excerpt: blogPostsI18n.excerpt,
      content: blogPostsI18n.content,
      meta_title: blogPostsI18n.meta_title,
      meta_description: blogPostsI18n.meta_description,
      created_at: blogPosts.created_at,
    })
    .from(blogPosts)
    .innerJoin(
      blogPostsI18n,
      and(eq(blogPostsI18n.blog_post_id, blogPosts.id), eq(blogPostsI18n.locale, locale)),
    )
    .where(and(eq(blogPostsI18n.slug, slug), publishedCond))
    .limit(1);
  return rows[0] ?? null;
}

export async function repoListRssBlogPosts(locale: string, limit: number) {
  return repoListPublishedBlogPosts(locale, { limit, offset: 0 });
}

export async function repoAdminListBlogPosts(locale: string) {
  return db
    .select({
      id: blogPosts.id,
      category: blogPosts.category,
      author: blogPosts.author,
      image_url: blogPosts.image_url,
      status: blogPosts.status,
      published_at: blogPosts.published_at,
      is_active: blogPosts.is_active,
      display_order: blogPosts.display_order,
      title: blogPostsI18n.title,
      slug: blogPostsI18n.slug,
      created_at: blogPosts.created_at,
      updated_at: blogPosts.updated_at,
    })
    .from(blogPosts)
    .leftJoin(
      blogPostsI18n,
      and(eq(blogPostsI18n.blog_post_id, blogPosts.id), eq(blogPostsI18n.locale, locale)),
    )
    .orderBy(desc(blogPosts.updated_at));
}

export async function repoAdminGetBlogPost(id: string, locale: string) {
  const rows = await db
    .select({
      id: blogPosts.id,
      category: blogPosts.category,
      author: blogPosts.author,
      image_url: blogPosts.image_url,
      status: blogPosts.status,
      published_at: blogPosts.published_at,
      is_active: blogPosts.is_active,
      display_order: blogPosts.display_order,
      title: blogPostsI18n.title,
      slug: blogPostsI18n.slug,
      excerpt: blogPostsI18n.excerpt,
      content: blogPostsI18n.content,
      meta_title: blogPostsI18n.meta_title,
      meta_description: blogPostsI18n.meta_description,
      created_at: blogPosts.created_at,
      updated_at: blogPosts.updated_at,
    })
    .from(blogPosts)
    .leftJoin(
      blogPostsI18n,
      and(eq(blogPostsI18n.blog_post_id, blogPosts.id), eq(blogPostsI18n.locale, locale)),
    )
    .where(eq(blogPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

type BaseInsert = {
  category: string;
  author: string | null;
  image_url: string | null;
  rss_source_url?: string | null;
  status: string;
  published_at: Date | null;
  is_active: number;
  display_order: number;
};

type I18nInsert = {
  locale: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
};

export async function repoInsertBlogPost(id: string, base: BaseInsert, i18n: I18nInsert) {
  await db.insert(blogPosts).values({
    id,
    category: base.category,
    author: base.author,
    image_url: base.image_url,
    rss_source_url: base.rss_source_url ?? null,
    status: base.status,
    published_at: base.published_at,
    is_active: base.is_active,
    display_order: base.display_order,
  });
  await db.insert(blogPostsI18n).values({
    blog_post_id: id,
    locale: i18n.locale,
    title: i18n.title,
    slug: i18n.slug,
    excerpt: i18n.excerpt,
    content: i18n.content,
    meta_title: i18n.meta_title,
    meta_description: i18n.meta_description,
  });
}

export async function repoUpdateBlogPost(
  id: string,
  base: Partial<BaseInsert>,
  i18n?: Partial<Omit<I18nInsert, 'locale'>> & { locale: string },
) {
  if (Object.keys(base).length) {
    await db.update(blogPosts).set(base).where(eq(blogPosts.id, id));
  }
  if (!i18n?.locale) return;
  const { locale: loc, ...i18nPatch } = i18n;
  const keys = Object.keys(i18nPatch).filter((k) => i18nPatch[k as keyof typeof i18nPatch] !== undefined);
  if (keys.length > 0) {
    await db
      .update(blogPostsI18n)
      .set(i18nPatch)
      .where(and(eq(blogPostsI18n.blog_post_id, id), eq(blogPostsI18n.locale, loc)));
  }
}

export async function repoDeleteBlogPost(id: string) {
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
}

export async function repoFindBlogPostIdByRssSourceUrl(url: string): Promise<string | null> {
  const [row] = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.rss_source_url, url))
    .limit(1);
  return row?.id ?? null;
}
