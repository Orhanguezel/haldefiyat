// packages/shared-backend/modules/halkode/index.ts
// Halk Öde REST API entegrasyonu
// Belge: https://docs-vpos.halkode.com.tr
// API base: https://app.halkode.com.tr/ccpayment

export interface HalkodeConfig {
  appId: string;
  appSecret: string;
  merchantKey: string;
  posId: number;
  apiBase?: string; // default: https://app.halkode.com.tr/ccpayment
}

export interface HalkodePaymentParams {
  invoiceId: string;
  amount: number; // TRY, örn: 150.00
  okUrl: string;
  failUrl: string;
  ccHolderName?: string;
  ccNo?: string;
  expMonth?: string;
  expYear?: string;
  cvv?: string;
  items?: Array<{ name: string; price: string; quantity: number }>;
  lang?: 'tr' | 'en';
}

export interface HalkodeTokenResponse {
  token: string;
  is3d: number;
  expiresAt: string;
}

export interface HalkodePayResponse {
  redirectUrl?: string;
  html?: string;
  paymentId?: string;
  raw: Record<string, unknown>;
}

function apiBase(cfg: HalkodeConfig): string {
  return (cfg.apiBase ?? 'https://app.halkode.com.tr/ccpayment').replace(/\/$/, '');
}

async function postJson(url: string, body: unknown, token?: string): Promise<unknown> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

/** Erişim token'ı al */
export async function getHalkodeToken(cfg: HalkodeConfig): Promise<HalkodeTokenResponse> {
  const base = apiBase(cfg);
  const data = (await postJson(`${base}/api/token`, {
    app_id: cfg.appId,
    app_secret: cfg.appSecret,
  })) as { status_code: number; status_description: string; data?: { token: string; is_3d: number; expires_at: string } };

  if (data.status_code !== 100 || !data.data) {
    throw new Error(`halkode_token_failed: ${data.status_description}`);
  }
  return {
    token: data.data.token,
    is3d: data.data.is_3d,
    expiresAt: data.data.expires_at,
  };
}

/** Ödeme başlat — banka hosted 3D sayfası için redirect/html döner */
export async function initiateHalkodePayment(
  cfg: HalkodeConfig,
  params: HalkodePaymentParams,
): Promise<HalkodePayResponse> {
  const { token } = await getHalkodeToken(cfg);
  const base = apiBase(cfg);

  const amountStr = params.amount.toFixed(2);
  const items = params.items ?? [{ name: 'Ödeme', price: amountStr, quantity: 1 }];

  const body: Record<string, unknown> = {
    invoice_id: params.invoiceId,
    amount: amountStr,
    total: amountStr,
    currency_code: 'TRY',
    merchant_key: cfg.merchantKey,
    ok_url: params.okUrl,
    fail_url: params.failUrl,
    installments_number: 1,
    pos_id: cfg.posId,
    items,
    lang: params.lang ?? 'tr',
  };

  // Kart bilgileri gönderilirse ekle (hosted form'da gönderilmez)
  if (params.ccHolderName) body['cc_holder_name'] = params.ccHolderName;
  if (params.ccNo) body['cc_no'] = params.ccNo;
  if (params.expMonth) body['expiry_month'] = params.expMonth;
  if (params.expYear) body['expiry_year'] = params.expYear.length === 4 ? params.expYear.slice(-2) : params.expYear;
  if (params.cvv) body['cvv'] = params.cvv;

  const raw = (await postJson(`${base}/api/pay`, body, token)) as Record<string, unknown>;

  // DEBUG — kaldır production'da
  console.warn('[HALKODE_DEBUG] pay response:', JSON.stringify(raw));

  if (raw['status_code'] !== undefined && (raw['status_code'] as number) !== 100) {
    throw new Error(`halkode_pay_failed: ${raw['status_description']}`);
  }

  const data = raw['data'] as Record<string, unknown> | undefined;

  return {
    redirectUrl: (data?.['redirect_url'] ?? data?.['url'] ?? data?.['payment_url']) as string | undefined,
    html: data?.['html'] as string | undefined,
    paymentId: (data?.['payment_id'] ?? data?.['id'] ?? data?.['invoice_id']) as string | undefined,
    raw,
  };
}

// ── Callback Verification ──────────────────────────────────────────────────

/** Halk Öde callback imzasını doğrula */
export function verifyHalkodeCallback(
  body: Record<string, string>,
  merchantKey: string,
): boolean {
  // Halk Öde CcPayment: HASHPARAMS tabanlı doğrulama (NestPay benzeri)
  const hashParamsStr = body['HASHPARAMS'] ?? body['hash_params'] ?? '';
  const receivedHash = body['HASH'] ?? body['hash'] ?? '';

  if (!hashParamsStr || !receivedHash) {
    // hash parametresi yoksa sadece status kontrolü yap
    return true;
  }

  const { createHash } = require('crypto') as typeof import('crypto');
  const keys = hashParamsStr.split(':').filter(Boolean);
  const data = keys.map((k) => body[k] ?? '').join('') + merchantKey;
  const computed = createHash('sha1').update(data, 'utf8').digest('base64');
  return computed === receivedHash;
}

/** Ödeme onaylı mı? */
export function isHalkodePaymentApproved(body: Record<string, string>): boolean {
  const status = body['status'] ?? body['payment_status'] ?? '';
  const procCode = body['ProcReturnCode'] ?? '';
  const response = body['Response'] ?? '';

  // CcPayment callback
  if (status === 'success' || status === '1') return true;
  // NestPay uyumluluk
  if (procCode === '00' || response === 'Approved') return true;

  return false;
}

export function getHalkodeOrderId(body: Record<string, string>): string {
  return body['invoice_id'] ?? body['oid'] ?? body['order_id'] ?? '';
}
