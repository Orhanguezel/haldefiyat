// =============================================================
// FILE: src/integrations/endpoints/admin/db-admin-endpoints.ts
// =============================================================
import { baseApi } from '@/integrations/base-api';
import { cleanParams } from '@/integrations/shared';
import type {
  DbSnapshot,
  DbSnapshotCreatePayload,
  DbImportTextPayload,
  DbImportUrlPayload,
  DbModuleExportParams,
  DbModuleImportPayload,
  DbUiExportParams,
  DbUiBootstrapPayload,
  DbModuleValidationResult,
  DbOperationResult,
} from '@/integrations/shared';

const B = '/admin/db';

export const dbAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // GET /admin/db/export — full DB SQL dump (returns blob)
    exportDbAdmin: b.query<Blob, void>({
      query: () => ({
        url: `${B}/export`,
        responseHandler: (r: Response) => r.blob(),
        cache: 'no-cache',
      }),
    }),

    // POST /admin/db/import-sql
    importDbTextAdmin: b.mutation<DbOperationResult, DbImportTextPayload>({
      query: (body) => ({ url: `${B}/import-sql`, method: 'POST', body }),
    }),

    // POST /admin/db/import-url
    importDbUrlAdmin: b.mutation<DbOperationResult, DbImportUrlPayload>({
      query: (body) => ({ url: `${B}/import-url`, method: 'POST', body }),
    }),

    // POST /admin/db/import-file (FormData)
    importDbFileAdmin: b.mutation<DbOperationResult, FormData>({
      query: (body) => ({ url: `${B}/import-file`, method: 'POST', body }),
    }),

    // GET /admin/db/snapshots
    listDbSnapshotsAdmin: b.query<DbSnapshot[], void>({
      query: () => `${B}/snapshots`,
      providesTags: ['Health'],
    }),

    // POST /admin/db/snapshots
    createDbSnapshotAdmin: b.mutation<DbOperationResult, DbSnapshotCreatePayload>({
      query: (body) => ({ url: `${B}/snapshots`, method: 'POST', body }),
      invalidatesTags: ['Health'],
    }),

    // POST /admin/db/snapshots/:id/restore
    restoreDbSnapshotAdmin: b.mutation<DbOperationResult, string>({
      query: (id) => ({ url: `${B}/snapshots/${encodeURIComponent(id)}/restore`, method: 'POST' }),
      invalidatesTags: ['Health'],
    }),

    // DELETE /admin/db/snapshots/:id
    deleteDbSnapshotAdmin: b.mutation<DbOperationResult, string>({
      query: (id) => ({ url: `${B}/snapshots/${encodeURIComponent(id)}`, method: 'DELETE' }),
      invalidatesTags: ['Health'],
    }),

    // GET /admin/db/export-module
    exportModuleAdmin: b.query<Blob, DbModuleExportParams>({
      query: (params) => ({
        url: `${B}/export-module`,
        params: cleanParams(params as Record<string, unknown>),
        responseHandler: (r: Response) => r.blob(),
        cache: 'no-cache',
      }),
    }),

    // POST /admin/db/import-module
    importModuleAdmin: b.mutation<DbOperationResult, DbModuleImportPayload>({
      query: (body) => ({ url: `${B}/import-module`, method: 'POST', body }),
    }),

    // GET /admin/db/modules/validate
    validateModulesAdmin: b.query<DbModuleValidationResult, void>({
      query: () => `${B}/modules/validate`,
    }),

    // GET /admin/db/site-settings/ui-export
    exportUiSettingsAdmin: b.query<unknown, DbUiExportParams | void>({
      query: (params) => ({
        url: `${B}/site-settings/ui-export`,
        params: cleanParams(params as Record<string, unknown> | undefined),
      }),
    }),

    // POST /admin/db/site-settings/ui-bootstrap
    bootstrapUiSettingsAdmin: b.mutation<DbOperationResult, DbUiBootstrapPayload>({
      query: (body) => ({ url: `${B}/site-settings/ui-bootstrap`, method: 'POST', body }),
    }),
  }),
});

export const {
  useLazyExportDbAdminQuery,
  useImportDbTextAdminMutation,
  useImportDbUrlAdminMutation,
  useImportDbFileAdminMutation,
  useListDbSnapshotsAdminQuery,
  useCreateDbSnapshotAdminMutation,
  useRestoreDbSnapshotAdminMutation,
  useDeleteDbSnapshotAdminMutation,
  useLazyExportModuleAdminQuery,
  useImportModuleAdminMutation,
  useLazyValidateModulesAdminQuery,
  useLazyExportUiSettingsAdminQuery,
  useBootstrapUiSettingsAdminMutation,
} = dbAdminApi;
