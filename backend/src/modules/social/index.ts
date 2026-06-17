import type { FastifyInstance, FastifyReply } from "fastify";
import { listSocialPosts, isSocialPlatform, type SocialPlatformKey } from "./repository";
import {
  getPosts,
  getCalendar,
  getTemplates,
  getPlatforms,
  createPost,
  publishNow,
  deletePost,
  toEcoPlatform,
  type EcoPost,
  type HalPlatform,
} from "./eco-client";

function resolvePlatform(raw: unknown): SocialPlatformKey {
  return isSocialPlatform(raw) ? raw : "twitter";
}

const HANDLE = "haldefiyat";

function externalUrl(p: EcoPost): string | null {
  if (p.platform === "x" && p.xTweetId) return `https://twitter.com/${HANDLE}/status/${p.xTweetId}`;
  if (p.platform === "facebook" && p.fbPostId) return `https://www.facebook.com/${p.fbPostId}`;
  return null;
}

function mapPost(p: EcoPost) {
  return {
    id: p.id,
    uuid: p.uuid,
    platform: p.platform,
    title: p.title,
    caption: p.caption,
    hashtags: p.hashtags,
    mediaUrls: Array.isArray(p.mediaUrls) ? p.mediaUrls : [],
    imageUrl: p.imageUrl,
    status: p.status,
    scheduledAt: p.scheduledAt,
    postedAt: p.postedAt,
    sourceType: p.sourceType,
    errorMessage: p.errorMessage,
    externalUrl: externalUrl(p),
    createdAt: p.createdAt,
  };
}

const QUEUE_STATUSES = new Set(["draft", "scheduled", "publishing", "failed"]);

async function ecoFail(reply: FastifyReply, err: unknown, log: FastifyInstance["log"], msg: string) {
  log.warn({ err }, msg);
  return reply.status(502).send({ success: false, error: "ekosistem-sosyal-medya'ya ulaşılamadı" });
}

export async function registerSocial(app: FastifyInstance) {
  // Public besleme — geriye dönük uyumlu (varsayılan twitter), opsiyonel ?platform=
  app.get("/social/feed", async (req, reply) => {
    const q = req.query as { limit?: string; platform?: string };
    const limit = Number(q?.limit) || 30;
    const platform = resolvePlatform(q?.platform);
    try {
      const items = await listSocialPosts(platform, limit);
      reply.header("cache-control", "public, max-age=300");
      return reply.send({ handle: HANDLE, platform, count: items.length, items });
    } catch (err) {
      req.log.warn({ err }, "social_feed_failed");
      return reply.send({ handle: HANDLE, platform, count: 0, items: [] });
    }
  });
}

export async function registerSocialAdmin(adminApi: FastifyInstance) {
  // Yayınlananlar — X-formatlı feed (ekosistem_sosyal cross-DB, analitik dahil).
  adminApi.get("/social/feed", async (req, reply) => {
    const q = req.query as { limit?: string; platform?: string };
    const limit = Number(q?.limit) || 30;
    const platform = resolvePlatform(q?.platform);
    try {
      const items = await listSocialPosts(platform, limit);
      return reply.send({ handle: HANDLE, platform, count: items.length, items });
    } catch (err) {
      req.log.warn({ err }, "admin_social_feed_failed");
      return reply.send({ handle: HANDLE, platform, count: 0, items: [] });
    }
  });

  // Hesap durumu — ekosistem platform_accounts (gerçek @haldefiyat).
  adminApi.get("/social/status", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    const eco = toEcoPlatform(platform as HalPlatform);
    try {
      const { items } = await getPlatforms();
      const acc = items.find((a) => a.platform === eco) ?? null;
      const has_credentials = !!(acc && (acc.hasOAuth1 || acc.hasAccessToken || acc.hasPageToken));
      return reply.send({
        platform,
        enabled: acc?.isActive === 1,
        has_credentials,
        account: acc ? { name: acc.accountName, handle: acc.accountName, lastError: acc.lastError } : null,
      });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_status_failed");
    }
  });

  // Plan / Strateji — ekosistem content_calendar.
  adminApi.get("/social/plan", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    try {
      const { items } = await getCalendar(platform as HalPlatform);
      return reply.send({ items });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_plan_failed");
    }
  });

  // Şablonlar — ekosistem content_templates.
  adminApi.get("/social/templates", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    try {
      const { items } = await getTemplates(platform as HalPlatform);
      return reply.send({ items });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_templates_failed");
    }
  });

  // Taslak & Kuyruk / Geçmiş — ekosistem posts.
  adminApi.get("/social/posts", async (req, reply) => {
    const q = req.query as { platform?: string; scope?: string };
    const platform = resolvePlatform(q?.platform);
    const scope = q?.scope === "history" ? "history" : "queue";
    try {
      const { items } = await getPosts(platform as HalPlatform, 50);
      const filtered = items.filter((p) =>
        scope === "history" ? p.status === "posted" : QUEUE_STATUSES.has(p.status),
      );
      return reply.send({ items: filtered.map(mapPost), scope });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_posts_failed");
    }
  });

  // Taslak kaydet (yayınlamadan).
  adminApi.post("/social/posts", async (req, reply) => {
    const body = (req.body ?? {}) as { platform?: string; caption?: string; hashtags?: string; mediaUrls?: string[]; scheduledAt?: string };
    const platform = resolvePlatform(body.platform);
    if (!body.caption?.trim()) return reply.status(400).send({ success: false, error: "Metin boş olamaz" });
    try {
      const post = await createPost({
        platform: platform as HalPlatform,
        caption: body.caption.trim(),
        hashtags: body.hashtags,
        mediaUrls: body.mediaUrls,
        scheduledAt: body.scheduledAt,
      });
      return reply.send({ success: true, id: post.id, post: mapPost(post) });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_save_failed");
    }
  });

  // Manuel gönderi — oluştur + ANINDA yayınla (gerçek @haldefiyat hesabından).
  adminApi.post("/social/send", async (req, reply) => {
    const body = (req.body ?? {}) as { platform?: string; caption?: string; hashtags?: string; mediaUrls?: string[] };
    const platform = resolvePlatform(body.platform);
    if (!body.caption?.trim()) return reply.status(400).send({ success: false, error: "Metin boş olamaz" });
    try {
      const post = await createPost({
        platform: platform as HalPlatform,
        caption: body.caption.trim(),
        hashtags: body.hashtags,
        mediaUrls: body.mediaUrls,
      });
      await publishNow(post.id);
      return reply.send({ success: true, id: post.id });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_send_failed");
    }
  });

  // Taslak/kuyruk kaydı sil.
  adminApi.delete("/social/posts/:id", async (req, reply) => {
    const id = Number((req.params as { id?: string })?.id);
    if (!Number.isFinite(id)) return reply.status(400).send({ success: false, error: "Geçersiz id" });
    try {
      await deletePost(id);
      return reply.send({ success: true });
    } catch (err) {
      return ecoFail(reply, err, req.log, "admin_social_delete_failed");
    }
  });
}
