/**
 * Twitter OAuth 1.0a HMAC-SHA1 imza üretici.
 * https://developer.twitter.com/en/docs/authentication/oauth-1-0a/authorizing-a-request
 *
 * Tweet POST için gereken Authorization header'ını oluşturur.
 * Bağımlılıksız (node:crypto kullanır).
 */

import { createHmac, randomBytes } from "crypto";

export interface OAuth1Creds {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
}

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(/[!*'()]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/**
 * Twitter API v2 POST /2/tweets çağrısı için Authorization header.
 * NOT: v2 tweet endpoint'i body JSON, OAuth signature query/body değil
 * sadece oauth_* parametrelerinden hesaplanır.
 */
export function buildOAuth1Header(
  method: "GET" | "POST",
  url: string,
  creds: OAuth1Creds,
  bodyParams: Record<string, string> = {},
): string {
  const oauthParams: Record<string, string> = {
    oauth_consumer_key:     creds.apiKey,
    oauth_nonce:            randomBytes(16).toString("hex"),
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp:        Math.floor(Date.now() / 1000).toString(),
    oauth_token:            creds.accessToken,
    oauth_version:          "1.0",
  };

  // İmza için tüm parametreler (oauth_ + body params) alfabetik birleştirilir
  const allParams = { ...oauthParams, ...bodyParams };
  const paramString = Object.keys(allParams)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k]!)}`)
    .join("&");

  const baseString = [
    method,
    percentEncode(url),
    percentEncode(paramString),
  ].join("&");

  const signingKey = `${percentEncode(creds.apiSecret)}&${percentEncode(creds.accessTokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  oauthParams.oauth_signature = signature;

  return "OAuth " + Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k]!)}"`)
    .join(", ");
}
