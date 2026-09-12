import { env } from "@/core/env";

const TENANT_KEY = "haldefiyat";
const API_BASE = (process.env.TANITIO_API_URL || "https://panel.tanitio.com/api/v1").replace(/\/+$/, "");

export type TanitioNotificationConfig = {
  tenantKey: string;
  telegram: { adminChatId: string | null; channelChatId: string | null; channelPublishEnabled: boolean; operationsEnabled: boolean };
  whatsapp: { channelUrl: string | null; channelBridgeEnabled: boolean };
};

let cache: { expiresAt: number; value: TanitioNotificationConfig } | null = null;

function headers() {
  return { Authorization: `Bearer ${env.TANITIO_CONTENT_API_KEY}`, "Content-Type": "application/json" };
}

export async function getTanitioNotificationConfig(): Promise<TanitioNotificationConfig> {
  if (cache && cache.expiresAt > Date.now()) return cache.value;
  if (!env.TANITIO_CONTENT_API_KEY) throw new Error("TANITIO_CONTENT_API_KEY eksik");
  const res = await fetch(`${API_BASE}/tenant-notifications/config?tenantKey=${TENANT_KEY}`, { headers: headers() });
  if (!res.ok) throw new Error(`Tanitio bildirim ayarlari HTTP ${res.status}`);
  const value = await res.json() as TanitioNotificationConfig;
  cache = { expiresAt: Date.now() + 60_000, value };
  return value;
}

export async function sendTanitioNotification(input: {
  target: "admin" | "channel" | "recipient";
  chatId?: string | number | null;
  text: string;
  photoUrl?: string | null;
  parseMode?: "html" | "plain";
}): Promise<boolean> {
  if (!env.TANITIO_CONTENT_API_KEY) return false;
  const res = await fetch(`${API_BASE}/tenant-notifications/send`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ tenantKey: TENANT_KEY, ...input }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.warn(`[tanitio-notifications] HTTP ${res.status} — ${detail.slice(0, 200)}`);
  }
  return res.ok;
}
