// ===================================================================
// FILE: src/integrations/shared/gtm.ts
// Google Tag Manager admin API tipleri + sabitler
// ===================================================================

export const GTM_ADMIN_BASE = '/admin/gtm';

export type GtmItem = { name: string; type: string; id: string; paused?: boolean };
export type GtmContainer = { public_id: string; name: string; path: string; workspace_path: string };

export type GtmStatusResp = { connected: boolean; container: GtmContainer | null };
export type GtmOverviewResp = {
  account_id: string;
  container: GtmContainer | null;
  tags: GtmItem[];
  triggers: GtmItem[];
  variables: GtmItem[];
};
export type GtmPublishResp = { ok: boolean; version: string };
