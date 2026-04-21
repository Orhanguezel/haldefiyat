// =============================================================
// FILE: src/integrations/shared/db-admin/db-admin-config.ts
// Config helpers for the db_admin utility module
// =============================================================

/** Admin API base path */
export const DB_ADMIN_BASE = '/admin/db';

/** Available module keys for module-level export/import */
export const DB_ADMIN_MODULE_KEYS = [
  'products',
  'categories',
  'services',
  'faqs',
  'newsletters',
  'custom_pages',
  'gallery',
  'references',
  'library',
  'popups',
  'sliders',
  'contacts',
  'support',
  'email_templates',
  'job_listings',
  'job_applications',
  'users',
  'audit',
  'site_settings',
] as const;

export type DbAdminModuleKey = typeof DB_ADMIN_MODULE_KEYS[number];

/** Tab keys for the db admin page */
export type DbAdminTabKey = 'snapshots' | 'import' | 'modules' | 'validate';

/** Import sub-tab keys */
export type DbImportTabKey = 'text' | 'url' | 'file';

/** Module sub-tab keys */
export type DbModuleTabKey = 'export' | 'import' | 'validate' | 'ui';

/** Format snapshot file size for display */
export function formatSnapshotSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Format ISO date to locale display */
export function formatSnapshotDate(iso?: string): string {
  if (!iso) return '-';
  try {
    return new Date(iso).toLocaleString('tr-TR');
  } catch {
    return iso;
  }
}

/** Build module select options from module keys */
export function buildDbModuleOptions(): Array<{ value: string; label: string }> {
  return DB_ADMIN_MODULE_KEYS.map((key) => ({
    value: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
  }));
}
