import type { ReactNode } from 'react';

export type AdminImageUploadFieldProps = {
  label?: string;
  helperText?: ReactNode;
  bucket?: string;
  folder?: string;
  metadata?: Record<string, string | number | boolean>;
  value?: string;
  onChange?: (url: string) => void;
  onSelectAsset?: (selection: { url: string; assetId: string | null }) => void;
  values?: string[];
  onChangeMultiple?: (urls: string[]) => void;
  onSelectAsCover?: (url: string) => void;
  coverValue?: string;
  disabled?: boolean;
  openLibraryHref?: string;
  onOpenLibraryClick?: () => void;
  multiple?: boolean;
  previewAspect?: '16x9' | '4x3' | '1x1';
  previewObjectFit?: 'cover' | 'contain';
};

export const ADMIN_IMAGE_LIBRARY_PAGE_SIZE = 24;

export function normalizeUploadValue(v: unknown): string {
  return String(v ?? '').trim();
}

export function isSvgUploadUrl(raw: string | undefined | null): boolean {
  const value = normalizeUploadValue(raw);
  if (!value) return false;

  const lower = value.toLowerCase();
  const base = lower.split('?')[0].split('#')[0];

  if (base.endsWith('.svg')) return true;
  if (lower.startsWith('data:image/svg+xml')) return true;
  if (lower.includes('format=svg') || lower.includes('f_svg')) return true;

  return false;
}

export function sanitizeCloudinarySvgUrl(raw: string): string {
  const value = normalizeUploadValue(raw);
  if (!value || !isSvgUploadUrl(value)) return value;
  if (value.startsWith('data:image/svg+xml')) return value;
  if (!value.includes('res.cloudinary.com')) return value;
  if (value.includes('/raw/upload/')) return value;
  if (value.includes('fl_sanitize')) return value;

  const marker = '/upload/';
  const idx = value.indexOf(marker);
  if (idx < 0) return value;

  const before = value.slice(0, idx + marker.length);
  const after = value.slice(idx + marker.length);
  const firstSeg = after.split('/')[0] || '';
  const rest = after.slice(firstSeg.length);

  if (firstSeg.startsWith('v')) {
    return `${before}fl_sanitize/${after}`;
  }

  return `${before}${firstSeg},fl_sanitize${rest}`;
}

export function toUploadMetadata(
  metadata?: Record<string, string | number | boolean>,
): Record<string, string> | undefined {
  if (!metadata) return undefined;
  return Object.fromEntries(Object.entries(metadata).map(([key, value]) => [key, String(value)]));
}

export function appendUniqueUploadUrls(existing: string[], incoming: string[]): string[] {
  const seen = new Set(existing.map(normalizeUploadValue));
  const next = [...existing];

  for (const item of incoming) {
    const value = normalizeUploadValue(item);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    next.push(value);
  }

  return next;
}

export function getDisplayUploadUrl(raw: string, max = 72): string {
  const value = normalizeUploadValue(raw);
  if (!value) return '';
  if (value.length <= max) return value;

  try {
    const url = new URL(value);
    const host = url.host;
    const path = url.pathname || '';
    const last = path.split('/').filter(Boolean).pop() || '';
    const shortValue = `${host}/…/${last}`;
    if (shortValue.length <= max) return shortValue;
  } catch {
    // ignore
  }

  const head = value.slice(0, Math.max(18, Math.floor(max * 0.55)));
  const tail = value.slice(-Math.max(12, Math.floor(max * 0.25)));
  return `${head}…${tail}`;
}

export function getUploadPreviewRatio(aspect: '16x9' | '4x3' | '1x1'): number {
  if (aspect === '4x3') return 4 / 3;
  if (aspect === '1x1') return 1;
  return 16 / 9;
}
