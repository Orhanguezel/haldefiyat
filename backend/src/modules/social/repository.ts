import { sql } from "drizzle-orm";
import { db } from "@/db/client";

// Sosyal içerik ekosistem-sosyal-medya sisteminde (ekosistem_sosyal DB, aynı sunucu).
// haldefiyat DB user'ına read-only SELECT verildi; cross-DB raw query ile okunur.
const HANDLE = "haldefiyat";

export const SOCIAL_PLATFORMS = ["twitter", "facebook", "instagram"] as const;
export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number];

export function isSocialPlatform(value: unknown): value is SocialPlatformKey {
  return typeof value === "string" && (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

// Her platform için: ekosistem_sosyal'deki dış-id kolonu, analytics platform değeri
// ve gönderiye giden public URL üretici. Değerler sabit whitelist — kullanıcı girdisi değil.
const PLATFORM_MAP: Record<
  SocialPlatformKey,
  { extIdCol: string; analyticsPlatform: string; buildUrl: (id: string) => string | null }
> = {
  twitter: {
    extIdCol: "x_tweet_id",
    analyticsPlatform: "x",
    buildUrl: (id) => `https://twitter.com/${HANDLE}/status/${id}`,
  },
  facebook: {
    extIdCol: "fb_post_id",
    analyticsPlatform: "facebook",
    buildUrl: (id) => `https://www.facebook.com/${id}`,
  },
  instagram: {
    extIdCol: "ig_media_id",
    analyticsPlatform: "instagram",
    // ig_media_id'den herkese açık permalink türetilemez; URL yok.
    buildUrl: () => null,
  },
};

export interface SocialPost {
  platform: SocialPlatformKey;
  postId: string;
  url: string | null;
  text: string;
  hashtags: string | null;
  mediaUrls: string[];
  postedAt: string;
  likes: number;
  comments: number;
  shares: number;
  reach: number;
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
// Platforma özgü dış-id kolonu dolu olan kayıtlar = o platforma gerçekten gönderilmiş postlar
// (platform='both'/'all' kayıtları da otomatik kapsanır).
export async function listSocialPosts(platform: SocialPlatformKey, limit = 30): Promise<SocialPost[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const cfg = PLATFORM_MAP[platform];
  const extIdCol = sql.raw(`sp.${cfg.extIdCol}`);

  const res = await db.execute(sql`
    SELECT ${extIdCol} AS postId, sp.caption AS text, sp.hashtags AS hashtags,
           sp.media_urls AS mediaUrls, sp.image_url AS imageUrl, sp.posted_at AS postedAt,
           COALESCE(MAX(pa.likes), 0) AS likes,
           COALESCE(MAX(pa.comments), 0) AS comments,
           COALESCE(MAX(pa.shares), 0) AS shares,
           COALESCE(MAX(pa.reach), 0) AS reach,
           COALESCE(MAX(pa.impressions), 0) AS impressions
    FROM ekosistem_sosyal.social_posts sp
    LEFT JOIN ekosistem_sosyal.post_analytics pa
      ON pa.post_id = sp.id AND pa.platform = ${cfg.analyticsPlatform}
    WHERE sp.sub_type = ${HANDLE} AND sp.status = 'posted'
      AND ${extIdCol} IS NOT NULL AND ${extIdCol} <> ''
    GROUP BY sp.id
    ORDER BY sp.posted_at DESC
    LIMIT ${safeLimit}
  `);

  const rows = (Array.isArray(res) ? res[0] : (res as { rows?: unknown[] }).rows ?? res) as Record<string, unknown>[];
  const seen = new Set<string>();
  const out: SocialPost[] = [];
  for (const r of rows ?? []) {
    const postId = String(r.postId ?? "");
    if (!postId || seen.has(postId)) continue;
    seen.add(postId);
    const media = parseMedia(r.mediaUrls);
    if (!media.length && r.imageUrl) media.push(String(r.imageUrl));
    out.push({
      platform,
      postId,
      url: cfg.buildUrl(postId),
      text: String(r.text ?? ""),
      hashtags: r.hashtags ? String(r.hashtags) : null,
      mediaUrls: media,
      postedAt: r.postedAt ? new Date(r.postedAt as string).toISOString() : "",
      likes: Number(r.likes) || 0,
      comments: Number(r.comments) || 0,
      shares: Number(r.shares) || 0,
      reach: Number(r.reach) || 0,
      impressions: Number(r.impressions) || 0,
    });
  }
  return out;
}

// Geriye dönük uyumluluk: public /social/feed twitter beslemesi.
export type SocialTweet = SocialPost;
export function listSocialTweets(limit = 30): Promise<SocialPost[]> {
  return listSocialPosts("twitter", limit);
}
