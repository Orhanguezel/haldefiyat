// ===================================================================
// FILE: src/integrations/shared/google-connect.ts
// Panelden Google bağlan/yenile (rotasyon) tipleri
// ===================================================================

export const GOOGLE_CONNECT_ADMIN_BASE = '/admin/google-connect';

export type GoogleServiceKey = 'ads' | 'ga4' | 'gtm' | 'gsc';
export type GoogleServiceHealth = {
  ok: boolean;
  checked_at: string;
  error?: string;
};
export type GoogleConnectStatusResp = {
  connected: boolean;
  scopes: string[];
  services: Record<GoogleServiceKey, boolean>;
  health: Record<GoogleServiceKey, GoogleServiceHealth>;
  expires_in: number;
  connected_at: string;
};
export type GoogleAuthUrlResp = { url: string; redirect_uri: string; state: string; callback_uri: string };
export type GoogleExchangeResp = { ok: boolean; scopes: string[] };
export type GoogleExchangeArgs = { code: string; redirect_uri?: string; state?: string };
export type GoogleRedirectResp = { callback_uri: string; playground_uri: string };
export type GoogleDisconnectResp = { ok: boolean; revoked: boolean };
export type GoogleCredentialsArgs = { client_secret?: string; developer_token?: string };

export const GOOGLE_SERVICE_LABELS: Record<string, string> = {
  ads: 'Google Ads',
  ga4: 'GA4 Analytics',
  gtm: 'Tag Manager',
  gsc: 'Search Console',
};
