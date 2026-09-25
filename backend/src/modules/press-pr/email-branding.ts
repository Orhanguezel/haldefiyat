import { randomUUID } from "node:crypto";

import { pool } from "@/db/client";
import { getGlobalSettingValue } from "@agro/shared-backend/modules/siteSettings";

export const PRESS_EMAIL_BRANDING_KEY = "press_email_branding";

export type PressEmailBranding = {
  logoUrl: string;
  logoAlt: string;
  tagline: string;
  signatureName: string;
  signatureTitle: string;
  email: string;
  website: string;
  accentColor: string;
};

export const DEFAULT_PRESS_EMAIL_BRANDING: PressEmailBranding = {
  logoUrl: "https://haldefiyat.com/logohaldefiyat_light.png",
  logoAlt: "HaldeFiyat",
  tagline: "Türkiye hal fiyatları ve tarım verileri",
  signatureName: "HaldeFiyat Veri Ekibi",
  signatureTitle: "Basın ve veri iletişimi",
  email: "info@gzlteknoloji.com",
  website: "https://haldefiyat.com",
  accentColor: "#f97316",
};

function text(value: unknown, fallback: string, max: number): string {
  const clean = String(value ?? "").trim().slice(0, max);
  return clean || fallback;
}

function httpsUrl(value: unknown, fallback: string): string {
  const clean = String(value ?? "").trim();
  try {
    const url = new URL(clean);
    return url.protocol === "https:" ? url.toString() : fallback;
  } catch { return fallback; }
}

export function normalizePressEmailBranding(value: unknown): PressEmailBranding {
  let input: Record<string, unknown> = {};
  if (value && typeof value === "object" && !Array.isArray(value)) input = value as Record<string, unknown>;
  else if (typeof value === "string") {
    try { input = JSON.parse(value) as Record<string, unknown>; } catch { input = {}; }
  }
  const emailRaw = String(input.email ?? "").trim().toLowerCase();
  return {
    logoUrl: httpsUrl(input.logoUrl, DEFAULT_PRESS_EMAIL_BRANDING.logoUrl),
    logoAlt: text(input.logoAlt, DEFAULT_PRESS_EMAIL_BRANDING.logoAlt, 120),
    tagline: text(input.tagline, DEFAULT_PRESS_EMAIL_BRANDING.tagline, 240),
    signatureName: text(input.signatureName, DEFAULT_PRESS_EMAIL_BRANDING.signatureName, 160),
    signatureTitle: text(input.signatureTitle, DEFAULT_PRESS_EMAIL_BRANDING.signatureTitle, 240),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw) ? emailRaw : DEFAULT_PRESS_EMAIL_BRANDING.email,
    website: httpsUrl(input.website, DEFAULT_PRESS_EMAIL_BRANDING.website).replace(/\/$/, ""),
    accentColor: /^#[0-9a-f]{6}$/i.test(String(input.accentColor ?? "")) ? String(input.accentColor).toLowerCase() : DEFAULT_PRESS_EMAIL_BRANDING.accentColor,
  };
}

export async function loadPressEmailBranding(): Promise<PressEmailBranding> {
  return normalizePressEmailBranding(await getGlobalSettingValue(PRESS_EMAIL_BRANDING_KEY));
}

export async function savePressEmailBranding(value: unknown): Promise<PressEmailBranding> {
  const branding = normalizePressEmailBranding(value);
  await pool.execute(
    `INSERT INTO site_settings (id,\`key\`,locale,value,created_at,updated_at)
     VALUES (?,?, '*',?,NOW(3),NOW(3))
     ON DUPLICATE KEY UPDATE value=VALUES(value),updated_at=NOW(3)`,
    [randomUUID(), PRESS_EMAIL_BRANDING_KEY, JSON.stringify(branding)],
  );
  return branding;
}
