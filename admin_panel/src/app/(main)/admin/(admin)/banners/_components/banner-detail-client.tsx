'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Megaphone, Save } from 'lucide-react';
import { toast } from 'sonner';

import { AdminImageUploadField } from '@/components/common/admin-image-upload-field';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  BANNER_DEVICES,
  BANNER_POSITIONS,
  BANNER_TYPES,
  type BannerAdmin,
  type BannerDevice,
  type BannerLifecycleStatus,
  type BannerPaymentStatus,
  type BannerPosition,
  type BannerSourceType,
  type BannerScopeType,
  type BannerType,
  type BannerUpsert,
} from '@/integrations/endpoints/banners-admin-endpoints';
import {
  useCreateBannerAdminMutation,
  useCreateAdPaymentAdminMutation,
  useBannerInventoryAdminQuery,
  useGetAdPaymentsAdminQuery,
  useGetBannerAdminQuery,
  useGetBannerPerformanceAdminQuery,
  useGetBannerAuditAdminQuery,
  useGetBannerQualityAdminQuery,
  useUpdateBannerAdminMutation,
} from '@/integrations/hooks';
import { resolveMediaUrl } from '@/lib/media-url';
import { BASE_URL } from '@/integrations/api-base';
import { tokenStore } from '@/integrations/core/token';
import { VistaSeedsPreview } from './vistaseeds-preview';

type FormState = {
  position: BannerPosition;
  title: string;
  advertiser: string;
  notes: string;
  type: BannerType;
  sourceType: BannerSourceType;
  lifecycleStatus: BannerLifecycleStatus;
  paymentStatus: BannerPaymentStatus;
  paymentOverride: boolean;
  paymentOverrideReason: string;
  totalAmount: string;
  paymentDueAt: string;
  paymentGraceHours: string;
  invoiceNumber: string;
  invoiceUrl: string;
  contractFileUrl: string;
  creativeFileUrl: string;
  creativeTemplate: BannerAdmin['creativeTemplate'];
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  animation: boolean;
  logoUrl: string;
  backgroundImageUrl: string;
  description: string;
  focalX: string;
  focalY: string;
  imageFit: 'cover' | 'contain';
  imageWidth: number;
  imageHeight: number;
  imageBytes: number;
  qualityOverrideReason: string;
  listingId: string;
  imageUrl: string;
  alt: string;
  linkUrl: string;
  linkTarget: string;
  rel: string;
  code: string;
  caption: string;
  ctaLabel: string;
  device: BannerDevice;
  desktopRow: string;
  desktopColumns: string;
  weight: string;
  impressionLimit: string;
  clickLimit: string;
  dailyImpressionLimit: string;
  visitorDailyImpressionLimit: string;
  visitorCampaignImpressionLimit: string;
  experimentKey: string;
  creativeVariant: string;
  autoOptimize: boolean;
  minimumOptimizationImpressions: string;
  displayOrder: string;
  isActive: boolean;
  startAt: string;
  endAt: string;
  reservationExpiresAt: string;
  salesOwner: string;
  cancellationReason: string;
  reportEmail: string;
  weeklyReportEnabled: boolean;
  targetType: BannerScopeType;
  targetValues: string;
};

type TargetOption = { value: string; label: string; reach: number; exampleUrl: string | null };

function emptyForm(): FormState {
  return {
    position: 'home_mid',
    title: '',
    advertiser: '',
    notes: '',
    type: 'image',
    sourceType: 'custom',
    lifecycleStatus: 'draft',
    paymentStatus: 'unpaid',
    paymentOverride: false,
    paymentOverrideReason: '',
    totalAmount: '0',
    paymentDueAt: '',
    paymentGraceHours: '72',
    invoiceNumber: '',
    invoiceUrl: '',
    contractFileUrl: '',
    creativeFileUrl: '',
    creativeTemplate: 'image',
    backgroundColor: '#123d2a',
    textColor: '#ffffff',
    accentColor: '#8ef05b',
    animation: false,
    logoUrl: '',
    backgroundImageUrl: '',
    description: '',
    focalX: '50',
    focalY: '50',
    imageFit: 'cover',
    imageWidth: 0,
    imageHeight: 0,
    imageBytes: 0,
    qualityOverrideReason: '',
    listingId: '',
    imageUrl: '',
    alt: '',
    linkUrl: '',
    linkTarget: '_blank',
    rel: 'sponsored nofollow noopener',
    code: '',
    caption: '',
    ctaLabel: '',
    device: 'all',
    desktopRow: '1',
    desktopColumns: '1',
    weight: '1',
    impressionLimit: '',
    clickLimit: '',
    dailyImpressionLimit: '',
    visitorDailyImpressionLimit: '3',
    visitorCampaignImpressionLimit: '20',
    experimentKey: '',
    creativeVariant: '',
    autoOptimize: false,
    minimumOptimizationImpressions: '1000',
    displayOrder: '0',
    isActive: false,
    startAt: '',
    endAt: '',
    reservationExpiresAt: '',
    salesOwner: '',
    cancellationReason: '',
    reportEmail: '',
    weeklyReportEnabled: false,
    targetType: 'global',
    targetValues: '',
  };
}

function toForm(b: BannerAdmin): FormState {
  return {
    position: b.position,
    title: b.title,
    advertiser: b.advertiser ?? '',
    notes: b.notes ?? '',
    type: b.type,
    sourceType: b.sourceType ?? (b.type === 'code' ? 'code' : 'custom'),
    lifecycleStatus: b.lifecycleStatus ?? (b.isActive ? 'live' : 'draft'),
    paymentStatus: b.paymentStatus ?? 'unpaid',
    paymentOverride: Boolean(b.paymentOverride),
    paymentOverrideReason: b.paymentOverrideReason ?? '',
    totalAmount: b.totalAmount ?? '0',
    paymentDueAt: b.paymentDueAt ? b.paymentDueAt.slice(0, 16) : '',
    paymentGraceHours: String(b.paymentGraceHours ?? 72),
    invoiceNumber: b.invoiceNumber ?? '',
    invoiceUrl: b.invoiceUrl ?? '',
    contractFileUrl: b.contractFileUrl ?? '',
    creativeFileUrl: b.creativeFileUrl ?? '',
    creativeTemplate: b.creativeTemplate ?? 'image',
    backgroundColor: b.creativeConfig?.backgroundColor ?? '#123d2a',
    textColor: b.creativeConfig?.textColor ?? '#ffffff',
    accentColor: b.creativeConfig?.accentColor ?? '#8ef05b',
    animation: Boolean(b.creativeConfig?.animation),
    logoUrl: b.creativeConfig?.logoUrl ?? '',
    backgroundImageUrl: b.creativeConfig?.backgroundImageUrl ?? '',
    description: b.creativeConfig?.description ?? '',
    focalX: String(b.creativeConfig?.focalX ?? 50),
    focalY: String(b.creativeConfig?.focalY ?? 50),
    imageFit: b.creativeConfig?.imageFit ?? 'cover',
    imageWidth: b.creativeConfig?.imageWidth ?? 0,
    imageHeight: b.creativeConfig?.imageHeight ?? 0,
    imageBytes: b.creativeConfig?.imageBytes ?? 0,
    qualityOverrideReason: b.qualityOverrideReason ?? '',
    listingId: b.listingId ? String(b.listingId) : '',
    imageUrl: b.imageUrl ?? '',
    alt: b.alt ?? '',
    linkUrl: b.linkUrl ?? '',
    linkTarget: b.linkTarget || '_blank',
    rel: b.rel || 'sponsored nofollow noopener',
    code: b.code ?? '',
    caption: b.caption ?? '',
    ctaLabel: b.ctaLabel ?? '',
    device: b.device,
    desktopRow: String(b.desktopRow ?? 1),
    desktopColumns: String(b.desktopColumns ?? 1),
    weight: String(b.weight ?? 1),
    impressionLimit: b.impressionLimit ? String(b.impressionLimit) : '',
    clickLimit: b.clickLimit ? String(b.clickLimit) : '',
    dailyImpressionLimit: b.dailyImpressionLimit ? String(b.dailyImpressionLimit) : '',
    visitorDailyImpressionLimit: String(b.visitorDailyImpressionLimit ?? 3),
    visitorCampaignImpressionLimit: String(b.visitorCampaignImpressionLimit ?? 20),
    experimentKey: b.experimentKey ?? '',
    creativeVariant: b.creativeVariant ?? '',
    autoOptimize: Boolean(b.autoOptimize),
    minimumOptimizationImpressions: String(b.minimumOptimizationImpressions ?? 1000),
    displayOrder: String(b.displayOrder ?? 0),
    isActive: Boolean(b.isActive),
    startAt: b.startAt ? b.startAt.slice(0, 16) : '',
    endAt: b.endAt ? b.endAt.slice(0, 16) : '',
    reservationExpiresAt: b.reservationExpiresAt ? b.reservationExpiresAt.slice(0, 16) : '',
    salesOwner: b.salesOwner ?? '',
    cancellationReason: b.cancellationReason ?? '',
    reportEmail: b.reportEmail ?? '',
    weeklyReportEnabled: Boolean(b.weeklyReportEnabled),
    targetType: b.targets?.[0]?.scopeType ?? 'global',
    targetValues: (b.targets ?? []).map((target) => target.scopeValue).filter(Boolean).join(', '),
  };
}

function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

const positionSize = (value: string): string =>
  BANNER_POSITIONS.find((p) => p.value === value)?.size ?? '';

interface Props {
  id: string;
}

export function BannerDetailClient({ id }: Props) {
  const router = useRouter();
  const isNew = id === 'new';
  const { data: banner, refetch } = useGetBannerAdminQuery({ id }, { skip: isNew });
  const { data: quality, refetch: refetchQuality } = useGetBannerQualityAdminQuery({ id }, { skip: isNew });
  const { data: payments } = useGetAdPaymentsAdminQuery({ id }, { skip: isNew });
  const [reportRange, setReportRange] = useState(() => ({
    from: new Date(Date.now() - 29 * 86_400_000).toISOString().slice(0, 10),
    to: new Date().toISOString().slice(0, 10),
  }));
  const { data: performanceResult, isFetching: isPerformanceLoading } = useGetBannerPerformanceAdminQuery(
    { id, ...reportRange },
    { skip: isNew },
  );
  const performance = performanceResult?.data;
  const { data: auditData } = useGetBannerAuditAdminQuery({ id }, { skip: isNew });
  const [createBanner, { isLoading: isCreating }] = useCreateBannerAdminMutation();
  const [createPayment, { isLoading: isCreatingPayment }] = useCreateAdPaymentAdminMutation();
  const [updateBanner, { isLoading: isUpdating }] = useUpdateBannerAdminMutation();

  const [form, setForm] = useState<FormState>(() => emptyForm());
  const [paymentForm, setPaymentForm] = useState({
    transactionType: 'payment', amount: '', paymentMethod: 'bank_transfer',
    paidAt: new Date().toISOString().slice(0, 16), referenceNumber: '', notes: '',
  });
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [previewReducedMotion, setPreviewReducedMotion] = useState(false);
  const { data: inventory } = useBannerInventoryAdminQuery({ position: form.position });
  const [listingOptions, setListingOptions] = useState<Array<{ id: number; title: string; productName: string; citySlug: string | null }>>([]);
  const [targetSearch, setTargetSearch] = useState('');
  const [targetOptions, setTargetOptions] = useState<TargetOption[]>([]);
  const initializedRef = useRef<string | null>(null);
  const isSaving = isCreating || isUpdating;

  useEffect(() => {
    if (isNew) {
      const params = new URLSearchParams(window.location.search);
      const requestedPosition = params.get('position');
      const requestedStart = params.get('start');
      const next = emptyForm();
      if (BANNER_POSITIONS.some((position) => position.value === requestedPosition)) {
        next.position = requestedPosition as BannerPosition;
      }
      if (requestedStart && /^\d{4}-\d{2}-\d{2}$/.test(requestedStart)) next.startAt = `${requestedStart}T00:00`;
      initializedRef.current = 'new';
      setForm(next);
      return;
    }
    if (!banner) return;
    const key = `${banner.id}-${banner.updatedAt ?? ''}`;
    if (initializedRef.current === key) return;
    initializedRef.current = key;
    setForm(toForm(banner));
  }, [isNew, banner]);

  useEffect(() => {
    const token = tokenStore.get();
    void fetch(`${BASE_URL}/admin/listings?status=approved&limit=100`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then(async (res) => {
      if (!res.ok) return;
      const body = await res.json() as { items?: Array<{ id: number; title: string; productName: string; citySlug: string | null }> };
      setListingOptions(body.items ?? []);
    });
  }, []);

  useEffect(() => {
    const token = tokenStore.get();
    const controller = new AbortController();
    const search = new URLSearchParams({ type: form.targetType });
    if (targetSearch.trim()) search.set('q', targetSearch.trim());
    void fetch(`${BASE_URL}/admin/banners/target-options?${search}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      signal: controller.signal,
    }).then(async (res) => {
      if (!res.ok) return;
      const body = await res.json() as { items?: TargetOption[] };
      setTargetOptions(body.items ?? []);
    }).catch(() => undefined);
    return () => controller.abort();
  }, [form.targetType, targetSearch]);

  useEffect(() => {
    if (!form.imageUrl) return;
    const image = new window.Image();
    image.onload = () => setForm((prev) => ({ ...prev, imageWidth: image.naturalWidth, imageHeight: image.naturalHeight }));
    image.src = resolveMediaUrl(form.imageUrl);
    void fetch(resolveMediaUrl(form.imageUrl), { method: 'HEAD' }).then((response) => {
      const bytes = Number(response.headers.get('content-length') || 0);
      if (bytes) setForm((prev) => ({ ...prev, imageBytes: bytes }));
    }).catch(() => undefined);
  }, [form.imageUrl]);

  const selectedTargetValues = useMemo(
    () => form.targetValues.split(',').map((value) => value.trim()).filter(Boolean),
    [form.targetValues],
  );
  const estimatedReach = useMemo(
    () => selectedTargetValues.reduce((sum, value) => sum + (targetOptions.find((option) => option.value === value)?.reach ?? 0), 0),
    [selectedTargetValues, targetOptions],
  );
  const filteredPositions = useMemo(() => {
    const byTarget: Partial<Record<BannerScopeType, BannerPosition[]>> = {
      firm: ['firm_detail_sidebar', 'firm_detail_footer'],
      listing: ['listing_detail_sidebar'],
      product: ['urun_sidebar', 'prices_top', 'prices_sidebar', 'home_mid'],
      category: ['urun_sidebar', 'prices_top', 'prices_sidebar', 'home_mid'],
      market: ['hal_sidebar'],
    };
    const allowed = byTarget[form.targetType];
    if (!allowed) return BANNER_POSITIONS;
    return BANNER_POSITIONS.filter((position) => allowed.includes(position.value) || position.value === form.position);
  }, [form.position, form.targetType]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Başlık zorunlu.');
      return;
    }
    if (form.type === 'image' && form.sourceType === 'custom' && !form.imageUrl.trim() && !vistaVariant) {
      toast.error('Görsel tipinde kapak görseli zorunlu.');
      return;
    }
    if (form.sourceType === 'listing' && !form.listingId) {
      toast.error('İlan kaynağı seçin.');
      return;
    }
    if (form.type === 'code' && !form.code.trim()) {
      toast.error('Kod tipinde HTML/kod zorunlu.');
      return;
    }
    if (form.targetType !== 'global' && !form.targetValues.trim()) {
      toast.error('Seçilen hedefleme için en az bir değer girin.');
      return;
    }

    const payload: BannerUpsert = {
      position: form.position,
      title: form.title.trim(),
      advertiser: form.advertiser.trim() || null,
      notes: form.notes.trim() || null,
      type: form.type,
      sourceType: form.sourceType,
      lifecycleStatus: form.lifecycleStatus,
      paymentStatus: form.paymentStatus,
      paymentOverride: form.paymentOverride,
      paymentOverrideReason: form.paymentOverrideReason.trim() || null,
      totalAmount: Number(form.totalAmount) || 0,
      paymentDueAt: toIso(form.paymentDueAt),
      paymentGraceHours: Number(form.paymentGraceHours) || 72,
      invoiceNumber: form.invoiceNumber.trim() || null,
      invoiceUrl: form.invoiceUrl.trim() || null,
      contractFileUrl: form.contractFileUrl.trim() || null,
      creativeFileUrl: form.creativeFileUrl.trim() || null,
      creativeTemplate: form.creativeTemplate,
      creativeConfig: {
        backgroundColor: form.backgroundColor,
        textColor: form.textColor,
        accentColor: form.accentColor,
        animation: form.animation,
        logoUrl: form.logoUrl.trim(),
        backgroundImageUrl: form.backgroundImageUrl.trim(),
        description: form.description.trim(),
        focalX: Number(form.focalX),
        focalY: Number(form.focalY),
        imageFit: form.imageFit,
        imageWidth: form.imageWidth || undefined,
        imageHeight: form.imageHeight || undefined,
        imageBytes: form.imageBytes || undefined,
      },
      qualityOverrideReason: form.qualityOverrideReason.trim() || null,
      listingId: form.sourceType === 'listing' ? Number(form.listingId) : null,
      imageUrl: form.imageUrl.trim() || null,
      alt: form.alt.trim() || null,
      linkUrl: form.linkUrl.trim() || null,
      linkTarget: form.linkTarget || '_blank',
      rel: form.rel || 'sponsored nofollow noopener',
      code: form.code.trim() || null,
      caption: form.caption.trim() || null,
      ctaLabel: form.ctaLabel.trim() || null,
      device: form.device,
      desktopRow: Number(form.desktopRow) || 1,
      desktopColumns: Number(form.desktopColumns) || 1,
      weight: Number(form.weight) || 1,
      impressionLimit: form.impressionLimit ? Number(form.impressionLimit) : null,
      clickLimit: form.clickLimit ? Number(form.clickLimit) : null,
      dailyImpressionLimit: form.dailyImpressionLimit ? Number(form.dailyImpressionLimit) : null,
      visitorDailyImpressionLimit: Number(form.visitorDailyImpressionLimit) || 3,
      visitorCampaignImpressionLimit: Number(form.visitorCampaignImpressionLimit) || 20,
      experimentKey: form.experimentKey.trim() || null,
      creativeVariant: form.creativeVariant.trim() || null,
      autoOptimize: form.autoOptimize,
      minimumOptimizationImpressions: Number(form.minimumOptimizationImpressions) || 1000,
      displayOrder: Number(form.displayOrder) || 0,
      isActive: form.lifecycleStatus === 'live' || form.lifecycleStatus === 'scheduled',
      startAt: toIso(form.startAt),
      endAt: toIso(form.endAt),
      reservationExpiresAt: toIso(form.reservationExpiresAt),
      salesOwner: form.salesOwner.trim() || null,
      cancellationReason: form.cancellationReason.trim() || null,
      reportEmail: form.reportEmail.trim() || null,
      weeklyReportEnabled: form.weeklyReportEnabled,
      targets: form.targetType === 'global'
        ? [{ scopeType: 'global', scopeValue: null }]
        : form.targetValues.split(',').map((value) => value.trim()).filter(Boolean).map((scopeValue) => ({
            scopeType: form.targetType,
            scopeValue,
          })),
    };

    if (isNew) {
      const result = await createBanner(payload).unwrap();
      toast.success('Banner oluşturuldu');
      router.replace(`/admin/banners/${result.data.id}`);
      return;
    }

    if (!banner) return;
    await updateBanner({ id: banner.id, patch: payload }).unwrap();
    initializedRef.current = null;
    await refetch();
    await refetchQuality();
    toast.success('Banner kaydedildi');
  }

  async function handleCreatePayment() {
    if (isNew || !banner || Number(paymentForm.amount) <= 0) {
      toast.error('Geçerli bir işlem tutarı girin.');
      return;
    }
    try {
      await createPayment({
        id: banner.id,
        transactionType: paymentForm.transactionType as 'payment' | 'refund',
        amount: Number(paymentForm.amount),
        paymentMethod: paymentForm.paymentMethod as 'cash' | 'bank_transfer' | 'card' | 'other',
        paidAt: toIso(paymentForm.paidAt)!,
        referenceNumber: paymentForm.referenceNumber.trim() || null,
        notes: paymentForm.notes.trim() || null,
      }).unwrap();
      setPaymentForm((prev) => ({ ...prev, amount: '', referenceNumber: '', notes: '' }));
      initializedRef.current = null;
      await refetch();
      toast.success(paymentForm.transactionType === 'refund' ? 'İade kaydedildi.' : 'Ödeme kaydedildi.');
    } catch (error) {
      const message = (error as { data?: { error?: string } })?.data?.error;
      toast.error(message ?? 'İşlem kaydedilemedi.');
    }
  }

  async function downloadProposal() {
    if (isNew || !banner) return;
    const token = tokenStore.get();
    const response = await fetch(`${BASE_URL}/admin/banners/${banner.id}/documents/proposal.pdf`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      toast.error('Teklif PDF’i oluşturulamadı.');
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reklam-teklifi-${banner.id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPerformance(format: 'csv' | 'pdf') {
    if (isNew || !banner) return;
    const token = tokenStore.get();
    const query = new URLSearchParams(reportRange);
    const response = await fetch(`${BASE_URL}/admin/banners/${banner.id}/performance.${format}?${query}`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      toast.error('Performans raporu oluşturulamadı.');
      return;
    }
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `kampanya-performans-${banner.id}.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const previewImg = form.imageUrl ? resolveMediaUrl(form.imageUrl) : '';
  const vistaVariant = !isNew && id === '3' ? 'sidebar' : !isNew && id === '5' ? 'leaderboard' : null;
  const selectedInventory = inventory?.items.find((item) => item.row === Number(form.desktopRow));
  const livePreviewUrl = useMemo(() => {
    const params = new URLSearchParams({
      id: isNew ? '0' : id,
      position: form.position,
      title: form.title,
      advertiser: form.advertiser,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl,
      caption: form.caption,
      ctaLabel: form.ctaLabel,
      template: form.creativeTemplate,
      backgroundColor: form.backgroundColor,
      textColor: form.textColor,
      accentColor: form.accentColor,
      animation: form.animation ? '1' : '0',
      logoUrl: form.logoUrl,
      backgroundImageUrl: form.backgroundImageUrl,
      description: form.description,
      focalX: form.focalX,
      focalY: form.focalY,
      imageFit: form.imageFit,
      theme: previewTheme,
      motion: previewReducedMotion ? 'reduced' : 'normal',
    });
    return `/ad-preview?${params.toString()}`;
  }, [form, id, isNew, previewReducedMotion, previewTheme]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/admin/banners')}>
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Liste
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-semibold text-lg">
              <Megaphone className="h-5 w-5" />
              {isNew ? 'Yeni Banner' : 'Banner Düzenle'}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? 'Yeni reklam pasif olarak oluşturulur.' : `Gösterim: ${banner?.impressions ?? 0} · Tıklama: ${banner?.clicks ?? 0}`}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {!isNew && quality ? (
        <Card className={quality.status === 'error' ? 'border-red-300' : quality.status === 'warning' ? 'border-amber-300' : 'border-emerald-300'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>Yayın Öncesi Kreatif Kalite Kontrolü</span>
              <Badge variant={quality.status === 'error' ? 'destructive' : quality.status === 'warning' ? 'secondary' : 'default'}>{quality.status === 'error' ? 'Kritik hata' : quality.status === 'warning' ? 'Uyarı var' : 'Kontroller geçti'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quality.items.map((item) => <div key={item.code} className={`rounded border px-3 py-2 text-sm ${item.severity === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{item.message}</div>)}
            {!quality.items.length ? <p className="text-sm text-emerald-700">Çözünürlük, oran, boyut, alt metin, kontrast, mobil düzen ve animasyon kontrolleri uygun.</p> : null}
            {quality.status === 'warning' ? <Input value={form.qualityOverrideReason} onChange={(event) => set('qualityOverrideReason', event.target.value)} placeholder="Uyarılara rağmen yayınlama gerekçesi (zorunlu)" /> : null}
            {form.imageWidth ? <p className="text-xs text-muted-foreground">Algılanan görsel: {form.imageWidth}×{form.imageHeight} · {form.imageBytes ? `${(form.imageBytes / 1024).toFixed(0)} KB` : 'dosya boyutu okunamadı'}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {!isNew ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
              <span>Kampanya Performansı</span>
              <div className="flex flex-wrap gap-2">
                <Input className="h-8 w-36" type="date" value={reportRange.from} onChange={(event) => setReportRange((value) => ({ ...value, from: event.target.value }))} />
                <Input className="h-8 w-36" type="date" value={reportRange.to} onChange={(event) => setReportRange((value) => ({ ...value, to: event.target.value }))} />
                <Button type="button" size="sm" variant="outline" onClick={() => downloadPerformance('csv')}>CSV indir</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => downloadPerformance('pdf')}>Sponsor PDF</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                  {[
                    ['Gösterim', performance.totals.impressions.toLocaleString('tr-TR')],
                    ['Tekil', performance.totals.uniqueImpressions.toLocaleString('tr-TR')],
                    ['Tıklama', performance.totals.clicks.toLocaleString('tr-TR')],
                    ['CTR', `%${(performance.totals.ctr * 100).toFixed(2)}`],
                    ['Dönüşüm', performance.totals.conversions.toLocaleString('tr-TR')],
                    ['CPM', performance.totals.cpm?.toFixed(2) ?? '—'],
                    ['CPC', performance.totals.cpc?.toFixed(2) ?? '—'],
                    ['CPA', performance.totals.cpa?.toFixed(2) ?? '—'],
                  ].map(([label, value]) => <div key={label} className="rounded-md border p-2"><div className="text-xs text-muted-foreground">{label}</div><strong className="text-sm">{value}</strong></div>)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Kampanya bedeli: {performance.totals.revenue.toLocaleString('tr-TR')} ₺ · Tahsilat: {performance.totals.collected.toLocaleString('tr-TR')} ₺
                  {Object.entries(performance.devices).map(([device, value]) => ` · ${device}: ${value.impressions} gösterim / ${value.clicks} tıklama`).join('')}
                </p>
              </div>
            ) : <p className="text-sm text-muted-foreground">{isPerformanceLoading ? 'Rapor hazırlanıyor…' : 'Seçili dönemde performans verisi yok.'}</p>}
          </CardContent>
        </Card>
      ) : null}

      {!isNew ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Denetim Geçmişi</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(auditData?.items ?? []).map((item) => {
              const keys = [...new Set([...Object.keys(item.beforeData ?? {}), ...Object.keys(item.afterData ?? {})])]
                .filter((key) => JSON.stringify(item.beforeData?.[key]) !== JSON.stringify(item.afterData?.[key]))
                .slice(0, 12);
              return (
                <div key={item.id} className="rounded-md border p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.action}</strong><span className="text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')} · {item.actorUserId || 'sistem'}</span></div>
                  {item.reason ? <p className="mt-1">Gerekçe: {item.reason}</p> : null}
                  {item.isFinancial ? <Badge className="mt-2" variant="secondary">Finansal değişiklik</Badge> : null}
                  {keys.length ? <p className="mt-2 text-muted-foreground">Değişen alanlar: {keys.join(', ')}</p> : null}
                </div>
              );
            })}
            {!auditData?.items.length ? <p className="text-sm text-muted-foreground">Bu kampanya için henüz alan bazlı denetim kaydı yok.</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reklam Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Başlık (iç ad / alt metin)</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Reklam veren</Label>
              <Input value={form.advertiser} placeholder="VistaSeeds" onChange={(e) => set('advertiser', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Slot (pozisyon)</Label>
              <Select value={form.position} onValueChange={(v) => set('position', v as BannerPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">Önerilen ölçü: {positionSize(form.position)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Tip</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v as BannerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Cihaz</Label>
                <Select value={form.device} onValueChange={(v) => set('device', v as BannerDevice)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_DEVICES.map((d) => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>Toplam gösterim limiti</Label>
                <Input type="number" min={1} placeholder="Limitsiz" value={form.impressionLimit} onChange={(e) => set('impressionLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Tıklama limiti</Label>
                <Input type="number" min={1} placeholder="Limitsiz" value={form.clickLimit} onChange={(e) => set('clickLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Günlük gösterim kotası</Label>
                <Input type="number" min={1} placeholder="Limitsiz" value={form.dailyImpressionLimit} onChange={(e) => set('dailyImpressionLimit', e.target.value)} />
              </div>
            </div>
            {banner ? (
              <p className="text-muted-foreground text-xs">
                Gerçekleşen: {banner.impressions.toLocaleString('tr-TR')} gösterim · {banner.clicks.toLocaleString('tr-TR')} tıklama
                {banner.dailyImpressionsDate ? ` · Bugünkü sayaç: ${banner.dailyImpressions.toLocaleString('tr-TR')}` : ''}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Ziyaretçi başına günlük sınır</Label>
                <Input type="number" min={1} value={form.visitorDailyImpressionLimit} onChange={(e) => set('visitorDailyImpressionLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Ziyaretçi başına kampanya sınırı</Label>
                <Input type="number" min={1} value={form.visitorCampaignImpressionLimit} onChange={(e) => set('visitorCampaignImpressionLimit', e.target.value)} />
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">A/B kreatif optimizasyonu</p>
                  <p className="text-muted-foreground text-xs">Aynı deney anahtarındaki varyantlar CTR ile karşılaştırılır.</p>
                </div>
                {banner ? <Badge variant={banner.performanceStatus === 'low' ? 'destructive' : banner.performanceStatus === 'winner' ? 'default' : 'secondary'}>{banner.performanceStatus}</Badge> : null}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>Deney anahtarı</Label><Input placeholder="erik-kreatif" value={form.experimentKey} onChange={(e) => set('experimentKey', e.target.value)} /></div>
                <div className="grid gap-2"><Label>Varyant</Label><Input placeholder="A / B" value={form.creativeVariant} onChange={(e) => set('creativeVariant', e.target.value)} /></div>
                <div className="grid gap-2"><Label>Minimum gösterim</Label><Input type="number" min={100} value={form.minimumOptimizationImpressions} onChange={(e) => set('minimumOptimizationImpressions', e.target.value)} /></div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.autoOptimize} onChange={(e) => set('autoOptimize', e.target.checked)} />
                Kazanan kreatife ağırlığı otomatik aktar
              </label>
            </div>

            <div className="grid gap-2">
              <Label>Reklam kaynağı</Label>
              <Select value={form.sourceType} onValueChange={(v) => set('sourceType', v as BannerSourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">Serbest banner</SelectItem>
                  <SelectItem value="listing">Onaylı ilandan banner</SelectItem>
                  <SelectItem value="firm">Firma / komisyoncu sponsoru</SelectItem>
                  <SelectItem value="code">Harici reklam kodu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 rounded-lg border p-3">
              <div><Label>Hazır kreatif şablonu</Label><p className="mt-1 text-xs text-muted-foreground">Grafik dosyası olmadan slot yapısına uygun reklam oluşturur.</p></div>
              <Select value={form.creativeTemplate} onValueChange={(value) => set('creativeTemplate', value as BannerAdmin['creativeTemplate'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Standart görsel</SelectItem>
                  <SelectItem value="firm">Firma tanıtım bannerı</SelectItem>
                  <SelectItem value="listing">İlan reklamı</SelectItem>
                  <SelectItem value="sponsorship">Ürün / kategori sponsorluğu</SelectItem>
                  <SelectItem value="leaderboard">Yatay leaderboard</SelectItem>
                  <SelectItem value="split">İki hücreli reklam kartı</SelectItem>
                  <SelectItem value="mpu">Yan sütun MPU</SelectItem>
                  <SelectItem value="mobile">Mobil reklam kartı</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">Arka plan<Input className="mt-1 h-9 p-1" type="color" value={form.backgroundColor} onChange={(event) => set('backgroundColor', event.target.value)} /></label>
                <label className="text-xs">Metin<Input className="mt-1 h-9 p-1" type="color" value={form.textColor} onChange={(event) => set('textColor', event.target.value)} /></label>
                <label className="text-xs">Vurgu<Input className="mt-1 h-9 p-1" type="color" value={form.accentColor} onChange={(event) => set('accentColor', event.target.value)} /></label>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={form.logoUrl} onChange={(event) => set('logoUrl', event.target.value)} placeholder="Firma logo URL’si" />
                <Input value={form.backgroundImageUrl} onChange={(event) => set('backgroundImageUrl', event.target.value)} placeholder="Arka plan görsel URL’si" />
              </div>
              <Textarea className="min-h-16" maxLength={240} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder="Kısa reklam açıklaması" />
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs">Yatay odak: %{form.focalX}<input className="mt-2 w-full" type="range" min={0} max={100} value={form.focalX} onChange={(event) => set('focalX', event.target.value)} /></label>
                <label className="text-xs">Dikey odak: %{form.focalY}<input className="mt-2 w-full" type="range" min={0} max={100} value={form.focalY} onChange={(event) => set('focalY', event.target.value)} /></label>
                <div><Label className="text-xs">Görsel yerleşimi</Label><Select value={form.imageFit} onValueChange={(value) => set('imageFit', value as 'cover' | 'contain')}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cover">Alanı doldur / kırp</SelectItem><SelectItem value="contain">Tamamını göster</SelectItem></SelectContent></Select></div>
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.animation} onChange={(event) => set('animation', event.target.checked)} />Yumuşak animasyonu etkinleştir</label>
            </div>

            <div className="grid gap-3 rounded-lg border p-3">
              <div>
                <Label>Hedefleme kapsamı</Label>
                <p className="mt-1 text-xs text-muted-foreground">Dar hedefler global reklamlardan önce seçilir. Aynı türde birden fazla değeri virgülle ayırabilirsiniz.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={form.targetType} onValueChange={(value) => {
                  set('targetType', value as BannerScopeType);
                  set('targetValues', '');
                  setTargetSearch('');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global — tüm uygun sayfalar</SelectItem>
                    <SelectItem value="page_type">Sayfa türü</SelectItem>
                    <SelectItem value="city">İl slug</SelectItem>
                    <SelectItem value="district">İlçe slug</SelectItem>
                    <SelectItem value="product">Ürün slug</SelectItem>
                    <SelectItem value="category">Kategori slug</SelectItem>
                    <SelectItem value="market">Hal slug</SelectItem>
                    <SelectItem value="firm">Firma ID</SelectItem>
                    <SelectItem value="listing">İlan ID</SelectItem>
                  </SelectContent>
                </Select>
                {form.targetType !== 'global' && (
                  <Input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder="İl, ürün, firma veya ilan ara…" />
                )}
              </div>
              {form.targetType !== 'global' && (
                <>
                  <div className="flex max-h-36 flex-wrap gap-2 overflow-y-auto">
                    {targetOptions.map((option) => {
                      const selected = selectedTargetValues.includes(option.value);
                      return (
                        <Button
                          key={option.value}
                          type="button"
                          size="sm"
                          variant={selected ? 'default' : 'outline'}
                          onClick={() => {
                            const next = selected
                              ? selectedTargetValues.filter((value) => value !== option.value)
                              : [...selectedTargetValues, option.value];
                            set('targetValues', next.join(', '));
                          }}
                        >
                          {option.label}
                        </Button>
                      );
                    })}
                  </div>
                  <div className="rounded-md bg-muted/50 p-2 text-xs">
                    <span className="font-medium">Seçilen:</span> {selectedTargetValues.join(', ') || 'Henüz hedef seçilmedi'}
                    <span className="ml-3 text-muted-foreground">Tahmini erişim: {estimatedReach ? estimatedReach.toLocaleString('tr-TR') : 'hesaplanıyor'}</span>
                    {selectedTargetValues.length === 1 && ['firm', 'listing', 'district'].includes(form.targetType) && (
                      <p className="mt-1 font-medium text-amber-700">Bu hedef oldukça dar. Kampanya erişimi sınırlı olabilir.</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {selectedTargetValues.map((value) => {
                      const option = targetOptions.find((item) => item.value === value);
                      return option?.exampleUrl ? (
                        <a key={value} href={option.exampleUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          Örnek sayfa: {option.label}
                        </a>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </div>

            {form.sourceType === 'listing' && (
              <div className="grid gap-2">
                <Label>İlan seçimi</Label>
                <Select value={form.listingId} onValueChange={(v) => set('listingId', v)}>
                  <SelectTrigger><SelectValue placeholder="Onaylı ilan seçin" /></SelectTrigger>
                  <SelectContent>
                    {listingOptions.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        #{item.id} · {item.productName} · {item.title} {item.citySlug ? `(${item.citySlug})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">Sadece onaylı ve süresi geçmemiş ilanlar canlıda gösterilir.</p>
              </div>
            )}

            {form.type === 'image' ? (
              <>
                {vistaVariant ? (
                  <div className="rounded-md border border-emerald-600/30 bg-emerald-500/5 p-3 text-xs">
                    <p className="font-semibold">VistaSeeds animasyonlu özel tasarım</p>
                    <p className="mt-1 text-muted-foreground">
                      Ürün görselleri tasarıma sabittir. Aşağıdaki ana metin ve CTA değişiklikleri canlı bannera yansır.
                    </p>
                  </div>
                ) : (
                  <AdminImageUploadField
                    label="Banner görseli"
                    helperText={`Önerilen ölçü: ${positionSize(form.position)}`}
                    value={form.imageUrl}
                    onChange={(url) => set('imageUrl', url ?? '')}
                    folder="uploads/banners"
                  />
                )}
                <div className="grid gap-2">
                  <Label>Görsel alt metni</Label>
                  <Input value={form.alt} placeholder={form.title} onChange={(e) => set('alt', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>Hedef link (URL)</Label>
                  <Input value={form.linkUrl} placeholder="https://vistaseeds.com.tr" onChange={(e) => set('linkUrl', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{vistaVariant ? 'Banner ana başlığı' : 'Reklam metni (caption)'}</Label>
                  <Input
                    value={form.caption}
                    placeholder={vistaVariant === 'sidebar' ? 'Verimin rengi değişir.' : vistaVariant === 'leaderboard' ? 'Her hasatta güçlü performans.' : "Sertifikalı hibrit tohumda Türkiye'nin güveni"}
                    onChange={(e) => set('caption', e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {vistaVariant ? 'Animasyonlu tasarımın ana mesajı.' : 'Görselin yanında/altında görünen kısa reklam metni (opsiyonel).'}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>CTA buton metni</Label>
                  <Input value={form.ctaLabel} placeholder="Tohumları Keşfet" onChange={(e) => set('ctaLabel', e.target.value)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label>HTML / Kod (AdSense vb.)</Label>
                <Textarea
                  className="min-h-40 font-mono text-xs"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="<script>...</script> veya <ins class='adsbygoogle' ...></ins>"
                />
                <p className="text-muted-foreground text-xs">Kod doğrudan sayfaya gömülür — yalnızca güvenilir reklam kodu girin.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Yayın & Zamanlama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 rounded-md border p-3">
              <Label>Yayın durumu</Label>
              <Select value={form.lifecycleStatus} onValueChange={(value) => set('lifecycleStatus', value as BannerLifecycleStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Taslak</SelectItem>
                  <SelectItem value="proposal">Teklif verildi</SelectItem>
                  <SelectItem value="reserved">Rezerve</SelectItem>
                  <SelectItem value="payment_pending">Ödeme bekliyor</SelectItem>
                  <SelectItem value="scheduled">Planlandı</SelectItem>
                  <SelectItem value="live">Yayında</SelectItem>
                  <SelectItem value="completed">Tamamlandı</SelectItem>
                  <SelectItem value="cancelled">İptal edildi</SelectItem>
                  <SelectItem value="problem">Sorunlu</SelectItem>
                  <SelectItem value="archived">Arşivlendi</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">Rezerve, ödeme bekliyor, planlandı ve yayında durumları slot kapasitesini tutar.</p>
            </div>
            {form.lifecycleStatus === 'reserved' ? (
              <div className="grid gap-2">
                <Label>Rezervasyon son geçerlilik zamanı (boşsa süreye göre otomatik)</Label>
                <Input type="datetime-local" value={form.reservationExpiresAt} onChange={(e) => set('reservationExpiresAt', e.target.value)} />
                <div><Label className="text-xs">Ödeme bekleme süresi (saat)</Label><Input className="mt-1" type="number" min={1} max={720} value={form.paymentGraceHours} onChange={(e) => set('paymentGraceHours', e.target.value)} /></div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>Satış sorumlusu</Label>
              <Input value={form.salesOwner} onChange={(e) => set('salesOwner', e.target.value)} placeholder="Ad soyad" />
            </div>
            <div className="grid gap-2 rounded-md border p-3">
              <Label>Ödeme durumu</Label>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Toplam kampanya tutarı (₺)</Label><Input className="mt-1" type="number" min={0} value={form.totalAmount} onChange={(event) => set('totalAmount', event.target.value)} /></div>
                <div><Label className="text-xs">Son ödeme tarihi</Label><Input className="mt-1" type="datetime-local" value={form.paymentDueAt} onChange={(event) => set('paymentDueAt', event.target.value)} /></div>
              </div>
              <Select value={form.paymentStatus} onValueChange={(value) => set('paymentStatus', value as BannerPaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Ödenmedi</SelectItem>
                  <SelectItem value="partial">Kısmi ödeme</SelectItem>
                  <SelectItem value="paid">Ödendi</SelectItem>
                  <SelectItem value="waived">Ücretsiz / feragat</SelectItem>
                  <SelectItem value="refunded">İade edildi</SelectItem>
                  <SelectItem value="cancelled">Ödeme iptal</SelectItem>
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.paymentOverride} onChange={(event) => set('paymentOverride', event.target.checked)} />
                Ödeme tamamlanmadan yetkili istisnasıyla yayınla
              </label>
              {form.paymentOverride ? (
                <Input value={form.paymentOverrideReason} onChange={(event) => set('paymentOverrideReason', event.target.value)} placeholder="İstisna gerekçesi (zorunlu)" />
              ) : null}
              <p className="text-muted-foreground text-xs">Ödenmemiş veya kısmi ödemeli reklam, gerekçeli istisna olmadan planlanamaz ve yayına alınamaz.</p>
              {!isNew && payments ? (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-muted p-2"><div className="text-muted-foreground">Toplam</div><strong>{payments.totalAmount.toLocaleString('tr-TR')} ₺</strong></div>
                    <div className="rounded bg-emerald-50 p-2 text-emerald-800"><div>Tahsil edilen</div><strong>{payments.collectedAmount.toLocaleString('tr-TR')} ₺</strong></div>
                    <div className="rounded bg-amber-50 p-2 text-amber-800"><div>Kalan</div><strong>{payments.remainingAmount.toLocaleString('tr-TR')} ₺</strong></div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select value={paymentForm.transactionType} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, transactionType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="payment">Tahsilat</SelectItem><SelectItem value="refund">İade</SelectItem></SelectContent></Select>
                    <Input type="number" min={0.01} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder="Tutar ₺" />
                    <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="bank_transfer">Havale/EFT</SelectItem><SelectItem value="card">Kart</SelectItem><SelectItem value="cash">Nakit</SelectItem><SelectItem value="other">Diğer</SelectItem></SelectContent></Select>
                    <Input type="datetime-local" value={paymentForm.paidAt} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paidAt: event.target.value }))} />
                    <Input value={paymentForm.referenceNumber} onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} placeholder="Referans / dekont no" />
                    <Input value={paymentForm.notes} onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder="Ödeme notu" />
                  </div>
                  <Button type="button" size="sm" onClick={handleCreatePayment} disabled={isCreatingPayment}>{paymentForm.transactionType === 'refund' ? 'İadeyi kaydet' : 'Ödemeyi kaydet'}</Button>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {payments.transactions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs">
                        <span>{new Date(item.paidAt).toLocaleDateString('tr-TR')} · {item.paymentMethod}{item.referenceNumber ? ` · ${item.referenceNumber}` : ''}{item.notes ? ` · ${item.notes}` : ''}</span>
                        <strong className={item.transactionType === 'refund' ? 'text-red-600' : 'text-emerald-700'}>{item.transactionType === 'refund' ? '−' : '+'}{Number(item.amount).toLocaleString('tr-TR')} ₺</strong>
                      </div>
                    ))}
                    {!payments.transactions.length ? <p className="text-xs text-muted-foreground">Henüz ödeme hareketi yok.</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div><Label>Belgeler ve anlaşma özeti</Label><p className="text-xs text-muted-foreground">Dosya bağlantıları yalnız admin kampanya detayında gösterilir.</p></div>
                {!isNew ? <Button type="button" size="sm" variant="outline" onClick={downloadProposal}>Teklif PDF indir</Button> : null}
              </div>
              {!isNew && banner ? (
                <div className="rounded bg-muted/40 p-2 text-xs">
                  <strong>HF-REK-{String(banner.id).padStart(6, '0')}</strong> · {form.advertiser || 'Reklam veren yok'} · {positionSize(form.position)} · {form.device} · {form.startAt || 'başlangıç yok'} / {form.endAt || 'bitiş yok'}
                </div>
              ) : null}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={form.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} placeholder="Fatura numarası" />
                <Input value={form.invoiceUrl} onChange={(event) => set('invoiceUrl', event.target.value)} placeholder="Harici fatura bağlantısı" />
                <Input value={form.contractFileUrl} onChange={(event) => set('contractFileUrl', event.target.value)} placeholder="Sözleşme dosyası bağlantısı" />
                <Input value={form.creativeFileUrl} onChange={(event) => set('creativeFileUrl', event.target.value)} placeholder="Kreatif kaynak dosyası bağlantısı" />
              </div>
              <div className="grid gap-2 border-t pt-3 md:grid-cols-2">
                <div><Label className="text-xs">Sponsor rapor e-postası</Label><Input className="mt-1" type="email" value={form.reportEmail} onChange={(event) => set('reportEmail', event.target.value)} placeholder="reklamveren@firma.com" /></div>
                <label className="flex items-center gap-2 self-end rounded border px-3 py-2 text-xs"><input type="checkbox" checked={form.weeklyReportEnabled} onChange={(event) => set('weeklyReportEnabled', event.target.checked)} />Haftalık performans raporu gönder</label>
                {!isNew && banner?.weeklyReportSentAt ? <p className="text-xs text-muted-foreground">Son haftalık gönderim: {new Date(banner.weeklyReportSentAt).toLocaleString('tr-TR')}</p> : null}
                {!isNew && banner?.closingReportSentAt ? <p className="text-xs text-muted-foreground">Kapanış raporu: {new Date(banner.closingReportSentAt).toLocaleString('tr-TR')}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {form.invoiceUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.invoiceUrl} target="_blank" rel="noopener noreferrer">Faturayı aç</a></Button> : null}
                {form.contractFileUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.contractFileUrl} target="_blank" rel="noopener noreferrer">Sözleşmeyi aç</a></Button> : null}
                {form.creativeFileUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.creativeFileUrl} target="_blank" rel="noopener noreferrer">Kreatif dosyayı aç</a></Button> : null}
              </div>
            </div>
            {form.lifecycleStatus === 'cancelled' ? (
              <div className="grid gap-2">
                <Label>İptal nedeni</Label>
                <Input value={form.cancellationReason} onChange={(e) => set('cancellationReason', e.target.value)} />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Başlangıç</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Bitiş</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Satır</Label>
                <Input type="number" min={1} max={20} value={form.desktopRow} onChange={(e) => set('desktopRow', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Satır kapasitesi</Label>
                <Select value={form.desktopColumns} onValueChange={(v) => set('desktopColumns', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 reklam</SelectItem>
                    <SelectItem value="2">2 reklam</SelectItem>
                    <SelectItem value="3">3 reklam</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
              <p className="text-muted-foreground text-xs">Aynı slot ve satırdaki reklamlar yan yana dizilir. Dolu satır kaydedilemez.</p>
              <Badge variant={selectedInventory?.available === 0 ? 'destructive' : 'secondary'}>
                {selectedInventory
                  ? `${selectedInventory.active}/${selectedInventory.columns} dolu`
                  : 'Boş satır'}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Sıra (display_order)</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Ağırlık (rotasyon)</Label>
                <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Not</Label>
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Sponsorlu · Önizleme
              </div>
              <div className="flex justify-center">
                {form.type === 'code' ? (
                  <div className="text-muted-foreground text-xs">Kod tipi — canlı sayfada render edilir.</div>
                ) : form.creativeTemplate !== 'image' ? (
                  <div
                    className={`flex min-h-32 w-full overflow-hidden rounded-xl border shadow-sm ${['mpu', 'mobile'].includes(form.creativeTemplate) ? 'max-w-72 flex-col' : 'items-stretch'} ${form.animation ? 'animate-pulse' : ''}`}
                    style={{
                      backgroundColor: form.backgroundColor,
                      color: form.textColor,
                      backgroundImage: form.backgroundImageUrl ? `linear-gradient(#0005,#0005),url("${resolveMediaUrl(form.backgroundImageUrl)}")` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    {previewImg ? <img src={previewImg} alt="" className={['mpu', 'mobile'].includes(form.creativeTemplate) ? 'h-32 w-full' : 'w-36'} style={{ objectFit: form.imageFit, objectPosition: `${form.focalX}% ${form.focalY}%` }} /> : null}
                    <div className="flex min-w-0 flex-1 flex-col justify-center p-4">
                      {form.logoUrl ? <img src={resolveMediaUrl(form.logoUrl)} alt="" className="mb-2 max-h-8 max-w-28 object-contain object-left" /> : null}
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: form.accentColor }}>Sponsorlu · {form.creativeTemplate}</span>
                      <strong className="mt-1 text-lg">{form.caption || form.title || 'Kampanya başlığı'}</strong>
                      {form.description ? <span className="mt-1 text-xs opacity-75">{form.description}</span> : null}
                      {form.advertiser ? <span className="mt-1 text-xs opacity-70">{form.advertiser}</span> : null}
                      <span className="mt-3 w-fit rounded-full px-3 py-1 text-xs font-bold text-black" style={{ backgroundColor: form.accentColor }}>{form.ctaLabel || 'İncele'} →</span>
                    </div>
                  </div>
                ) : vistaVariant ? (
                  <VistaSeedsPreview variant={vistaVariant} headline={form.caption} ctaLabel={form.ctaLabel} />
                ) : previewImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImg} alt={form.alt || form.title} className="max-h-40 max-w-full rounded border object-contain" />
                ) : (
                  <div className="text-muted-foreground text-xs">Görsel seçilmedi.</div>
                )}
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  {(['desktop', 'tablet', 'mobile'] as const).map((device) => <Button key={device} type="button" size="sm" variant={previewDevice === device ? 'default' : 'outline'} onClick={() => setPreviewDevice(device)}>{device === 'desktop' ? 'Masaüstü' : device === 'tablet' ? 'Tablet' : 'Mobil'}</Button>)}
                  <Button type="button" size="sm" variant="outline" onClick={() => setPreviewTheme((value) => value === 'dark' ? 'light' : 'dark')}>{previewTheme === 'dark' ? 'Koyu tema' : 'Açık tema'}</Button>
                  <Button type="button" size="sm" variant={previewReducedMotion ? 'default' : 'outline'} onClick={() => setPreviewReducedMotion((value) => !value)}>Azaltılmış hareket</Button>
                  <Button type="button" size="sm" variant="ghost" asChild><a href={livePreviewUrl} target="_blank" rel="noopener noreferrer">Gerçek sayfada aç</a></Button>
                </div>
                <div className="mx-auto overflow-hidden rounded-lg border bg-muted transition-[width]" style={{ width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '390px', maxWidth: '100%' }}>
                  <iframe key={livePreviewUrl} src={livePreviewUrl} title="Canlı banner önizlemesi" className="h-72 w-full border-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
