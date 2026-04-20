import "dotenv/config";

function parseEnvInt(v: string | undefined, fallback: number): number {
  const n = parseInt(v ?? "", 10);
  return Number.isNaN(n) ? fallback : n;
}

function parseEnvList(v: string | undefined): string[] {
  if (!v) return [];
  return v.split(",").map((s) => s.trim()).filter(Boolean);
}

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3033";
const CORS_LIST = parseEnvList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

const RAW_STORAGE = (process.env.STORAGE_DRIVER || "local").toLowerCase();
const STORAGE_DRIVER = (RAW_STORAGE === "cloudinary" ? "cloudinary" : "local") as "local" | "cloudinary";

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseEnvInt(process.env.PORT, 8088),
  SENTRY_DSN: process.env.SENTRY_DSN || "",

  STORAGE_DRIVER,
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || "",
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || "/uploads",
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || "",
  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "",

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || "uploads",
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "uploads",
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || "",
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || "",
  },

  DB: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseEnvInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASSWORD || "app",
    name: process.env.DB_NAME || "hal_fiyatlari",
  },

  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "cookie-secret",

  CORS_ORIGIN,

  PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:8088",
  FRONTEND_URL,

  REDIS_URL: process.env.REDIS_URL || "",
  BULLMQ_CONNECTION: process.env.BULLMQ_CONNECTION || "",

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || "",
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseEnvInt(process.env.SMTP_PORT, 587),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "noreply@haldefiyat.com",

  ETL: {
    cronSchedule: process.env.ETL_CRON_SCHEDULE || "15 3 * * *",
    cronTimezone: process.env.ETL_CRON_TIMEZONE || "UTC",
    alertsSchedule: process.env.ALERTS_CRON_SCHEDULE || "30 3 * * *",
    maxDateFallbackDays: parseEnvInt(process.env.ETL_MAX_DATE_FALLBACK_DAYS, 7),
    autoRegisterProducts: (process.env.ETL_AUTO_REGISTER_PRODUCTS ?? "true").toLowerCase() === "true",
    requestTimeoutMs: parseEnvInt(process.env.ETL_REQUEST_TIMEOUT_MS, 30_000),
  },
};
