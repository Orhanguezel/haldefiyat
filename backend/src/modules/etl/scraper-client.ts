/**
 * Merkezi Scrapling servisi (scraper.guezelwebdesign.com) HTTP wrapper.
 *
 * Sorunlu HTML kaynaklari (antkomder, gaziantep, kayseri, kocaeli, mersin,
 * balikesir) icin anti-bot bypass + JS render saglar. Servis hatasi durumunda
 * cagiran legacy fetch davranisina sessizce dusler.
 *
 * Etkin olmasi icin .env'de:
 *   SCRAPER_URL          = https://scraper.guezelwebdesign.com
 *   SCRAPER_API_KEY      = scraper-hal-fiyatlari-...
 *   SCRAPER_ENABLED      = true                      # default true (URL+KEY varsa)
 *   HF_SCRAPER_SOURCES   = key1,key2,...             # bu listedekiler Scrapling'e gider
 *   HF_SCRAPER_DYNAMIC   = key1,...                  # bu listedekiler "dynamic" mode (JS render)
 */

const TRUTHY = new Set(["1", "true", "yes", "on"]);

function envBool(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return TRUTHY.has(value.trim().toLowerCase());
}

function envList(name: string): Set<string> {
  return new Set((process.env[name] ?? "").split(",").map((s) => s.trim()).filter(Boolean));
}

export interface ScrapeOptions {
  /** "fast" | "stealthy" | "dynamic" — default "stealthy" */
  mode?: "fast" | "stealthy" | "dynamic";
  /** Maksimum bekleme suresi (saniye). Default 60. */
  timeoutSeconds?: number;
  /** CSS selector hazirsa wait icin. */
  waitFor?: string;
  /** Cloudflare Turnstile cozumu. Default false. */
  solveCloudflare?: boolean;
  /** HTTP method. Default "GET". POST sadece "fast" mode'da. */
  method?: "GET" | "POST";
  /** application/x-www-form-urlencoded body (POST icin). */
  formData?: Record<string, string>;
  /** Extra HTTP headers (UA disinda). */
  extraHeaders?: Record<string, string>;
  /** Request'e forward edilecek cookies (multi-step istekler icin). */
  cookies?: Record<string, string>;
  /** Response'ta cookies geri donsun mu (multi-step icin gerekir). */
  returnCookies?: boolean;
}

export interface ScraperResult {
  ok: boolean;
  status: number | null;
  html: string | null;
  durationMs: number | null;
  cookies?: Record<string, string> | null;
  error?: string;
}

export function isScraperEnabled(): boolean {
  if (!process.env.SCRAPER_URL || !process.env.SCRAPER_API_KEY) return false;
  return envBool("SCRAPER_ENABLED", true);
}

export function shouldUseScraperFor(sourceKey: string): boolean {
  if (!isScraperEnabled()) return false;
  return envList("HF_SCRAPER_SOURCES").has(sourceKey);
}

export function shouldUseDynamicFor(sourceKey: string): boolean {
  return envList("HF_SCRAPER_DYNAMIC").has(sourceKey);
}

export async function fetchViaScraper(
  url: string,
  options: ScrapeOptions = {},
): Promise<ScraperResult> {
  const baseUrl = (process.env.SCRAPER_URL ?? "").replace(/\/$/, "");
  const apiKey  = process.env.SCRAPER_API_KEY ?? "";
  if (!baseUrl || !apiKey) {
    return { ok: false, status: null, html: null, durationMs: null, error: "scraper_disabled" };
  }

  const timeoutSeconds = options.timeoutSeconds ?? 60;
  const controller = new AbortController();
  const httpTimeout = setTimeout(() => controller.abort(), (timeoutSeconds + 30) * 1000);

  try {
    const payload: Record<string, unknown> = {
      url,
      mode: options.mode ?? "stealthy",
      options: {
        headless: true,
        network_idle: true,
        timeout: timeoutSeconds,
        solve_cloudflare: options.solveCloudflare ?? false,
        ...(options.waitFor ? { wait_for: options.waitFor } : {}),
      },
      return_html: true,
    };
    if (options.method === "POST") {
      payload.method = "POST";
      if (options.formData) payload.form_data = options.formData;
    }
    if (options.extraHeaders) payload.extra_headers = options.extraHeaders;
    if (options.cookies) payload.cookies = options.cookies;
    if (options.returnCookies) payload.return_cookies = true;

    const res = await fetch(`${baseUrl}/api/v1/scrape`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, status: res.status, html: null, durationMs: null, error: `scraper HTTP ${res.status}` };
    }
    const data = await res.json() as {
      success: boolean;
      status_code: number | null;
      duration_ms: number | null;
      html: string | null;
      cookies?: Record<string, string> | null;
      error?: string | null;
    };
    if (!data.success || data.html == null) {
      return { ok: false, status: data.status_code, html: null, durationMs: data.duration_ms, cookies: data.cookies ?? null, error: data.error ?? "scraper_no_html" };
    }
    return { ok: true, status: data.status_code, html: data.html, durationMs: data.duration_ms, cookies: data.cookies ?? null };
  } catch (err: unknown) {
    return {
      ok: false,
      status: null,
      html: null,
      durationMs: null,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(httpTimeout);
  }
}
