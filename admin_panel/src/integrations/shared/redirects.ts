// =============================================================
// FILE: src/integrations/shared/redirects.ts
// Hal — 301/410 yönlendirme + içerik/index denetimi (shared types)
// =============================================================

export const REDIRECTS_ADMIN_BASE = 'admin/redirects';
export const SEO_AUDIT_ADMIN_BASE = 'admin/seo-audit';

export type RedirectType = '301' | '410';

export interface RedirectRowDto {
  id: number;
  sourcePath: string;
  type: RedirectType;
  targetUrl: string | null;
  note: string | null;
  hits: number;
  isActive: number;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface RedirectsListResponseDto {
  items: RedirectRowDto[];
  total: number;
  page: number;
  limit: number;
  byType: Array<{ type: RedirectType; n: number }>;
}

export interface RedirectsListQueryParams {
  type?: 'all' | RedirectType;
  search?: string;
  page?: number;
}

export interface RedirectInputDto {
  sourcePath: string;
  type: RedirectType;
  targetUrl?: string | null;
  note?: string | null;
}

export interface RedirectUpsertResponseDto {
  ok: boolean;
  created: number;
  skipped: number;
}

export type SeoAuditIssue =
  | 'thin_indexed'
  | 'variant_indexed'
  | 'lowquality_indexed'
  | 'ready_not_indexed'
  | null;

export interface SeoAuditItemDto {
  slug: string;
  displayName: string | null;
  nameTr: string;
  seoIndex: number;
  dataQuality: number;
  canonicalSlug: string | null;
  hasEditorial: boolean;
  indexed: boolean;
  issue: SeoAuditIssue;
}

export interface SeoAuditResponseDto {
  summary: {
    total: number;
    indexed: number;
    withEditorial: number;
    thin_indexed: number;
    variant_indexed: number;
    lowquality_indexed: number;
    ready_not_indexed: number;
  };
  items: SeoAuditItemDto[];
}

export const SEO_AUDIT_ISSUE_LABELS: Record<Exclude<SeoAuditIssue, null>, string> = {
  thin_indexed: 'İndexli ama içerik yok',
  variant_indexed: 'İndexli ama varyant (canonical dolu)',
  lowquality_indexed: 'İndexli ama veri kalitesi <70',
  ready_not_indexed: 'Hazır ama indexlenmemiş',
};
