/**
 * Arama motoru ayristiricilari. VPS'ten deneme (2026-09-05): Google captcha, DuckDuckGo
 * baglanti yok, Bing Turkce uzun kuyruk sorgularda alakasiz ("adana limon fiyatlari" →
 * Adana turizmi). Brave (kendi indeksi, 20 sonuc/sayfa) ve Yandex (TR pazarinda guclu)
 * dogru sonuc veriyor; Bing yedek olarak duruyor.
 */
import { decodeBingUrl, domainOf, fetchBingPage, type SerpHit } from "./serp-bing";

export type SerpEngine = "brave" | "yandex" | "bing";
export const SERP_ENGINES: SerpEngine[] = ["brave", "yandex", "bing"];
/** Motorun tek sayfada verdigi sonuc sayisi — "ilk 20" icin kac sayfa gerektigi buradan cikar. */
export const PAGE_SIZE: Record<SerpEngine, number> = { brave: 20, yandex: 10, bing: 10 };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)));
}
const text = (s: string) => decodeEntities(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

async function getHtml(url: string): Promise<{ html: string | null; error?: string }> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.5", Accept: "text/html" }, signal: AbortSignal.timeout(25_000) });
    if (!res.ok) return { html: null, error: `HTTP ${res.status}` };
    return { html: await res.text() };
  } catch (err) {
    return { html: null, error: err instanceof Error ? err.message : String(err) };
  }
}

function pushHit(hits: SerpHit[], page: number, pageSize: number, url: string, title: string | null, snippet: string | null) {
  const domain = domainOf(url);
  if (!domain) return;
  hits.push({ position: (page - 1) * pageSize + hits.length + 1, page, url: url.slice(0, 1000), domain, title: title?.slice(0, 500) || null, snippet: snippet?.slice(0, 1000) || null });
}

/** Brave: <div class="snippet ..." data-pos="N" data-type="web"> bloklari; ilk <a href> hedef, .title baslik, .generic-snippet .content aciklama. */
export function parseBraveHtml(html: string, page: number): SerpHit[] {
  const hits: SerpHit[] = [];
  const parts = html.split(/(?=<div[^>]*class="snippet [^"]*"[^>]*data-pos="\d+"[^>]*data-type="web")/);
  for (const block of parts.slice(1)) {
    const href = /<a href="(https?:\/\/(?!search\.brave\.com)[^"]+)"/.exec(block)?.[1];
    if (!href) continue;
    const title = /<div class="title[^"]*"[^>]*title="([^"]*)"/.exec(block)?.[1] ?? /<div class="title[^"]*"[^>]*>(.*?)<\/div>/s.exec(block)?.[1] ?? null;
    const desc = /<div class="generic-snippet[^"]*">.*?<div class="content[^"]*">(.*?)<\/div>/s.exec(block)?.[1] ?? null;
    pushHit(hits, page, PAGE_SIZE.brave, decodeEntities(href), title ? text(title) : null, desc ? text(desc) : null);
  }
  return hits;
}

/** Yandex: <li class="serp-item"> icinde OrganicTitle-Link (href + baslik), OrganicTextContentSpan aciklama. Reklam/yandex ici sonuclar atlanir. */
export function parseYandexHtml(html: string, page: number): SerpHit[] {
  const hits: SerpHit[] = [];
  const items = html.split(/(?=<li class="serp-item)/).slice(1);
  for (const item of items) {
    const m = /class="[^"]*OrganicTitle-Link[^"]*"[^>]*href="(https?:\/\/[^"]+)"[^>]*>(.*?)<\/a>/s.exec(item);
    if (!m) continue;
    const href = decodeEntities(m[1]);
    if (/(^|\.)yandex\.(com\.tr|ru|com)\//.test(href)) continue;
    const desc = /class="[^"]*OrganicTextContentSpan[^"]*"[^>]*>(.*?)<\/span>/s.exec(item)?.[1] ?? null;
    pushHit(hits, page, PAGE_SIZE.yandex, href, text(m[2]), desc ? text(desc) : null);
  }
  return hits;
}

export async function fetchSerpPage(engine: SerpEngine, query: string, page: number): Promise<{ hits: SerpHit[]; error?: string }> {
  if (engine === "bing") return fetchBingPage(query, page === 1 ? 1 : 2);
  const q = encodeURIComponent(query);
  const url = engine === "brave"
    ? `https://search.brave.com/search?q=${q}&source=web&country=tr${page > 1 ? `&offset=${page - 1}` : ""}`
    : `https://yandex.com.tr/search/?text=${q}&lr=11508${page > 1 ? `&p=${page - 1}` : ""}`;
  const { html, error } = await getHtml(url);
  if (!html) return { hits: [], error };
  const hits = engine === "brave" ? parseBraveHtml(html, page) : parseYandexHtml(html, page);
  if (!hits.length && /captcha|smartcaptcha|robot/i.test(html) && html.length < 60_000) return { hits: [], error: "captcha" };
  return { hits };
}

export { decodeBingUrl };
