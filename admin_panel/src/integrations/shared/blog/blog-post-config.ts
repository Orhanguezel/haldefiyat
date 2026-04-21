import type { BlogPostCreatePayload, BlogPostDto, BlogPostListQueryParams } from './blog-types';

export type BlogPostDetailTabKey = 'content' | 'seo';

export interface BlogPostFormState {
  category: string;
  author: string;
  image_url: string;
  status: 'draft' | 'published';
  published_at: string;
  is_active: boolean;
  display_order: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

export function createEmptyBlogPostForm(): BlogPostFormState {
  return {
    category: 'genel',
    author: '',
    image_url: '',
    status: 'draft',
    published_at: '',
    is_active: true,
    display_order: 0,
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    meta_title: '',
    meta_description: '',
  };
}

export function mapBlogPostToForm(item: BlogPostDto | null | undefined): BlogPostFormState {
  const fallback = createEmptyBlogPostForm();
  if (!item) return fallback;
  let pub = '';
  if (item.published_at) {
    const d = new Date(item.published_at);
    if (!Number.isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, '0');
      pub = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
  }
  return {
    category: item.category || 'genel',
    author: item.author ?? '',
    image_url: item.image_url ?? '',
    status: (item.status as 'draft' | 'published') || 'draft',
    published_at: pub,
    is_active: item.is_active !== 0,
    display_order: item.display_order ?? 0,
    title: item.title ?? '',
    slug: item.slug ?? '',
    excerpt: item.excerpt ?? '',
    content: item.content ?? '',
    meta_title: item.meta_title ?? '',
    meta_description: item.meta_description ?? '',
  };
}

export function buildBlogPostPayload(form: BlogPostFormState, locale: string): BlogPostCreatePayload {
  return {
    locale,
    category: form.category as BlogPostCreatePayload['category'],
    author: form.author.trim() || null,
    image_url: form.image_url.trim() || null,
    status: form.status,
    published_at: form.published_at ? new Date(form.published_at).toISOString() : null,
    is_active: form.is_active,
    display_order: form.display_order,
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim() || null,
    content: form.content,
    meta_title: form.meta_title.trim() || null,
    meta_description: form.meta_description.trim() || null,
  };
}

export function buildBlogPostsListQueryParams(input: { locale?: string }): BlogPostListQueryParams {
  const out: BlogPostListQueryParams = {};
  if (input.locale) out.locale = input.locale;
  return out;
}
