const DEFAULT_SAMPLE_RATE = 0.1;
const BOT_USER_AGENT =
  /bot|crawler|spider|crawling|headless|lighthouse|pagespeed|google-inspectiontool/i;

type SessionStore = Pick<Storage, "getItem" | "setItem">;

export function webVitalsSampleRate(configured: string | undefined): number {
  const parsed = Number(configured);
  if (!Number.isFinite(parsed)) return DEFAULT_SAMPLE_RATE;
  return Math.min(1, Math.max(0, parsed));
}

export function isSyntheticUserAgent(userAgent: string): boolean {
  return BOT_USER_AGENT.test(userAgent);
}

export function isSampledWebVitalsSession({
  storage,
  storageKey,
  rate,
  random = Math.random,
}: {
  storage: SessionStore;
  storageKey: string;
  rate: number;
  random?: () => number;
}): boolean {
  try {
    const stored = storage.getItem(storageKey);
    if (stored !== null) return stored === "1";

    const sampled = random() < rate;
    storage.setItem(storageKey, sampled ? "1" : "0");
    return sampled;
  } catch {
    return random() < rate;
  }
}
