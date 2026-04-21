// =============================================================
// FILE: src/integrations/shared/db-admin/db-admin-types.ts
// Types for the db_admin utility module
// =============================================================

/** Snapshot entry returned by GET /admin/db/snapshots */
export type DbSnapshot = {
  id: string;
  label: string;
  note?: string;
  file: string;
  size?: number;
  created_at: string;
};

/** Body for POST /admin/db/snapshots */
export type DbSnapshotCreatePayload = {
  label: string;
  note?: string;
};

/** Body for POST /admin/db/import-sql */
export type DbImportTextPayload = {
  sql: string;
  truncate_before?: boolean;
  dry_run?: boolean;
};

/** Body for POST /admin/db/import-url */
export type DbImportUrlPayload = {
  url: string;
  truncate_before?: boolean;
  dry_run?: boolean;
};

/** Query params for GET /admin/db/export-module */
export type DbModuleExportParams = {
  module: string;
  format?: 'sql' | 'json';
  upsert?: boolean;
};

/** Body for POST /admin/db/import-module */
export type DbModuleImportPayload = {
  module: string;
  sql: string;
  truncate_before?: boolean;
};

/** Query params for GET /admin/db/site-settings/ui-export */
export type DbUiExportParams = {
  locale?: string;
  prefix?: string;
};

/** Body for POST /admin/db/site-settings/ui-bootstrap */
export type DbUiBootstrapPayload = {
  source_locale: string;
  target_locale: string;
  overwrite?: boolean;
  only_ui_keys?: boolean;
};

/** Module manifest entry from GET /admin/db/modules/validate */
export type DbModuleManifestEntry = {
  module: string;
  status: 'ok' | 'error';
  errors?: string[];
  warnings?: string[];
  declared_tables?: string[];
  duplicates?: string[];
};

/** Result of POST /admin/db/validate-modules or GET /admin/db/modules/validate */
export type DbModuleValidationResult = {
  modules: DbModuleManifestEntry[];
};

/** Generic success response from db operations */
export type DbOperationResult = {
  ok: boolean;
  message?: string;
  affected?: number;
};
