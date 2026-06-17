// ===================================================================
// FILE: src/integrations/shared/social.ts
// Sosyal izleme paneli — ekosistem-sosyal-medya verisini okuma tipleri
// ===================================================================

export const SOCIAL_ADMIN_BASE = "/admin/social";

/** Ayrı admin sayfası olan platformlar (izleme paneli). */
export const SOCIAL_FEED_PLATFORMS = ["twitter", "facebook", "instagram"] as const;
export type SocialFeedPlatform = (typeof SOCIAL_FEED_PLATFORMS)[number];

/** GET /admin/social/feed?platform=&limit= döndüğü tek gönderi. */
export type SocialFeedPost = {
  platform: SocialFeedPlatform;
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
};

export type SocialFeedResp = {
  handle: string;
  platform: SocialFeedPlatform;
  count: number;
  items: SocialFeedPost[];
};

export type SocialFeedParams = {
  platform: SocialFeedPlatform;
  limit?: number;
};

/** Platforma göre gönderi URL'inin gösterilip gösterilemeyeceği. */
export function hasPublicSocialUrl(post: SocialFeedPost): boolean {
  return typeof post.url === "string" && post.url.length > 0;
}
