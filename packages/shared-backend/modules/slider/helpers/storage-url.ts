// src/modules/slider/helpers/storage-url.ts
import { getStorageSettings } from '@agro/shared-backend/modules/siteSettings/service';

export type StorageBases = {
  cdnPublicBase?: string | null;
  publicApiBase?: string | null;
};

function encSeg(s: string) {
  return encodeURIComponent(s);
}

export function publicUrlOf(
  bucket?: string | null,
  path?: string | null,
  providerUrl?: string | null,
  bases?: StorageBases,
): string | null {
  if (providerUrl) return providerUrl;
  if (!bucket || !path) return null;

  const encPath = path
    .split('/')
    .map((segment) => encSeg(segment))
    .join('/');

  const cdnBase = (bases?.cdnPublicBase || '').replace(/\/+$/, '');
  const apiBase = (bases?.publicApiBase || '').replace(/\/+$/, '');

  if (cdnBase) return `${cdnBase}/${encSeg(bucket)}/${encPath}`;
  if (apiBase) return `${apiBase}/storage/${encSeg(bucket)}/${encPath}`;

  return `/storage/${encSeg(bucket)}/${encPath}`;
}

export async function getBases(): Promise<StorageBases> {
  const storage = await getStorageSettings();
  return {
    cdnPublicBase: storage.cdnPublicBase,
    publicApiBase: storage.publicApiBase,
  };
}
