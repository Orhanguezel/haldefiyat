/**
 * Twitter/X otomatik paylaşım yayıncısı (@haldefiyat).
 *
 * Free tier 1500 tweet/ay (~50/gün). Bizim cron'umuz günde 1 tweet — fazlasıyla yeterli.
 *
 * Veri: trending top 3 yükselen + top 3 düşen (280 char sığması için Telegram'a göre kısaltıldı).
 *
 * Endpoint: POST https://api.twitter.com/2/tweets
 * Auth: OAuth 1.0a HMAC-SHA1 (server-side, 4 token)
 */

import { env } from "@/core/env";
import { trendingChanges } from "@/modules/prices/repository";
import { buildOAuth1Header } from "./oauth1";

const TWEET_ENDPOINT = "https://api.twitter.com/2/tweets";
const SITE_URL = "https://haldefiyat.com";
const TWEET_MAX_LENGTH = 280; // X t.co URL kısaltma 23 char, bunu hesaba kat
const URL_RESERVED_CHARS = 23;

export interface TweetResult {
  posted: boolean;
  tweetId?: string;
  text?: string;
  error?: string;
}

function fmtPrice(n: number): string {
  return n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(0)}%`;
}

// Tweet metni — 280 char budget içinde, link ile birlikte
function buildDailyTweetText(items: Awaited<ReturnType<typeof trendingChanges>>): string {
  if (items.length === 0) return "";

  const risers = items.filter((i) => i.changePct > 0).slice(0, 3);
  const fallers = items.filter((i) => i.changePct < 0).slice(0, 3);

  const dateStr = new Date().toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    timeZone: "Europe/Istanbul",
  });

  const lines: string[] = [`📊 Hal fiyatları — ${dateStr}`];

  if (risers.length > 0) {
    lines.push("");
    lines.push("📈 Yükselenler:");
    for (const r of risers) {
      const name = r.product?.nameTr ?? "?";
      lines.push(`• ${name} ${fmtPct(r.changePct)} → ${fmtPrice(r.latest)}₺`);
    }
  }

  if (fallers.length > 0) {
    lines.push("");
    lines.push("📉 Düşenler:");
    for (const f of fallers) {
      const name = f.product?.nameTr ?? "?";
      lines.push(`• ${name} ${fmtPct(f.changePct)} → ${fmtPrice(f.latest)}₺`);
    }
  }

  // URL en sonda — t.co 23 char sayar
  const url = `${SITE_URL}/`;
  const body = lines.join("\n");
  const totalBudget = TWEET_MAX_LENGTH - URL_RESERVED_CHARS - 2; // 2 = "\n\n"

  // Body uzunsa son satırdan kıs
  let truncated = body;
  while (truncated.length > totalBudget && lines.length > 2) {
    lines.pop();
    truncated = lines.join("\n");
  }

  return `${truncated}\n\n${url}`;
}

export async function postTweet(text: string): Promise<TweetResult> {
  const creds = env.TWITTER;
  if (!creds.apiKey || !creds.apiSecret || !creds.accessToken || !creds.accessTokenSecret) {
    return { posted: false, error: "TWITTER credentials eksik (.env kontrolu)" };
  }

  const authHeader = buildOAuth1Header("POST", TWEET_ENDPOINT, creds, {});
  const res = await fetch(TWEET_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({ text }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      posted: false,
      error: `HTTP ${res.status} — ${JSON.stringify(body).slice(0, 300)}`,
      text,
    };
  }
  const data = (body as { data?: { id: string; text: string } }).data;
  return {
    posted: true,
    tweetId: data?.id,
    text:    data?.text ?? text,
  };
}

/**
 * Cron tetikleyicisi — günlük trending tweet.
 */
export async function publishDailyTweet(): Promise<TweetResult> {
  const items = await trendingChanges(10);
  const text = buildDailyTweetText(items);
  if (!text) {
    return { posted: false, error: "Trending verisi boş, tweet atlandı" };
  }
  return postTweet(text);
}
