// src/core/env.ts
import "dotenv/config";
import { parseEnvBool, parseEnvInt, parseEnvList } from '../modules/_shared';

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const CORS_LIST = parseEnvList(process.env.CORS_ORIGIN);
const CORS_ORIGIN = CORS_LIST.length ? CORS_LIST : [FRONTEND_URL];

const RAW_STORAGE_DRIVER = (process.env.STORAGE_DRIVER || 'cloudinary').toLowerCase();
const STORAGE_DRIVER = (RAW_STORAGE_DRIVER === 'local' ? 'local' : 'cloudinary') as
  | 'local'
  | 'cloudinary';

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: parseEnvInt(process.env.PORT, 8083),
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  SITE_NAME: process.env.SITE_NAME || 'Corporate Site',

  // Redis
  REDIS_URL: process.env.REDIS_URL || '',
  REDIS_HOST: process.env.REDIS_HOST || '127.0.0.1',
  REDIS_PORT: parseEnvInt(process.env.REDIS_PORT, 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',

  // Storage
  STORAGE_DRIVER,
  LOCAL_STORAGE_ROOT: process.env.LOCAL_STORAGE_ROOT || '',
  LOCAL_STORAGE_BASE_URL: process.env.LOCAL_STORAGE_BASE_URL || '/uploads',
  STORAGE_CDN_PUBLIC_BASE: process.env.STORAGE_CDN_PUBLIC_BASE || '',
  STORAGE_PUBLIC_API_BASE: process.env.STORAGE_PUBLIC_API_BASE || '',
  CDN_PUBLIC_BASE: process.env.CDN_PUBLIC_BASE || "",
  PUBLIC_API_BASE: process.env.PUBLIC_API_BASE || "",

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_UNSIGNED_PRESET: process.env.CLOUDINARY_UNSIGNED_PRESET || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || '',
  CLOUDINARY_UPLOAD_PRESET: process.env.CLOUDINARY_UPLOAD_PRESET || '',
  CLOUDINARY_FOLDER: process.env.CLOUDINARY_FOLDER || '',
  CLOUDINARY_BASE_PUBLIC: process.env.CLOUDINARY_BASE_PUBLIC || '',
  CLOUDINARY: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'uploads',
    basePublic: process.env.CLOUDINARY_BASE_PUBLIC || '',
    publicStorageBase: process.env.PUBLIC_STORAGE_BASE || '',
  },

  // DB
  DB: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: parseEnvInt(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "app",
    password: process.env.DB_PASSWORD || "app",
    name: process.env.DB_NAME || "mydb",
  },

  // Auth
  JWT_SECRET: process.env.JWT_SECRET || "change-me",
  COOKIE_SECRET: process.env.COOKIE_SECRET || "cookie-secret",
  ALLOW_TEMP_LOGIN: process.env.ALLOW_TEMP_LOGIN || '',
  TEMP_PASSWORD: process.env.TEMP_PASSWORD || '',
  AUTH_ADMIN_EMAILS: process.env.AUTH_ADMIN_EMAILS || '',

  // CORS
  CORS_ORIGIN,

  // Google OAuth
  GOOGLE: {
    CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
    CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",

  // URLs
  PUBLIC_URL: process.env.PUBLIC_URL || "http://localhost:8083",
  FRONTEND_URL,
  FRONTEND_DEFAULT_LOCALE: process.env.FRONTEND_DEFAULT_LOCALE || 'tr',

  // Dealer catalog: projeye gore hangi product.item_type degerleri bayi kataloguna dahil edilecek.
  // Default 'product' — VistaSeed gibi tohum/ekipman projeleri icin. Bereketfide gibi fide projelerinde '.env' icinde 'bereketfide' olarak ayarlanmali.
  DEALER_CATALOG_ITEM_TYPES: (parseEnvList(process.env.DEALER_CATALOG_ITEM_TYPES).length
    ? parseEnvList(process.env.DEALER_CATALOG_ITEM_TYPES)
    : ['product']) as readonly string[],

  FEATURE_IYZICO_PAYMENT: parseEnvBool(process.env.FEATURE_IYZICO_PAYMENT, false),
  IYZICO_API_KEY: process.env.IYZICO_API_KEY || '',
  IYZICO_SECRET_KEY: process.env.IYZICO_SECRET_KEY || '',
  IYZICO_BASE_URL: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
  IYZICO_SUB_MERCHANT_KEY: process.env.IYZICO_SUB_MERCHANT_KEY || '',

  FEATURE_BANK_CARD_PAYMENT: parseEnvBool(process.env.FEATURE_BANK_CARD_PAYMENT, false),
  PAYMENT_PENDING_TIMEOUT_MINUTES: parseEnvInt(process.env.PAYMENT_PENDING_TIMEOUT_MINUTES, 30),
  PAYMENT_CLEANUP_INTERVAL_MS: parseEnvInt(process.env.PAYMENT_CLEANUP_INTERVAL_MS, 60000),
  PAYMENT_CARD_PROVIDER: process.env.PAYMENT_CARD_PROVIDER || 'craftgate',

  CRAFTGATE_API_KEY: process.env.CRAFTGATE_API_KEY || '',
  CRAFTGATE_SECRET_KEY: process.env.CRAFTGATE_SECRET_KEY || '',
  CRAFTGATE_BASE_URL: process.env.CRAFTGATE_BASE_URL || 'https://sandbox-api.craftgate.io',

  NESTPAY_ISBANK_MERCHANT_ID: process.env.NESTPAY_ISBANK_MERCHANT_ID || '',
  NESTPAY_ISBANK_API_USER: process.env.NESTPAY_ISBANK_API_USER || '',
  NESTPAY_ISBANK_API_PASS: process.env.NESTPAY_ISBANK_API_PASS || '',
  NESTPAY_ISBANK_STORE_KEY: process.env.NESTPAY_ISBANK_STORE_KEY || '',
  NESTPAY_ISBANK_API_URL: process.env.NESTPAY_ISBANK_API_URL || 'https://sanalpos.isbank.com.tr/fim/api',
  NESTPAY_ISBANK_3D_URL: process.env.NESTPAY_ISBANK_3D_URL || 'https://sanalpos.isbank.com.tr/fim/est3Dgate',

  HALKODE_APP_ID: process.env.HALKODE_APP_ID || process.env.HALKODE_API_USER || '',
  HALKODE_APP_SECRET: process.env.HALKODE_APP_SECRET || process.env.HALKODE_API_PASS || '',
  HALKODE_MERCHANT_KEY: process.env.HALKODE_MERCHANT_KEY || process.env.HALKODE_STORE_KEY || '',
  HALKODE_POS_ID: Number(process.env.HALKODE_POS_ID || '0'),
  HALKODE_API_BASE: process.env.HALKODE_API_BASE || 'https://app.halkode.com.tr/ccpayment',

  ZIRAATPAY_MERCHANT: process.env.ZIRAATPAY_MERCHANT || '',
  ZIRAATPAY_MERCHANT_USER: process.env.ZIRAATPAY_MERCHANT_USER || '',
  ZIRAATPAY_MERCHANT_PASSWORD: process.env.ZIRAATPAY_MERCHANT_PASSWORD || '',
  ZIRAATPAY_BASE_URL: process.env.ZIRAATPAY_BASE_URL || 'https://test.ziraatpay.com.tr/ziraatpay/api/v2',

  // AI (Groq)
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  GROQ_API_BASE: process.env.GROQ_API_BASE || 'https://api.groq.com/openai/v1',

  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || "",
  SMTP_PORT: parseEnvInt(process.env.SMTP_PORT, 465),
  SMTP_SECURE: parseEnvBool(process.env.SMTP_SECURE, false),
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  MAIL_FROM: process.env.MAIL_FROM || "",
} as const;

export type AppEnv = typeof env;
