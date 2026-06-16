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

export type SeoAuditMissing =
  | 'no_price_data'
  | 'few_markets'
  | 'messy_name'
  | 'no_alias'
  | 'no_editorial';

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
  priceRows30d: number;
  marketCount30d: number;
  nameClean: boolean;
  aliasCount: number;
  missing: SeoAuditMissing[];
  gscStatus: string;
  gscState: string | null;
  recommendation: string;
}

// GSC coverage_state → kullanıcı etiketi (Google'ın gerçek index sonucu)
export const GSC_STATUS_LABELS: Record<string, string> = {
  indexed: 'İndexli',
  discovered_not_indexed: 'Keşfedildi, indexlenmedi',
  crawled_not_indexed: 'Tarandı, indexlenmedi',
  noindex: 'Noindex (bizim)',
  unknown: 'Google bilmiyor',
  redirect: 'Yönlendirme',
  not_checked: 'Henüz denetlenmedi',
  other: 'Diğer',
};

// Aksiyon önerisi etiketleri (kalite + Google sonucu birleşik triyaj)
export const SEO_AUDIT_RECOMMENDATION_LABELS: Record<string, string> = {
  ok: 'İyi durumda',
  index_ac: "Index'e aç",
  noindex_veya_duzelt: 'Düzelt veya noindex',
  variant_canonical_ok: 'Varyant (canonical OK)',
  thin_market_ekle_veya_noindex: 'Market ekle veya noindex',
  zenginlestir_ic_link: 'Zenginleştir + iç link',
  tarama_bekliyor: 'Tarama bekliyor',
};

// dataQuality bileşenleri (puan) — kullanıcı "elle tamamla" tarafı için.
export const SEO_AUDIT_MISSING_LABELS: Record<SeoAuditMissing, string> = {
  no_price_data: 'Fiyat verisi yok (−40)',
  few_markets: '3’ten az hal (−25)',
  messy_name: 'İsim kirli (−15) · displayName ata',
  no_alias: 'Alias yok (−10)',
  no_editorial: 'Editoryel yok (−10)',
};

export interface SeoAuditResponseDto {
  summary: {
    total: number;
    indexed: number;
    withEditorial: number;
    thin_indexed: number;
    variant_indexed: number;
    lowquality_indexed: number;
    ready_not_indexed: number;
    gsc?: {
      indexed: number;
      discovered_not_indexed: number;
      crawled_not_indexed: number;
      noindex: number;
      unknown: number;
      not_checked: number;
    };
  };
  items: SeoAuditItemDto[];
}

export interface SeoAuditActionRequestDto {
  action: 'set-index' | 'set-noindex';
  slugs?: string[];
  issue?: Exclude<SeoAuditIssue, null>;
}

export interface SeoAuditActionResponseDto {
  ok: boolean;
  updated: number;
  skipped: number;
  slugs: string[];
}

export const SEO_AUDIT_ISSUE_LABELS: Record<Exclude<SeoAuditIssue, null>, string> = {
  thin_indexed: 'İndexli ama içerik yok',
  variant_indexed: 'İndexli ama varyant (canonical dolu)',
  lowquality_indexed: 'İndexli ama veri kalitesi <70',
  ready_not_indexed: 'Hazır ama indexlenmemiş',
};
