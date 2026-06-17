import type { FastifyInstance, FastifyReply } from "fastify";
import {
  getSocialPlatformStatus,
  sendTweet,
  queueTweet,
  cancelQueuedTweet,
  repoListTweets,
  repoListContentPlans,
  repoMarkTweetSent,
  type TweetRow,
  type SocialPlatform,
} from "@agro/shared-backend/modules/twitter";
import {
  listSocialPosts,
  listSocialTemplates,
  getTweetById,
  setPlanActive,
  isSocialPlatform,
  type SocialPlatformKey,
} from "./repository";
import { createDraftTweet, buildTodayChartUrl, runDailyMoversJob } from "./daily-content";

function resolvePlatform(raw: unknown): SocialPlatformKey {
  return isSocialPlatform(raw) ? raw : "twitter";
}

const HANDLE = "haldefiyat";

// hal tweets.status → frontend SocialPostStatus
const STATUS_MAP: Record<string, string> = {
  draft: "draft",
  queued: "scheduled",
  posting: "publishing",
  sent: "posted",
  failed: "failed",
  canceled: "cancelled",
};

function externalUrl(row: TweetRow): string | null {
  if (row.platform === "twitter" && row.x_tweet_id) return `https://twitter.com/${HANDLE}/status/${row.x_tweet_id}`;
  if (row.external_post_id && row.platform === "facebook") return `https://www.facebook.com/${row.external_post_id}`;
  return null;
}

function mapTweet(row: TweetRow) {
  return {
    id: Number(row.id) || row.id,
    uuid: String(row.id),
    platform: row.platform,
    title: null as string | null,
    caption: row.content,
    hashtags: null as string | null,
    mediaUrls: row.media_url ? [row.media_url] : [],
    imageUrl: null as string | null,
    status: STATUS_MAP[row.status] ?? row.status,
    scheduledAt: row.scheduled_at ? new Date(row.scheduled_at).toISOString() : null,
    postedAt: row.posted_at ? new Date(row.posted_at).toISOString() : null,
    sourceType: row.source,
    errorMessage: row.error_message,
    externalUrl: externalUrl(row),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : "",
  };
}

const QUEUE_STATUSES = new Set(["draft", "queued", "posting", "failed"]);

function fail(reply: FastifyReply, err: unknown, log: FastifyInstance["log"], msg: string) {
  log.warn({ err }, msg);
  return reply.status(500).send({ success: false, error: (err as Error)?.message || "hata" });
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
  // Yayınlananlar — X-formatlı feed (yayınlanmış + analitik).
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

  // Günlük tweet'i ŞİMDİ hazırla — yarın 09:00 TR'ye planlar, kuyruğa ileri tarihli ekler.
  adminApi.post("/social/prepare-daily", async (req, reply) => {
    try {
      const r = await runDailyMoversJob();
      return reply.send({ success: r.ok, reason: r.reason });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_prepare_failed");
    }
  });

  // Günün grafiği önizleme (tweet atmaz) — Faz3 görsel doğrulama + manuel kullanım.
  adminApi.get("/social/chart-preview", async (req, reply) => {
    try {
      const url = await buildTodayChartUrl();
      return reply.send({ success: true, url });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_chart_failed");
    }
  });

  // Hesap durumu — hal site_settings X kimlik bilgileri.
  adminApi.get("/social/status", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    try {
      const s = await getSocialPlatformStatus(platform as SocialPlatform);
      return reply.send({ platform, enabled: s.enabled, has_credentials: s.has_credentials, account: null });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_status_failed");
    }
  });

  // Plan / Strateji — hal social_content_plans (haftalık strateji slotları).
  adminApi.get("/social/plan", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    try {
      const items = await repoListContentPlans(platform);
      return reply.send({ items });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_plan_failed");
    }
  });

  // Şablonlar — hal hf_social_templates.
  adminApi.get("/social/templates", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    try {
      const items = await listSocialTemplates(platform);
      return reply.send({ items });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_templates_failed");
    }
  });

  // Taslak & Kuyruk / Geçmiş — hal tweets.
  adminApi.get("/social/posts", async (req, reply) => {
    const q = req.query as { platform?: string; scope?: string };
    const platform = resolvePlatform(q?.platform);
    const scope = q?.scope === "history" ? "history" : "queue";
    try {
      const { items } = await repoListTweets({ platform, limit: 50, offset: 0 });
      const filtered = items.filter((r) => (scope === "history" ? r.status === "sent" : QUEUE_STATUSES.has(r.status)));
      return reply.send({ items: filtered.map(mapTweet), scope });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_posts_failed");
    }
  });

  // Taslak kaydet / ileri tarihli planla (kuyruk).
  adminApi.post("/social/posts", async (req, reply) => {
    const body = (req.body ?? {}) as { platform?: string; caption?: string; hashtags?: string; mediaUrls?: string[]; scheduledAt?: string };
    const platform = resolvePlatform(body.platform);
    const text = [body.caption?.trim(), body.hashtags?.trim()].filter(Boolean).join("\n\n");
    if (!body.caption?.trim()) return reply.status(400).send({ success: false, error: "Metin boş olamaz" });
    try {
      // Tarih varsa kuyruğa (dispatcher o zaman yayınlar); yoksa gerçek TASLAK (yayınlanmaz).
      if (body.scheduledAt) {
        const res = await queueTweet({
          text,
          platform: platform as SocialPlatform,
          scheduledAt: new Date(body.scheduledAt),
          mediaUrl: body.mediaUrls?.[0] ?? null,
          source: "manual",
        });
        if (!res.ok) return reply.status(400).send({ success: false, error: res.reason });
        return reply.send({ success: true, id: res.id });
      }
      const id = await createDraftTweet(text, "manual", body.mediaUrls?.[0] ?? null);
      return reply.send({ success: true, id });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_save_failed");
    }
  });

  // Manuel gönderi — anında yayınla (@haldefiyat, hal publisher).
  adminApi.post("/social/send", async (req, reply) => {
    const body = (req.body ?? {}) as { platform?: string; caption?: string; hashtags?: string; mediaUrls?: string[] };
    const platform = resolvePlatform(body.platform);
    const text = [body.caption?.trim(), body.hashtags?.trim()].filter(Boolean).join("\n\n");
    if (!body.caption?.trim()) return reply.status(400).send({ success: false, error: "Metin boş olamaz" });
    try {
      const res = await sendTweet({
        text,
        platform: platform as SocialPlatform,
        mediaUrl: body.mediaUrls?.[0] ?? null,
        source: "manual",
      });
      return reply.send({ success: true, id: res.tweet_id });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_send_failed");
    }
  });

  // Taslak/kuyruk kaydını ŞİMDİ yayınla (@haldefiyat).
  adminApi.post("/social/posts/:id/publish", async (req, reply) => {
    const id = String((req.params as { id?: string })?.id ?? "");
    if (!id) return reply.status(400).send({ success: false, error: "Geçersiz id" });
    try {
      const row = await getTweetById(id);
      if (!row) return reply.status(404).send({ success: false, error: "Kayıt yok" });
      if (row.status === "sent") return reply.status(400).send({ success: false, error: "Zaten yayınlandı" });
      const res = await sendTweet({
        text: row.content,
        platform: row.platform as SocialPlatform,
        mediaUrl: row.mediaUrl,
        source: "manual",
      });
      await repoMarkTweetSent(id, res.tweet_id, row.platform);
      return reply.send({ success: true, id });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_publish_failed");
    }
  });

  // Plan slotu aç/kapa — otomasyonu (günlük/haftalık) kontrol eder.
  adminApi.patch("/social/plan/:id", async (req, reply) => {
    const id = String((req.params as { id?: string })?.id ?? "");
    const body = (req.body ?? {}) as { is_active?: boolean };
    if (!id) return reply.status(400).send({ success: false, error: "Geçersiz id" });
    try {
      const ok = await setPlanActive(id, body.is_active !== false);
      return reply.send({ success: ok });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_plan_update_failed");
    }
  });

  // Kuyruk/taslak kaydı iptal et.
  adminApi.delete("/social/posts/:id", async (req, reply) => {
    const id = String((req.params as { id?: string })?.id ?? "");
    if (!id) return reply.status(400).send({ success: false, error: "Geçersiz id" });
    try {
      const res = await cancelQueuedTweet(id);
      return reply.send({ success: res.ok });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_delete_failed");
    }
  });
}
