export interface ZiraatPayConfig {
  merchant: string;
  merchantUser: string;
  merchantPassword: string;
  baseUrl: string;
}

export interface ZiraatPaySaleResponse {
  ResponseCode?: string;
  ResponseMessage?: string;
  HTML?: string;
  RedirectURL?: string;
  OrderID?: string;
  TransactionId?: string;
}

export interface ZiraatPayStatusResponse {
  ResponseCode?: string;
  ResponseMessage?: string;
  OrderID?: string;
  Amount?: string;
  Currency?: string;
  TransactionState?: string;
}

export async function ziraatPayInit3D(
  config: ZiraatPayConfig,
  params: {
    orderId: string;
    amount: number;
    okUrl: string;
    failUrl: string;
    locale?: string;
    buyerIp?: string;
    installment?: number;
  },
): Promise<ZiraatPaySaleResponse> {
  const body = new URLSearchParams({
    ACTION: 'SALE3D',
    MERCHANT: config.merchant,
    MERCHANTUSER: config.merchantUser,
    MERCHANTPASSWORD: config.merchantPassword,
    AMOUNT: String(Math.round(params.amount * 100)),
    CURRENCY: '949',
    ORDERID: params.orderId,
    OKURL: params.okUrl,
    FAILURL: params.failUrl,
    TAKSIT: String(Math.max(1, params.installment ?? 1)),
    RETURNTYPE: 'HTML',
    IPADDRESS: params.buyerIp ?? '0.0.0.0',
    LANGUAGE: (params.locale ?? 'tr').toUpperCase() === 'EN' ? 'EN' : 'TR',
  });

  const res = await fetch(config.baseUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ziraatpay_http_${res.status}: ${text}`);
  }

  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return res.json() as Promise<ZiraatPaySaleResponse>;
  }

  const html = await res.text();
  return { ResponseCode: '00', HTML: html };
}

export async function ziraatPayQueryOrder(
  config: ZiraatPayConfig,
  orderId: string,
): Promise<ZiraatPayStatusResponse> {
  const body = new URLSearchParams({
    ACTION: 'STATUS',
    MERCHANT: config.merchant,
    MERCHANTUSER: config.merchantUser,
    MERCHANTPASSWORD: config.merchantPassword,
    ORDERID: orderId,
  });

  const res = await fetch(config.baseUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ziraatpay_status_http_${res.status}: ${text}`);
  }

  return res.json() as Promise<ZiraatPayStatusResponse>;
}
