type SearchResult<T> = { data: T | null; throttled: boolean; calls: number; error?: string; unavailable?: boolean };
type SearchDependencies = {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  sleep: (ms: number) => Promise<void>;
};

/** Read-only search POSTs: pace requests and retry transient failures, never 403/429. */
export function createMarketfiyatiSearch<T>(dependencies: Partial<SearchDependencies> = {}) {
  const request = dependencies.fetch ?? fetch;
  const sleep = dependencies.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  let started = false;
  return async (keyword: string, page: number): Promise<SearchResult<T>> => {
    let lastError = "SEARCH_NETWORK_OR_RESPONSE_ERROR";
    for (let attempt = 0; attempt < 3; attempt++) {
      if (started) await sleep(attempt ? 2_000 * 2 ** (attempt - 1) : 1_100);
      started = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20_000);
      try {
        const response = await request("https://api.marketfiyati.org.tr/api/v2/search", {
          method: "POST",
          headers: { "Content-Type": "application/json", "User-Agent": "HaldeFiyat/1.0 (+https://haldefiyat.com/metodoloji)" },
          body: JSON.stringify({ keywords: keyword, pages: page, size: 25 }),
          signal: controller.signal,
        });
        if (response.ok) return { data: await response.json() as T, throttled: false, calls: attempt + 1 };
        lastError = `SEARCH_HTTP_${response.status}`;
        await response.body?.cancel();
        const throttled = response.status === 403 || response.status === 429;
        if (throttled || response.status < 500) return { data: null, throttled, calls: attempt + 1, error: lastError };
      } catch (error) {
        const failure = error as { code?: string; cause?: { code?: string }; name?: string };
        const code = failure?.code ?? failure?.cause?.code;
        const category = controller.signal.aborted ? "ETIMEDOUT"
          : code && ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(code) ? code
          : "NETWORK_OR_RESPONSE";
        lastError = `SEARCH_${category}_ERROR`;
      } finally {
        clearTimeout(timer);
      }
    }
    // A source that keeps dropping connections must not receive hundreds of
    // additional keyword requests. Preserve the partial run and stop here.
    return { data: null, throttled: false, calls: 3, error: lastError, unavailable: true };
  };
}
