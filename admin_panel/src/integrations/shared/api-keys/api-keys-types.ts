import { extractArray, toInt, toIso, toStr } from '@/integrations/shared/common';

export const API_KEYS_ADMIN_BASE = 'admin/api-keys';
export const API_KEY_TIERS = ['free', 'pro'] as const;

export type ApiKeyTier = (typeof API_KEY_TIERS)[number];

export type AdminApiKeyDto = {
  id: number;
  userId: string;
  userEmail: string;
  userFullName: string;
  keyPrefix: string;
  name: string;
  tier: ApiKeyTier;
  dailyLimit: number;
  usedToday: number;
  lastUsedAt: string | null;
  createdAt: string | null;
  revoked: boolean;
};

export type AdminApiKeysResponse = {
  items: AdminApiKeyDto[];
};

export type AdminSetApiKeyTierInput = {
  id: number;
  tier: ApiKeyTier;
};

export type AdminSetApiKeyTierResponse = {
  ok: boolean;
};

function normalizeTier(value: unknown): ApiKeyTier {
  return value === 'pro' ? 'pro' : 'free';
}

export function normalizeAdminApiKey(raw: unknown): AdminApiKeyDto {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: toInt(row.id),
    userId: toStr(row.userId ?? row.user_id),
    userEmail: toStr(row.userEmail ?? row.user_email),
    userFullName: toStr(row.userFullName ?? row.user_full_name),
    keyPrefix: toStr(row.keyPrefix ?? row.key_prefix),
    name: toStr(row.name),
    tier: normalizeTier(row.tier),
    dailyLimit: toInt(row.dailyLimit ?? row.daily_limit),
    usedToday: toInt(row.usedToday ?? row.used_today),
    lastUsedAt: toIso(row.lastUsedAt ?? row.last_used_at),
    createdAt: toIso(row.createdAt ?? row.created_at),
    revoked: Boolean(row.revoked),
  };
}

export function normalizeAdminApiKeysResponse(raw: unknown): AdminApiKeysResponse {
  return {
    items: extractArray(raw).map(normalizeAdminApiKey),
  };
}

export function formatApiKeyDate(value: string | null): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatApiKeyUsage(key: Pick<AdminApiKeyDto, 'usedToday' | 'dailyLimit'>): string {
  return `${key.usedToday.toLocaleString('tr-TR')} / ${key.dailyLimit.toLocaleString('tr-TR')}`;
}
