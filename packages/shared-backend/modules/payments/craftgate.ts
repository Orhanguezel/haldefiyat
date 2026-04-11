import { createHmac, randomUUID } from 'crypto';

export interface CraftgateConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

export interface CraftgateItem {
  id: string;
  name: string;
  price: number;
}

export interface CraftgateInitResponse {
  id?: string;
  url?: string;
  expiresAt?: string;
  errors?: { errorCode?: string; errorDescription?: string }[];
}

export interface CraftgateRetrieveResponse {
  payment?: {
    id: number;
    status: string;
    orderId?: string;
    merchantPaymentId?: string;
    price?: number;
    paidPrice?: number;
    currency?: string;
    fraudStatus?: number;
  };
  errors?: { errorCode?: string; errorDescription?: string }[];
}

function buildHeaders(config: CraftgateConfig, path: string, body: string): Record<string, string> {
  const rndKey = randomUUID();
  const ts = String(Math.floor(Date.now() / 1000));
  const raw = config.apiKey + rndKey + ts + path + body;
  const sig = createHmac('sha256', config.secretKey).update(raw).digest('base64');
  return {
    'x-api-key': config.apiKey,
    'x-rnd-key': rndKey,
    'x-auth-version': '1',
    'x-signature': sig,
    'content-type': 'application/json',
    accept: 'application/json',
  };
}

async function cgPost<T>(config: CraftgateConfig, path: string, body: unknown): Promise<T> {
  const base = config.baseUrl.replace(/\/$/, '');
  const json = JSON.stringify(body);
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: buildHeaders(config, path, json),
    body: json,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`craftgate_http_${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

async function cgGet<T>(config: CraftgateConfig, path: string): Promise<T> {
  const base = config.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}${path}`, {
    method: 'GET',
    headers: buildHeaders(config, path, ''),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`craftgate_http_${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function craftgateInitCheckout(
  config: CraftgateConfig,
  params: {
    orderId: string;
    amount: number;
    callbackUrl: string;
    items: CraftgateItem[];
    locale?: string;
  },
): Promise<CraftgateInitResponse> {
  return cgPost<CraftgateInitResponse>(config, '/payment/v1/checkout-payments/init', {
    price: params.amount,
    paidPrice: params.amount,
    currency: 'TRY',
    paymentGroup: 'PRODUCT',
    callbackUrl: params.callbackUrl,
    merchantPaymentId: params.orderId,
    locale: (params.locale ?? 'tr').toUpperCase(),
    items: params.items,
  });
}

export async function craftgateRetrieveCheckout(
  config: CraftgateConfig,
  checkoutId: string,
): Promise<CraftgateRetrieveResponse> {
  return cgGet<CraftgateRetrieveResponse>(config, `/payment/v1/checkout-payments/${checkoutId}`);
}
