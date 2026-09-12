import { registerSocialCards } from "./cards/router";
import type { FastifyInstance, FastifyReply } from "fastify";
import {
  cancelQueuedTweet,
  repoListTweets,
  repoListContentPlans,
  type TweetRow,
} from "@agro/shared-backend/modules/twitter";
import {
  listSocialPosts,
  listSocialTemplates,
  isSocialPlatform,
  type SocialPlatformKey,
} from "./repository";
import { buildTodayChartUrl } from "./daily-content";

function resolvePlatform(raw: unknown): SocialPlatformKey {
  return isSocialPlatform(raw) ? raw : "twitter";
}

const HANDLE = "haldefiyat";
const SOCIAL_OWNER = "ekosistem-sosyal-medya";

function externalPublisherRequired(reply: FastifyReply) {
  return reply.status(409).send({
    success: false,
    error: "external_publisher_required",
    publisher: SOCIAL_OWNER,
    action: "İçeriği Tanitio haldefiyat tenantında üretin ve yönetin.",
  });
}

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
  await registerSocialCards(app);
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

  // Sosyal icerik uretimi merkezi Tanitio tenantina aittir. Bu eski endpoint
  // yeniden acilirsa iki ayri kuyruk ayni marka icin taslak uretmeye baslar.
  adminApi.post("/social/prepare-daily", async (_req, reply) => externalPublisherRequired(reply));

  // Günün grafiği önizleme (tweet atmaz) — Faz3 görsel doğrulama + manuel kullanım.
  adminApi.get("/social/chart-preview", async (req, reply) => {
    try {
      const url = await buildTodayChartUrl();
      return reply.send({ success: true, url });
    } catch (err) {
      return fail(reply, err, req.log, "admin_social_chart_failed");
    }
  });

  // Eski panelde sahiplik acik gorunsun; yerel credential durumu yayin yetkisi degildir.
  adminApi.get("/social/status", async (req, reply) => {
    const platform = resolvePlatform((req.query as { platform?: string })?.platform);
    return reply.send({ platform, enabled: false, has_credentials: false, account: null, publisher: SOCIAL_OWNER, legacy: true });
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

  adminApi.post("/social/posts", async (_req, reply) => externalPublisherRequired(reply));

  // HalDeFiyat gerçek yayıncı değildir. Çift-poster riskini önlemek için bu
  // eski endpoint yalnız dış yayın kapısına yönlendiren kontrollü cevap verir.
  adminApi.post("/social/send", async (req, reply) => {
    return reply.status(409).send({
      success: false,
      error: "external_publisher_required",
      publisher: SOCIAL_OWNER,
      action: "Taslağı kaydedip merkezi yayın kuyruğunda onaylayın.",
    });
  });

  // Taslak/kuyruk kaydını ŞİMDİ yayınla (@haldefiyat).
  adminApi.post("/social/posts/:id/publish", async (req, reply) => {
    const id = String((req.params as { id?: string })?.id ?? "");
    if (!id) return reply.status(400).send({ success: false, error: "Geçersiz id" });
    return reply.status(409).send({
      success: false,
      id,
      error: "external_publisher_required",
      publisher: SOCIAL_OWNER,
    });
  });

  adminApi.patch("/social/plan/:id", async (_req, reply) => externalPublisherRequired(reply));

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
