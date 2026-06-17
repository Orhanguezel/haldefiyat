// ===================================================================
// FILE: src/integrations/shared/social.ts
// Sosyal medya admin — ekosistem-sosyal-medya proxy tipleri (haldefiyat)
// ===================================================================

export const SOCIAL_ADMIN_BASE = "/admin/social";

/** Ayrı admin sayfası olan platformlar. */
export const SOCIAL_FEED_PLATFORMS = ["twitter", "facebook", "instagram"] as const;
export type SocialFeedPlatform = (typeof SOCIAL_FEED_PLATFORMS)[number];

// ── Yayınlananlar feed (cross-DB, X-formatlı önizleme) ─────────────────────────

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

export type SocialFeedParams = { platform: SocialFeedPlatform; limit?: number };

export function hasPublicSocialUrl(post: SocialFeedPost): boolean {
  return typeof post.url === "string" && post.url.length > 0;
}

// ── Hesap durumu ───────────────────────────────────────────────────────────────

export type SocialStatusResp = {
  platform: SocialFeedPlatform;
  enabled: boolean;
  has_credentials: boolean;
  account: { name: string | null; handle: string | null; lastError: string | null } | null;
};

// ── Plan (ekosistem content_calendar) ──────────────────────────────────────────

export type SocialPlanItem = {
  id: number;
  date: string;
  timeSlot: string;
  postType: string;
  platform: string;
  notes: string | null;
  templateId: number | null;
  postId: number | null;
  status: string;
};

export type SocialPlanResp = { items: SocialPlanItem[] };

// ── Şablonlar (ekosistem content_templates) ────────────────────────────────────

export type SocialTemplate = {
  id: number;
  name: string;
  postType: string;
  platform: string;
  captionTemplate: string;
  hashtags: string | null;
  variables: string[] | null;
  isActive: number;
};

export type SocialTemplatesResp = { items: SocialTemplate[] };

// ── Gönderiler (taslak / kuyruk / geçmiş) ──────────────────────────────────────

export type SocialPostStatus = "draft" | "scheduled" | "publishing" | "posted" | "failed" | "cancelled";

export type SocialPostRow = {
  id: number;
  uuid: string;
  platform: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  mediaUrls: string[];
  imageUrl: string | null;
  status: SocialPostStatus;
  scheduledAt: string | null;
  postedAt: string | null;
  sourceType: string;
  errorMessage: string | null;
  externalUrl: string | null;
  createdAt: string;
};

export type SocialPostsParams = { platform: SocialFeedPlatform; scope: "queue" | "history" };
export type SocialPostsResp = { items: SocialPostRow[]; scope: "queue" | "history" };

export type SocialComposeBody = {
  platform: SocialFeedPlatform;
  caption: string;
  hashtags?: string;
  mediaUrls?: string[];
  scheduledAt?: string;
};

// ── Önizleme kartı için marka hesap görünümü ───────────────────────────────────

export type SocialAccountInfo = { name: string; handle: string; avatarUrl: string; profileUrl: string };

export const SOCIAL_ACCOUNTS: Record<SocialFeedPlatform, SocialAccountInfo> = {
  twitter: {
    name: "Hal de Fiyat",
    handle: "@haldefiyat",
    avatarUrl: "https://haldefiyat.com/apple-touch-icon.png",
    profileUrl: "https://x.com/haldefiyat",
  },
  facebook: {
    name: "Hal de Fiyat",
    handle: "haldefiyat",
    avatarUrl: "https://haldefiyat.com/apple-touch-icon.png",
    profileUrl: "https://www.facebook.com/haldefiyat",
  },
  instagram: {
    name: "Hal de Fiyat",
    handle: "@haldefiyat",
    avatarUrl: "https://haldefiyat.com/apple-touch-icon.png",
    profileUrl: "https://www.instagram.com/haldefiyat",
  },
};
