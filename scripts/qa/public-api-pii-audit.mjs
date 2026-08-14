#!/usr/bin/env node

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const origin = new URL(process.argv[2] ?? "https://haldefiyat.com").origin;
const outputPath = process.argv[3] ?? "artifacts/renewal-2026/public-api-pii-audit.json";
const routes = [
  { path: "/api/v1/listings?limit=100", policy: "listing" },
  { path: "/api/v1/prices?limit=100", policy: "generic" },
  { path: "/api/v1/prices/products?seoIndex=true", policy: "generic" },
  { path: "/api/v1/prices/markets?seoIndex=true", policy: "publicBusiness" },
];

const SECRET_KEY = /(?:password|secret|authorization|cookie|access_?token|refresh_?token|jwt|otp|visitor_?hash|ip_?address)/i;
const LISTING_PRIVATE_KEY = /^(?:contactName|contactPhone|raw|ownerId|userId|createdBy|sellerPhone|sellerEmail)$/i;
const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const TR_MOBILE = /(?:\+?90|0)?\s*5\d{2}(?:[\s().-]*\d){7}\b/;

function walk(value, visit, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visit, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    visit(key, child, childPath);
    walk(child, visit, childPath);
  }
}

function inspect(body, policy) {
  const findings = [];
  walk(body, (key, value, path) => {
    if (SECRET_KEY.test(key) && value != null && value !== "") {
      findings.push({ path, reason: "secret-key-non-null" });
    }
    if (policy === "listing" && LISTING_PRIVATE_KEY.test(key) && value != null && value !== "") {
      findings.push({ path, reason: "private-listing-field-non-null" });
    }
    if (policy !== "publicBusiness" && typeof value === "string" && (EMAIL.test(value) || TR_MOBILE.test(value))) {
      findings.push({ path, reason: "contact-pattern-in-public-value" });
    }
  });
  return findings;
}

const snapshots = [];
for (const route of routes) {
  const started = Date.now();
  const response = await fetch(`${origin}${route.path}`, {
    headers: { accept: "application/json", "user-agent": "HalDeFiyat-PII-Audit/1.0" },
    signal: AbortSignal.timeout(20_000),
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = null;
  }
  const findings = body == null ? [{ path: "$", reason: "invalid-json" }] : inspect(body, route.policy);
  snapshots.push({
    path: route.path,
    policy: route.policy,
    status: response.status,
    bytes: Buffer.byteLength(text),
    durationMs: Date.now() - started,
    findings,
  });
}

const report = {
  generatedAt: new Date().toISOString(),
  origin,
  passed: snapshots.every((snapshot) => snapshot.status === 200 && snapshot.findings.length === 0),
  snapshots,
};
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
