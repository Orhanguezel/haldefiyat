import { File, Image as ImageIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { StorageListQuery } from '@/integrations/shared/storage';

export type AdminStorageFilters = {
  search: string;
  bucket: string;
  folder: string;
  mime: string;
};

export type AdminStorageDetailFormData = {
  name: string;
  bucket: string;
  folder: string;
};

export const ADMIN_STORAGE_ALL_OPTION = 'all';
export const ADMIN_STORAGE_DEFAULT_BUCKET = 'public';
export const ADMIN_STORAGE_DEFAULT_LIMIT = 100;

export const ADMIN_STORAGE_DEFAULT_FILTERS: AdminStorageFilters = {
  search: '',
  bucket: ADMIN_STORAGE_ALL_OPTION,
  folder: ADMIN_STORAGE_ALL_OPTION,
  mime: ADMIN_STORAGE_ALL_OPTION,
};

export const ADMIN_STORAGE_MIME_OPTIONS = [
  { value: 'image/', labelKey: 'imageType' },
  { value: 'video/', labelKey: 'videoType' },
  { value: 'audio/', labelKey: 'audioType' },
  { value: 'application/pdf', labelKey: 'pdfType' },
] as const;

export function createAdminStorageDetailFormData(): AdminStorageDetailFormData {
  return {
    name: '',
    bucket: ADMIN_STORAGE_DEFAULT_BUCKET,
    folder: '',
  };
}

export function buildAdminStorageListQuery(filters: AdminStorageFilters): StorageListQuery {
  return {
    q: filters.search || undefined,
    bucket: filters.bucket !== ADMIN_STORAGE_ALL_OPTION ? filters.bucket : undefined,
    folder: filters.folder !== ADMIN_STORAGE_ALL_OPTION ? filters.folder : undefined,
    mime: filters.mime !== ADMIN_STORAGE_ALL_OPTION ? filters.mime : undefined,
    sort: 'created_at',
    order: 'desc',
    limit: ADMIN_STORAGE_DEFAULT_LIMIT,
  };
}

export function formatAdminStorageBytes(bytes: number): string {
  if (bytes === 0) return '0 B';

  const base = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(base));

  return `${Math.round((bytes / Math.pow(base, unitIndex)) * 100) / 100} ${sizes[unitIndex]}`;
}

export function formatAdminStorageDateTime(value: string | null | undefined): string {
  if (!value) return '-';

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleString('tr-TR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

export function getAdminStorageMimeIcon(mime: string): LucideIcon {
  if (mime.startsWith('image/')) return ImageIcon;
  return File;
}

export function getAdminStorageMimeColorClass(mime: string): string {
  if (mime.startsWith('image/')) return 'text-blue-600 dark:text-blue-400';
  if (mime.startsWith('video/')) return 'text-purple-600 dark:text-purple-400';
  if (mime.startsWith('audio/')) return 'text-green-600 dark:text-green-400';
  if (mime.includes('pdf')) return 'text-red-600 dark:text-red-400';
  return 'text-muted-foreground';
}
