export function sendPageviewBeacon(path: string): void {
  if (typeof window === "undefined") return;

  try {
    const search = window.location.search;
    const endpoint = `/api/v1/track/pageview${search}`;
    const body = JSON.stringify({
      path,
      referer: document.referrer || "",
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: "application/json" }));
      return;
    }

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    /* noop */
  }
}
