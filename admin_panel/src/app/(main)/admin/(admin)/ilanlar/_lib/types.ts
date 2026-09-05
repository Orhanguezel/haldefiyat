export type Listing = {
  id: number; title: string; productName: string; citySlug: string | null;
  listingType: string; status: string; isSuspicious: number | boolean; isFeatured: number | boolean;
  validUntil: string; featuredUntil?: string | null; contactPhone: string | null;
  quantity: string | number | null; quantityUnit: string | null;
  priceType: string | null; priceMin: string | number | null; priceMax: string | number | null;
  description: string | null; images?: string[];
};

export type ListingResponse = { items: Listing[]; summary?: { active: number; pending: number; rejected: number } };

export type EditForm = {
  title: string; validUntil: string; contactPhone: string;
  quantity: string; quantityUnit: string; priceType: string;
  priceMin: string; priceMax: string; description: string;
};

export type Inquiry = {
  id: number; listingId: number; name: string | null; phone: string | null;
  message: string | null; offerPrice: string | null; createdAt: string | null;
};

export type ListingAnalytics = {
  days: number;
  summary: { listViews: number; detailViews: number; ilanVerViews: number; inquiries: number };
  daily: Array<{ date: string; listViews: number; detailViews: number; ilanVerViews: number; inquiries: number }>;
  searches: { products: Array<{ term: string; hits: number }>; cities: Array<{ term: string; hits: number }> };
  perListing: Array<{ id: number; title: string; slug: string; status: string; viewCount: number; inquiries: number }>;
};

export type PackageKey = 'daily' | 'weekly' | 'monthly';
export type Pricing = Record<PackageKey, { days: number; price: number }>;

export type AdDevice = 'all' | 'desktop' | 'mobile';

export type AdRow = {
  id: number; listingId: number | null; position: string; desktopRow: number; desktopColumns: number;
  device: AdDevice; isActive: number | boolean; endAt: string | null;
  title?: string; lifecycleStatus?: string; archivedAt?: string | null;
};

export type AdSlot = {
  slotKey: string; label: string; isActive: number | boolean;
  desktopCapacity: number; sourceTypes: string[]; recommendedSize?: string | null;
};

export type AdForm = {
  enabled: boolean; position: string; desktopRow: number; desktopColumns: number;
  device: AdDevice; package: PackageKey; paymentConfirmed: boolean;
};
