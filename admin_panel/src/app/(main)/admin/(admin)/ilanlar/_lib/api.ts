import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';
import type { EditForm, Listing } from './types';

export const MAX_IMAGES = 6;
const UPLOAD_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

export function imageSrc(url: string) {
  return /^https?:\/\//.test(url) ? url : `${UPLOAD_ORIGIN}${url}`;
}

export async function api(path: string, init: RequestInit = {}) {
  const token = tokenStore.get();
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
}

export async function uploadListingImage(file: File): Promise<string | null> {
  const token = tokenStore.get();
  const body = new FormData();
  body.append('file', file);
  const res = await fetch(`${BASE_URL}/storage/listings/upload`, {
    method: 'POST',
    credentials: 'include',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string };
  return res.ok && json.url ? json.url : null;
}

export function toEditForm(item: Listing): EditForm {
  return {
    title: item.title ?? '',
    validUntil: (item.validUntil ?? '').slice(0, 10),
    contactPhone: item.contactPhone ?? '',
    quantity: item.quantity == null ? '' : String(item.quantity),
    quantityUnit: item.quantityUnit ?? 'kg',
    priceType: item.priceType ?? 'sabit',
    priceMin: item.priceMin == null ? '' : String(item.priceMin),
    priceMax: item.priceMax == null ? '' : String(item.priceMax),
    description: item.description ?? '',
  };
}

export const PRICE_TYPE_OPTIONS = [
  { value: 'sabit', label: 'Sabit fiyat' },
  { value: 'pazarlik', label: 'Pazarlık' },
  { value: 'hal_endeksli', label: 'Hal endeksli' },
] as const;

export const PKG_LABEL: Record<'daily' | 'weekly' | 'monthly', string> = {
  daily: 'Günlük', weekly: 'Haftalık', monthly: 'Aylık',
};

export const STATUS_LABEL: Record<string, string> = {
  pending: 'Bekleyen', approved: 'Onaylı', rejected: 'Reddedilen',
  expired: 'Süresi doldu', closed: 'Kapalı', all: 'Tümü',
};

export const TYPE_LABEL: Record<string, string> = { satis: 'Satış', alim: 'Alım' };

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function daysLeft(value?: string | null) {
  if (!value) return null;
  const target = new Date(`${value.slice(0, 10)}T23:59:59`).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / 86400000);
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('tr-TR').format(value);
}
