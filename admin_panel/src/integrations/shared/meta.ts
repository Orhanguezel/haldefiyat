// ===================================================================
// FILE: src/integrations/shared/meta.ts
// Meta Pixel + Conversions API admin tipleri
// ===================================================================

export const META_ADMIN_BASE = '/admin/meta';

export type MetaStatusResp = {
  enabled: boolean;
  pixel_id: string;
  pixel_configured: boolean;
  capi_configured: boolean;
  test_code_set: boolean;
};
export type MetaSaveArgs = {
  meta_enabled?: boolean;
  meta_pixel_id?: string;
  meta_capi_token?: string;
  meta_test_event_code?: string;
};
export type MetaTestResp = { ok: boolean; skipped?: boolean; events_received?: number; error?: string };
