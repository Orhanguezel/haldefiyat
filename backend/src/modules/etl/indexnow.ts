const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haldefiyat.com").replace(/\/$/, "");
const INDEXNOW_KEY = process.env.INDEXNOW_KEY ?? "75e8d89807d0a6e3229797e46e260279";

const CORE_URLS = [
  `${SITE_URL}/`,
  `${SITE_URL}/fiyatlar`,
  `${SITE_URL}/endeks`,
  `${SITE_URL}/hal`,
];

export async function submitIndexNow(extraUrls: string[] = []): Promise<void> {
  const urls = [...new Set([...CORE_URLS, ...extraUrls])];
  const body = {
    host: new URL(SITE_URL).hostname,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
}
