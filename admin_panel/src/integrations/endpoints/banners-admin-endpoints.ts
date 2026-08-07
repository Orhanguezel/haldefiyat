import { baseApi } from '@/integrations/base-api';

export type BannerType = 'image' | 'code';
export type BannerSourceType = 'custom' | 'listing' | 'firm' | 'code';
export type BannerDevice = 'all' | 'desktop' | 'mobile';
export type BannerLifecycleStatus = 'draft' | 'proposal' | 'reserved' | 'payment_pending' | 'scheduled' | 'live' | 'completed' | 'cancelled' | 'problem' | 'archived';
export type BannerPaymentStatus = 'unpaid' | 'partial' | 'paid' | 'waived' | 'refunded' | 'cancelled';
export type BannerScopeType = 'global' | 'page_type' | 'city' | 'district' | 'product' | 'category' | 'market' | 'firm' | 'listing';
export type BannerTarget = { scopeType: BannerScopeType; scopeValue?: string | null };

export type BannerPosition =
  | 'global_top'
  | 'global_footer'
  | 'home_ticker_below'
  | 'home_mid'
  | 'home_footer_top'
  | 'prices_top'
  | 'prices_sidebar'
  | 'analiz_inline'
  | 'analiz_sidebar'
  | 'urun_sidebar'
  | 'hal_sidebar'
  | 'listing_detail_sidebar'
  | 'firm_detail_sidebar'
  | 'firm_detail_footer';

export const BANNER_POSITIONS: { value: BannerPosition; label: string; size: string }[] = [
  { value: 'global_top', label: 'TÜM SAYFALAR — üst (header altı)', size: 'Yatay 970×90' },
  { value: 'global_footer', label: 'TÜM SAYFALAR — footer üstü', size: 'Yatay 970×90' },
  { value: 'home_ticker_below', label: 'Anasayfa — ticker altı', size: 'Yatay 970×90 (mobil 320×100)' },
  { value: 'home_mid', label: 'Anasayfa — orta', size: 'Yatay 970×90' },
  { value: 'home_footer_top', label: 'Anasayfa — footer üstü', size: 'Yatay 970×90' },
  { value: 'prices_top', label: 'Fiyatlar — üst şerit', size: 'Yatay 970×90' },
  { value: 'prices_sidebar', label: 'Fiyatlar — yan sütun', size: 'MPU 300×250 / 300×600' },
  { value: 'analiz_inline', label: 'Analiz — yazı içi', size: 'İçerik 728×90 / responsive' },
  { value: 'analiz_sidebar', label: 'Analiz — yan sütun', size: 'MPU 300×250' },
  { value: 'urun_sidebar', label: 'Ürün detay — yan sütun', size: 'MPU 300×250' },
  { value: 'hal_sidebar', label: 'Hal detay — yan sütun', size: 'MPU 300×250' },
  { value: 'listing_detail_sidebar', label: 'İlan detay — yan sütun', size: 'MPU 300×250' },
  { value: 'firm_detail_sidebar', label: 'Firma detay — yan sütun', size: 'MPU 300×250' },
  { value: 'firm_detail_footer', label: 'Firma detay — içerik altı', size: 'Yatay 970×90 / iki kart' },
];

export interface BannerInventoryItem {
  position: BannerPosition;
  row: number;
  columns: number;
  active: number;
  available: number;
  items: BannerAdmin[];
}

export interface AdSlotAdmin {
  id: number;
  slotKey: BannerPosition;
  label: string;
  pageType: string;
  placementDescription: string;
  desktopCapacity: number;
  mobileCapacity: number;
  mobileBehavior: 'stack' | 'hide' | 'single' | 'scroll';
  recommendedSize: string | null;
  aspectRatio: string | null;
  sourceTypes: BannerSourceType[];
  deliveryMode: 'fixed' | 'rotation';
  baseDailyPrice: string;
  trafficMultiplier: string;
  visibilityMultiplier: string;
  desktopMultiplier: string;
  mobileMultiplier: string;
  isActive: number;
  displayOrder: number;
}

export interface AdCalendarBooking {
  id: number;
  position: BannerPosition;
  title: string;
  advertiser: string | null;
  sourceType: BannerSourceType;
  lifecycleStatus: BannerLifecycleStatus;
  paymentStatus: BannerPaymentStatus;
  paymentOverride: number;
  paymentOverrideReason: string | null;
  totalAmount: string;
  paymentDueAt: string | null;
  paymentGraceHours: number;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  contractFileUrl: string | null;
  creativeFileUrl: string | null;
  creativeTemplate: 'image' | 'firm' | 'listing' | 'sponsorship' | 'leaderboard' | 'split' | 'mpu' | 'mobile';
  creativeConfig: {
    backgroundColor?: string; textColor?: string; accentColor?: string; animation?: boolean;
    logoUrl?: string; backgroundImageUrl?: string; description?: string;
    focalX?: number; focalY?: number; imageFit?: 'cover' | 'contain';
    imageWidth?: number; imageHeight?: number; imageBytes?: number;
  } | null;
  qualityOverrideReason: string | null;
  device: BannerDevice;
  desktopRow: number;
  desktopColumns: number;
  startAt: string | null;
  endAt: string | null;
  reservationExpiresAt: string | null;
  salesOwner: string | null;
  cancellationReason: string | null;
  targets: BannerTarget[];
}

export interface AdSlotAvailability {
  slotKey: BannerPosition;
  pageType: string;
  capacity: number;
  occupied: number;
  available: number;
  nextAvailableAt: string | null;
}

export interface AdWaitlistItem {
  id: number;
  position: BannerPosition;
  title: string;
  advertiser: string | null;
  sourceType: BannerSourceType;
  listingId: number | null;
  firmId: number | null;
  device: BannerDevice;
  preferredStartAt: string | null;
  preferredEndAt: string | null;
  priority: number;
  status: 'waiting' | 'offered' | 'converted' | 'cancelled';
  notes: string | null;
  requestedDate?: string;
  requestedAvailable?: number;
  requestedNextAvailableAt?: string | null;
  alternatives?: Array<{ slotKey: BannerPosition; label: string; available: number; nextAvailableAt: string | null }>;
}

export interface AdPackageAdmin {
  id: number;
  slug: string;
  name: string;
  billingPeriod: 'daily' | 'weekly' | 'monthly' | 'custom';
  durationDays: number;
  price: string;
  currency: string;
  devices: BannerDevice[];
  impressionLimit: number | null;
  clickLimit: number | null;
  includesFirmProfile: number;
  discountPercent: string;
  customPriceAllowed: number;
  isActive: number;
  slotKeys: BannerPosition[];
}

export type AdPackagePayload = {
  slug: string;
  name: string;
  billingPeriod: AdPackageAdmin['billingPeriod'];
  durationDays: number;
  price: number;
  currency?: string;
  devices?: BannerDevice[];
  impressionLimit?: number | null;
  clickLimit?: number | null;
  includesFirmProfile?: boolean;
  discountPercent?: number;
  customPriceAllowed?: boolean;
  isActive?: boolean;
  slotKeys?: BannerPosition[];
};

export interface AdPriceQuote {
  currency: string;
  suggestedPrice: number;
  appliedPrice: number;
  discountPercent: number;
  overrideId: number | null;
  factors: Record<'baseDailyPrice' | 'durationDays' | 'traffic' | 'visibility' | 'device' | 'targeting' | 'season' | 'capacity' | 'durationDiscount', number>;
}

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
  sourceType: BannerSourceType;
  lifecycleStatus: BannerLifecycleStatus;
  paymentStatus: BannerPaymentStatus;
  paymentOverride: number;
  paymentOverrideReason: string | null;
  totalAmount: string;
  paymentDueAt: string | null;
  paymentGraceHours: number;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  contractFileUrl: string | null;
  creativeFileUrl: string | null;
  creativeTemplate: 'image' | 'firm' | 'listing' | 'sponsorship' | 'leaderboard' | 'split' | 'mpu' | 'mobile';
  creativeConfig: {
    backgroundColor?: string; textColor?: string; accentColor?: string; animation?: boolean;
    logoUrl?: string; backgroundImageUrl?: string; description?: string;
    focalX?: number; focalY?: number; imageFit?: 'cover' | 'contain';
    imageWidth?: number; imageHeight?: number; imageBytes?: number;
  } | null;
  qualityOverrideReason: string | null;
  listingId: number | null;
  firmId: number | null;
  sponsorshipId: number | null;
  imageUrl: string | null;
  alt: string | null;
  linkUrl: string | null;
  linkTarget: string;
  rel: string;
  code: string | null;
  caption: string | null;
  ctaLabel: string | null;
  device: BannerDevice;
  desktopRow: number;
  desktopColumns: number;
  weight: number;
  impressionLimit: number | null;
  clickLimit: number | null;
  dailyImpressionLimit: number | null;
  dailyImpressions: number;
  dailyImpressionsDate: string | null;
  visitorDailyImpressionLimit: number;
  visitorCampaignImpressionLimit: number;
  experimentKey: string | null;
  creativeVariant: string | null;
  autoOptimize: number;
  minimumOptimizationImpressions: number;
  performanceStatus: 'learning' | 'normal' | 'low' | 'winner';
  displayOrder: number;
  isActive: number;
  startAt: string | null;
  endAt: string | null;
  reservationExpiresAt: string | null;
  salesOwner: string | null;
  cancellationReason: string | null;
  impressions: number;
  clicks: number;
  createdAt: string | null;
  updatedAt: string | null;
  reportEmail: string | null;
  weeklyReportEnabled: number;
  weeklyReportSentAt: string | null;
  closingReportSentAt: string | null;
  targets?: BannerTarget[];
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

export interface BannerDistributionItem {
  id: number;
  title: string;
  advertiser: string | null;
  position: string;
  expectedShare: number;
  actualShare: number;
  variance: number;
  performanceStatus: BannerAdmin['performanceStatus'];
  experimentKey: string | null;
  creativeVariant: string | null;
  impressions: number;
  clicks: number;
  guaranteeProgress: number | null;
}

export interface BannerMetricItem {
  id: number;
  bannerId: number;
  metricDate: string;
  device: 'desktop' | 'mobile';
  scopeKey: string;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
  title: string;
  advertiser: string | null;
  position: string | null;
  ctr: number;
  liveDays: number;
  remainingDays: number | null;
}

export interface BannerConversionItem {
  bannerId: number;
  eventType: 'listing_view' | 'offer_submit' | 'phone_click' | 'whatsapp_click' | 'firm_contact' | 'directions_click' | 'favorite_add';
  entityType: 'listing' | 'firm' | 'product';
  conversions: number;
}

export interface BannerRevenueReport {
  from: string;
  to: string;
  totals: {
    revenue: number; collected: number; outstanding: number;
    impressions: number; clicks: number; conversions: number;
    cpm: number | null; cpc: number | null; cpa: number | null; occupancyRate: number;
  };
  campaigns: Array<{
    bannerId: number; title: string; advertiser: string | null; position: string; firmId: number | null;
    revenue: number; collected: number; outstanding: number; impressions: number; clicks: number; conversions: number;
    cpm: number | null; cpc: number | null; cpa: number | null;
  }>;
  slots: Array<{ key: string; revenue: number; collected: number; outstanding: number; impressions: number; clicks: number; conversions: number; occupancyRate: number }>;
  firms: Array<{ key: number; revenue: number; collected: number; outstanding: number; impressions: number; clicks: number; conversions: number }>;
}

export interface CampaignPerformanceReport {
  from: string;
  to: string;
  banner: { id: number; title: string; advertiser: string | null; position: string; startAt: string | null; endAt: string | null };
  totals: {
    impressions: number; uniqueImpressions: number; clicks: number; uniqueClicks: number;
    ctr: number; conversions: number; revenue: number; collected: number;
    cpm: number | null; cpc: number | null; cpa: number | null;
  };
  devices: Record<string, { impressions: number; clicks: number }>;
  conversions: BannerConversionItem[];
}

export interface AdSelfServiceRequest {
  id: number; firmId: number; bannerId: number | null; requestedBy: string;
  requestType: 'creative_change' | 'extension' | 'new_slot' | 'support';
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested' | 'cancelled';
  payload: Record<string, unknown>; requesterNote: string | null; reviewNote: string | null;
  firmName: string; bannerTitle: string | null; createdAt: string;
}

export interface AdAuditLog {
  id: number; entityType: string; entityId: string; action: string; actorUserId: string | null;
  beforeData: Record<string, unknown> | null; afterData: Record<string, unknown> | null;
  reason: string | null; isFinancial: number; createdAt: string;
}

export interface BannerUpsert {
  position: BannerPosition;
  title: string;
  advertiser?: string | null;
  notes?: string | null;
  type?: BannerType;
  sourceType?: BannerSourceType;
  lifecycleStatus?: BannerLifecycleStatus;
  paymentStatus?: BannerPaymentStatus;
  paymentOverride?: boolean;
  paymentOverrideReason?: string | null;
  totalAmount?: number;
  paymentDueAt?: string | null;
  paymentGraceHours?: number;
  invoiceNumber?: string | null;
  invoiceUrl?: string | null;
  contractFileUrl?: string | null;
  creativeFileUrl?: string | null;
  creativeTemplate?: BannerAdmin['creativeTemplate'];
  creativeConfig?: BannerAdmin['creativeConfig'];
  qualityOverrideReason?: string | null;
  listingId?: number | null;
  firmId?: number | null;
  sponsorshipId?: number | null;
  imageUrl?: string | null;
  alt?: string | null;
  linkUrl?: string | null;
  linkTarget?: string;
  rel?: string;
  code?: string | null;
  caption?: string | null;
  ctaLabel?: string | null;
  device?: BannerDevice;
  desktopRow?: number;
  desktopColumns?: number;
  weight?: number;
  impressionLimit?: number | null;
  clickLimit?: number | null;
  dailyImpressionLimit?: number | null;
  visitorDailyImpressionLimit?: number;
  visitorCampaignImpressionLimit?: number;
  experimentKey?: string | null;
  creativeVariant?: string | null;
  autoOptimize?: boolean;
  minimumOptimizationImpressions?: number;
  displayOrder?: number;
  isActive?: boolean;
  startAt?: string | null;
  endAt?: string | null;
  reservationExpiresAt?: string | null;
  salesOwner?: string | null;
  cancellationReason?: string | null;
  reportEmail?: string | null;
  weeklyReportEnabled?: boolean;
  targets?: BannerTarget[];
}

export interface AdPaymentTransaction {
  id: number;
  bannerId: number;
  transactionType: 'payment' | 'refund';
  amount: string;
  currency: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'other';
  paidAt: string;
  referenceNumber: string | null;
  notes: string | null;
  createdAt: string | null;
}

export interface AdPaymentSummary {
  totalAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  paymentStatus: BannerPaymentStatus;
  paymentDueAt: string | null;
  transactions: AdPaymentTransaction[];
}

export interface AdPaymentAlert {
  id: number;
  title: string;
  advertiser: string | null;
  salesOwner: string | null;
  totalAmount: string;
  paymentStatus: BannerPaymentStatus;
  paymentDueAt: string;
  paymentReminderSentAt: string | null;
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
    bannerDistributionAdmin: builder.query<{ items: BannerDistributionItem[] }, void>({
      query: () => ({ url: '/admin/banners/distribution' }),
      providesTags: [{ type: 'Banners' as const, id: 'STATS' }],
    }),
    bannerMetricsAdmin: builder.query<{ items: BannerMetricItem[] }, { from: string; to: string; bannerId?: number }>({
      query: (params) => ({ url: '/admin/banners/metrics', params }),
      providesTags: [{ type: 'Banners' as const, id: 'STATS' }],
    }),
    bannerConversionsAdmin: builder.query<{ items: BannerConversionItem[] }, { from: string; to: string; bannerId?: number }>({
      query: (params) => ({ url: '/admin/banners/conversions', params }),
      providesTags: [{ type: 'Banners' as const, id: 'STATS' }],
    }),
    bannerRevenueAdmin: builder.query<{ data: BannerRevenueReport }, { from: string; to: string }>({
      query: (params) => ({ url: '/admin/banners/revenue', params }),
      providesTags: [{ type: 'Banners' as const, id: 'STATS' }],
    }),
    bannerInventoryAdmin: builder.query<{ items: BannerInventoryItem[] }, { position?: BannerPosition } | void>({
      query: (params) => ({
        url: '/admin/banners/inventory',
        params: params?.position ? { position: params.position } : undefined,
      }),
      providesTags: [{ type: 'Banners' as const, id: 'INVENTORY' }],
    }),
    listAdSlotsAdmin: builder.query<{ items: AdSlotAdmin[] }, void>({
      query: () => ({ url: '/admin/banners/slots' }),
      providesTags: [{ type: 'Banners' as const, id: 'SLOTS' }],
    }),
    updateAdSlotAdmin: builder.mutation<
      { ok: boolean },
      { slotKey: BannerPosition; patch: Partial<Pick<AdSlotAdmin, 'desktopCapacity' | 'mobileCapacity' | 'mobileBehavior' | 'deliveryMode' | 'baseDailyPrice' | 'trafficMultiplier' | 'visibilityMultiplier' | 'desktopMultiplier' | 'mobileMultiplier'>> & { isActive?: boolean } }
    >({
      query: ({ slotKey, patch }) => ({ url: `/admin/banners/slots/${slotKey}`, method: 'PATCH', body: patch }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'SLOTS' }, { type: 'Banners' as const, id: 'CALENDAR' }],
    }),
    adCalendarAdmin: builder.query<
      { from: string; to: string; slots: AdSlotAdmin[]; bookings: AdCalendarBooking[] },
      { from: string; to: string }
    >({
      query: (params) => ({ url: '/admin/banners/calendar', params }),
      providesTags: [{ type: 'Banners' as const, id: 'CALENDAR' }],
    }),
    adSlotAvailabilityAdmin: builder.query<
      { at: string; items: AdSlotAvailability[] },
      { at: string; device?: BannerDevice; horizonDays?: number }
    >({
      query: (params) => ({ url: '/admin/banners/availability', params }),
      providesTags: [{ type: 'Banners' as const, id: 'AVAILABILITY' }],
    }),
    listAdWaitlistAdmin: builder.query<{ items: AdWaitlistItem[] }, void>({
      query: () => ({ url: '/admin/banners-waitlist' }),
      providesTags: [{ type: 'Banners' as const, id: 'WAITLIST' }],
    }),
    listAdPackagesAdmin: builder.query<{ items: AdPackageAdmin[] }, void>({
      query: () => ({ url: '/admin/banners/packages' }),
      providesTags: [{ type: 'Banners' as const, id: 'PACKAGES' }],
    }),
    createAdPackageAdmin: builder.mutation<{ id: number }, AdPackagePayload>({
      query: (body) => ({ url: '/admin/banners/packages', method: 'POST', body }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'PACKAGES' }],
    }),
    updateAdPackageAdmin: builder.mutation<{ ok: boolean }, { id: number; patch: Partial<AdPackagePayload> }>({
      query: ({ id, patch }) => ({ url: `/admin/banners/packages/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'PACKAGES' }],
    }),
    quoteAdPriceAdmin: builder.mutation<AdPriceQuote, {
      slotKey: BannerPosition;
      device: BannerDevice;
      durationDays: number;
      startAt?: string | null;
      targetTypes?: BannerTarget['scopeType'][];
      manualPrice?: number;
      manualDiscountPercent?: number;
      overrideReason?: string;
      bannerId?: number;
    }>({
      query: (body) => ({ url: '/admin/banners/pricing/quote', method: 'POST', body }),
    }),
    adWaitlistSuggestionsAdmin: builder.query<{ items: AdWaitlistItem[] }, { at: string }>({
      query: (params) => ({ url: '/admin/banners-waitlist/suggestions', params }),
      providesTags: [{ type: 'Banners' as const, id: 'WAITLIST' }],
    }),
    createAdWaitlistAdmin: builder.mutation<{ id: number }, {
      position: BannerPosition; title: string; advertiser?: string | null; sourceType?: BannerSourceType;
      device?: BannerDevice; preferredStartAt?: string | null; preferredEndAt?: string | null; priority?: number; notes?: string | null;
    }>({
      query: (body) => ({ url: '/admin/banners-waitlist', method: 'POST', body }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'WAITLIST' }],
    }),
    updateAdWaitlistAdmin: builder.mutation<{ ok: boolean }, {
      id: number; patch: Partial<Pick<AdWaitlistItem, 'status' | 'priority' | 'notes'>>
    }>({
      query: ({ id, patch }) => ({ url: `/admin/banners-waitlist/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'WAITLIST' }],
    }),
    getBannerAdmin: builder.query<BannerAdmin, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}` }),
      transformResponse: (response: { data: BannerAdmin }) => response.data,
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id }],
    }),
    getBannerQualityAdmin: builder.query<{
      status: 'passed' | 'warning' | 'error';
      items: Array<{ code: string; message: string; severity: 'error' | 'warning' }>;
    }, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}/quality` }),
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id: `QUALITY-${id}` }],
    }),
    getBannerPerformanceAdmin: builder.query<{ data: CampaignPerformanceReport }, { id: number | string; from: string; to: string }>({
      query: ({ id, ...params }) => ({ url: `/admin/banners/${id}/performance`, params }),
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id: `PERFORMANCE-${id}` }],
    }),
    getBannerAuditAdmin: builder.query<{ items: AdAuditLog[] }, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}/audit` }),
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id: `AUDIT-${id}` }],
    }),
    getAdPaymentsAdmin: builder.query<AdPaymentSummary, { id: number | string }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}/payments` }),
      providesTags: (_res, _err, { id }) => [{ type: 'Banners' as const, id: `PAYMENTS-${id}` }],
    }),
    getAdPaymentAlertsAdmin: builder.query<{ items: AdPaymentAlert[] }, void>({
      query: () => ({ url: '/admin/banners/payment-alerts' }),
      providesTags: [{ type: 'Banners' as const, id: 'PAYMENT-ALERTS' }],
    }),
    getAdSelfServiceRequestsAdmin: builder.query<{ items: AdSelfServiceRequest[] }, { status?: string } | void>({
      query: (params) => ({ url: '/admin/banners/self-service-requests', params: params || undefined }),
      providesTags: [{ type: 'Banners' as const, id: 'SELF-SERVICE' }],
    }),
    reviewAdSelfServiceRequestAdmin: builder.mutation<{ item: AdSelfServiceRequest }, { id: number; status: 'approved' | 'rejected' | 'revision_requested'; reviewNote: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/banners/self-service-requests/${id}`, method: 'PATCH', body }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'SELF-SERVICE' }, { type: 'Banners' as const, id: 'LIST' }],
    }),
    createAdPaymentAdmin: builder.mutation<{ id: number; summary: AdPaymentSummary }, {
      id: number;
      transactionType: 'payment' | 'refund';
      amount: number;
      currency?: string;
      paymentMethod: AdPaymentTransaction['paymentMethod'];
      paidAt: string;
      referenceNumber?: string | null;
      notes?: string | null;
    }>({
      query: ({ id, ...body }) => ({ url: `/admin/banners/${id}/payments`, method: 'POST', body }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Banners' as const, id: `PAYMENTS-${id}` },
        { type: 'Banners' as const, id },
        { type: 'Banners' as const, id: 'LIST' },
      ],
    }),
    createBannerAdmin: builder.mutation<{ data: BannerAdmin }, BannerUpsert>({
      query: (body) => ({ url: '/admin/banners', method: 'POST', body }),
      invalidatesTags: [
        { type: 'Banners' as const, id: 'LIST' },
        { type: 'Banners' as const, id: 'STATS' },
        { type: 'Banners' as const, id: 'INVENTORY' },
        { type: 'Banners' as const, id: 'CALENDAR' },
        { type: 'Banners' as const, id: 'AVAILABILITY' },
      ],
    }),
    updateBannerAdmin: builder.mutation<{ data: BannerAdmin }, { id: number; patch: Partial<BannerUpsert> }>({
      query: ({ id, patch }) => ({ url: `/admin/banners/${id}`, method: 'PATCH', body: patch }),
      invalidatesTags: (_res, _err, { id }) => [
        { type: 'Banners' as const, id: 'LIST' },
        { type: 'Banners' as const, id: 'STATS' },
        { type: 'Banners' as const, id },
        { type: 'Banners' as const, id: 'INVENTORY' },
        { type: 'Banners' as const, id: 'CALENDAR' },
        { type: 'Banners' as const, id: 'AVAILABILITY' },
      ],
    }),
    duplicateBannerAdmin: builder.mutation<{ data: BannerAdmin }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}/duplicate`, method: 'POST' }),
      invalidatesTags: [{ type: 'Banners' as const, id: 'LIST' }],
    }),
    deleteBannerAdmin: builder.mutation<{ ok: boolean }, { id: number }>({
      query: ({ id }) => ({ url: `/admin/banners/${id}`, method: 'DELETE' }),
      invalidatesTags: [
        { type: 'Banners' as const, id: 'LIST' },
        { type: 'Banners' as const, id: 'STATS' },
        { type: 'Banners' as const, id: 'INVENTORY' },
        { type: 'Banners' as const, id: 'CALENDAR' },
        { type: 'Banners' as const, id: 'AVAILABILITY' },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useListBannersAdminQuery,
  useBannerStatsAdminQuery,
  useBannerDistributionAdminQuery,
  useBannerMetricsAdminQuery,
  useBannerConversionsAdminQuery,
  useBannerRevenueAdminQuery,
  useBannerInventoryAdminQuery,
  useListAdSlotsAdminQuery,
  useUpdateAdSlotAdminMutation,
  useAdCalendarAdminQuery,
  useAdSlotAvailabilityAdminQuery,
  useListAdPackagesAdminQuery,
  useCreateAdPackageAdminMutation,
  useUpdateAdPackageAdminMutation,
  useQuoteAdPriceAdminMutation,
  useListAdWaitlistAdminQuery,
  useAdWaitlistSuggestionsAdminQuery,
  useCreateAdWaitlistAdminMutation,
  useUpdateAdWaitlistAdminMutation,
  useGetBannerAdminQuery,
  useGetBannerQualityAdminQuery,
  useGetBannerPerformanceAdminQuery,
  useGetBannerAuditAdminQuery,
  useGetAdPaymentsAdminQuery,
  useGetAdPaymentAlertsAdminQuery,
  useGetAdSelfServiceRequestsAdminQuery,
  useReviewAdSelfServiceRequestAdminMutation,
  useCreateAdPaymentAdminMutation,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDuplicateBannerAdminMutation,
  useDeleteBannerAdminMutation,
} = bannersAdminApi;
