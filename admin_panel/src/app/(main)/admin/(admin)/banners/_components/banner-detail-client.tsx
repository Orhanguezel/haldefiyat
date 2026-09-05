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
import { useAdminT } from '../../../_components/common/use-admin-t';
import { errorMessage } from '../_lib/banner-meta';

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
  const t = useAdminT('admin.banners.detail');
  const tb = useAdminT('admin.banners');
  const tc = useAdminT('admin.common');
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
      toast.error(t('toasts.titleRequired'));
      return;
    }
    if (form.type === 'image' && form.sourceType === 'custom' && !form.imageUrl.trim() && !vistaVariant) {
      toast.error(t('toasts.imageRequired'));
      return;
    }
    if (form.sourceType === 'listing' && !form.listingId) {
      toast.error(t('toasts.listingRequired'));
      return;
    }
    if (form.type === 'code' && !form.code.trim()) {
      toast.error(t('toasts.codeRequired'));
      return;
    }
    if (form.targetType !== 'global' && !form.targetValues.trim()) {
      toast.error(t('toasts.targetRequired'));
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

    try {
      if (isNew) {
        const result = await createBanner(payload).unwrap();
        toast.success(t('toasts.created'));
        router.replace(`/admin/banners/${result.data.id}`);
        return;
      }
      if (!banner) return;
      await updateBanner({ id: banner.id, patch: payload }).unwrap();
      initializedRef.current = null;
      await refetch();
      await refetchQuality();
      toast.success(t('toasts.saved'));
    } catch (error) {
      toast.error(errorMessage(error, tc('saveFailed')));
    }
  }

  async function handleCreatePayment() {
    if (isNew || !banner || Number(paymentForm.amount) <= 0) {
      toast.error(t('toasts.amountInvalid'));
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
      toast.success(paymentForm.transactionType === 'refund' ? t('toasts.refundSaved') : t('toasts.paymentSaved'));
    } catch (error) {
      toast.error(errorMessage(error, t('toasts.txFailed')));
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
      toast.error(t('toasts.proposalFailed'));
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
      toast.error(t('toasts.reportFailed'));
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
            {t('back')}
          </Button>
          <div>
            <h1 className="flex items-center gap-2 font-semibold text-lg">
              <Megaphone className="h-5 w-5" />
              {isNew ? t('newTitle') : t('editTitle')}
            </h1>
            <p className="text-muted-foreground text-xs">
              {isNew ? t('newHint') : t('counters', { impressions: banner?.impressions ?? 0, clicks: banner?.clicks ?? 0 })}
            </p>
          </div>
        </div>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          <Save className="mr-1.5 h-4 w-4" />
          {isSaving ? tc('saving') : tc('save')}
        </Button>
      </div>

      {!isNew && quality ? (
        <Card className={quality.status === 'error' ? 'border-red-300' : quality.status === 'warning' ? 'border-amber-300' : 'border-emerald-300'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>{t('quality.title')}</span>
              <Badge variant={quality.status === 'error' ? 'destructive' : quality.status === 'warning' ? 'secondary' : 'default'}>{t(`quality.${quality.status}`)}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quality.items.map((item) => <div key={item.code} className={`rounded border px-3 py-2 text-sm ${item.severity === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>{item.message}</div>)}
            {!quality.items.length ? <p className="text-sm text-emerald-700">{t('quality.allGood')}</p> : null}
            {quality.status === 'warning' ? <Input value={form.qualityOverrideReason} onChange={(event) => set('qualityOverrideReason', event.target.value)} placeholder={t('quality.overridePlaceholder')} /> : null}
            {form.imageWidth ? <p className="text-xs text-muted-foreground">{t('quality.detected', { w: form.imageWidth, h: form.imageHeight, size: form.imageBytes ? `${(form.imageBytes / 1024).toFixed(0)} KB` : t('quality.sizeUnknown') })}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      {!isNew ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-3 text-base">
              <span>{t('perf.title')}</span>
              <div className="flex flex-wrap gap-2">
                <Input className="h-8 w-36" type="date" value={reportRange.from} onChange={(event) => setReportRange((value) => ({ ...value, from: event.target.value }))} />
                <Input className="h-8 w-36" type="date" value={reportRange.to} onChange={(event) => setReportRange((value) => ({ ...value, to: event.target.value }))} />
                <Button type="button" size="sm" variant="outline" onClick={() => downloadPerformance('csv')}>{t('perf.csv')}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => downloadPerformance('pdf')}>{t('perf.pdf')}</Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
                  {[
                    [tb('revenue.impressions'), performance.totals.impressions.toLocaleString('tr-TR')],
                    [tb('revenue.uniqueImpressions'), performance.totals.uniqueImpressions.toLocaleString('tr-TR')],
                    [tb('revenue.clicks'), performance.totals.clicks.toLocaleString('tr-TR')],
                    ['CTR', `%${(performance.totals.ctr * 100).toFixed(2)}`],
                    [tb('revenue.conversions'), performance.totals.conversions.toLocaleString('tr-TR')],
                    ['CPM', performance.totals.cpm?.toFixed(2) ?? '—'],
                    ['CPC', performance.totals.cpc?.toFixed(2) ?? '—'],
                    ['CPA', performance.totals.cpa?.toFixed(2) ?? '—'],
                  ].map(([label, value]) => <div key={label} className="rounded-md border p-2"><div className="text-xs text-muted-foreground">{label}</div><strong className="text-sm">{value}</strong></div>)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('perf.money', { revenue: performance.totals.revenue.toLocaleString('tr-TR'), collected: performance.totals.collected.toLocaleString('tr-TR') })}
                  {Object.entries(performance.devices).map(([device, value]) => ` · ${tb(`devices.${device}`, undefined, device)}: ${value.impressions} / ${value.clicks}`).join('')}
                </p>
              </div>
            ) : <p className="text-sm text-muted-foreground">{isPerformanceLoading ? t('perf.loading') : t('perf.empty')}</p>}
          </CardContent>
        </Card>
      ) : null}

      {!isNew ? (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{t('audit.title')}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {(auditData?.items ?? []).map((item) => {
              const keys = [...new Set([...Object.keys(item.beforeData ?? {}), ...Object.keys(item.afterData ?? {})])]
                .filter((key) => JSON.stringify(item.beforeData?.[key]) !== JSON.stringify(item.afterData?.[key]))
                .slice(0, 12);
              return (
                <div key={item.id} className="rounded-md border p-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2"><strong>{item.action}</strong><span className="text-muted-foreground">{new Date(item.createdAt).toLocaleString('tr-TR')} · {item.actorUserId || t('audit.system')}</span></div>
                  {item.reason ? <p className="mt-1">{t('audit.reason', { reason: item.reason })}</p> : null}
                  {item.isFinancial ? <Badge className="mt-2" variant="secondary">{t('audit.financial')}</Badge> : null}
                  {keys.length ? <p className="mt-2 text-muted-foreground">{t('audit.changed', { list: keys.join(', ') })}</p> : null}
                </div>
              );
            })}
            {!auditData?.items.length ? <p className="text-sm text-muted-foreground">{t('audit.empty')}</p> : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('info.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>{t('info.name')}</Label>
              <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('info.advertiser')}</Label>
              <Input value={form.advertiser} placeholder={t('info.advertiserPlaceholder')} onChange={(e) => set('advertiser', e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>{t('info.slot')}</Label>
              <Select value={form.position} onValueChange={(v) => set('position', v as BannerPosition)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {filteredPositions.map((p) => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t('info.recommended', { size: positionSize(form.position) })}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t('info.type')}</Label>
                <Select value={form.type} onValueChange={(v) => set('type', v as BannerType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_TYPES.map((opt) => <SelectItem key={opt.value} value={opt.value}>{tb(`types.${opt.value}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t('info.device')}</Label>
                <Select value={form.device} onValueChange={(v) => set('device', v as BannerDevice)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BANNER_DEVICES.map((d) => <SelectItem key={d.value} value={d.value}>{tb(`devices.${d.value}`)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="grid gap-2">
                <Label>{t('info.impressionLimit')}</Label>
                <Input type="number" min={1} placeholder={t('info.unlimited')} value={form.impressionLimit} onChange={(e) => set('impressionLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('info.clickLimit')}</Label>
                <Input type="number" min={1} placeholder={t('info.unlimited')} value={form.clickLimit} onChange={(e) => set('clickLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('info.dailyLimit')}</Label>
                <Input type="number" min={1} placeholder={t('info.unlimited')} value={form.dailyImpressionLimit} onChange={(e) => set('dailyImpressionLimit', e.target.value)} />
              </div>
            </div>
            {banner ? (
              <p className="text-muted-foreground text-xs">
                {t('info.realized', { impressions: banner.impressions.toLocaleString('tr-TR'), clicks: banner.clicks.toLocaleString('tr-TR') })}
                {banner.dailyImpressionsDate ? ` · ${t('info.todayCounter', { count: banner.dailyImpressions.toLocaleString('tr-TR') })}` : ''}
              </p>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t('info.visitorDaily')}</Label>
                <Input type="number" min={1} value={form.visitorDailyImpressionLimit} onChange={(e) => set('visitorDailyImpressionLimit', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('info.visitorCampaign')}</Label>
                <Input type="number" min={1} value={form.visitorCampaignImpressionLimit} onChange={(e) => set('visitorCampaignImpressionLimit', e.target.value)} />
              </div>
            </div>
            <div className="rounded-md border p-3">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{t('ab.title')}</p>
                  <p className="text-muted-foreground text-xs">{t('ab.hint')}</p>
                </div>
                {banner ? <Badge variant={banner.performanceStatus === 'low' ? 'destructive' : banner.performanceStatus === 'winner' ? 'default' : 'secondary'}>{tb(`performance.${banner.performanceStatus}`)}</Badge> : null}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="grid gap-2"><Label>{t('ab.key')}</Label><Input placeholder={t('ab.keyPlaceholder')} value={form.experimentKey} onChange={(e) => set('experimentKey', e.target.value)} /></div>
                <div className="grid gap-2"><Label>{t('ab.variant')}</Label><Input placeholder="A / B" value={form.creativeVariant} onChange={(e) => set('creativeVariant', e.target.value)} /></div>
                <div className="grid gap-2"><Label>{t('ab.minImpressions')}</Label><Input type="number" min={100} value={form.minimumOptimizationImpressions} onChange={(e) => set('minimumOptimizationImpressions', e.target.value)} /></div>
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.autoOptimize} onChange={(e) => set('autoOptimize', e.target.checked)} />
                {t('ab.auto')}
              </label>
            </div>

            <div className="grid gap-2">
              <Label>{t('source.title')}</Label>
              <Select value={form.sourceType} onValueChange={(v) => set('sourceType', v as BannerSourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{t('source.custom')}</SelectItem>
                  <SelectItem value="listing">{t('source.listing')}</SelectItem>
                  <SelectItem value="firm">{t('source.firm')}</SelectItem>
                  <SelectItem value="code">{t('source.code')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 rounded-lg border p-3">
              <div><Label>{t('template.title')}</Label><p className="mt-1 text-xs text-muted-foreground">{t('template.hint')}</p></div>
              <Select value={form.creativeTemplate} onValueChange={(value) => set('creativeTemplate', value as BannerAdmin['creativeTemplate'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">{t('template.options.image')}</SelectItem>
                  <SelectItem value="firm">{t('template.options.firm')}</SelectItem>
                  <SelectItem value="listing">{t('template.options.listing')}</SelectItem>
                  <SelectItem value="sponsorship">{t('template.options.sponsorship')}</SelectItem>
                  <SelectItem value="leaderboard">{t('template.options.leaderboard')}</SelectItem>
                  <SelectItem value="split">{t('template.options.split')}</SelectItem>
                  <SelectItem value="mpu">{t('template.options.mpu')}</SelectItem>
                  <SelectItem value="mobile">{t('template.options.mobile')}</SelectItem>
                </SelectContent>
              </Select>
              <div className="grid grid-cols-3 gap-2">
                <label className="text-xs">{t('template.bg')}<Input className="mt-1 h-9 p-1" type="color" value={form.backgroundColor} onChange={(event) => set('backgroundColor', event.target.value)} /></label>
                <label className="text-xs">{t('template.text')}<Input className="mt-1 h-9 p-1" type="color" value={form.textColor} onChange={(event) => set('textColor', event.target.value)} /></label>
                <label className="text-xs">{t('template.accent')}<Input className="mt-1 h-9 p-1" type="color" value={form.accentColor} onChange={(event) => set('accentColor', event.target.value)} /></label>
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={form.logoUrl} onChange={(event) => set('logoUrl', event.target.value)} placeholder={t('template.logoUrl')} />
                <Input value={form.backgroundImageUrl} onChange={(event) => set('backgroundImageUrl', event.target.value)} placeholder={t('template.bgUrl')} />
              </div>
              <Textarea className="min-h-16" maxLength={240} value={form.description} onChange={(event) => set('description', event.target.value)} placeholder={t('template.description')} />
              <div className="grid gap-3 md:grid-cols-3">
                <label className="text-xs">{t('template.focalX', { value: form.focalX })}<input className="mt-2 w-full" type="range" min={0} max={100} value={form.focalX} onChange={(event) => set('focalX', event.target.value)} /></label>
                <label className="text-xs">{t('template.focalY', { value: form.focalY })}<input className="mt-2 w-full" type="range" min={0} max={100} value={form.focalY} onChange={(event) => set('focalY', event.target.value)} /></label>
                <div><Label className="text-xs">{t('template.fit')}</Label><Select value={form.imageFit} onValueChange={(value) => set('imageFit', value as 'cover' | 'contain')}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cover">{t('template.cover')}</SelectItem><SelectItem value="contain">{t('template.contain')}</SelectItem></SelectContent></Select></div>
              </div>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={form.animation} onChange={(event) => set('animation', event.target.checked)} />{t('template.animation')}</label>
            </div>

            <div className="grid gap-3 rounded-lg border p-3">
              <div>
                <Label>{t('target.title')}</Label>
                <p className="mt-1 text-xs text-muted-foreground">{t('target.hint')}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Select value={form.targetType} onValueChange={(value) => {
                  set('targetType', value as BannerScopeType);
                  set('targetValues', '');
                  setTargetSearch('');
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">{t('target.types.global')}</SelectItem>
                    <SelectItem value="page_type">{t('target.types.page_type')}</SelectItem>
                    <SelectItem value="city">{t('target.types.city')}</SelectItem>
                    <SelectItem value="district">{t('target.types.district')}</SelectItem>
                    <SelectItem value="product">{t('target.types.product')}</SelectItem>
                    <SelectItem value="category">{t('target.types.category')}</SelectItem>
                    <SelectItem value="market">{t('target.types.market')}</SelectItem>
                    <SelectItem value="firm">{t('target.types.firm')}</SelectItem>
                    <SelectItem value="listing">{t('target.types.listing')}</SelectItem>
                  </SelectContent>
                </Select>
                {form.targetType !== 'global' && (
                  <Input value={targetSearch} onChange={(event) => setTargetSearch(event.target.value)} placeholder={t('target.search')} />
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
                    <span className="font-medium">{t('target.selected')}</span> {selectedTargetValues.join(', ') || t('target.none')}
                    <span className="ml-3 text-muted-foreground">{t('target.reach', { value: estimatedReach ? estimatedReach.toLocaleString('tr-TR') : t('target.computing') })}</span>
                    {selectedTargetValues.length === 1 && ['firm', 'listing', 'district'].includes(form.targetType) && (
                      <p className="mt-1 font-medium text-amber-700">{t('target.narrow')}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs">
                    {selectedTargetValues.map((value) => {
                      const option = targetOptions.find((item) => item.value === value);
                      return option?.exampleUrl ? (
                        <a key={value} href={option.exampleUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">
                          {t('target.example', { label: option.label })}
                        </a>
                      ) : null;
                    })}
                  </div>
                </>
              )}
            </div>

            {form.sourceType === 'listing' && (
              <div className="grid gap-2">
                <Label>{t('listing.title')}</Label>
                <Select value={form.listingId} onValueChange={(v) => set('listingId', v)}>
                  <SelectTrigger><SelectValue placeholder={t('listing.placeholder')} /></SelectTrigger>
                  <SelectContent>
                    {listingOptions.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        #{item.id} · {item.productName} · {item.title} {item.citySlug ? `(${item.citySlug})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">{t('listing.hint')}</p>
              </div>
            )}

            {form.type === 'image' ? (
              <>
                {vistaVariant ? (
                  <div className="rounded-md border border-emerald-600/30 bg-emerald-500/5 p-3 text-xs">
                    <p className="font-semibold">{t('creative.vistaTitle')}</p>
                    <p className="mt-1 text-muted-foreground">
                      {t('creative.vistaHint')}
                    </p>
                  </div>
                ) : (
                  <AdminImageUploadField
                    label={t('creative.image')}
                    helperText={t('info.recommended', { size: positionSize(form.position) })}
                    value={form.imageUrl}
                    onChange={(url) => set('imageUrl', url ?? '')}
                    folder="uploads/banners"
                  />
                )}
                <div className="grid gap-2">
                  <Label>{t('creative.alt')}</Label>
                  <Input value={form.alt} placeholder={form.title} onChange={(e) => set('alt', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{t('creative.link')}</Label>
                  <Input value={form.linkUrl} placeholder="https://" onChange={(e) => set('linkUrl', e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label>{vistaVariant ? t('creative.headline') : t('creative.caption')}</Label>
                  <Input
                    value={form.caption}
                    placeholder={t('creative.captionPlaceholder')}
                    onChange={(e) => set('caption', e.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {vistaVariant ? t('creative.headlineHint') : t('creative.captionHint')}
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label>{t('creative.cta')}</Label>
                  <Input value={form.ctaLabel} placeholder={t('creative.ctaPlaceholder')} onChange={(e) => set('ctaLabel', e.target.value)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label>{t('creative.code')}</Label>
                <Textarea
                  className="min-h-40 font-mono text-xs"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder={t('creative.codePlaceholder')}
                />
                <p className="text-muted-foreground text-xs">{t('creative.codeHint')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('schedule.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 rounded-md border p-3">
              <Label>{t('schedule.status')}</Label>
              <Select value={form.lifecycleStatus} onValueChange={(value) => set('lifecycleStatus', value as BannerLifecycleStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['draft', 'proposal', 'reserved', 'payment_pending', 'scheduled', 'live', 'completed', 'cancelled', 'problem', 'archived'] as BannerLifecycleStatus[]).map((k) => <SelectItem key={k} value={k}>{tb(`lifecycles.${k}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">{t('schedule.statusHint')}</p>
            </div>
            {form.lifecycleStatus === 'reserved' ? (
              <div className="grid gap-2">
                <Label>{t('schedule.reservationExpires')}</Label>
                <Input type="datetime-local" value={form.reservationExpiresAt} onChange={(e) => set('reservationExpiresAt', e.target.value)} />
                <div><Label className="text-xs">{t('schedule.graceHours')}</Label><Input className="mt-1" type="number" min={1} max={720} value={form.paymentGraceHours} onChange={(e) => set('paymentGraceHours', e.target.value)} /></div>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label>{t('schedule.salesOwner')}</Label>
              <Input value={form.salesOwner} onChange={(e) => set('salesOwner', e.target.value)} placeholder={t('schedule.salesOwnerPlaceholder')} />
            </div>
            <div className="grid gap-2 rounded-md border p-3">
              <Label>{t('payment.title')}</Label>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">{t('payment.total')}</Label><Input className="mt-1" type="number" min={0} value={form.totalAmount} onChange={(event) => set('totalAmount', event.target.value)} /></div>
                <div><Label className="text-xs">{t('payment.due')}</Label><Input className="mt-1" type="datetime-local" value={form.paymentDueAt} onChange={(event) => set('paymentDueAt', event.target.value)} /></div>
              </div>
              <Select value={form.paymentStatus} onValueChange={(value) => set('paymentStatus', value as BannerPaymentStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['unpaid', 'partial', 'paid', 'waived', 'refunded', 'cancelled'] as BannerPaymentStatus[]).map((k) => <SelectItem key={k} value={k}>{tb(`payments.${k}`)}</SelectItem>)}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={form.paymentOverride} onChange={(event) => set('paymentOverride', event.target.checked)} />
                {t('payment.override')}
              </label>
              {form.paymentOverride ? (
                <Input value={form.paymentOverrideReason} onChange={(event) => set('paymentOverrideReason', event.target.value)} placeholder={t('payment.overrideReason')} />
              ) : null}
              <p className="text-muted-foreground text-xs">{t('payment.hint')}</p>
              {!isNew && payments ? (
                <div className="space-y-3 border-t pt-3">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded bg-muted p-2"><div className="text-muted-foreground">{t('payment.sumTotal')}</div><strong>{payments.totalAmount.toLocaleString('tr-TR')} ₺</strong></div>
                    <div className="rounded bg-emerald-50 p-2 text-emerald-800"><div>{t('payment.collected')}</div><strong>{payments.collectedAmount.toLocaleString('tr-TR')} ₺</strong></div>
                    <div className="rounded bg-amber-50 p-2 text-amber-800"><div>{t('payment.remaining')}</div><strong>{payments.remainingAmount.toLocaleString('tr-TR')} ₺</strong></div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    <Select value={paymentForm.transactionType} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, transactionType: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="payment">{t('payment.tx.payment')}</SelectItem><SelectItem value="refund">{t('payment.tx.refund')}</SelectItem></SelectContent></Select>
                    <Input type="number" min={0.01} step="0.01" value={paymentForm.amount} onChange={(event) => setPaymentForm((prev) => ({ ...prev, amount: event.target.value }))} placeholder={t('payment.amount')} />
                    <Select value={paymentForm.paymentMethod} onValueChange={(value) => setPaymentForm((prev) => ({ ...prev, paymentMethod: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['bank_transfer', 'card', 'cash', 'other'] as const).map((k) => <SelectItem key={k} value={k}>{t(`payment.methods.${k}`)}</SelectItem>)}</SelectContent></Select>
                    <Input type="datetime-local" value={paymentForm.paidAt} onChange={(event) => setPaymentForm((prev) => ({ ...prev, paidAt: event.target.value }))} />
                    <Input value={paymentForm.referenceNumber} onChange={(event) => setPaymentForm((prev) => ({ ...prev, referenceNumber: event.target.value }))} placeholder={t('payment.reference')} />
                    <Input value={paymentForm.notes} onChange={(event) => setPaymentForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder={t('payment.note')} />
                  </div>
                  <Button type="button" size="sm" onClick={handleCreatePayment} disabled={isCreatingPayment}>{paymentForm.transactionType === 'refund' ? t('payment.saveRefund') : t('payment.savePayment')}</Button>
                  <div className="max-h-40 space-y-1 overflow-y-auto">
                    {payments.transactions.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-2 rounded border px-2 py-1.5 text-xs">
                        <span>{new Date(item.paidAt).toLocaleDateString('tr-TR')} · {t(`payment.methods.${item.paymentMethod}`, undefined, item.paymentMethod)}{item.referenceNumber ? ` · ${item.referenceNumber}` : ''}{item.notes ? ` · ${item.notes}` : ''}</span>
                        <strong className={item.transactionType === 'refund' ? 'text-red-600' : 'text-emerald-700'}>{item.transactionType === 'refund' ? '−' : '+'}{Number(item.amount).toLocaleString('tr-TR')} ₺</strong>
                      </div>
                    ))}
                    {!payments.transactions.length ? <p className="text-xs text-muted-foreground">{t('payment.noTx')}</p> : null}
                  </div>
                </div>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div><Label>{t('docs.title')}</Label><p className="text-xs text-muted-foreground">{t('docs.hint')}</p></div>
                {!isNew ? <Button type="button" size="sm" variant="outline" onClick={downloadProposal}>{t('docs.proposal')}</Button> : null}
              </div>
              {!isNew && banner ? (
                <div className="rounded bg-muted/40 p-2 text-xs">
                  <strong>HF-REK-{String(banner.id).padStart(6, '0')}</strong> · {form.advertiser || tb('table.noAdvertiser')} · {positionSize(form.position)} · {tb(`devices.${form.device}`)} · {form.startAt || t('docs.noStart')} / {form.endAt || t('docs.noEnd')}
                </div>
              ) : null}
              <div className="grid gap-2 md:grid-cols-2">
                <Input value={form.invoiceNumber} onChange={(event) => set('invoiceNumber', event.target.value)} placeholder={t('docs.invoiceNumber')} />
                <Input value={form.invoiceUrl} onChange={(event) => set('invoiceUrl', event.target.value)} placeholder={t('docs.invoiceUrl')} />
                <Input value={form.contractFileUrl} onChange={(event) => set('contractFileUrl', event.target.value)} placeholder={t('docs.contractUrl')} />
                <Input value={form.creativeFileUrl} onChange={(event) => set('creativeFileUrl', event.target.value)} placeholder={t('docs.creativeUrl')} />
              </div>
              <div className="grid gap-2 border-t pt-3 md:grid-cols-2">
                <div><Label className="text-xs">{t('docs.reportEmail')}</Label><Input className="mt-1" type="email" value={form.reportEmail} onChange={(event) => set('reportEmail', event.target.value)} placeholder="ornek@firma.com" /></div>
                <label className="flex items-center gap-2 self-end rounded border px-3 py-2 text-xs"><input type="checkbox" checked={form.weeklyReportEnabled} onChange={(event) => set('weeklyReportEnabled', event.target.checked)} />{t('docs.weekly')}</label>
                {!isNew && banner?.weeklyReportSentAt ? <p className="text-xs text-muted-foreground">{t('docs.lastWeekly', { date: new Date(banner.weeklyReportSentAt).toLocaleString('tr-TR') })}</p> : null}
                {!isNew && banner?.closingReportSentAt ? <p className="text-xs text-muted-foreground">{t('docs.closing', { date: new Date(banner.closingReportSentAt).toLocaleString('tr-TR') })}</p> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                {form.invoiceUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.invoiceUrl} target="_blank" rel="noopener noreferrer">{t('docs.openInvoice')}</a></Button> : null}
                {form.contractFileUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.contractFileUrl} target="_blank" rel="noopener noreferrer">{t('docs.openContract')}</a></Button> : null}
                {form.creativeFileUrl ? <Button type="button" size="sm" variant="ghost" asChild><a href={form.creativeFileUrl} target="_blank" rel="noopener noreferrer">{t('docs.openCreative')}</a></Button> : null}
              </div>
            </div>
            {form.lifecycleStatus === 'cancelled' ? (
              <div className="grid gap-2">
                <Label>{t('schedule.cancelReason')}</Label>
                <Input value={form.cancellationReason} onChange={(e) => set('cancellationReason', e.target.value)} />
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t('schedule.start')}</Label>
                <Input type="datetime-local" value={form.startAt} onChange={(e) => set('startAt', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('schedule.end')}</Label>
                <Input type="datetime-local" value={form.endAt} onChange={(e) => set('endAt', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t('schedule.row')}</Label>
                <Input type="number" min={1} max={20} value={form.desktopRow} onChange={(e) => set('desktopRow', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('schedule.columns')}</Label>
                <Select value={form.desktopColumns} onValueChange={(v) => set('desktopColumns', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['1', '2', '3'].map((k) => <SelectItem key={k} value={k}>{t('schedule.adsPerRow', { count: k })}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 p-3">
              <p className="text-muted-foreground text-xs">{t('schedule.rowHint')}</p>
              <Badge variant={selectedInventory?.available === 0 ? 'destructive' : 'secondary'}>
                {selectedInventory
                  ? t('schedule.rowFull', { active: selectedInventory.active, columns: selectedInventory.columns })
                  : t('schedule.rowEmpty')}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>{t('schedule.order')}</Label>
                <Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder', e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>{t('schedule.weight')}</Label>
                <Input type="number" value={form.weight} onChange={(e) => set('weight', e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t('schedule.note')}</Label>
              <Input value={form.notes} onChange={(e) => set('notes', e.target.value)} />
            </div>

            <div className="rounded-md border p-4">
              <div className="mb-2 text-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('preview.title')}
              </div>
              <div className="flex justify-center">
                {form.type === 'code' ? (
                  <div className="text-muted-foreground text-xs">{t('preview.codeNote')}</div>
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
                      <strong className="mt-1 text-lg">{form.caption || form.title || t('preview.titleFallback')}</strong>
                      {form.description ? <span className="mt-1 text-xs opacity-75">{form.description}</span> : null}
                      {form.advertiser ? <span className="mt-1 text-xs opacity-70">{form.advertiser}</span> : null}
                      <span className="mt-3 w-fit rounded-full px-3 py-1 text-xs font-bold text-black" style={{ backgroundColor: form.accentColor }}>{form.ctaLabel || t('creative.ctaPlaceholder')} →</span>
                    </div>
                  </div>
                ) : vistaVariant ? (
                  <VistaSeedsPreview variant={vistaVariant} headline={form.caption} ctaLabel={form.ctaLabel} />
                ) : previewImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImg} alt={form.alt || form.title} className="max-h-40 max-w-full rounded border object-contain" />
                ) : (
                  <div className="text-muted-foreground text-xs">{t('preview.noImage')}</div>
                )}
              </div>
              <div className="mt-4 border-t pt-4">
                <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
                  {(['desktop', 'tablet', 'mobile'] as const).map((device) => <Button key={device} type="button" size="sm" variant={previewDevice === device ? 'default' : 'outline'} onClick={() => setPreviewDevice(device)}>{t(`preview.devices.${device}`)}</Button>)}
                  <Button type="button" size="sm" variant="outline" onClick={() => setPreviewTheme((value) => value === 'dark' ? 'light' : 'dark')}>{previewTheme === 'dark' ? t('preview.dark') : t('preview.light')}</Button>
                  <Button type="button" size="sm" variant={previewReducedMotion ? 'default' : 'outline'} onClick={() => setPreviewReducedMotion((value) => !value)}>{t('preview.reducedMotion')}</Button>
                  <Button type="button" size="sm" variant="ghost" asChild><a href={livePreviewUrl} target="_blank" rel="noopener noreferrer">{t('preview.openLive')}</a></Button>
                </div>
                <div className="mx-auto overflow-hidden rounded-lg border bg-muted transition-[width]" style={{ width: previewDevice === 'desktop' ? '100%' : previewDevice === 'tablet' ? '768px' : '390px', maxWidth: '100%' }}>
                  <iframe key={livePreviewUrl} src={livePreviewUrl} title={t('preview.iframeTitle')} className="h-72 w-full border-0" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
