// ===================================================================
// FILE: src/modules/social/eco-client.ts
// ekosistem-sosyal-medya backend istemcisi (haldefiyat tenant).
// hal admin sosyal sayfalari bu API'yi proxy'ler. ENV: ECO_SOCIAL_URL/TENANT.
// ===================================================================

import { env } from "@/core/env";

const BASE = env.ECO_SOCIAL.url.replace(/\/$/, "");
const TENANT = env.ECO_SOCIAL.tenant;

// hal "twitter" ↔ ekosistem "x"; digerleri ayni.
export type HalPlatform = "twitter" | "facebook" | "instagram";
const PLATFORM_TO_ECO: Record<HalPlatform, string> = {
  twitter: "x",
  facebook: "facebook",
  instagram: "instagram",
};

export function toEcoPlatform(p: HalPlatform): string {
  return PLATFORM_TO_ECO[p] ?? "x";
}

function qs(params: Record<string, string | number | undefined>): string {
  const sp = new URLSearchParams();
  sp.set("tenantKey", TENANT);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  }
  return sp.toString();
}

async function ecoGet<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}?${qs(params)}`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`eco GET ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

async function ecoSend<T>(method: "POST" | "DELETE", path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "content-type": "application/json", accept: "application/json" },
    body: body ? JSON.stringify({ tenantKey: TENANT, ...body }) : JSON.stringify({ tenantKey: TENANT }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`eco ${method} ${path} -> ${res.status} ${text.slice(0, 200)}`);
  }
  return (await res.json()) as T;
}

// ── Tipler (ekosistem yanit sekilleri) ────────────────────────────────────────

export type EcoListResp<T> = { items: T[] };

export type EcoPost = {
  id: number;
  uuid: string;
  platform: string;
  title: string | null;
  caption: string;
  hashtags: string | null;
  mediaUrls: string[] | null;
  imageUrl: string | null;
  status: string;
  scheduledAt: string | null;
  postedAt: string | null;
  xTweetId: string | null;
  fbPostId: string | null;
  igMediaId: string | null;
  sourceType: string;
  errorMessage: string | null;
  createdAt: string;
};

export type EcoCalendarItem = {
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

export type EcoTemplate = {
  id: number;
  name: string;
  postType: string;
  platform: string;
  captionTemplate: string;
  hashtags: string | null;
  variables: string[] | null;
  isActive: number;
};

export type EcoPlatformAccount = {
  id: number;
  platform: string;
  accountName: string | null;
  accountId: string | null;
  isActive: number;
  lastPostAt: string | null;
  lastError: string | null;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  hasPageToken: boolean;
  hasOAuth1: boolean;
};

// ── Okuma ─────────────────────────────────────────────────────────────────────

export function getPosts(platform: HalPlatform, limit = 50) {
  return ecoGet<EcoListResp<EcoPost>>("/posts", { platform: toEcoPlatform(platform), limit });
}

export function getCalendar(platform: HalPlatform) {
  return ecoGet<EcoListResp<EcoCalendarItem>>("/calendar", { platform: toEcoPlatform(platform) });
}

export function getTemplates(platform: HalPlatform) {
  return ecoGet<EcoListResp<EcoTemplate>>("/templates", { platform: toEcoPlatform(platform) });
}

export function getPlatforms() {
  return ecoGet<EcoListResp<EcoPlatformAccount>>("/platforms", {});
}

// ── Yazma ─────────────────────────────────────────────────────────────────────

export type CreatePostInput = {
  platform: HalPlatform;
  caption: string;
  hashtags?: string;
  mediaUrls?: string[];
  scheduledAt?: string;
};

export function createPost(input: CreatePostInput) {
  return ecoSend<EcoPost>("POST", "/posts", {
    postType: "haber",
    platform: toEcoPlatform(input.platform),
    caption: input.caption,
    hashtags: input.hashtags || undefined,
    mediaUrls: input.mediaUrls?.length ? input.mediaUrls : undefined,
    scheduledAt: input.scheduledAt || undefined,
    sourceType: "manual",
  });
}

export function publishNow(id: number) {
  return ecoSend<{ ok?: boolean }>("POST", `/posts/${id}/publish-now`, {});
}

export function deletePost(id: number) {
  return ecoSend<{ ok?: boolean }>("DELETE", `/posts/${id}`, {});
}
