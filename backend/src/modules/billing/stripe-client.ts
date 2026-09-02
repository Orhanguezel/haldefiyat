/**
 * Stripe HTTP istemcisi — SDK YOK, tek bagimlilik fetch.
 *
 * Gerekce: SDK surum yukseltmeleri bundle ve tip riski getiriyor; Stripe REST
 * API'si form-encoded ve kararli. Ayni yaklasim goldmoodastro'da uretimde
 * calisiyor (packages/shared-backend/modules/orders/stripe.service.ts).
 *
 * FAIL-CLOSED: STRIPE_SECRET_KEY yoksa hicbir cagri yapilmaz, StripeNotConfigured
 * firlatilir. Odeme yolunda sessiz varsayilan OLMAZ.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export class StripeNotConfiguredError extends Error {
  constructor(missing: string) {
    super(`stripe_not_configured:${missing}`);
  }
}

function secretKey(): string {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) throw new StripeNotConfiguredError("STRIPE_SECRET_KEY");
  return key;
}

export function isStripeConfigured(): boolean {
  return Boolean((process.env.STRIPE_SECRET_KEY ?? "").trim())
    && Boolean((process.env.STRIPE_PRO_PRICE_ID ?? "").trim());
}

/** Stripe form-encoded gövde ister; iç içe alanlari a[b][c] bicimine cevirir. */
function toForm(obj: Record<string, unknown>, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          parts.push(...toForm(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof v === "object") {
      parts.push(...toForm(v as Record<string, unknown>, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts;
}

async function stripeRequest(
  method: "GET" | "POST",
  path: string,
  payload?: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const url = `${STRIPE_API}${path}`;
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    signal: AbortSignal.timeout(20_000),
  };
  if (method === "POST") init.body = toForm(payload ?? {}).join("&");

  const res = await fetch(url, init);
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = body.error as { message?: string } | undefined;
    const error = new Error(err?.message ?? `stripe_http_${res.status}`);
    (error as Error & { statusCode?: number }).statusCode = res.status;
    throw error;
  }
  return body;
}

export interface CheckoutArgs {
  userId: string;
  email?: string | null;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
  locale?: string;
}

/**
 * Aylik Pro aboneligi icin Checkout oturumu.
 *
 * `mode: "subscription"` + Stripe panelinde tanimli yinelenen fiyat kullanilir;
 * tutar KODA YAZILMAZ (STRIPE_PRO_PRICE_ID). Boylece fiyat degisikligi deploy
 * gerektirmez ve kod ile panel arasinda tutar sapmasi olusmaz.
 *
 * client_reference_id = userId: webhook aboneligi bu alandan kullaniciya baglar.
 */
export async function createSubscriptionCheckout(args: CheckoutArgs): Promise<{ id: string; url: string }> {
  const priceId = (process.env.STRIPE_PRO_PRICE_ID ?? "").trim();
  if (!priceId) throw new StripeNotConfiguredError("STRIPE_PRO_PRICE_ID");

  const payload: Record<string, unknown> = {
    mode: "subscription",
    client_reference_id: args.userId,
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: args.userId },
    subscription_data: { metadata: { user_id: args.userId } },
    allow_promotion_codes: true,
  };
  // Mevcut musteri varsa ona bagla; yoksa e-posta ile yeni musteri acilir.
  if (args.customerId) payload.customer = args.customerId;
  else if (args.email) payload.customer_email = args.email;

  const loc = (args.locale ?? "").slice(0, 2).toLowerCase();
  if (["tr", "en"].includes(loc)) payload.locale = loc;

  const session = await stripeRequest("POST", "/checkout/sessions", payload);
  return { id: String(session.id), url: String(session.url) };
}

/**
 * Stripe'in kendi musteri portali — iptal, kart guncelleme ve fatura gecmisi
 * orada yasar. Kendi faturalama ekranimizi yazmiyoruz: iptal akisinin dogru
 * calismasi para iadesi ve KVKK acisindan Stripe'in sorumlulugunda kalir.
 */
export async function createBillingPortalSession(customerId: string, returnUrl: string): Promise<{ url: string }> {
  const session = await stripeRequest("POST", "/billing_portal/sessions", {
    customer: customerId,
    return_url: returnUrl,
  });
  return { url: String(session.url) };
}

export async function retrieveSubscription(subscriptionId: string): Promise<Record<string, unknown>> {
  return stripeRequest("GET", `/subscriptions/${encodeURIComponent(subscriptionId)}`);
}
