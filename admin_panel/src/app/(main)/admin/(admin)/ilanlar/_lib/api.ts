import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';
import type { EditForm, Listing } from './types';

export const MAX_IMAGES = 6;
const UPLOAD_ORIGIN = BASE_URL.replace(/\/api\/v1\/?$/, '');

export function imageSrc(url: string) {
  return /^https?:\/\//.test(url) ? url : `${UPLOAD_ORIGIN}${url}`;
}

let refreshPromise: Promise<boolean> | null = null;

async function renewSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const res = await fetch(`${BASE_URL}/auth/token/refresh`, {
        method: 'POST', credentials: 'include', headers: { Accept: 'application/json' },
      });
      if (!res.ok) return false;
      const json = await res.json() as { access_token?: string };
      if (!json.access_token) return false;
      tokenStore.set(json.access_token);
      return true;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

export async function api(path: string, init: RequestInit = {}) {
  const originalToken = tokenStore.get();
  const send = () => {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const token = tokenStore.get();
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(`${BASE_URL}${path}`, { ...init, credentials: 'include', headers });
  };
  let res = await send();
  if (res.status === 401) {
    const token = tokenStore.get();
    if ((token && token !== originalToken) || await renewSession()) res = await send();
  }
  return res;
}

export async function uploadListingImage(file: File): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('JPG, PNG veya WebP biçiminde bir görsel seçin.');
  }
  if (file.size > 5 * 1024 * 1024) throw new Error('Görsel en fazla 5 MB olabilir.');
  const body = new FormData();
  body.append('file', file);
  const res = await api('/storage/listings/upload', { method: 'POST', body });
  const json = (await res.json().catch(() => ({}))) as { url?: string };
  if (res.status === 401) throw new Error('Oturumunuz sona erdi. Yeniden giriş yapıp görseli tekrar yükleyin.');
  if (res.status === 413) throw new Error('Görsel sunucunun boyut sınırını aşıyor. Daha küçük bir dosya seçin.');
  if (!res.ok || !json.url) throw new Error('Görsel yüklenemedi. Lütfen tekrar deneyin.');
  return json.url;
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

export const PRICE_TYPES = ['sabit', 'pazarlik', 'hal_endeksli'] as const;
export const PACKAGES = ['daily', 'weekly', 'monthly'] as const;
export const STATUSES = ['pending', 'approved', 'rejected', 'all'] as const;

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
