/**
 * Bing arama sonucu ayristirici. Google VPS IP'sine captcha, DuckDuckGo baglanti
 * vermiyor (2026-09-05 denemesi); Bing TR sonuclari 10'ar sayfa halinde acik.
 */
export interface SerpHit {
  position: number;
  page: number;
  url: string;
  domain: string;
  title: string | null;
  snippet: string | null;
}

const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_m, h: string) => String.fromCodePoint(parseInt(h, 16)));
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();
}

/** Bing "ck/a?...&u=a1<base64url>" yonlendirmesini gercek adrese cevirir. */
export function decodeBingUrl(href: string): string | null {
  const clean = decodeEntities(href);
  try {
    const u = new URL(clean);
    if (!/(^|\.)bing\.com$/i.test(u.hostname)) return clean;
    const packed = u.searchParams.get("u");
    if (!packed) return null;
    const b64 = packed.replace(/^a1/, "").replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(b64 + "=".repeat((4 - (b64.length % 4)) % 4), "base64").toString("utf8");
    return /^https?:\/\//i.test(decoded) ? decoded : null;
  } catch {
    return null;
  }
}

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function parseBingHtml(html: string, page: number): SerpHit[] {
  const blocks = html.match(/<li class="b_algo".*?<\/li>/gs) ?? [];
  const hits: SerpHit[] = [];
  for (const block of blocks) {
    const h2 = /<h2[^>]*>(.*?)<\/h2>/s.exec(block)?.[1] ?? "";
    const href = /href="([^"]+)"/.exec(h2)?.[1];
    const url = href ? decodeBingUrl(href) : null;
    if (!url) continue;
    const domain = domainOf(url);
    if (!domain) continue;
    const caption = /class="b_caption".*?<p[^>]*>(.*?)<\/p>/s.exec(block)?.[1];
    hits.push({
      position: (page - 1) * 10 + hits.length + 1,
      page,
      url: url.slice(0, 1000),
      domain,
      title: stripTags(h2).slice(0, 500) || null,
      snippet: caption ? stripTags(caption).slice(0, 1000) : null,
    });
  }
  return hits;
}

export async function fetchBingPage(query: string, page: 1 | 2): Promise<{ hits: SerpHit[]; error?: string }> {
  const first = page === 1 ? 1 : 11;
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=tr&cc=TR&first=${first}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept-Language": "tr-TR,tr;q=0.9,en;q=0.5", Accept: "text/html" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return { hits: [], error: `HTTP ${res.status}` };
    const html = await res.text();
    const hits = parseBingHtml(html, page);
    if (!hits.length && /captcha|challenge/i.test(html)) return { hits: [], error: "captcha" };
    return { hits };
  } catch (err) {
    return { hits: [], error: err instanceof Error ? err.message : String(err) };
  }
}
