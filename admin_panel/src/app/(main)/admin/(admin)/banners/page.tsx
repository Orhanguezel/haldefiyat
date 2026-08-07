'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Copy, Edit, LayoutGrid, ListPlus, Megaphone, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BANNER_POSITIONS,
  type AdWaitlistItem,
  type AdPriceQuote,
  type BannerAdmin,
} from '@/integrations/endpoints/banners-admin-endpoints';
import {
  useDeleteBannerAdminMutation,
  useDuplicateBannerAdminMutation,
  useAdCalendarAdminQuery,
  useAdSlotAvailabilityAdminQuery,
  useAdWaitlistSuggestionsAdminQuery,
  useCreateAdWaitlistAdminMutation,
  useListAdSlotsAdminQuery,
  useListAdPackagesAdminQuery,
  useGetAdPaymentAlertsAdminQuery,
  useGetAdSelfServiceRequestsAdminQuery,
  useReviewAdSelfServiceRequestAdminMutation,
  useCreateAdPackageAdminMutation,
  useUpdateAdPackageAdminMutation,
  useQuoteAdPriceAdminMutation,
  useListBannersAdminQuery,
  useBannerDistributionAdminQuery,
  useBannerMetricsAdminQuery,
  useBannerConversionsAdminQuery,
  useBannerRevenueAdminQuery,
  useUpdateAdSlotAdminMutation,
  useUpdateAdWaitlistAdminMutation,
  useUpdateBannerAdminMutation,
} from '@/integrations/hooks';

const positionLabel = (value: string): string =>
  BANNER_POSITIONS.find((p) => p.value === value)?.label ?? value;
const lifecycleLabel: Record<string, string> = {
  draft: 'Taslak', proposal: 'Teklif', reserved: 'Rezerve', payment_pending: 'Ödeme bekliyor',
  scheduled: 'Planlandı', live: 'Yayında', completed: 'Tamamlandı', cancelled: 'İptal',
  problem: 'Sorunlu', archived: 'Arşiv',
};

function ctr(banner: BannerAdmin): string {
  if (!banner.impressions) return '—';
  return `%${((banner.clicks / banner.impressions) * 100).toFixed(1)}`;
}

export default function Page() {
  const [calendarDays, setCalendarDays] = useState(7);
  const [calendarDevice, setCalendarDevice] = useState<'all' | 'desktop' | 'mobile'>('all');
  const [waitForm, setWaitForm] = useState({ title: '', advertiser: '', position: 'global_footer', start: '', end: '', priority: '0', notes: '' });
  const [packageForm, setPackageForm] = useState({
    name: '', slug: '', billingPeriod: 'monthly', durationDays: '30', price: '',
    impressionLimit: '', clickLimit: '', slotKeys: [] as string[], includesFirmProfile: false,
  });
  const [priceForm, setPriceForm] = useState({
    slotKey: 'global_footer', device: 'all', durationDays: '30', startAt: new Date().toISOString().slice(0, 10),
    targetType: 'global', manualPrice: '', manualDiscountPercent: '', overrideReason: '',
  });
  const [priceQuote, setPriceQuote] = useState<AdPriceQuote | null>(null);
  const [requestReviewNotes, setRequestReviewNotes] = useState<Record<number, string>>({});
  const dateRange = useMemo(() => {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + calendarDays - 1);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, [calendarDays]);
  const monthRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);
  const previousMonthRange = useMemo(() => {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const to = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
  }, []);
  const { data, isLoading, refetch } = useListBannersAdminQuery(undefined);
  const { data: distribution } = useBannerDistributionAdminQuery();
  const { data: metrics } = useBannerMetricsAdminQuery(monthRange);
  const { data: conversions } = useBannerConversionsAdminQuery(monthRange);
  const { data: revenueData } = useBannerRevenueAdminQuery(monthRange);
  const { data: previousRevenueData } = useBannerRevenueAdminQuery(previousMonthRange);
  const { data: slotsData } = useListAdSlotsAdminQuery();
  const { data: calendar } = useAdCalendarAdminQuery(dateRange);
  const { data: availability } = useAdSlotAvailabilityAdminQuery({ at: dateRange.from, device: calendarDevice, horizonDays: 365 });
  const { data: waitlist } = useAdWaitlistSuggestionsAdminQuery({ at: dateRange.from });
  const { data: packagesData } = useListAdPackagesAdminQuery();
  const { data: paymentAlerts } = useGetAdPaymentAlertsAdminQuery();
  const { data: selfServiceRequests } = useGetAdSelfServiceRequestsAdminQuery({ status: 'pending' });
  const [deleteBanner] = useDeleteBannerAdminMutation();
  const [duplicateBanner] = useDuplicateBannerAdminMutation();
  const [updateBanner] = useUpdateBannerAdminMutation();
  const [updateSlot] = useUpdateAdSlotAdminMutation();
  const [createWaitlist, { isLoading: isCreatingWaitlist }] = useCreateAdWaitlistAdminMutation();
  const [updateWaitlist] = useUpdateAdWaitlistAdminMutation();
  const [createPackage, { isLoading: isCreatingPackage }] = useCreateAdPackageAdminMutation();
  const [updatePackage] = useUpdateAdPackageAdminMutation();
  const [quoteAdPrice, { isLoading: isQuotingPrice }] = useQuoteAdPriceAdminMutation();
  const [reviewSelfServiceRequest, { isLoading: isReviewingRequest }] = useReviewAdSelfServiceRequestAdminMutation();

  const banners = data?.items ?? [];
  const problemBanners = banners.filter((banner) => banner.lifecycleStatus === 'problem');
  const distributionIssues = (distribution?.items ?? []).filter((item) => Math.abs(item.variance) >= 0.15 || item.performanceStatus === 'low');
  const metricTotals = (metrics?.items ?? []).reduce((total, item) => ({
    impressions: total.impressions + item.impressions,
    uniqueImpressions: total.uniqueImpressions + item.uniqueImpressions,
    clicks: total.clicks + item.clicks,
    uniqueClicks: total.uniqueClicks + item.uniqueClicks,
  }), { impressions: 0, uniqueImpressions: 0, clicks: 0, uniqueClicks: 0 });
  const conversionTotal = (conversions?.items ?? []).reduce((sum, item) => sum + Number(item.conversions), 0);
  const revenue = revenueData?.data;
  const previousRevenue = previousRevenueData?.data;
  const slots = slotsData?.items ?? [];
  const now = Date.now();
  const oneWeek = now + 7 * 86_400_000;
  const activeCampaigns = banners.filter((banner) => banner.lifecycleStatus === 'live');
  const scheduledCampaigns = banners.filter((banner) => banner.lifecycleStatus === 'scheduled');
  const endingSoon = banners.filter((banner) => banner.endAt && new Date(banner.endAt).getTime() >= now && new Date(banner.endAt).getTime() <= oneWeek);
  const renewalCandidates = banners.filter((banner) => ['completed', 'live'].includes(banner.lifecycleStatus) && banner.endAt && new Date(banner.endAt).getTime() <= oneWeek && Boolean(banner.advertiser));
  const reservedRevenue = banners.filter((banner) => ['reserved', 'payment_pending', 'scheduled'].includes(banner.lifecycleStatus)).reduce((sum, banner) => sum + Number(banner.totalAmount), 0);
  const monthChange = previousRevenue?.totals.revenue
    ? ((Number(revenue?.totals.revenue ?? 0) - previousRevenue.totals.revenue) / previousRevenue.totals.revenue) * 100
    : null;
  const campaignRanking = [...(revenue?.campaigns ?? [])].filter((item) => item.impressions > 0).sort((a, b) => (b.clicks / b.impressions) - (a.clicks / a.impressions));
  const conversionRanking = [...(revenue?.campaigns ?? [])].filter((item) => item.conversions > 0).sort((a, b) => b.conversions - a.conversions);
  const deviceBreakdown = Object.entries((metrics?.items ?? []).reduce<Record<string, { impressions: number; clicks: number }>>((result, item) => {
    const value = result[item.device] ?? { impressions: 0, clicks: 0 };
    value.impressions += item.impressions; value.clicks += item.clicks; result[item.device] = value;
    return result;
  }, {}));
  const scopeBreakdown = Object.entries((metrics?.items ?? []).filter((item) => item.scopeKey.startsWith('city:') || item.scopeKey.startsWith('category:')).reduce<Record<string, number>>((result, item) => {
    result[item.scopeKey] = (result[item.scopeKey] ?? 0) + item.impressions;
    return result;
  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const creativeWaiting = banners.filter((banner) => banner.lifecycleStatus === 'reserved' && !banner.imageUrl && !banner.code);
  const approvalWaiting = banners.filter((banner) => banner.lifecycleStatus === 'proposal');
  const deliveryRisks = (distribution?.items ?? []).filter((item) => Math.abs(item.variance) >= 0.15 || (item.guaranteeProgress !== null && item.guaranteeProgress < 0.8));
  const emptyValuableSlots = [...slots].filter((slot) => slot.isActive && (availability?.items.find((item) => item.slotKey === slot.slotKey)?.available ?? 0) > 0).sort((a, b) => Number(b.baseDailyPrice) - Number(a.baseDailyPrice)).slice(0, 5);
  const dates = useMemo(() => Array.from({ length: calendarDays }, (_, index) => {
    const date = new Date(`${dateRange.from}T12:00:00`);
    date.setDate(date.getDate() + index);
    return date;
  }), [calendarDays, dateRange.from]);

  function bookingsFor(slotKey: string, date: Date) {
    const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date); dayEnd.setHours(23, 59, 59, 999);
    return (calendar?.bookings ?? []).filter((booking) => {
      if (booking.position !== slotKey) return false;
      if (calendarDevice !== 'all' && booking.device !== 'all' && booking.device !== calendarDevice) return false;
      const start = booking.startAt ? new Date(booking.startAt) : new Date(0);
      const end = booking.endAt ? new Date(booking.endAt) : new Date('2999-12-31');
      return start <= dayEnd && end >= dayStart;
    });
  }

  function calendarCapacity(slot: (typeof slots)[number]) {
    return calendarDevice === 'mobile' ? slot.mobileCapacity : slot.desktopCapacity;
  }

  function alternativesFor(slotKey: string, date: Date) {
    const source = slots.find((slot) => slot.slotKey === slotKey);
    if (!source) return [];
    return slots.filter((slot) =>
      slot.isActive &&
      slot.slotKey !== slotKey &&
      slot.pageType === source.pageType &&
      bookingsFor(slot.slotKey, date).length < calendarCapacity(slot)
    );
  }

  async function moveBooking(bookingId: number, targetPosition: string, targetDate: Date) {
    const booking = calendar?.bookings.find((item) => item.id === bookingId);
    if (!booking?.startAt || !booking.endAt) {
      toast.error('Başlangıç ve bitiş tarihi olmayan sürekli reklam takvimden taşınamaz.');
      return;
    }
    const start = new Date(booking.startAt);
    const end = new Date(booking.endAt);
    const duration = end.getTime() - start.getTime();
    const targetStart = new Date(targetDate);
    targetStart.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), start.getMilliseconds());
    try {
      await updateBanner({
        id: booking.id,
        patch: {
          position: targetPosition as BannerAdmin['position'],
          startAt: targetStart.toISOString(),
          endAt: new Date(targetStart.getTime() + duration).toISOString(),
        },
      }).unwrap();
      toast.success('Reklam tarihi ve slot uygunluk kontrolünden geçirilerek taşındı.');
    } catch (error) {
      const message = (error as { data?: { error?: string } })?.data?.error;
      toast.error(message ?? 'Reklam taşınamadı. Hedef tarih veya slot dolu olabilir.');
    }
  }

  async function handleDelete(banner: BannerAdmin) {
    if (!confirm(`"${banner.title}" reklamı silinsin mi?`)) return;
    await deleteBanner({ id: banner.id }).unwrap();
    await refetch();
    toast.success('Banner silindi');
  }

  async function handleDuplicate(banner: BannerAdmin) {
    const result = await duplicateBanner({ id: banner.id }).unwrap();
    toast.success('Reklam güvenli bir taslak kopya olarak oluşturuldu.');
    window.location.assign(`/admin/banners/${result.data.id}`);
  }

  async function handleCreateWaitlist() {
    if (!waitForm.title.trim()) {
      toast.error('Talep başlığı zorunlu.');
      return;
    }
    await createWaitlist({
      position: waitForm.position as BannerAdmin['position'],
      title: waitForm.title.trim(),
      advertiser: waitForm.advertiser.trim() || null,
      preferredStartAt: waitForm.start ? new Date(`${waitForm.start}T00:00:00`).toISOString() : null,
      preferredEndAt: waitForm.end ? new Date(`${waitForm.end}T23:59:59`).toISOString() : null,
      priority: Number(waitForm.priority) || 0,
      notes: waitForm.notes.trim() || null,
    }).unwrap();
    setWaitForm({ title: '', advertiser: '', position: 'global_footer', start: '', end: '', priority: '0', notes: '' });
    toast.success('Talep bekleme listesine eklendi.');
  }

  async function handleWaitlistStatus(id: number, status: 'offered' | 'converted' | 'cancelled') {
    await updateWaitlist({ id, patch: { status } }).unwrap();
    toast.success(status === 'offered' ? 'Teklif verildi olarak işaretlendi.' : status === 'cancelled' ? 'Talep iptal edildi.' : 'Talep reklama dönüştürüldü.');
  }

  async function handleConvertWaitlist(item: AdWaitlistItem) {
    await updateWaitlist({ id: item.id, patch: { status: 'converted' } }).unwrap();
    const target = item.alternatives?.[0]?.slotKey ?? item.position;
    window.location.assign(`/admin/banners/new?position=${target}&start=${item.requestedDate ?? dateRange.from}`);
  }

  async function handleCreatePackage() {
    if (!packageForm.name.trim() || !packageForm.slug.trim() || !packageForm.price) {
      toast.error('Paket adı, slug ve fiyat zorunlu.');
      return;
    }
    await createPackage({
      name: packageForm.name.trim(),
      slug: packageForm.slug.trim(),
      billingPeriod: packageForm.billingPeriod as 'daily' | 'weekly' | 'monthly' | 'custom',
      durationDays: Number(packageForm.durationDays) || 30,
      price: Number(packageForm.price),
      devices: ['all'],
      impressionLimit: packageForm.impressionLimit ? Number(packageForm.impressionLimit) : null,
      clickLimit: packageForm.clickLimit ? Number(packageForm.clickLimit) : null,
      includesFirmProfile: packageForm.includesFirmProfile,
      customPriceAllowed: true,
      slotKeys: packageForm.slotKeys as BannerAdmin['position'][],
    }).unwrap();
    setPackageForm({ name: '', slug: '', billingPeriod: 'monthly', durationDays: '30', price: '', impressionLimit: '', clickLimit: '', slotKeys: [], includesFirmProfile: false });
    toast.success('Reklam paketi oluşturuldu.');
  }

  async function handlePriceQuote() {
    try {
      const quote = await quoteAdPrice({
        slotKey: priceForm.slotKey as BannerAdmin['position'],
        device: priceForm.device as 'all' | 'desktop' | 'mobile',
        durationDays: Number(priceForm.durationDays) || 1,
        startAt: priceForm.startAt || null,
        targetTypes: [priceForm.targetType as 'global'],
        manualPrice: priceForm.manualPrice ? Number(priceForm.manualPrice) : undefined,
        manualDiscountPercent: priceForm.manualDiscountPercent ? Number(priceForm.manualDiscountPercent) : undefined,
        overrideReason: priceForm.overrideReason.trim() || undefined,
      }).unwrap();
      setPriceQuote(quote);
      toast.success(quote.overrideId ? 'Fiyat hesaplandı ve manuel değişiklik denetim kaydına yazıldı.' : 'Önerilen fiyat hesaplandı.');
    } catch (error) {
      const message = (error as { data?: { error?: string } })?.data?.error;
      toast.error(message ?? 'Fiyat hesaplanamadı.');
    }
  }

  async function handleRequestReview(id: number, status: 'approved' | 'rejected' | 'revision_requested') {
    const reviewNote = requestReviewNotes[id]?.trim();
    if (!reviewNote) {
      toast.error('Onay, ret veya revizyon için inceleme notu zorunlu.');
      return;
    }
    await reviewSelfServiceRequest({ id, status, reviewNote }).unwrap();
    setRequestReviewNotes((value) => ({ ...value, [id]: '' }));
    toast.success(status === 'approved' ? 'Talep onaylandı ve güvenli biçimde uygulandı.' : status === 'rejected' ? 'Talep reddedildi.' : 'Revizyon istendi.');
  }

  return (
    <div className="space-y-4">
      {(paymentAlerts?.items.length ?? 0) > 0 ? (
        <Card className="border-amber-300 bg-amber-50/40">
          <CardHeader>
            <CardTitle className="text-base text-amber-900">Geciken Reklam Ödemeleri</CardTitle>
            <CardDescription>Satış sorumlularının takip etmesi gereken ödeme tarihi geçmiş kampanyalar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {paymentAlerts?.items.map((item) => (
              <Link key={item.id} href={`/admin/banners/${item.id}`} className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-background p-3 text-sm">
                <div><div className="font-medium">{item.title}</div><div className="text-xs text-muted-foreground">{item.advertiser || 'Reklam veren yok'} · Sorumlu: {item.salesOwner || 'Atanmadı'}</div></div>
                <div className="text-right"><div className="font-semibold text-amber-800">{Number(item.totalAmount).toLocaleString('tr-TR')} ₺</div><div className="text-xs text-muted-foreground">{new Date(item.paymentDueAt).toLocaleDateString('tr-TR')}</div></div>
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {problemBanners.length > 0 ? (
        <Card className="border-red-300 bg-red-50/40">
          <CardHeader><CardTitle className="text-base text-red-900">Sorunlu Reklamlar</CardTitle><CardDescription>Otomatik kalite veya kaynak denetiminde yayından kaldırılan kampanyalar.</CardDescription></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {problemBanners.map((banner) => <Link key={banner.id} href={`/admin/banners/${banner.id}`} className="rounded-lg border border-red-200 bg-background p-3"><div className="font-medium">{banner.title}</div><div className="mt-1 text-xs text-muted-foreground">{banner.advertiser || 'Reklam veren yok'} · {banner.notes || 'Detay için kalite raporunu açın'}</div></Link>)}
          </CardContent>
        </Card>
      ) : null}
      {(selfServiceRequests?.items.length ?? 0) > 0 ? (
        <Card className="border-blue-300 bg-blue-50/30">
          <CardHeader><CardTitle className="text-base">Reklam Veren Onay Kuyruğu</CardTitle><CardDescription>Self-servis portalından gelen talepler. Kreatif ve süre değişiklikleri onay verilene kadar canlı kampanyayı değiştirmez.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {selfServiceRequests?.items.map((item) => (
              <div key={item.id} className="rounded-lg border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-2"><div><strong>{item.firmName}</strong><p className="text-xs text-muted-foreground">{item.bannerTitle || 'Yeni kampanya'} · {item.requestType} · {new Date(item.createdAt).toLocaleString('tr-TR')}</p></div><Badge variant="secondary">Onay bekliyor</Badge></div>
                <p className="mt-2 text-sm">{item.requesterNote || 'Açıklama girilmedi.'}</p>
                <pre className="mt-2 overflow-x-auto rounded bg-muted p-2 text-[10px]">{JSON.stringify(item.payload, null, 2)}</pre>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Input className="min-w-64 flex-1" value={requestReviewNotes[item.id] ?? ''} onChange={(event) => setRequestReviewNotes((value) => ({ ...value, [item.id]: event.target.value }))} placeholder="Reklam verene iletilecek karar / revizyon notu" />
                  <Button size="sm" disabled={isReviewingRequest} onClick={() => void handleRequestReview(item.id, 'approved')}>Onayla</Button>
                  <Button size="sm" variant="outline" disabled={isReviewingRequest} onClick={() => void handleRequestReview(item.id, 'revision_requested')}>Revizyon iste</Button>
                  <Button size="sm" variant="destructive" disabled={isReviewingRequest} onClick={() => void handleRequestReview(item.id, 'rejected')}>Reddet</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gelir ve Operasyon Dashboardu</CardTitle>
          <CardDescription>Bu ayın ticari durumu, boş envanter, performans ve müdahale gerektiren kampanyalar.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Bu ay gelir</p><strong>{Number(revenue?.totals.revenue ?? 0).toLocaleString('tr-TR')} ₺</strong><p className={`text-xs ${monthChange !== null && monthChange < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{monthChange === null ? 'Geçen ay karşılaştırması yok' : `${monthChange >= 0 ? '+' : ''}%${monthChange.toFixed(1)} geçen aya göre`}</p></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Rezerve gelir</p><strong>{reservedRevenue.toLocaleString('tr-TR')} ₺</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tahsil edilen</p><strong className="text-emerald-700">{Number(revenue?.totals.collected ?? 0).toLocaleString('tr-TR')} ₺</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tahsilat bekleyen</p><strong className="text-amber-700">{Number(revenue?.totals.outstanding ?? 0).toLocaleString('tr-TR')} ₺</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Kampanyalar</p><strong>{activeCampaigns.length} aktif · {scheduledCampaigns.length} planlı</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Yakında biten / yenileme</p><strong>{endingSoon.length} / {renewalCandidates.length}</strong></div>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Envanter ve satış fırsatları</h3>
              <p className="mt-1 text-xs text-muted-foreground">Genel doluluk %{((revenue?.totals.occupancyRate ?? 0) * 100).toFixed(1)} · Kapasite nedeniyle bekleyen {(waitlist?.items ?? []).length} talep</p>
              <div className="mt-3 space-y-2">
                {emptyValuableSlots.map((slot) => {
                  const availableCount = availability?.items.find((item) => item.slotKey === slot.slotKey)?.available ?? 0;
                  return <div key={slot.slotKey} className="flex justify-between gap-2 text-xs"><span className="truncate">{slot.label}</span><strong>{availableCount} boş · {Number(slot.baseDailyPrice).toLocaleString('tr-TR')} ₺/gün</strong></div>;
                })}
                {!emptyValuableSlots.length ? <p className="text-xs text-muted-foreground">Satışa açık boş slot bulunmuyor.</p> : null}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Performans liderleri</h3>
              <div className="mt-3 space-y-2 text-xs">
                {campaignRanking.slice(0, 3).map((item) => <Link key={item.bannerId} href={`/admin/banners/${item.bannerId}`} className="flex justify-between gap-2 hover:underline"><span className="truncate">{item.title}</span><strong>%{((item.clicks / item.impressions) * 100).toFixed(2)} CTR</strong></Link>)}
                {conversionRanking.slice(0, 3).map((item) => <div key={`conversion-${item.bannerId}`} className="flex justify-between gap-2"><span className="truncate">{item.advertiser || item.title}</span><strong>{item.conversions} dönüşüm</strong></div>)}
                {!campaignRanking.length ? <p className="text-muted-foreground">Bu ay ölçülmüş kampanya yok.</p> : null}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <h3 className="text-sm font-semibold">Operasyon uyarıları</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <span className="rounded bg-amber-50 p-2">Ödeme bekleyen <strong>{paymentAlerts?.items.length ?? 0}</strong></span>
                <span className="rounded bg-amber-50 p-2">Kreatif bekleyen <strong>{creativeWaiting.length}</strong></span>
                <span className="rounded bg-blue-50 p-2">Onay bekleyen <strong>{approvalWaiting.length}</strong></span>
                <span className="rounded bg-blue-50 p-2">7 günde bitecek <strong>{endingSoon.length}</strong></span>
                <span className="rounded bg-red-50 p-2">Bozuk kaynak/link <strong>{problemBanners.length}</strong></span>
                <span className="rounded bg-red-50 p-2">Dağıtım riski <strong>{deliveryRisks.length}</strong></span>
              </div>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4"><h3 className="text-sm font-semibold">Cihaz kırılımı</h3><div className="mt-2 flex flex-wrap gap-3 text-xs">{deviceBreakdown.map(([device, value]) => <span key={device}>{device}: <strong>{value.impressions.toLocaleString('tr-TR')}</strong> gösterim / {value.clicks} tıklama</span>)}{!deviceBreakdown.length ? <span className="text-muted-foreground">Veri yok.</span> : null}</div></div>
            <div className="rounded-lg border p-4"><h3 className="text-sm font-semibold">İl ve kategori kırılımı</h3><div className="mt-2 flex flex-wrap gap-2 text-xs">{scopeBreakdown.map(([scope, count]) => <Badge key={scope} variant="outline">{scope.replace(':', ': ')} · {count}</Badge>)}{!scopeBreakdown.length ? <span className="text-muted-foreground">Hedefli gösterim verisi yok.</span> : null}</div></div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Reklam Paketleri</CardTitle>
          <CardDescription>Fiyat, süre, dahil slotlar ve performans limitlerini merkezi olarak yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <Input value={packageForm.name} onChange={(event) => setPackageForm((prev) => ({ ...prev, name: event.target.value, slug: prev.slug || event.target.value.toLocaleLowerCase('tr-TR').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} placeholder="Paket adı" />
            <Input value={packageForm.slug} onChange={(event) => setPackageForm((prev) => ({ ...prev, slug: event.target.value }))} placeholder="paket-slug" />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={packageForm.billingPeriod} onChange={(event) => setPackageForm((prev) => ({ ...prev, billingPeriod: event.target.value }))}>
              <option value="daily">Günlük</option><option value="weekly">Haftalık</option><option value="monthly">Aylık</option><option value="custom">Özel</option>
            </select>
            <Input value={packageForm.durationDays} onChange={(event) => setPackageForm((prev) => ({ ...prev, durationDays: event.target.value }))} type="number" min={1} placeholder="Süre (gün)" />
            <Input value={packageForm.price} onChange={(event) => setPackageForm((prev) => ({ ...prev, price: event.target.value }))} type="number" min={0} placeholder="Fiyat ₺" />
            <Input value={packageForm.impressionLimit} onChange={(event) => setPackageForm((prev) => ({ ...prev, impressionLimit: event.target.value }))} type="number" min={1} placeholder="Gösterim limiti" />
            <Input value={packageForm.clickLimit} onChange={(event) => setPackageForm((prev) => ({ ...prev, clickLimit: event.target.value }))} type="number" min={1} placeholder="Tıklama limiti" />
            <Button type="button" variant={packageForm.includesFirmProfile ? 'default' : 'outline'} onClick={() => setPackageForm((prev) => ({ ...prev, includesFirmProfile: !prev.includesFirmProfile }))}>Firma profili + banner</Button>
          </div>
          <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
            {BANNER_POSITIONS.map((slot) => {
              const selected = packageForm.slotKeys.includes(slot.value);
              return <Button key={slot.value} type="button" size="sm" variant={selected ? 'default' : 'outline'} onClick={() => setPackageForm((prev) => ({ ...prev, slotKeys: selected ? prev.slotKeys.filter((key) => key !== slot.value) : [...prev.slotKeys, slot.value] }))}>{slot.label}</Button>;
            })}
          </div>
          <Button onClick={handleCreatePackage} disabled={isCreatingPackage}>Paket oluştur</Button>
          <div className="grid gap-3 md:grid-cols-3">
            {(packagesData?.items || []).map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <div><div className="font-semibold">{item.name}</div><div className="text-xs text-muted-foreground">{item.durationDays} gün · {Number(item.price).toLocaleString('tr-TR')} {item.currency}</div></div>
                  <Button size="sm" variant={item.isActive ? 'default' : 'outline'} onClick={() => updatePackage({ id: item.id, patch: { isActive: !item.isActive } })}>{item.isActive ? 'Aktif' : 'Pasif'}</Button>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">{item.slotKeys.map((key) => <Badge key={key} variant="outline">{positionLabel(key)}</Badge>)}</div>
                <div className="mt-2 text-xs text-muted-foreground">{item.devices.join(', ')}{item.impressionLimit ? ` · ${item.impressionLimit} gösterim` : ''}{item.clickLimit ? ` · ${item.clickLimit} tıklama` : ''}{item.includesFirmProfile ? ' · Firma profili dahil' : ''}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Otomatik Fiyat Önerisi</CardTitle>
          <CardDescription>Slot, süre, cihaz, hedefleme, sezon ve kapasiteye göre aynı koşullarda aynı fiyatı üretir.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 md:grid-cols-4">
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={priceForm.slotKey} onChange={(event) => setPriceForm((prev) => ({ ...prev, slotKey: event.target.value }))}>
              {slots.map((slot) => <option key={slot.slotKey} value={slot.slotKey}>{slot.label}</option>)}
            </select>
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={priceForm.device} onChange={(event) => setPriceForm((prev) => ({ ...prev, device: event.target.value }))}>
              <option value="all">Tüm cihazlar</option><option value="desktop">Masaüstü</option><option value="mobile">Mobil</option>
            </select>
            <Input type="number" min={1} value={priceForm.durationDays} onChange={(event) => setPriceForm((prev) => ({ ...prev, durationDays: event.target.value }))} placeholder="Süre (gün)" />
            <Input type="date" value={priceForm.startAt} onChange={(event) => setPriceForm((prev) => ({ ...prev, startAt: event.target.value }))} />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={priceForm.targetType} onChange={(event) => setPriceForm((prev) => ({ ...prev, targetType: event.target.value }))}>
              <option value="global">Global</option><option value="page_type">Sayfa türü</option><option value="city">İl</option><option value="district">İlçe</option><option value="product">Ürün</option><option value="category">Kategori</option><option value="market">Hal</option><option value="firm">Firma</option><option value="listing">İlan</option>
            </select>
            <Input type="number" min={0} value={priceForm.manualPrice} onChange={(event) => setPriceForm((prev) => ({ ...prev, manualPrice: event.target.value }))} placeholder="Manuel fiyat (opsiyonel)" />
            <Input type="number" min={0} max={100} value={priceForm.manualDiscountPercent} onChange={(event) => setPriceForm((prev) => ({ ...prev, manualDiscountPercent: event.target.value }))} placeholder="Manuel indirim %" />
            <Input value={priceForm.overrideReason} onChange={(event) => setPriceForm((prev) => ({ ...prev, overrideReason: event.target.value }))} placeholder="Manuel değişiklik gerekçesi" />
          </div>
          <Button onClick={handlePriceQuote} disabled={isQuotingPrice}>Fiyatı hesapla</Button>
          {priceQuote && 'suggestedPrice' in priceQuote ? (
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex flex-wrap items-end gap-6">
                <div><div className="text-xs text-muted-foreground">Önerilen</div><div className="text-2xl font-semibold">{Number(priceQuote.suggestedPrice).toLocaleString('tr-TR')} ₺</div></div>
                <div><div className="text-xs text-muted-foreground">Uygulanan</div><div className="text-xl font-medium">{Number(priceQuote.appliedPrice).toLocaleString('tr-TR')} ₺</div></div>
                <Badge variant="outline">%{priceQuote.discountPercent} indirim</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                {Object.entries(priceQuote.factors).map(([key, value]) => <span key={key} className="rounded border bg-background px-2 py-1">{key}: {value}</span>)}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <Megaphone className="h-4 w-4" />
              Reklam / Bannerlar
            </CardTitle>
            <CardDescription>
              Frontend slotlarında gösterilen reklamları yönet. Görsel veya HTML/kod, zamanlama,
              cihaz hedefleme ve tıklama/gösterim takibi.
            </CardDescription>
          </div>
          <Button size="sm" asChild>
            <Link href="/admin/banners/new">
              <Plus className="mr-1.5 h-4 w-4" />
              Yeni Banner
            </Link>
          </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reklam geliri</CardTitle>
          <CardDescription>Seçili tarih aralığındaki kampanyaların sözleşme, tahsilat ve birim maliyet özeti.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Kampanya geliri</p><strong>{Number(revenue?.totals.revenue ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tahsil edilen</p><strong className="text-emerald-600">{Number(revenue?.totals.collected ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tahsilat bekleyen</p><strong className="text-amber-600">{Number(revenue?.totals.outstanding ?? 0).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Envanter doluluğu</p><strong>%{((revenue?.totals.occupancyRate ?? 0) * 100).toFixed(1)}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">CPM</p><strong>{revenue?.totals.cpm == null ? '—' : `${revenue.totals.cpm.toFixed(2)} ₺`}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tıklama maliyeti</p><strong>{revenue?.totals.cpc == null ? '—' : `${revenue.totals.cpc.toFixed(2)} ₺`}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Dönüşüm maliyeti</p><strong>{revenue?.totals.cpa == null ? '—' : `${revenue.totals.cpa.toFixed(2)} ₺`}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Gelir üreten slot</p><strong>{revenue?.slots.filter((slot) => slot.revenue > 0).length ?? 0}</strong></div>
          </div>
          {(revenue?.slots.length ?? 0) > 0 ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {revenue?.slots.map((slot) => (
                <div key={slot.key} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                  <span>{positionLabel(slot.key)}</span>
                  <span className="text-right"><strong>{slot.revenue.toLocaleString('tr-TR')} ₺</strong><small className="ml-2 text-muted-foreground">%{(slot.occupancyRate * 100).toFixed(0)} dolu</small></span>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dağılım ve kreatif performansı</CardTitle>
          <CardDescription>Beklenen ağırlık payından %15’ten fazla sapan veya düşük CTR işaretlenen kampanyalar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-6">
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Gösterim</p><strong>{metricTotals.impressions.toLocaleString('tr-TR')}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tekil gösterim</p><strong>{metricTotals.uniqueImpressions.toLocaleString('tr-TR')}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tıklama</p><strong>{metricTotals.clicks.toLocaleString('tr-TR')}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Tekil tıklama</p><strong>{metricTotals.uniqueClicks.toLocaleString('tr-TR')}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">CTR</p><strong>%{metricTotals.impressions ? ((metricTotals.clicks / metricTotals.impressions) * 100).toFixed(2) : '0.00'}</strong></div>
            <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">Dönüşüm</p><strong>{conversionTotal.toLocaleString('tr-TR')}</strong></div>
          </div>
          {distributionIssues.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {distributionIssues.map((item) => (
                <Link key={item.id} href={`/admin/banners/${item.id}`} className="rounded-md border p-3 hover:bg-muted/40">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{item.title}</span>
                    <Badge variant={item.performanceStatus === 'low' ? 'destructive' : 'outline'}>{item.performanceStatus}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Beklenen %{(item.expectedShare * 100).toFixed(1)} · Gerçek %{(item.actualShare * 100).toFixed(1)}
                    {item.guaranteeProgress !== null ? ` · Garanti %${(item.guaranteeProgress * 100).toFixed(1)}` : ''}
                  </p>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Belirgin dağılım veya performans sorunu yok.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><ListPlus className="h-4 w-4" />Reklam Bekleme Listesi</CardTitle>
          <CardDescription>Dolu alan taleplerini kaydet; sistem tercih tarihinde hedef slotu ve aynı sayfa türündeki alternatifleri kontrol eder.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Talep / kampanya adı" value={waitForm.title} onChange={(event) => setWaitForm((prev) => ({ ...prev, title: event.target.value }))} />
            <Input placeholder="Reklam veren" value={waitForm.advertiser} onChange={(event) => setWaitForm((prev) => ({ ...prev, advertiser: event.target.value }))} />
            <select className="h-9 rounded-md border bg-background px-3 text-sm" value={waitForm.position} onChange={(event) => setWaitForm((prev) => ({ ...prev, position: event.target.value }))}>
              {slots.map((slot) => <option key={slot.slotKey} value={slot.slotKey}>{slot.label}</option>)}
            </select>
            <Input type="number" min={0} max={100} placeholder="Öncelik" value={waitForm.priority} onChange={(event) => setWaitForm((prev) => ({ ...prev, priority: event.target.value }))} />
            <label className="text-xs text-muted-foreground">Tercih başlangıcı<Input className="mt-1" type="date" value={waitForm.start} onChange={(event) => setWaitForm((prev) => ({ ...prev, start: event.target.value }))} /></label>
            <label className="text-xs text-muted-foreground">Tercih bitişi<Input className="mt-1" type="date" value={waitForm.end} onChange={(event) => setWaitForm((prev) => ({ ...prev, end: event.target.value }))} /></label>
            <Input className="xl:col-span-2" placeholder="Operasyon notu" value={waitForm.notes} onChange={(event) => setWaitForm((prev) => ({ ...prev, notes: event.target.value }))} />
            <Button onClick={handleCreateWaitlist} disabled={isCreatingWaitlist}>Bekleme listesine ekle</Button>
          </div>
          <div className="space-y-2">
            {(waitlist?.items ?? []).map((item) => {
              const targetAvailable = (item.requestedAvailable ?? 0) > 0;
              const bestAlternative = item.alternatives?.[0];
              return (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                  <div className="min-w-64">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{item.title}</span>
                      <Badge variant={item.status === 'offered' ? 'secondary' : 'outline'}>{item.status === 'offered' ? 'Teklif verildi' : 'Bekliyor'}</Badge>
                      <Badge variant="outline">Öncelik {item.priority}</Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">{item.advertiser || 'Reklam veren belirtilmedi'} · {positionLabel(item.position)} · {item.requestedDate}</div>
                    <div className={`mt-1 text-xs font-medium ${targetAvailable ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {targetAvailable
                        ? `Hedef slotta ${item.requestedAvailable} hücre boş`
                        : item.requestedNextAvailableAt
                          ? `Hedef dolu · ilk boş ${new Date(`${item.requestedNextAvailableAt}T12:00:00`).toLocaleDateString('tr-TR')}`
                          : 'Hedef slot 365 gün içinde boşalmıyor'}
                      {!targetAvailable && bestAlternative ? ` · Alternatif: ${bestAlternative.label}` : ''}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleWaitlistStatus(item.id, 'offered')}>Teklif verildi</Button>
                    <Button size="sm" onClick={() => void handleConvertWaitlist(item)}>Reklama dönüştür</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleWaitlistStatus(item.id, 'cancelled')}>İptal</Button>
                  </div>
                </div>
              );
            })}
            {(waitlist?.items ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Bekleyen reklam talebi yok.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><LayoutGrid className="h-4 w-4" />Reklam Slotları</CardTitle>
          <CardDescription>Satılabilir alanların merkezi kataloğu. Pasif slot frontend'de yeni reklam için kullanılamaz.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {slots.map((slot) => (
              <div key={slot.slotKey} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{slot.label}</div>
                    <div className="mt-1 font-mono text-[10px] text-muted-foreground">{slot.slotKey}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateSlot({ slotKey: slot.slotKey, patch: { isActive: !slot.isActive } })}
                  >
                    <Badge variant={slot.isActive ? 'default' : 'outline'}>{slot.isActive ? 'Satışa açık' : 'Kapalı'}</Badge>
                  </button>
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">{slot.placementDescription}</p>
                <div className="mt-3 flex flex-wrap gap-1">
                  <Badge variant="secondary">Masaüstü {slot.desktopCapacity}</Badge>
                  <Badge variant="secondary">Mobil {slot.mobileCapacity}</Badge>
                  <Badge variant="outline">{slot.deliveryMode === 'fixed' ? 'Sabit hücre' : 'Rotasyon'}</Badge>
                  {slot.recommendedSize ? <Badge variant="outline">{slot.recommendedSize}</Badge> : null}
                </div>
                <div className="mt-3 text-[11px] text-muted-foreground">
                  Kaynaklar: {slot.sourceTypes.join(', ')} · Mobil: {slot.mobileBehavior}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t pt-3">
                  <label className="text-[10px] text-muted-foreground">Baz ₺/gün<Input className="mt-1 h-7 text-xs" type="number" defaultValue={slot.baseDailyPrice} onBlur={(event) => updateSlot({ slotKey: slot.slotKey, patch: { baseDailyPrice: event.target.value } })} /></label>
                  <label className="text-[10px] text-muted-foreground">Trafik<Input className="mt-1 h-7 text-xs" type="number" step="0.01" defaultValue={slot.trafficMultiplier} onBlur={(event) => updateSlot({ slotKey: slot.slotKey, patch: { trafficMultiplier: event.target.value } })} /></label>
                  <label className="text-[10px] text-muted-foreground">Görünürlük<Input className="mt-1 h-7 text-xs" type="number" step="0.01" defaultValue={slot.visibilityMultiplier} onBlur={(event) => updateSlot({ slotKey: slot.slotKey, patch: { visibilityMultiplier: event.target.value } })} /></label>
                  <label className="text-[10px] text-muted-foreground">Masaüstü<Input className="mt-1 h-7 text-xs" type="number" step="0.01" defaultValue={slot.desktopMultiplier} onBlur={(event) => updateSlot({ slotKey: slot.slotKey, patch: { desktopMultiplier: event.target.value } })} /></label>
                  <label className="text-[10px] text-muted-foreground">Mobil<Input className="mt-1 h-7 text-xs" type="number" step="0.01" defaultValue={slot.mobileMultiplier} onBlur={(event) => updateSlot({ slotKey: slot.slotKey, patch: { mobileMultiplier: event.target.value } })} /></label>
                </div>
                <div className="mt-2 border-t pt-2 text-[11px]">
                  {(() => {
                    const item = availability?.items.find((entry) => entry.slotKey === slot.slotKey);
                    if (!item) return <span className="text-muted-foreground">Uygunluk hesaplanıyor…</span>;
                    if (item.available > 0) return <span className="font-medium text-emerald-700">Bugün {item.available} hücre boş</span>;
                    return <span className="font-medium text-amber-700">İlk boş tarih: {item.nextAvailableAt ? new Date(`${item.nextAvailableAt}T12:00:00`).toLocaleDateString('tr-TR') : '365 gün içinde yok'}</span>;
                  })()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base"><CalendarDays className="h-4 w-4" />Envanter Takvimi</CardTitle>
            <CardDescription>Gelecek reklam doluluğu. Bir hücreye tıklayarak ilgili slotta yeni reklam oluşturabilirsin.</CardDescription>
          </div>
          <div className="flex flex-wrap justify-end gap-1">
            <select
              aria-label="Takvim cihazı"
              className="h-9 rounded-md border bg-background px-2 text-xs"
              value={calendarDevice}
              onChange={(event) => setCalendarDevice(event.target.value as 'all' | 'desktop' | 'mobile')}
            >
              <option value="all">Tüm cihazlar</option>
              <option value="desktop">Masaüstü</option>
              <option value="mobile">Mobil</option>
            </select>
            {[7, 30, 90].map((days) => (
              <Button key={days} size="sm" variant={calendarDays === days ? 'default' : 'outline'} onClick={() => setCalendarDays(days)}>
                {days === 7 ? '1 Hafta' : days === 30 ? '1 Ay' : '3 Ay'}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-max w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/50">
                  <th className="sticky left-0 z-10 min-w-52 border-r bg-muted px-3 py-2 text-left">Slot</th>
                  {dates.map((date) => <th key={date.toISOString()} className="min-w-16 border-r px-2 py-2 font-medium">{date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}</th>)}
                </tr>
              </thead>
              <tbody>
                {slots.filter((slot) => slot.isActive).map((slot) => (
                  <tr key={slot.slotKey} className="border-t">
                    <td className="sticky left-0 z-10 border-r bg-background px-3 py-2">
                      <div className="max-w-48 truncate font-medium">{slot.label}</div>
                      <div className="text-[10px] text-muted-foreground">{calendarCapacity(slot)} hücre · {calendarDevice === 'all' ? 'masaüstü bazlı' : calendarDevice}</div>
                    </td>
                    {dates.map((date) => {
                      const bookings = bookingsFor(slot.slotKey, date);
                      const occupied = bookings.length;
                      const capacity = calendarCapacity(slot);
                      const full = occupied >= capacity;
                      const partial = occupied > 0 && !full;
                      const alternatives = full ? alternativesFor(slot.slotKey, date) : [];
                      return (
                        <td
                          key={date.toISOString()}
                          className="border-r p-1 text-center"
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={(event) => {
                            event.preventDefault();
                            const bookingId = Number(event.dataTransfer.getData('application/x-hal-banner-id'));
                            if (Number.isFinite(bookingId)) void moveBooking(bookingId, slot.slotKey, date);
                          }}
                        >
                          <Link
                            href={`/admin/banners/new?position=${slot.slotKey}&start=${date.toISOString().slice(0, 10)}&device=${calendarDevice}`}
                            title={[
                              bookings.map((booking) => {
                                const scopes = booking.targets.filter((target) => target.scopeType !== 'global').map((target) => `${target.scopeType}:${target.scopeValue}`).join(', ');
                                return `${booking.title} [${booking.device}]${scopes ? ` — ${scopes}` : ''}`;
                              }).join(', ') || 'Boş',
                              alternatives.length ? `Alternatif: ${alternatives.map((item) => item.label).join(', ')}` : '',
                            ].filter(Boolean).join(' · ')}
                            className={`block rounded px-1 py-2 font-semibold ${full ? 'bg-red-500/15 text-red-700' : partial ? 'bg-amber-500/15 text-amber-700' : 'bg-emerald-500/12 text-emerald-700'}`}
                          >
                            {occupied}/{capacity}
                          </Link>
                          {calendarDays === 7 && bookings.slice(0, 2).map((booking) => (
                            <button
                              key={booking.id}
                              type="button"
                              draggable={Boolean(booking.startAt && booking.endAt)}
                              onDragStart={(event) => event.dataTransfer.setData('application/x-hal-banner-id', String(booking.id))}
                              onClick={() => window.location.assign(`/admin/banners/${booking.id}`)}
                              className="mt-1 block max-w-16 truncate rounded border bg-background px-1 py-0.5 text-[9px]"
                              title={`${booking.title} · ${booking.device}${booking.targets.length ? ` · ${booking.targets.map((target) => target.scopeType === 'global' ? 'global' : `${target.scopeType}:${target.scopeValue}`).join(', ')}` : ''}${booking.startAt && booking.endAt ? ' — taşımak için sürükle' : ' — sürekli yayın'}`}
                            >
                              {booking.title} · {booking.device === 'desktop' ? 'M' : booking.device === 'mobile' ? 'Mob' : 'Tümü'}
                            </button>
                          ))}
                          {calendarDays === 7 && alternatives.length > 0 ? (
                            <div className="mt-1 max-w-16 truncate text-[8px] text-muted-foreground" title={alternatives.map((item) => item.label).join(', ')}>
                              Alternatif: {alternatives[0].label}
                            </div>
                          ) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-emerald-500/50" />Boş</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-amber-500/50" />Kısmen dolu</span>
            <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded bg-red-500/50" />Dolu</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Banner</TableHead>
                <TableHead>Slot</TableHead>
                <TableHead>Tip</TableHead>
                <TableHead>Cihaz</TableHead>
                <TableHead className="text-right">Gösterim</TableHead>
                <TableHead className="text-right">Tıklama</TableHead>
                <TableHead className="text-right">CTR</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={9}>Yükleniyor...</TableCell>
                </TableRow>
              )}
              {!isLoading && banners.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9}>Henüz banner yok. "Yeni Banner" ile ilk reklamı ekleyin.</TableCell>
                </TableRow>
              )}
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="min-w-[240px] whitespace-normal">
                    <Link href={`/admin/banners/${banner.id}`} className="font-medium hover:underline">
                      {banner.title}
                    </Link>
                    {banner.advertiser && (
                      <div className="mt-0.5 text-muted-foreground text-xs">{banner.advertiser}</div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{positionLabel(banner.position)}</TableCell>
                  <TableCell className="text-sm">{banner.type === 'code' ? 'Kod' : 'Görsel'}</TableCell>
                  <TableCell className="text-sm">{banner.device}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{banner.impressions}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{banner.clicks}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{ctr(banner)}</TableCell>
                  <TableCell>
                    <Badge variant={banner.lifecycleStatus === 'live' ? 'default' : banner.lifecycleStatus === 'problem' || banner.lifecycleStatus === 'cancelled' ? 'destructive' : 'outline'}>
                      {lifecycleLabel[banner.lifecycleStatus] ?? banner.lifecycleStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/banners/${banner.id}`}>
                          <Edit className="mr-1.5 h-4 w-4" />
                          Düzenle
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleDuplicate(banner)} title="Taslak kopya oluştur">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(banner)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
