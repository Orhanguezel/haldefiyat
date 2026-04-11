// src/modules/blog/rss-import.service.ts
import { createHash, randomUUID } from 'crypto';
import { parseRss2Items } from './rss-parse';
import {
  repoFindBlogPostIdByRssSourceUrl,
  repoInsertBlogPost,
} from './repository';

const lastFetchAt = new Map<string, number>();

function hashSlug(link: string): string {
  const h = createHash('sha256').update(link).digest('hex').slice(0, 20);
  return `rss-${h}`;
}

export type RssImportResult = {
  imported: number;
  skipped: number;
  feeds: number;
  errors: string[];
};

export async function runRssImport(options?: {
  feedUrls?: string[];
  force?: boolean;
  locale?: string;
  category?: string;
}): Promise<RssImportResult> {
  const rawFeeds = process.env.RSS_IMPORT_FEEDS ?? '';
  const urls = options?.feedUrls?.length ? options.feedUrls : rawFeeds.split(',').map(s => s.trim()).filter(Boolean);

  const result: RssImportResult = { imported: 0, skipped: 0, feeds: 0, errors: [] };

  if (!urls.length) {
    result.errors.push('rss_import_no_feeds');
    return result;
  }

  const locale = (options?.locale || process.env.RSS_IMPORT_LOCALE || 'tr').trim().toLowerCase();
  const category = (options?.category || process.env.RSS_IMPORT_CATEGORY || 'haber').trim();
  const maxPer = Math.max(1, Math.min(100, Number(process.env.RSS_IMPORT_MAX_ITEMS_PER_FEED) || 20));
  const minMs = Math.max(0, Number(process.env.RSS_IMPORT_MIN_INTERVAL_MS) || 0);
  const ua = process.env.RSS_IMPORT_USER_AGENT || 'RssImport/1.0';

  for (const feedUrl of urls) {
    const url = feedUrl.trim();
    if (!url) continue;
    result.feeds += 1;

    const now = Date.now();
    if (!options?.force && minMs > 0) {
      const prev = lastFetchAt.get(url) ?? 0;
      if (now - prev < minMs) {
        result.errors.push(`rss_import_rate_limited:${url}`);
        continue;
      }
    }
    lastFetchAt.set(url, now);

    let xml: string;
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': ua, Accept: 'application/rss+xml, application/xml, text/xml, */*' },
        signal: AbortSignal.timeout(45_000),
      });
      if (!res.ok) {
        result.errors.push(`rss_import_fetch_${res.status}:${url}`);
        continue;
      }
      xml = await res.text();
    } catch (e) {
      result.errors.push(`rss_import_fetch:${url}:${e instanceof Error ? e.message : 'unknown'}`);
      continue;
    }

    let items;
    try {
      items = parseRss2Items(xml);
    } catch {
      result.errors.push(`rss_import_parse:${url}`);
      continue;
    }

    let n = 0;
    for (const item of items) {
      if (n >= maxPer) break;
      const sourceUrl = item.link.trim();
      if (!sourceUrl) continue;

      const existing = await repoFindBlogPostIdByRssSourceUrl(sourceUrl);
      if (existing) {
        result.skipped += 1;
        continue;
      }

      const id = randomUUID();
      const slug = hashSlug(sourceUrl);
      const publishedAt = item.pubDate ?? new Date();

      await repoInsertBlogPost(
        id,
        {
          category,
          author: item.author,
          image_url: item.imageUrl,
          rss_source_url: sourceUrl,
          status: 'published',
          published_at: publishedAt,
          is_active: 1,
          display_order: 0,
        },
        {
          locale,
          title: item.title,
          slug,
          excerpt: item.excerpt || null,
          content: item.html,
          meta_title: item.title.slice(0, 255),
          meta_description: item.excerpt ? item.excerpt.slice(0, 500) : null,
        },
      );
      result.imported += 1;
      n += 1;
    }
  }

  return result;
}
