// =============================================================
// FILE: src/integrations/shared/db-admin/index.ts
// Explicit barrel for db-admin shared module
// =============================================================

export {
  type DbSnapshot,
  type DbSnapshotCreatePayload,
  type DbImportTextPayload,
  type DbImportUrlPayload,
  type DbModuleExportParams,
  type DbModuleImportPayload,
  type DbUiExportParams,
  type DbUiBootstrapPayload,
  type DbModuleManifestEntry,
  type DbModuleValidationResult,
  type DbOperationResult,
} from './db-admin-types';

export {
  DB_ADMIN_BASE,
  DB_ADMIN_MODULE_KEYS,
  type DbAdminModuleKey,
  type DbAdminTabKey,
  type DbImportTabKey,
  type DbModuleTabKey,
  formatSnapshotSize,
  formatSnapshotDate,
  buildDbModuleOptions,
} from './db-admin-config';
