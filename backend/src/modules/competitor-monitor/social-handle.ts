/**
 * Arama sonucundaki sosyal medya adreslerini sınıflandırır.
 *
 * NEDEN VAR: kaynak projede (hal-fiyatlari) instagram/facebook/youtube gibi
 * alan adları "her aramada çıkan gürültü" sayılıp ELENİYORDU. Bu üründe tam
 * tersi geçerli — bir arama sonucunda rakibin Instagram hesabının çıkması,
 * aradığımız şeyin ta kendisidir.
 *
 * NEDEN TEK TÜR YETMEZ: aynı projenin sorguları filtresiz yeniden tarandığında
 * (2026-09-08 ölçümü) sonuçların dörde ayrıldığı görüldü —
 *   account       instagram.com/limon.33.fiyatlari       → gerçek hesap
 *   group         facebook.com/groups/limonpiyasasi      → rakip değil, kitle
 *   content       instagram.com/medyaankaracom/reel/DC4… → gönderi (kanıt)
 *   platform_page instagram.com/popular/bayrampasa-…     → Instagram'ın kendi sayfası
 * Naif `/^\/([^/]+)/` ayrıştırması sonuncuya "popular" adlı bir rakip der.
 * Tür ayrımı bu yüzden var; sınıflandıramadığımızda hesap DEMİYORUZ.
 */

export type SocialPlatform = "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "linkedin";
export type SocialEntityKind = "account" | "group" | "content" | "platform_page";

export interface SocialRef {
  platform: SocialPlatform;
  /** Hesap/grup adı. content ve platform_page için null olabilir. */
  handle: string | null;
  kind: SocialEntityKind;
}

/** Hesap adı gibi görünen ama platforma ait olan ilk yol parçaları. */
const PLATFORM_SEGMENTS: Record<SocialPlatform, Set<string>> = {
  instagram: new Set(["explore", "popular", "directory", "locations", "accounts", "about", "developer", "legal", "topics", "s", "challenge"]),
  facebook: new Set(["watch", "marketplace", "events", "pages", "gaming", "login", "help", "search", "hashtag", "bookmarks", "business", "ads", "privacy", "policies", "terms", "recover", "settings"]),
  tiktok: new Set(["tag", "discover", "music", "explore", "live", "foryou", "trending", "search", "upload", "business", "legal"]),
  youtube: new Set(["results", "feed", "gaming", "premium", "music", "hashtag", "about", "howyoutubeworks", "creators", "t"]),
  x: new Set(["i", "search", "hashtag", "home", "explore", "settings", "login", "notifications", "messages", "compose", "intent", "share"]),
  linkedin: new Set(["feed", "jobs", "learning", "pulse", "posts", "search", "help", "legal", "login", "signup", "showcase"]),
};

/** İlk parçadan sonra gelirse adresin bir gönderi olduğunu gösteren parçalar. */
const CONTENT_SEGMENTS: Record<SocialPlatform, Set<string>> = {
  instagram: new Set(["p", "reel", "reels", "tv", "stories", "story"]),
  facebook: new Set(["posts", "videos", "photos", "reels", "media", "about", "live"]),
  tiktok: new Set(["video", "photo"]),
  youtube: new Set(["watch", "shorts", "playlist", "video"]),
  x: new Set(["status", "statuses"]),
  linkedin: new Set(["posts", "recent-activity", "detail"]),
};

function cleanHandle(raw: string | undefined, { allowDots = true } = {}): string | null {
  if (!raw) return null;
  let handle: string;
  try {
    handle = decodeURIComponent(raw.split(/[?#]/)[0] ?? "");
  } catch {
    handle = raw.split(/[?#]/)[0] ?? "";
  }
  handle = handle.replace(/^@/, "").replace(/\/+$/, "").trim();
  if (!handle || handle.length > 150) return null;
  // Hesap/grup adları harf-rakam ve birkaç ayraçtan oluşur. Facebook'un
  // "/p/Erdemli-Narenciye-100064504607709" biçimi de bu kalıba uyar.
  const pattern = allowDots ? /^[A-Za-z0-9._-]+$/ : /^[A-Za-z0-9_-]+$/;
  if (!pattern.test(handle)) return null;
  return handle.toLowerCase();
}

function hostPlatform(host: string): SocialPlatform | null {
  if (/(^|\.)instagram\.com$/.test(host)) return "instagram";
  if (/(^|\.)tiktok\.com$/.test(host)) return "tiktok";
  if (/(^|\.)(facebook\.com|fb\.com|fb\.me)$/.test(host)) return "facebook";
  if (/(^|\.)(youtube\.com|youtu\.be)$/.test(host)) return "youtube";
  if (/(^|\.)(x\.com|twitter\.com)$/.test(host)) return "x";
  if (/(^|\.)linkedin\.com$/.test(host)) return "linkedin";
  return null;
}

function classifyInstagram(segments: string[]): SocialRef {
  const [first, second] = segments;
  if (!first) return { platform: "instagram", handle: null, kind: "platform_page" };
  if (PLATFORM_SEGMENTS.instagram.has(first)) return { platform: "instagram", handle: null, kind: "platform_page" };
  // /p/<kod> ve /reel/<kod>: gönderi, hesap adı YOK.
  if (CONTENT_SEGMENTS.instagram.has(first)) return { platform: "instagram", handle: null, kind: "content" };
  const handle = cleanHandle(first);
  if (!handle) return { platform: "instagram", handle: null, kind: "platform_page" };
  // /<hesap>/reel/<kod>: hesap adı var, ama adres gönderiye işaret ediyor.
  if (second && CONTENT_SEGMENTS.instagram.has(second)) return { platform: "instagram", handle, kind: "content" };
  return { platform: "instagram", handle, kind: "account" };
}

function classifyFacebook(segments: string[], params: URLSearchParams): SocialRef {
  const [first, second, third] = segments;
  if (!first) return { platform: "facebook", handle: null, kind: "platform_page" };
  // Gruplar rakip değildir: kitlenin toplandığı yerdir, ayrı listede gösterilir.
  if (first === "groups") {
    const handle = cleanHandle(second);
    return { platform: "facebook", handle, kind: handle ? "group" : "platform_page" };
  }
  // /p/<Ad>-<sayısal-id>/ — Facebook'un yeni sayfa biçimi.
  if (first === "p") {
    const handle = cleanHandle(second);
    return { platform: "facebook", handle, kind: handle ? "account" : "content" };
  }
  // /people/<Ad>/<id>/ ve profile.php?id=<id> — sayfa kimliği adrestedir.
  if (first === "people") {
    const handle = cleanHandle(third);
    return { platform: "facebook", handle, kind: handle ? "account" : "platform_page" };
  }
  if (first === "profile.php") {
    const handle = cleanHandle(params.get("id") ?? undefined, { allowDots: false });
    return { platform: "facebook", handle, kind: handle ? "account" : "platform_page" };
  }
  if (first === "share" || first === "story.php" || first === "permalink.php" || first === "photo.php") {
    return { platform: "facebook", handle: null, kind: "content" };
  }
  if (PLATFORM_SEGMENTS.facebook.has(first)) return { platform: "facebook", handle: null, kind: "platform_page" };
  const handle = cleanHandle(first);
  if (!handle) return { platform: "facebook", handle: null, kind: "platform_page" };
  if (second && CONTENT_SEGMENTS.facebook.has(second)) return { platform: "facebook", handle, kind: "content" };
  return { platform: "facebook", handle, kind: "account" };
}

function classifyTiktok(segments: string[]): SocialRef {
  const [first, second] = segments;
  if (!first) return { platform: "tiktok", handle: null, kind: "platform_page" };
  // TikTok hesapları daima @ ile başlar; @ yoksa keşfet/etiket sayfasıdır.
  if (!first.startsWith("@")) return { platform: "tiktok", handle: null, kind: "platform_page" };
  const handle = cleanHandle(first);
  if (!handle) return { platform: "tiktok", handle: null, kind: "platform_page" };
  if (second && CONTENT_SEGMENTS.tiktok.has(second)) return { platform: "tiktok", handle, kind: "content" };
  return { platform: "tiktok", handle, kind: "account" };
}

function classifyYoutube(segments: string[]): SocialRef {
  const [first, second] = segments;
  if (!first) return { platform: "youtube", handle: null, kind: "platform_page" };
  if (first.startsWith("@")) {
    const handle = cleanHandle(first);
    return { platform: "youtube", handle, kind: handle ? "account" : "platform_page" };
  }
  if ((first === "channel" || first === "c" || first === "user") && second) {
    const handle = cleanHandle(second);
    return { platform: "youtube", handle, kind: handle ? "account" : "platform_page" };
  }
  if (CONTENT_SEGMENTS.youtube.has(first)) return { platform: "youtube", handle: null, kind: "content" };
  return { platform: "youtube", handle: null, kind: "platform_page" };
}

function classifyX(segments: string[]): SocialRef {
  const [first, second] = segments;
  if (!first) return { platform: "x", handle: null, kind: "platform_page" };
  if (PLATFORM_SEGMENTS.x.has(first)) return { platform: "x", handle: null, kind: "platform_page" };
  const handle = cleanHandle(first);
  if (!handle) return { platform: "x", handle: null, kind: "platform_page" };
  if (second && CONTENT_SEGMENTS.x.has(second)) return { platform: "x", handle, kind: "content" };
  return { platform: "x", handle, kind: "account" };
}

function classifyLinkedin(segments: string[]): SocialRef {
  const [first, second] = segments;
  if (!first) return { platform: "linkedin", handle: null, kind: "platform_page" };
  if (first === "groups") {
    const handle = cleanHandle(second);
    return { platform: "linkedin", handle, kind: handle ? "group" : "platform_page" };
  }
  if ((first === "company" || first === "in" || first === "school" || first === "showcase") && second) {
    const handle = cleanHandle(second);
    return { platform: "linkedin", handle, kind: handle ? "account" : "platform_page" };
  }
  if (PLATFORM_SEGMENTS.linkedin.has(first)) return { platform: "linkedin", handle: null, kind: "content" };
  return { platform: "linkedin", handle: null, kind: "platform_page" };
}

/**
 * URL bir sosyal medya adresiyse platform + (varsa) hesap adı + tür döner.
 * Sosyal medya değilse null.
 */
export function detectSocialRef(url: string): SocialRef | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const platform = hostPlatform(parsed.hostname.toLowerCase().replace(/^www\./, ""));
  if (!platform) return null;
  const segments = parsed.pathname.split("/").filter(Boolean);
  switch (platform) {
    case "instagram":
      return classifyInstagram(segments);
    case "facebook":
      return classifyFacebook(segments, parsed.searchParams);
    case "tiktok":
      return classifyTiktok(segments);
    case "youtube":
      return classifyYoutube(segments);
    case "x":
      return classifyX(segments);
    case "linkedin":
      return classifyLinkedin(segments);
  }
}

/** competitors.platform enum'u youtube/x/linkedin tanımıyor — eşleme burada. */
export function toCompetitorPlatform(platform: SocialPlatform): "instagram" | "facebook" | "tiktok" | "web" | "other" {
  if (platform === "instagram" || platform === "facebook" || platform === "tiktok") return platform;
  return "other";
}

/** Hesap adresini yeniden kurar — competitors.profile_url için. */
export function profileUrlFor(platform: SocialPlatform, handle: string): string {
  switch (platform) {
    case "instagram":
      return `https://www.instagram.com/${handle}/`;
    case "facebook":
      return /^\d+$/.test(handle) ? `https://www.facebook.com/profile.php?id=${handle}` : `https://www.facebook.com/${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    case "youtube":
      return `https://www.youtube.com/@${handle}`;
    case "x":
      return `https://x.com/${handle}`;
    case "linkedin":
      return `https://www.linkedin.com/company/${handle}`;
  }
}
