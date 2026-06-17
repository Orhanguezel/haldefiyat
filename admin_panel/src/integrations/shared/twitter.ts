// ===================================================================
// FILE: src/integrations/shared/twitter.ts
// Twitter/X Admin API types + settings keys
// ===================================================================

export const TWITTER_ADMIN_BASE = "/admin/twitter";

export const TWEET_MAX_LENGTH = 280;

export const SOCIAL_PLATFORMS = ["twitter", "facebook", "instagram", "linkedin", "youtube"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** site_settings içindeki Twitter anahtarları (BE: modules/twitter/settings.ts) */
export const TWITTER_SETTINGS_KEYS = [
  "twitter_enabled",
  "twitter_api_key",
  "twitter_api_secret",
  "twitter_access_token",
  "twitter_access_token_secret",
] as const;

export type TwitterSettingsKey = (typeof TWITTER_SETTINGS_KEYS)[number];

export type TwitterSettingsModel = Record<TwitterSettingsKey, string>;

export const TWITTER_BOOLEAN_SETTINGS_KEYS = new Set<TwitterSettingsKey>(["twitter_enabled"]);

export function createTwitterSettingsDefaults(): TwitterSettingsModel {
  return {
    twitter_enabled: "false",
    twitter_api_key: "",
    twitter_api_secret: "",
    twitter_access_token: "",
    twitter_access_token_secret: "",
  };
}

export type TwitterCredentialFieldDef = {
  settingsKey: TwitterSettingsKey;
  i18nKey: string;
};

export const TWITTER_CREDENTIAL_FIELDS: TwitterCredentialFieldDef[] = [
  { settingsKey: "twitter_api_key", i18nKey: "apiKey" },
  { settingsKey: "twitter_api_secret", i18nKey: "apiSecret" },
  { settingsKey: "twitter_access_token", i18nKey: "accessToken" },
  { settingsKey: "twitter_access_token_secret", i18nKey: "accessTokenSecret" },
] as const;

/** GET /admin/twitter/status */
export type TwitterStatusResp = {
  enabled: boolean;
  has_credentials: boolean;
};

/** GET /admin/twitter/templates */
export type TwitterTemplatePreview = {
  id: string;
  platform?: SocialPlatform;
  title: string;
  description: string;
  slot_label: string;
  template: string;
  post_format?: string;
  content: string;
  media_url: string | null;
};

export type TwitterTemplatePreviewResp = {
  items: TwitterTemplatePreview[];
};

/** POST /admin/twitter/verify */
export type TwitterVerifyResp = {
  ok: boolean;
  account?: {
    id: string;
    name: string;
    username: string;
  };
};

export type TwitterSyncHistoryResp = {
  ok: boolean;
  imported: number;
  skipped: number;
  total: number;
  account?: {
    id: string;
    name: string;
    username: string;
  };
  error?: string;
  message?: string;
};

/** POST /admin/twitter/ai-draft */
export type TwitterAiDraftBody = {
  platform?: SocialPlatform;
  topic?: string;
  template?: string;
  product_id?: string | null;
  current_text?: string;
};

export type TwitterAiDraftResp = {
  ok: boolean;
  platform?: SocialPlatform;
  source: "ai" | "fallback";
  model: string;
  caption: string;
  hashtags: string;
  text: string;
  media_url: string | null;
};

/** POST /admin/twitter/send */
export type TwitterSendBody = {
  text: string;
  platform?: SocialPlatform;
  media_url?: string | null;
  post_format?: "post" | "story";
};

export type TwitterSendResp = {
  ok: boolean;
  tweet_id: string;
};

/** GET /admin/twitter/tweets */
export type TweetStatus = "queued" | "posting" | "sent" | "failed" | "canceled";

export type TweetLogRow = {
  id: string;
  platform: SocialPlatform;
  content: string;
  status: TweetStatus;
  source: string;
  template: string | null;
  media_url: string | null;
  source_ref: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  retry_count: number;
  x_tweet_id: string | null;
  external_post_id: string | null;
  error_message: string | null;
  created_at: string;
};

export type TwitterLogListParams = {
  platform?: SocialPlatform;
  status?: TweetStatus;
  page?: number;
  limit?: number;
};

export type TwitterLogListResp = {
  items: TweetLogRow[];
  total: number;
  page: number;
  limit: number;
};

export function buildTweetUrl(xTweetId: string): string {
  return `https://x.com/i/web/status/${xTweetId}`;
}

/** Platform karakteri — gönderim formu bu konfigle şekillenir */
export type PlatformSendConfig = {
  maxLength: number;
  mediaRequired: boolean;
  supportsStory: boolean;
  supportsLink: boolean;
  defaultTags: string;
};

export const PLATFORM_SEND_CONFIG: Record<SocialPlatform, PlatformSendConfig> = {
  twitter: { maxLength: 280, mediaRequired: false, supportsStory: false, supportsLink: true, defaultTags: "#VistaSeeds #yerlitohum" },
  facebook: { maxLength: 5000, mediaRequired: false, supportsStory: false, supportsLink: true, defaultTags: "#VistaSeeds #yerlitohum" },
  instagram: { maxLength: 2200, mediaRequired: true, supportsStory: true, supportsLink: false, defaultTags: "#VistaSeeds #yerlitohum #tohum #sebzetohumu #tarım #çiftçi #sera #fide #üretici #tohumculuk" },
  linkedin: { maxLength: 3000, mediaRequired: false, supportsStory: false, supportsLink: true, defaultTags: "#VistaSeeds #tohum #tarım #ihracat" },
  youtube: { maxLength: 5000, mediaRequired: true, supportsStory: false, supportsLink: true, defaultTags: "" },
};

export type PostFormat = "post" | "story";

/** GET /admin/twitter/plans */
export type TwitterPlanRow = {
  id: string;
  platform: SocialPlatform;
  slot_key: string;
  day_of_week: number;
  hour: number;
  minute: number;
  template: string;
  pillar: string | null;
  topic: string | null;
  preferred_product: string | null;
  post_format: PostFormat;
  media_required: number;
  is_active: number;
  order_index: number;
};

export type TwitterPlansResp = {
  items: TwitterPlanRow[];
};

export const PLAN_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export function planDayKey(dayOfWeek: number): (typeof PLAN_DAY_KEYS)[number] {
  return PLAN_DAY_KEYS[(dayOfWeek - 1 + 7) % 7] ?? "mon";
}
