/**
 * Google Search Console snapshot collector.
 *
 * Usage:
 *   bun scripts/seo/gsc-snapshot.ts --dry-run
 *   bun scripts/seo/gsc-snapshot.ts --apply --inspect --limit=100
 *
 * Env:
 *   GSC_SITE_URL=https://haldefiyat.com/
 *   GOOGLE_SERVICE_ACCOUNT_JSON='{"client_email":"...","private_key":"..."}'
 *   or GOOGLE_APPLICATION_CREDENTIALS=/path/service-account.json
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { createSign } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { db, pool } from "../../src/db/client";
import { hfProducts, hfSeoSnapshots } from "../../src/db/schema";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};
type SearchRow = {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
};

const rawArgs = process.argv.slice(2);
const shouldApply = rawArgs.includes("--apply");
const shouldInspect = rawArgs.includes("--inspect");
const limit = Number(readArg("--limit=", "250"));
const snapshotDate = readArg("--date=", new Date().toISOString().slice(0, 10));
const siteUrl = (process.env.GSC_SITE_URL ?? "https://haldefiyat.com/").replace(/\/?$/, "/");

if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
  console.log(`Usage:
  bun scripts/seo/gsc-snapshot.ts [--dry-run] [--apply] [--inspect]
    --limit=250
    --date=YYYY-MM-DD

Requires GSC_SITE_URL and service account credentials for --apply.
`);
  process.exit(0);
}

function readArg(prefix: string, fallback: string): string {
  return rawArgs.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function readServiceAccount(): ServiceAccount {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path && existsSync(path)) {
    return JSON.parse(readFileSync(path, "utf8")) as ServiceAccount;
  }
  throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON veya GOOGLE_APPLICATION_CREDENTIALS gerekli");
}

async function getAccessToken() {
  const account = readServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: account.token_uri ?? "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  const signature = base64url(signer.sign(account.private_key.replace(/\\n/g, "\n")));
  const assertion = `${unsigned}.${signature}`;

  const res = await fetch(claim.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`OAuth token error ${res.status}: ${await res.text()}`);
  const json = await res.json() as { access_token?: string };
  if (!json.access_token) throw new Error("OAuth response access_token icermiyor");
  return json.access_token;
}

function dateMinus(days: number) {
  const d = new Date(`${snapshotDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

async function fetchSearchAnalytics(token: string): Promise<SearchRow[]> {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        startDate: dateMinus(28),
        endDate: dateMinus(1),
        dimensions: ["page"],
        rowLimit: Math.min(25_000, Math.max(1, limit)),
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!res.ok) throw new Error(`Search Analytics ${res.status}: ${await res.text()}`);
  const json = await res.json() as { rows?: SearchRow[] };
  return json.rows ?? [];
}

async function inspectUrl(token: string, inspectionUrl: string) {
  const res = await fetch("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inspectionUrl, siteUrl }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`URL Inspection ${inspectionUrl} ${res.status}: ${await res.text()}`);
  const json = await res.json() as {
    inspectionResult?: {
      indexStatusResult?: {
        coverageState?: string;
        lastCrawlTime?: string;
        googleCanonical?: string;
        userCanonical?: string;
      };
    };
  };
  return json.inspectionResult?.indexStatusResult ?? {};
}

async function productUrls() {
  const rows = await db.select({ slug: hfProducts.slug })
    .from(hfProducts)
    .where(eq(hfProducts.seoIndex, 1))
    .limit(Math.min(1000, Math.max(1, limit)));
  return rows.map((row) => `${siteUrl}urun/${row.slug}`);
}

async function main() {
  const urls = await productUrls();
  console.log(`[gsc-snapshot] date=${snapshotDate} site=${siteUrl} product_urls=${urls.length} apply=${shouldApply} inspect=${shouldInspect}`);
  if (!shouldApply) {
    console.log(urls.slice(0, 20).join("\n"));
    console.log("[gsc-snapshot] DB'ye yazmak ve GSC API cagirmak icin --apply kullan.");
    return;
  }

  const token = await getAccessToken();
  const searchRows = await fetchSearchAnalytics(token);
  const searchMap = new Map(searchRows.map((row) => [row.keys?.[0] ?? "", row]));

  for (const url of urls) {
    const performance = searchMap.get(url);
    const inspection = shouldInspect ? await inspectUrl(token, url) : {};
    const lastCrawled = inspection.lastCrawlTime
      ? new Date(inspection.lastCrawlTime)
      : null;
    await db.insert(hfSeoSnapshots).values({
      snapshotDate: new Date(`${snapshotDate}T12:00:00Z`),
      url,
      coverageState: inspection.coverageState ?? null,
      lastCrawled,
      googleCanonical: inspection.googleCanonical ?? null,
      userCanonical: inspection.userCanonical ?? null,
      clicks28d: Math.round(performance?.clicks ?? 0),
      impressions28d: Math.round(performance?.impressions ?? 0),
      positionAvg: performance?.position == null ? null : String(performance.position.toFixed(2)),
      ctrPct: performance?.ctr == null ? null : String((performance.ctr * 100).toFixed(2)),
    }).onDuplicateKeyUpdate({
      set: {
        coverageState: inspection.coverageState ?? null,
        lastCrawled,
        googleCanonical: inspection.googleCanonical ?? null,
        userCanonical: inspection.userCanonical ?? null,
        clicks28d: Math.round(performance?.clicks ?? 0),
        impressions28d: Math.round(performance?.impressions ?? 0),
        positionAvg: performance?.position == null ? null : String(performance.position.toFixed(2)),
        ctrPct: performance?.ctr == null ? null : String((performance.ctr * 100).toFixed(2)),
      },
    });
    console.log(`[gsc-snapshot] upsert ${url}`);
  }
}

main()
  .catch((err) => {
    console.error("[gsc-snapshot] Fatal:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
