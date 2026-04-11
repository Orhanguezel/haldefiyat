import Iyzico from 'iyzipay';

export interface IyzicoConfig {
  apiKey: string;
  secretKey: string;
  uri: string;
}

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
  itemType: 'VIRTUAL' | 'PHYSICAL';
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

function createIyzicoClient(config: IyzicoConfig): any {
  return new Iyzico({
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    uri: config.uri,
  });
}

function promisify<T>(
  fn: (req: unknown, cb: (err: Error | null, result: unknown) => void) => void,
  req: unknown,
): Promise<T> {
  return new Promise((resolve, reject) => {
    fn(req, (err, result) => {
      if (err) return reject(err);
      resolve(result as T);
    });
  });
}

export async function createCheckoutForm(
  config: IyzicoConfig,
  req: CheckoutFormInitRequest,
): Promise<CheckoutFormInitResponse> {
  const client = createIyzicoClient(config);
  return promisify<CheckoutFormInitResponse>(
    client.checkoutFormInitialize.create.bind(client.checkoutFormInitialize),
    req,
  );
}

export async function retrieveCheckoutForm(
  config: IyzicoConfig,
  token: string,
  conversationId: string,
): Promise<CheckoutFormDetailResponse> {
  const client = createIyzicoClient(config);
  return promisify<CheckoutFormDetailResponse>(
    client.checkoutForm.retrieve.bind(client.checkoutForm),
    { locale: 'tr', conversationId, token },
  );
}
