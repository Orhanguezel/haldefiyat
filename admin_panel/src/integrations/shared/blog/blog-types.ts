export type BlogCategory =
  | 'genel'
  | 'haber'
  | 'tohum-bilimi'
  | 'ekim-teknikleri'
  | 'tarim-teknolojisi'
  | 'piyasa-analizi'
  | 'mevsimsel';

export type BlogStatus = 'draft' | 'published';

export interface BlogPostDto {
  id: string;
  category: string;
  author: string | null;
  image_url: string | null;
  status: string;
  published_at: string | null;
  is_active: number;
  display_order: number;
  title: string | null;
  slug: string | null;
  excerpt: string | null;
  content: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface BlogPostListQueryParams {
  locale?: string;
}

export interface BlogPostCreatePayload {
  locale: string;
  category: BlogCategory;
  author?: string | null;
  image_url?: string | null;
  status: BlogStatus;
  published_at?: string | null;
  is_active: boolean;
  display_order: number;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  meta_title?: string | null;
  meta_description?: string | null;
}

export type BlogPostUpdatePayload = Partial<BlogPostCreatePayload> & { locale?: string };

export const BLOG_POST_DEFAULT_LOCALE = 'tr';

export interface BlogRssImportPayload {
  feed_urls?: string[];
  force?: boolean;
  locale?: string;
  category?: BlogCategory;
}

export interface BlogRssImportResult {
  imported: number;
  skipped: number;
  feeds: number;
  errors: string[];
}
