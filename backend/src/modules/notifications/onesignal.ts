/**
 * OneSignal REST API istemcisi.
 *
 * Çağrılar auth: `Authorization: Basic <REST_API_KEY>` header'ıyla yapılır
 * (OneSignal'in kendi formatı — Basic olmasına rağmen değer raw API key).
 *
 * Kullanım:
 *   await sendToExternalIds(["user-uuid-1"], { title, message, url })
 *   await sendBroadcast({ title, message, url })
 *
 * Hatalar: env eksikse null döner, fetch hatası varsa log'lanıp throw edilmez
 * (cron gibi arka plan akışlarını durdurmamak için).
 */

import { env } from "@/core/env";

const API_URL = "https://onesignal.com/api/v1/notifications";

export interface PushPayload {
  title:   string;
  message: string;
  url?:    string;
  /** Opsiyonel ek veri (frontend'de OneSignal notificationClicked event'inde) */
  data?:   Record<string, string | number | boolean>;
}

interface OneSignalResponse {
  id?:         string;
  recipients?: number;
  errors?:     string[] | Record<string, unknown>;
}

function isConfigured(): boolean {
  return Boolean(env.ONESIGNAL.appId && env.ONESIGNAL.restApiKey);
}

function buildBase(payload: PushPayload): Record<string, unknown> {
  const url = payload.url ?? env.ONESIGNAL.launchUrl;
  return {
    app_id:    env.ONESIGNAL.appId,
    headings:  { en: payload.title, tr: payload.title },
    contents:  { en: payload.message, tr: payload.message },
    url,
    web_url:   url,
    chrome_web_icon:  `${env.ONESIGNAL.launchUrl}/favicon.png`,
    firefox_icon:     `${env.ONESIGNAL.launchUrl}/favicon.png`,
    data:      payload.data ?? undefined,
  };
}

async function sendRaw(body: Record<string, unknown>): Promise<OneSignalResponse | null> {
  if (!isConfigured()) {
    console.warn("[onesignal] skipped — app_id/rest_api_key eksik");
    return null;
  }
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": `Basic ${env.ONESIGNAL.restApiKey}`,
      },
      body:    JSON.stringify(body),
      signal:  AbortSignal.timeout(20_000),
    });
    const json = (await res.json()) as OneSignalResponse;
    if (!res.ok) {
      console.error("[onesignal] HTTP", res.status, json);
      return json;
    }
    return json;
  } catch (err) {
    console.error("[onesignal] fetch hatasi", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * Belirli kullanıcılara push (external_id eşleşmesi).
 * Frontend OneSignalProvider `OneSignal.login(user.id)` çağırdığı için
 * external_id = backend user.id'dir.
 */
export async function sendToExternalIds(
  externalIds: string[],
  payload: PushPayload,
): Promise<OneSignalResponse | null> {
  const cleaned = externalIds.filter(Boolean);
  if (cleaned.length === 0) return null;
  return sendRaw({
    ...buildBase(payload),
    include_external_user_ids: cleaned,
    channel_for_external_user_ids: "push",
  });
}

/**
 * Tüm aktif subscriber'lara broadcast. Haftalık bülten gibi herkese açık
 * duyurular için.
 */
export async function sendBroadcast(
  payload: PushPayload,
  options: { segment?: string } = {},
): Promise<OneSignalResponse | null> {
  return sendRaw({
    ...buildBase(payload),
    included_segments: [options.segment ?? "Subscribed Users"],
  });
}

export { isConfigured as isOneSignalConfigured };
