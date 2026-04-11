import {
  char,
  datetime,
  foreignKey,
  index,
  int,
  mysqlTable,
  primaryKey,
  text,
  tinyint,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';
import { longtext } from '@agro/shared-backend/modules/_shared';

export const blogPosts = mysqlTable(
  'blog_posts',
  {
    id: char('id', { length: 36 }).primaryKey().notNull(),
    category: varchar('category', { length: 64 }).notNull().default('genel'),
    author: varchar('author', { length: 128 }),
    image_url: varchar('image_url', { length: 512 }),
    /** Dis RSS kaynagi; ayni URL tekrar iceri alinmaz */
    rss_source_url: varchar('rss_source_url', { length: 768 }),
    status: varchar('status', { length: 16 }).notNull().default('draft'),
    published_at: datetime('published_at', { fsp: 3 }),
    is_active: tinyint('is_active').notNull().default(1),
    display_order: int('display_order').notNull().default(0),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    index('blog_posts_category_idx').on(t.category),
    index('blog_posts_status_idx').on(t.status),
    index('blog_posts_published_idx').on(t.published_at),
    index('blog_posts_active_idx').on(t.is_active),
  ],
);

export const blogPostsI18n = mysqlTable(
  'blog_posts_i18n',
  {
    blog_post_id: char('blog_post_id', { length: 36 }).notNull(),
    locale: varchar('locale', { length: 8 }).notNull().default('tr'),
    title: varchar('title', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull(),
    excerpt: text('excerpt'),
    content: longtext('content').notNull(),
    meta_title: varchar('meta_title', { length: 255 }),
    meta_description: varchar('meta_description', { length: 500 }),
    created_at: datetime('created_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    updated_at: datetime('updated_at', { fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .$onUpdateFn(() => new Date()),
  },
  (t) => [
    primaryKey({ columns: [t.blog_post_id, t.locale] }),
    foreignKey({
      columns: [t.blog_post_id],
      foreignColumns: [blogPosts.id],
      name: 'fk_blog_posts_i18n_post',
    })
      .onDelete('cascade')
      .onUpdate('cascade'),
    uniqueIndex('blog_posts_i18n_slug_locale_uq').on(t.slug, t.locale),
    index('blog_posts_i18n_locale_idx').on(t.locale),
  ],
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type BlogPostI18n = typeof blogPostsI18n.$inferSelect;
