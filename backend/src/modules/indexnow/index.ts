import { env } from "@/core/env";

// IndexNow — Bing/Copilot ve diger katilimci motorlara icerik degisikligini aninda bildirir.
// https://www.indexnow.org/ — tek POST ile URL listesi gonderilir.
const ENDPOINT = "https://api.indexnow.org/indexnow";

// Gunluk guncellenen ana hub sayfalari (fiyatlar her gece ETL ile degisir).
const DEFAULT_HUB_PATHS = ["/", "/fiyatlar", "/hal", "/canli-hal-fiyatlari", "/endeks"];

function resolveSiteUrl(): string {
  const raw = process.env.INDEXNOW_SITE_URL || env.FRONTEND_URL || "";
  return raw.replace(/\/$/, "");
}

export interface IndexNowResult {
  submitted: number;
  status: number;
}

/**
 * URL listesini IndexNow'a gonderir. INDEXNOW_KEY env yoksa sessizce devre disi
 * (null doner) — boylece dev/test ortaminda yanlislikla ping atilmaz.
 */
export async function submitToIndexNow(
  paths: string[] = DEFAULT_HUB_PATHS,
): Promise<IndexNowResult | null> {
  const key = (process.env.INDEXNOW_KEY ?? "").trim();
  const site = resolveSiteUrl();
  if (!key || !/^https?:\/\//.test(site)) return null;

  const host = new URL(site).host;
  const urlList = [...new Set(paths)].map((p) =>
    p.startsWith("http") ? p : `${site}${p}`,
  );
  if (urlList.length === 0) return null;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation: `${site}/indexnow-key.txt`,
      urlList,
    }),
  });

  // 200 OK / 202 Accepted = basari; digerleri cron tarafindan loglanir.
  return { submitted: urlList.length, status: res.status };
}
