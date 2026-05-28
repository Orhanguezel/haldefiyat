const VERSION = (
  process.env.NEXT_PUBLIC_GIT_SHA ??
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.GIT_COMMIT_SHA ??
  "dev"
).slice(0, 12);

const swSource = String.raw`
const VERSION = "__VERSION__";
const STATIC_CACHE = "haldefiyat-static-" + VERSION;
const IMAGE_CACHE = "haldefiyat-images-" + VERSION;
const HTML_CACHE = "haldefiyat-html-" + VERSION;
const PRICE_CACHE = "haldefiyat-prices-" + VERSION;
const WIDGET_CACHE = "haldefiyat-widget-" + VERSION;
const CACHE_PREFIXES = [
  "haldefiyat-static-",
  "haldefiyat-images-",
  "haldefiyat-html-",
  "haldefiyat-prices-",
  "haldefiyat-widget-",
];

const ONE_MINUTE = 60 * 1000;
const THIRTY_SECONDS = 30 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(HTML_CACHE)
      .then((cache) => cache.add("/offline"))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => {
        const owned = CACHE_PREFIXES.some((prefix) => key.startsWith(prefix));
        const current = [STATIC_CACHE, IMAGE_CACHE, HTML_CACHE, PRICE_CACHE, WIDGET_CACHE].includes(key);
        return owned && !current ? caches.delete(key) : Promise.resolve(false);
      })))
      .then(() => self.clients.claim()),
  );
});

function isSafeGet(request) {
  return request.method === "GET" && (request.url.startsWith(self.location.origin) || request.mode === "navigate");
}

function isBlockedPath(pathname) {
  return pathname.startsWith("/admin") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/v1/auth") ||
    pathname === "/giris" ||
    pathname === "/kayit" ||
    pathname.endsWith("/giris") ||
    pathname.endsWith("/kayit");
}

function isHtmlRequest(request) {
  return request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");
}

function isStaticAsset(pathname) {
  return pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|woff2?|ttf|otf)$/i.test(pathname);
}

function isImageAsset(pathname) {
  return pathname.startsWith("/_next/image") ||
    pathname.startsWith("/uploads/") ||
    /\.(?:png|jpe?g|webp|avif|gif|svg|ico)$/i.test(pathname);
}

function withCacheTime(response) {
  const headers = new Headers(response.headers);
  headers.set("x-sw-cached-at", String(Date.now()));
  return response.blob().then((body) => new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}

function isFresh(response, ttl) {
  const cachedAt = Number(response.headers.get("x-sw-cached-at") || "0");
  return cachedAt > 0 && Date.now() - cachedAt < ttl;
}

async function cachePut(cacheName, request, response) {
  if (!response || !response.ok) return response;
  const cache = await caches.open(cacheName);
  await cache.put(request, await withCacheTime(response.clone()));
  return response;
}

async function cacheFirst(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached && isFresh(cached, ttl)) return cached;

  try {
    const fresh = await fetch(request);
    return await cachePut(cacheName, request, fresh);
  } catch {
    if (cached) return cached;
    throw new Error("cache-first miss");
  }
}

async function networkFirst(request, cacheName, ttl, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    return await cachePut(cacheName, request, fresh);
  } catch {
    const cached = await cache.match(request);
    if (cached && isFresh(cached, ttl)) {
      const headers = new Headers(cached.headers);
      headers.set("x-hal-offline", "1");
      return new Response(await cached.blob(), {
        status: cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    if (fallbackUrl) return (await caches.open(HTML_CACHE)).match(fallbackUrl);
    throw new Error("network-first miss");
  }
}

async function staleWhileRevalidate(request, cacheName, ttl) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => cachePut(cacheName, request, response))
    .catch(() => null);

  if (cached && isFresh(cached, ttl)) {
    refresh.catch(() => null);
    return cached;
  }

  const fresh = await refresh;
  return fresh || cached || fetch(request);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (!isSafeGet(request)) return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || isBlockedPath(url.pathname)) return;

  if (isHtmlRequest(request)) {
    event.respondWith(networkFirst(request, HTML_CACHE, ONE_MINUTE, "/offline"));
    return;
  }

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, ONE_YEAR));
    return;
  }

  if (isImageAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, THIRTY_DAYS));
    return;
  }

  if (url.pathname.startsWith("/api/v1/prices/widget")) {
    event.respondWith(staleWhileRevalidate(request, WIDGET_CACHE, FIVE_MINUTES));
    return;
  }

  if (url.pathname.startsWith("/api/v1/prices/")) {
    event.respondWith(networkFirst(request, PRICE_CACHE, THIRTY_SECONDS));
  }
});
`;

export function GET() {
  return new Response(swSource.replace("__VERSION__", VERSION), {
    headers: {
      "Cache-Control": "no-store, must-revalidate",
      "Content-Type": "application/javascript; charset=utf-8",
    },
  });
}
