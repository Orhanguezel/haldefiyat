import { baseApi } from '@/integrations/base-api';

export type BannerType = 'image' | 'code';
export type BannerDevice = 'all' | 'desktop' | 'mobile';

export type BannerPosition =
  | 'home_ticker_below'
  | 'home_mid'
  | 'home_footer_top'
  | 'prices_top'
  | 'prices_sidebar'
  | 'analiz_inline'
  | 'analiz_sidebar'
  | 'urun_sidebar'
  | 'hal_sidebar';

export const BANNER_POSITIONS: { value: BannerPosition; label: string; size: string }[] = [
  { value: 'home_ticker_below', label: 'Anasayfa — ticker altı', size: 'Yatay 970×90 (mobil 320×100)' },
  { value: 'home_mid', label: 'Anasayfa — orta', size: 'Yatay 970×90' },
  { value: 'home_footer_top', label: 'Anasayfa — footer üstü', size: 'Yatay 970×90' },
  { value: 'prices_top', label: 'Fiyatlar — üst şerit', size: 'Yatay 970×90' },
  { value: 'prices_sidebar', label: 'Fiyatlar — yan sütun', size: 'MPU 300×250 / 300×600' },
  { value: 'analiz_inline', label: 'Analiz — yazı içi', size: 'İçerik 728×90 / responsive' },
  { value: 'analiz_sidebar', label: 'Analiz — yan sütun', size: 'MPU 300×250' },
  { value: 'urun_sidebar', label: 'Ürün detay — yan sütun', size: 'MPU 300×250' },
  { value: 'hal_sidebar', label: 'Hal detay — yan sütun', size: 'MPU 300×250' },
];

export const BANNER_TYPES: { value: BannerType; label: string }[] = [
  { value: 'image', label: 'Görsel (link)' },
  { value: 'code', label: 'HTML / Kod (AdSense)' },
];

export const BANNER_DEVICES: { value: BannerDevice; label: string }[] = [
  { value: 'all', label: 'Tüm cihazlar' },
  { value: 'desktop', label: 'Sadece masaüstü' },
  { value: 'mobile', label: 'Sadece mobil' },
];

export interface BannerAdmin {
  id: number;
  position: BannerPosition;
  title: string;
  advertiser: string | null;
  notes: string | null;
  type: BannerType;
  imageUrl: string | null;
  alt: string | null;
  linkUrl: string | null;
  linkTarget: string;
  rel: string;
  code: string | null;
  caption: string | null;
  ctaLabel: string | null;
  device: BannerDevice;
  weight: number;
  displayOrder: number;
  isActive: number;
  startAt: string | null;
  endAt: string | null;
  impressions: number;
  clicks: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface BannerStat {
  id: number;
  title: string;
  position: string;
  advertiser: string | null;
  impressions: number;
  clicks: number;
  isActive: number;
}

export interface BannerUpsert {
  position: BannerPosition;
  title: string;
  advertiser?: string | null;
  notes?: string | null;
  type?: BannerType;
  imageUrl?: string | null;
  alt?: string | null;
  linkUrl?: string | null;
  linkTarget?: string;
  rel?: string;
  code?: string | null;
  caption?: string | null;
  ctaLabel?: string | null;
  device?: BannerDevice;
  weight?: number;
  displayOrder?: number;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
}

export const bannersAdminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    listBannersAdmin: builder.query<
      { items: BannerAdmin[]; positions: string[] },
      { position?: BannerPosition; is_active?: '0' | '1'; q?: string } | undefined
    >({
      query: (params) => {
        const search = new URLSearchParams();
        if (params?.position) search.set('position', params.position);
        if (params?.is_active) search.set('is_active', params.is_active);
        if (params?.q) search.set('q', params.q);
        const qs = search.toString();
        return { url: `/admin/banners${qs ? `?${qs}` : ''}` };
      },
      providesTags: [{ type: 'Banners' as const, id: 'LIST' }],
    }),
    bannerStatsAdmin: builder.query<{ items: BannerStat[] }, void>({
      query: () => ({ url: '/admin/banners/stats' }),
      providesTags: [{ type: 'Banners' as const, id: 'STATS' }],
    }),
    getBannerAdmin: builder.query<BannerAdmin, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}` }),
      transformResponse: (response: { data: BannerAdmin }) => response.data,
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id }],
    }),
    createBannerAdmin: builder.mutation<{ data: BannerAdmin }, BannerUpsert>({
      query: (body) => ({ url: '/admin/banners', method: 'POST', body }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'LIST' }, { type: 'Banners' as const, id: 'STATS' }],
    }),
    updateBannerAdmin: builder.mutation<{ data: BannerAdmin }, { id: number; patch: Partial<BannerUpsert> }>({
      query: ({ id, patch }) => ({ url: `/admin/banners/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Banners' as const, id: 'LIST' },
        { type: 'Banners' as const, id: 'STATS' },
        { type: 'Banners' as const, id },
      ],
    }),
    deleteBannerAdmin: builder.mutation<{ ok: boolean }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'LIST' }, { type: 'Banners' as const, id: 'STATS' }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBannersAdminQuery,
  useBannerStatsAdminQuery,
  useGetBannerAdminQuery,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
} = bannersAdminApi;
