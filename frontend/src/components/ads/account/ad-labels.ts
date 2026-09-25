export type SelfServiceListing = { id: number; slug: string; title: string; status: string };
export type Campaign = {
  id: number; firmId: number | null; listingId: number | null; title: string; position: string;
  ownerType: "account" | "firm" | "listing"; listing: SelfServiceListing | null;
  lifecycleStatus: string; imageUrl: string | null; caption: string | null;
  device: "all" | "desktop" | "mobile";
  startAt: string | null; endAt: string | null;
  impressions: number; clicks: number; uniqueImpressions: number; uniqueClicks: number; conversions: number;
  performanceStatus: string; paymentStatus?: string; totalAmount?: string;
  invoiceUrl?: string | null; contractFileUrl?: string | null;
};
export type FirmAccess = { id: number; name: string; role: string; canViewFinancials: boolean };
export type AdRequest = {
  id: number; firmId: number; bannerId: number | null; requestType: string; status: string;
  requesterNote: string | null; reviewNote: string | null; createdAt: string;
};
export type PortalData = { firms: FirmAccess[]; listings: SelfServiceListing[]; campaigns: Campaign[]; requests: AdRequest[] };

type Totals = { impressions: number; uniqueImpressions: number; clicks: number; uniqueClicks: number; ctr: number; conversions: number };
export type CampaignReport = {
  from: string; to: string;
  totals: Totals & { revenue?: number; collected?: number; cpm?: number | null; cpc?: number | null; cpa?: number | null };
  devices: Record<"desktop" | "mobile", Omit<Totals, "ctr" | "conversions">>;
  scopes: Array<{ date: string; device: string; scopeKey: string; impressions: number; uniqueImpressions: number; clicks: number; uniqueClicks: number; ctr: number }>;
  conversions: Array<{ eventType: string; entityType: string; conversions: number }>;
};

export const POSITION_LABELS: Record<string, string> = {
  global_top: "Site üstü", global_footer: "Site altı · tüm sayfalar",
  home_ticker_below: "Ana sayfa · fiyat bandı altı", home_mid: "Ana sayfa · orta", home_footer_top: "Ana sayfa · alt",
  prices_top: "Fiyatlar · üst", prices_sidebar: "Fiyatlar · kenar",
  analiz_inline: "Analiz · yazı içi", analiz_sidebar: "Analiz · kenar",
  urun_sidebar: "Ürün sayfası", hal_sidebar: "Hal sayfası",
  listing_detail_sidebar: "İlan sayfası · kenar", firm_detail_sidebar: "Firma sayfası · kenar", firm_detail_footer: "Firma sayfası · alt",
};
export const POSITION_DETAILS: Record<string, { page: string; placement: string }> = {
  global_top: { page: "Tüm sayfalar", placement: "Üst reklam alanı" },
  global_footer: { page: "Tüm sayfalar", placement: "Sayfa sonu reklam alanı" },
  home_ticker_below: { page: "Ana sayfa", placement: "Fiyat bandının altı" },
  home_mid: { page: "Ana sayfa", placement: "Orta bölüm" },
  home_footer_top: { page: "Ana sayfa", placement: "Sayfa sonundan önce" },
  prices_top: { page: "Fiyatlar sayfası", placement: "Üst reklam alanı" },
  prices_sidebar: { page: "Fiyatlar sayfası", placement: "Sağ kenar alanı" },
  analiz_inline: { page: "Analiz yazıları", placement: "Yazı içi reklam alanı" },
  analiz_sidebar: { page: "Analiz yazıları", placement: "Sağ kenar alanı" },
  urun_sidebar: { page: "Ürün detay sayfaları", placement: "Sağ kenar alanı" },
  hal_sidebar: { page: "Hal detay sayfaları", placement: "Sağ kenar alanı" },
  listing_detail_sidebar: { page: "İlan detay sayfaları", placement: "Sağ kenar alanı" },
  firm_detail_sidebar: { page: "Firma detay sayfaları", placement: "Sağ kenar alanı" },
  firm_detail_footer: { page: "Firma detay sayfaları", placement: "İçerik altı reklam alanı" },
};
export const STATUS_LABELS: Record<string, string> = {
  draft: "Taslak", proposal: "Teklif", reserved: "Rezerve", payment_pending: "Ödeme bekliyor",
  scheduled: "Planlandı", live: "Yayında", paused: "Durduruldu", completed: "Tamamlandı", cancelled: "İptal",
  problem: "Kontrol gerekiyor", archived: "Arşiv",
};
export const PERFORMANCE_LABELS: Record<string, string> = { learning: "Veri toplanıyor", normal: "Normal", low: "Düşük", winner: "Güçlü" };
export const EVENT_LABELS: Record<string, string> = {
  listing_view: "İlan görüntüleme", offer_submit: "Teklif gönderimi", phone_click: "Telefon tıklaması",
  whatsapp_click: "WhatsApp tıklaması", firm_contact: "Firma iletişimi", directions_click: "Yol tarifi", favorite_add: "Favoriye ekleme",
};
export const PAYMENT_LABELS: Record<string, string> = {
  unpaid: "Ödenmedi", partial: "Kısmi ödeme", paid: "Ödendi", waived: "Ücretsiz", refunded: "İade", cancelled: "İptal",
};

export const fmtNumber = (value: number) => value.toLocaleString("tr-TR");
export const fmtCtr = (clicks: number, impressions: number) => `%${(impressions ? (clicks / impressions) * 100 : 0).toFixed(2).replace(".", ",")}`;
export const fmtDate = (value: string | null) => value ? new Date(value).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—";
export const fmtCampaignPeriod = (startAt: string | null, endAt: string | null) => {
  if (!startAt && !endAt) return "Süresiz yayın";
  if (startAt && !endAt) return `${fmtDate(startAt)} tarihinden itibaren`;
  if (!startAt && endAt) return `${fmtDate(endAt)} tarihine kadar`;
  return `${fmtDate(startAt)} – ${fmtDate(endAt)}`;
};
export const label = (map: Record<string, string>, key: string) => map[key] ?? key;
