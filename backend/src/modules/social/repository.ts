import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Sosyal içerik ekosistem-sosyal-medya sisteminde (ekosistem_sosyal DB, aynı sunucu).
// haldefiyat DB user'ına read-only SELECT verildi; cross-DB raw query ile okunur.
const HANDLE = "haldefiyat";

export interface SocialTweet {
  tweetId: string;
  url: string;
  text: string;
  hashtags: string | null;
  mediaUrls: string[];
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}

function parseMedia(raw: unknown): string[] {
  if (!raw) return [];
  try {
    const arr = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

// post_analytics post başına zaman-serisi tutar → GROUP BY ile collapse, MAX = en güncel kümülatif.
export async function listSocialTweets(limit = 30): Promise<SocialTweet[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const res = await db.execute(sql`
    SELECT sp.x_tweet_id AS tweetId, sp.caption AS text, sp.hashtags AS hashtags,
           sp.media_urls AS mediaUrls, sp.posted_at AS postedAt,
           COALESCE(MAX(pa.likes), 0) AS likes,
           COALESCE(MAX(pa.comments), 0) AS comments,
           COALESCE(MAX(pa.shares), 0) AS shares,
           COALESCE(MAX(pa.impressions), 0) AS impressions
    FROM ekosistem_sosyal.social_posts sp
    LEFT JOIN ekosistem_sosyal.post_analytics pa
      ON pa.post_id = sp.id AND pa.platform = 'x'
    WHERE sp.sub_type = ${HANDLE} AND sp.status = 'posted'
      AND sp.x_tweet_id IS NOT NULL AND sp.x_tweet_id <> ''
    GROUP BY sp.id
    ORDER BY sp.posted_at DESC
    LIMIT ${safeLimit}
  `);

  const rows = (Array.isArray(res) ? res[0] : (res as { rows?: unknown[] }).rows ?? res) as Record<string, unknown>[];
  const seen = new Set<string>();
  const out: SocialTweet[] = [];
  for (const r of rows ?? []) {
    const tweetId = String(r.tweetId ?? "");
    if (!tweetId || seen.has(tweetId)) continue;
    seen.add(tweetId);
    out.push({
      tweetId,
      url: `https://twitter.com/${HANDLE}/status/${tweetId}`,
      text: String(r.text ?? ""),
      hashtags: r.hashtags ? String(r.hashtags) : null,
      mediaUrls: parseMedia(r.mediaUrls),
      postedAt: r.postedAt ? new Date(r.postedAt as string).toISOString() : "",
      likes: Number(r.likes) || 0,
      comments: Number(r.comments) || 0,
      shares: Number(r.shares) || 0,
      impressions: Number(r.impressions) || 0,
    });
  }
  return out;
}
