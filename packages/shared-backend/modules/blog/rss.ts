// src/modules/blog/rss.ts
import type { RouteHandler } from 'fastify';
import { env } from '../../core/env';
import { handleRouteError } from '@agro/shared-backend/modules/_shared';
import { repoListRssBlogPosts } from './repository';

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function toRfc822(d: Date | string | null | undefined): string {
  if (d == null) return new Date().toUTCString();
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  return new Date(Number.isNaN(t) ? Date.now() : t).toUTCString();
}

export const getBlogRssFeed: RouteHandler = async (req, reply) => {
  try {
    const locale = (req.query as { locale?: string }).locale ?? 'tr';
    const limit = Math.min(50, Math.max(1, parseInt((req.query as { limit?: string }).limit ?? '20', 10)));
    const rows = await repoListRssBlogPosts(locale, limit);
    const base = env.FRONTEND_URL.replace(/\/$/, '');
    const channelTitle = `${env.SITE_NAME} — Blog`;

    const items = rows
      .map((row) => {
        const link = `${base}/${locale}/blog/${encodeURIComponent(row.slug)}`;
        const pubDate = toRfc822(row.published_at ?? row.created_at);
        const desc = escapeXml(row.excerpt ?? '');
        return `    <item>
      <title>${escapeXml(row.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description>${desc}</description>
    </item>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(`${base}/${locale}/blog`)}</link>
    <description>${escapeXml(channelTitle)}</description>
    <language>${escapeXml(locale)}</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;
    return reply
      .header('Cache-Control', 'public, max-age=300, s-maxage=300')
      .type('application/rss+xml; charset=utf-8')
      .send(xml);
  } catch (err) {
    return handleRouteError(reply, req, err, 'blog_rss_error');
  }
};
