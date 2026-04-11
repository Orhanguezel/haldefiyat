// src/modules/wallet/iyzico.ts
// İyzico Checkout Form entegrasyonu (SDK: `iyzico-sdk` → kayıt adı `iyzipay`).
// Marketplace modu destekler (subMerchantKey/subMerchantPrice).

import Iyzico from "./iyzico-sdk";
import { env } from '../../core/env';

// ── Singleton İyzico client ─────────────────────────────────────────────────

let _instance: InstanceType<typeof Iyzico> | null = null;

function getIyzicoClient(): InstanceType<typeof Iyzico> {
  if (!_instance) {
    _instance = new Iyzico({
      apiKey: env.IYZICO_API_KEY,
      secretKey: env.IYZICO_SECRET_KEY,
      uri: env.IYZICO_BASE_URL,
    });
  }
  return _instance;
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IyzicoBuyer {
  id: string;
  name: string;
  surname: string;
  email: string;
  identityNumber: string;
  registrationAddress: string;
  city: string;
  country: string;
  ip?: string;
}

export interface IyzicoAddress {
  contactName: string;
  city: string;
  country: string;
  address: string;
}

export interface IyzicoBasketItem {
  id: string;
  name: string;
  category1: string;
  itemType: "VIRTUAL" | "PHYSICAL";
  price: string;
  subMerchantKey?: string;
  subMerchantPrice?: string;
}

export interface CheckoutFormInitRequest {
  locale: string;
  conversationId: string;
  price: string;
  paidPrice: string;
  currency: string;
  basketId: string;
  paymentGroup: string;
  callbackUrl: string;
  enabledInstallments: number[];
  buyer: IyzicoBuyer;
  shippingAddress: IyzicoAddress;
  billingAddress: IyzicoAddress;
  basketItems: IyzicoBasketItem[];
}

export interface CheckoutFormInitResponse {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  conversationId?: string;
  token?: string;
  tokenExpireTime?: number;
  checkoutFormContent?: string;
}

export interface CheckoutFormDetailResponse {
  status: string;
  errorCode?: string;
  errorMessage?: string;
  paymentId?: string;
  paymentStatus?: string;
  price?: string;
  paidPrice?: string;
  currency?: string;
  basketId?: string;
  conversationId?: string;
  fraudStatus?: number;
}

// ── Public API ────────────────────────────────────────────────────────────────

function promisify<T>(fn: (req: unknown, cb: (err: Error | null, result: unknown) => void) => void, req: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(req, (err, result) => {
      if (err) return reject(err);
      resolve(result as T);
    });
  });
}

export async function createCheckoutForm(req: CheckoutFormInitRequest): Promise<CheckoutFormInitResponse> {
  const client = getIyzicoClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return promisify<CheckoutFormInitResponse>(
    (client.checkoutFormInitialize.create as any).bind(client.checkoutFormInitialize),
    req,
  );
}

export async function retrieveCheckoutForm(token: string, conversationId: string): Promise<CheckoutFormDetailResponse> {
  const client = getIyzicoClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iyzico = client.checkoutFormInitialize as any;
  return promisify<CheckoutFormDetailResponse>(
    iyzico.retrieve.bind(iyzico),
    { locale: "tr", conversationId, token },
  );
}
