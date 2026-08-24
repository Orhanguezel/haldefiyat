'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { buildFirmWhatsappLink } from '@/lib/firm-whatsapp';
import { publicSiteLink } from '@/lib/public-site';
import {
  useCreateFirmDealAdminMutation,
  useCreateFirmAdCampaignAdminMutation,
  useCreateFirmSponsorshipAdminMutation,
  useAdSlotAvailabilityAdminQuery,
  useDeleteFirmDealAdminMutation,
  useDeleteFirmSponsorshipAdminMutation,
  useListFirmAdCampaignsAdminQuery,
  useListFirmDealsAdminQuery,
  useListFirmSponsorshipsAdminQuery,
  useListAdSlotsAdminQuery,
  useUpdateFirmAdminMutation,
  useClearFirmContactsAdminMutation,
  useUpdateFirmDealAdminMutation,
  useUpdateFirmSponsorshipAdminMutation,
} from '@/integrations/hooks';
import type { FirmAdminItem, FirmDeal, FirmSponsorship } from '@/integrations/endpoints/firms-admin-endpoints';
import { BANNER_POSITIONS } from '@/integrations/endpoints/banners-admin-endpoints';

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  contacted: 'Görüşüldü',
  negotiating: 'Pazarlık',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
};


export function FirmCrmPanel({ firm, onClose }: { firm: FirmAdminItem; onClose: () => void }) {
  const { data: dealsData } = useListFirmDealsAdminQuery(firm.id);
  const { data: sponsorData } = useListFirmSponsorshipsAdminQuery(firm.id);
  const { data: campaignData } = useListFirmAdCampaignsAdminQuery(firm.id);
  const { data: slotsData } = useListAdSlotsAdminQuery();
  const { data: slotAvailability } = useAdSlotAvailabilityAdminQuery({
    at: new Date().toISOString().slice(0, 10),
    horizonDays: 365,
  });
  const [createDeal, { isLoading: isCreatingDeal }] = useCreateFirmDealAdminMutation();
  const [updateDeal] = useUpdateFirmDealAdminMutation();
  const [deleteDeal] = useDeleteFirmDealAdminMutation();
  const [createSponsor, { isLoading: isCreatingSponsor }] = useCreateFirmSponsorshipAdminMutation();
  const [createCampaign, { isLoading: isCreatingCampaign }] = useCreateFirmAdCampaignAdminMutation();
  const [updateSponsor] = useUpdateFirmSponsorshipAdminMutation();
  const [deleteSponsor] = useDeleteFirmSponsorshipAdminMutation();
  const [updateFirm, { isLoading: isUpdatingFirm }] = useUpdateFirmAdminMutation();
  const [clearContacts, { isLoading: isClearingContacts }] = useClearFirmContactsAdminMutation();

  const [dealStatus, setDealStatus] = useState<FirmDeal['status']>('lead');
  const [dealType, setDealType] = useState<FirmDeal['dealType']>('reklam');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [contractUrl, setContractUrl] = useState('');
  const [renewalReminderDays, setRenewalReminderDays] = useState('14');
  const [tier, setTier] = useState('premium');
  const [placement, setPlacement] = useState<FirmSponsorship['placement']>('il');
  const [placementSlug, setPlacementSlug] = useState(firm.citySlug || '');
  const [days, setDays] = useState('30');
  const [description, setDescription] = useState(firm.description || '');
  const [edit, setEdit] = useState({
    name: firm.name || '',
    contactPerson: firm.contactPerson || '',
    phone: firm.phone || '',
    address: firm.address || '',
    citySlug: firm.citySlug || '',
    districtSlug: firm.districtSlug || '',
    categories: (firm.categories || []).join(', '),
    firmType: firm.firmType,
  });
  const [seoIndex, setSeoIndex] = useState(firm.seoIndex === true || firm.seoIndex === 1);
  const [editError, setEditError] = useState('');
  const [editSaved, setEditSaved] = useState(false);

  async function handleSaveFirm() {
    setEditError('');
    setEditSaved(false);
    try {
      await updateFirm({
        firmId: firm.id,
        body: {
          name: edit.name.trim(),
          contactPerson: edit.contactPerson.trim() || null,
          phone: edit.phone.trim() || null,
          address: edit.address.trim() || null,
          citySlug: edit.citySlug.trim() || null,
          districtSlug: edit.districtSlug.trim() || null,
          categories: edit.categories.split(',').map((item) => item.trim()).filter(Boolean),
          firmType: edit.firmType,
          description,
          seoIndex,
        },
      }).unwrap();
      setEditSaved(true);
    } catch (error) {
      const apiError = error as { data?: { error?: string; issues?: Array<{ path?: string[]; message?: string }> } };
      const issue = apiError.data?.issues?.[0];
      setEditError(issue ? `${issue.path?.join('.')}: ${issue.message}` : apiError.data?.error || 'Firma kaydedilemedi.');
    }
  }

  const [campaignSlot, setCampaignSlot] = useState('global_footer');
  const [campaignTitle, setCampaignTitle] = useState(firm.name);
  const [campaignCaption, setCampaignCaption] = useState('');
  const [campaignImage, setCampaignImage] = useState(firm.photoUrl || '');
  const [campaignRow, setCampaignRow] = useState('1');
  const [campaignColumns, setCampaignColumns] = useState('2');
  const [campaignPayment, setCampaignPayment] = useState<'unpaid' | 'paid' | 'waived'>('unpaid');
  const [campaignDealId, setCampaignDealId] = useState('');
  const [campaignError, setCampaignError] = useState('');
  const suggestedSlotKeys = useMemo(() => {
    if (placement === 'global') return ['global_footer', 'global_top', 'home_mid'];
    if (placement === 'kategori') return ['urun_sidebar', 'prices_sidebar', 'home_mid'];
    return ['firm_detail_footer', 'firm_detail_sidebar', 'prices_top'];
  }, [placement]);
  const suggestedSlots = useMemo(() => {
    const slots = (slotsData?.items || []).filter((slot) =>
      slot.isActive && slot.sourceTypes.includes('firm') && suggestedSlotKeys.includes(slot.slotKey),
    );
    return [...slots].sort((a, b) => {
      const ai = suggestedSlotKeys.indexOf(a.slotKey);
      const bi = suggestedSlotKeys.indexOf(b.slotKey);
      return ai - bi;
    });
  }, [slotsData?.items, suggestedSlotKeys]);

  async function submitDeal() {
    await createDeal({
      firmId: firm.id,
      body: {
        status: dealStatus,
        dealType,
        value: dealValue ? Number(dealValue) : null,
        currency: 'TRY',
        notes: notes || null,
        contractNumber: contractNumber || null,
        contractUrl: contractUrl || null,
        renewalReminderDays: Math.max(1, Number(renewalReminderDays) || 14),
        nextActionAt: nextAction ? new Date(nextAction).toISOString() : null,
      },
    }).unwrap();
    setDealValue('');
    setNotes('');
    setNextAction('');
    setContractNumber('');
    setContractUrl('');
  }

  async function submitSponsor() {
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + Math.max(1, Number(days) || 30) * 24 * 60 * 60 * 1000);
    await createSponsor({
      firmId: firm.id,
      tier,
      placement,
      placementSlug: placement === 'global' ? null : placementSlug || firm.citySlug || null,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      isActive: true,
    }).unwrap();
  }

  async function submitCampaign() {
    setCampaignError('');
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + Math.max(1, Number(days) || 30) * 86_400_000);
    try {
      await createCampaign({
        firmId: firm.id,
        body: {
          dealId: campaignDealId ? Number(campaignDealId) : null,
          position: campaignSlot,
          title: campaignTitle,
          caption: campaignCaption || null,
          imageUrl: campaignImage || null,
          linkUrl: `/firma/${firm.slug}`,
          ctaLabel: 'Firmayı İncele',
          tier,
          placement,
          placementSlug: placement === 'global' ? null : placementSlug || firm.citySlug || null,
          startsAt: startsAt.toISOString(),
          endsAt: endsAt.toISOString(),
          desktopRow: Math.max(1, Number(campaignRow) || 1),
          desktopColumns: Math.max(1, Number(campaignColumns) || 1),
          paymentStatus: campaignPayment,
        },
      }).unwrap();
    } catch (error) {
      const apiError = error as { data?: { error?: string } };
      setCampaignError(apiError.data?.error || 'Kampanya oluşturulamadı.');
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base">{firm.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{firm.citySlug || '-'}{firm.phone ? ` · ${firm.phone}` : ''}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onClose}>Kapat</Button>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3 xl:col-span-2">
          <h3 className="text-sm font-semibold">Firma Bilgileri</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Firma adı</label>
              <Input value={edit.name} onChange={(event) => setEdit({ ...edit, name: event.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Yetkili kişi</label>
              <Input value={edit.contactPerson} onChange={(event) => setEdit({ ...edit, contactPerson: event.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Telefon</label>
              <Input value={edit.phone} onChange={(event) => setEdit({ ...edit, phone: event.target.value })} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Firma tipi</label>
              <Select value={edit.firmType} onValueChange={(value) => setEdit({ ...edit, firmType: value as FirmAdminItem['firmType'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="komisyoncu">Komisyoncu</SelectItem>
                  <SelectItem value="soguk_hava">Soğuk Hava</SelectItem>
                  <SelectItem value="nakliye">Nakliye</SelectItem>
                  <SelectItem value="zirai_ilac">Zirai İlaç</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">İl slug</label>
              <Input value={edit.citySlug} onChange={(event) => setEdit({ ...edit, citySlug: event.target.value })} placeholder="antalya" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">İlçe slug</label>
              <Input value={edit.districtSlug} onChange={(event) => setEdit({ ...edit, districtSlug: event.target.value })} placeholder="kumluca" />
              {edit.districtSlug.trim() !== '' && !/^[a-z0-9-]+$/.test(edit.districtSlug.trim()) && (
                <p className="text-xs text-amber-600">Slug biçimi bozuk (küçük harf, rakam ve tire olmalı).</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-muted-foreground">Adres</label>
              <Textarea value={edit.address} onChange={(event) => setEdit({ ...edit, address: event.target.value })} rows={2} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs text-muted-foreground">Kategoriler (virgülle ayır)</label>
              <Input value={edit.categories} onChange={(event) => setEdit({ ...edit, categories: event.target.value })} placeholder="Domates, Salatalık" />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" checked={seoIndex} onChange={(event) => setSeoIndex(event.target.checked)} />
              Google&apos;a aç (sitemap + index)
            </label>
            <Button size="sm" onClick={handleSaveFirm} disabled={isUpdatingFirm}>Firma bilgilerini kaydet</Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isClearingContacts}
              onClick={async () => {
                if (!window.confirm(`"${firm.name}" firmasının yayındaki telefon ve OCR iletişim kayıtları kaldırılacak. KVKK/düzeltme talebi için kullanın. Onaylıyor musunuz?`)) return;
                await clearContacts({ firmId: firm.id }).unwrap();
                setEdit((prev) => ({ ...prev, phone: '' }));
              }}
            >
              İletişim bilgisini kaldır (KVKK)
            </Button>
            {editSaved && <span className="text-xs text-emerald-600">Kaydedildi.</span>}
            {editError && <span className="text-xs text-red-600">{editError}</span>}
          </div>
        </section>

        <section className="space-y-3 xl:col-span-2">
          <h3 className="text-sm font-semibold">Moderasyon</h3>
          <div className="grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <Textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Firma açıklaması" rows={3} />
            <Button size="sm" onClick={() => updateFirm({ firmId: firm.id, body: { description, status: 'approved' } })} disabled={isUpdatingFirm}>
              Onayla ve kaydet
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateFirm({ firmId: firm.id, body: { status: 'rejected' } })} disabled={isUpdatingFirm}>
              Reddet
            </Button>
          </div>
        </section>
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Deal Paneli</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Select value={dealStatus} onValueChange={(value) => setDealStatus(value as FirmDeal['status'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={dealType} onValueChange={(value) => setDealType(value as FirmDeal['dealType'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="reklam">Reklam</SelectItem>
                <SelectItem value="sponsorluk">Sponsorluk</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="diger">Diğer</SelectItem>
              </SelectContent>
            </Select>
            <Input value={dealValue} onChange={(event) => setDealValue(event.target.value)} placeholder="Teklif TL" />
            <Input value={nextAction} onChange={(event) => setNextAction(event.target.value)} type="datetime-local" />
            <Input className="md:col-span-2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Not" />
            <Input value={contractNumber} onChange={(event) => setContractNumber(event.target.value)} placeholder="Sözleşme numarası" />
            <Input value={contractUrl} onChange={(event) => setContractUrl(event.target.value)} placeholder="Sözleşme/dosya bağlantısı" />
            <Input value={renewalReminderDays} onChange={(event) => setRenewalReminderDays(event.target.value)} type="number" min={1} max={180} placeholder="Yenileme uyarısı (gün)" />
          </div>
          <Button size="sm" onClick={submitDeal} disabled={isCreatingDeal}>Deal ekle</Button>

          <Table>
            <TableHeader><TableRow><TableHead>Durum</TableHead><TableHead>Tip</TableHead><TableHead>Tutar</TableHead><TableHead>Sözleşme</TableHead><TableHead>İşlem</TableHead></TableRow></TableHeader>
            <TableBody>
              {(dealsData?.items || []).map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell>
                    <Select value={deal.status} onValueChange={(value) => updateDeal({ dealId: deal.id, firmId: firm.id, body: { status: value as FirmDeal['status'] } })}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>{Object.entries(STATUS_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>{deal.dealType}</TableCell>
                  <TableCell>{deal.value ? `${Number(deal.value).toLocaleString('tr-TR')} ${deal.currency}` : '-'}</TableCell>
                  <TableCell>
                    {deal.contractUrl ? (
                      <a className="text-primary underline underline-offset-2" href={deal.contractUrl} target="_blank" rel="noopener noreferrer">
                        {deal.contractNumber || 'Dosyayı aç'}
                      </a>
                    ) : deal.contractNumber || '-'}
                  </TableCell>
                  <TableCell><Button variant="outline" size="sm" onClick={() => deleteDeal({ dealId: deal.id, firmId: firm.id })}>Sil</Button></TableCell>
                </TableRow>
              ))}
              {(dealsData?.items || []).length === 0 && <TableRow><TableCell colSpan={5}>Deal yok.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Sponsorluk</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Input value={tier} onChange={(event) => setTier(event.target.value)} placeholder="Tier: premium" />
            <Select value={placement} onValueChange={(value) => setPlacement(value as FirmSponsorship['placement'])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="il">İl</SelectItem>
                <SelectItem value="kategori">Kategori</SelectItem>
                <SelectItem value="global">Global</SelectItem>
              </SelectContent>
            </Select>
            <Input value={placementSlug} onChange={(event) => setPlacementSlug(event.target.value)} placeholder="Yerleşim slug" />
            <Input value={days} onChange={(event) => setDays(event.target.value)} placeholder="Gün" />
          </div>
          <Button size="sm" onClick={submitSponsor} disabled={isCreatingSponsor}>Sponsorluğu başlat</Button>

          <Table>
            <TableHeader><TableRow><TableHead>Tier</TableHead><TableHead>Yer</TableHead><TableHead>Bitiş</TableHead><TableHead>İşlem</TableHead></TableRow></TableHeader>
            <TableBody>
              {(sponsorData?.items || []).map((sponsor) => (
                <TableRow key={sponsor.id}>
                  <TableCell>{sponsor.tier}</TableCell>
                  <TableCell>{sponsor.placement}{sponsor.placementSlug ? ` / ${sponsor.placementSlug}` : ''}</TableCell>
                  <TableCell>
                    {new Date(sponsor.endsAt).toLocaleDateString('tr-TR')}
                    {(() => {
                      const remainingDays = Math.ceil((new Date(sponsor.endsAt).getTime() - Date.now()) / 86_400_000);
                      const reminderDays = Math.max(1, ...(dealsData?.items || []).filter((deal) => deal.status === 'won').map((deal) => deal.renewalReminderDays || 14), 14);
                      if (!(sponsor.isActive === true || sponsor.isActive === 1) || remainingDays > reminderDays) return null;
                      return (
                        <Badge className="ml-2" variant={remainingDays < 0 ? 'destructive' : 'secondary'}>
                          {remainingDays < 0 ? 'Süresi doldu' : remainingDays === 0 ? 'Bugün bitiyor' : `${remainingDays} gün kaldı · yenile`}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button variant="outline" size="sm" onClick={() => updateSponsor({ sponsorshipId: sponsor.id, firmId: firm.id, body: { isActive: !(sponsor.isActive === true || sponsor.isActive === 1) } })}>
                      {sponsor.isActive === true || sponsor.isActive === 1 ? 'Pasifleştir' : 'Aktifleştir'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => deleteSponsor({ sponsorshipId: sponsor.id, firmId: firm.id })}>Sil</Button>
                  </TableCell>
                </TableRow>
              ))}
              {(sponsorData?.items || []).length === 0 && <TableRow><TableCell colSpan={4}>Sponsorluk yok.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </section>

        <section className="space-y-3 xl:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold">Reklam Kampanyası</h3>
              <p className="text-xs text-muted-foreground">Anlaşma, sponsorluk ve ölçümlü banner kaydını birlikte oluşturur.</p>
            </div>
            <div className="text-sm">
              {campaignData?.summary.impressions.toLocaleString('tr-TR') || 0} gösterim · {campaignData?.summary.clicks.toLocaleString('tr-TR') || 0} tıklama ·{' '}
              {campaignData?.summary.impressions ? ((campaignData.summary.clicks / campaignData.summary.impressions) * 100).toFixed(2) : '0.00'}% CTR
            </div>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            <Select value={campaignSlot} onValueChange={setCampaignSlot}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{BANNER_POSITIONS.map((slot) => <SelectItem key={slot.value} value={slot.value}>{slot.label}</SelectItem>)}</SelectContent>
            </Select>
            <Input value={campaignTitle} onChange={(event) => setCampaignTitle(event.target.value)} placeholder="Reklam başlığı" />
            <Input value={campaignCaption} onChange={(event) => setCampaignCaption(event.target.value)} placeholder="Kısa reklam metni" />
            <Input value={campaignImage} onChange={(event) => setCampaignImage(event.target.value)} placeholder="Görsel URL (firma görseli varsayılan)" />
            <Select value={campaignDealId || 'none'} onValueChange={(value) => setCampaignDealId(value === 'none' ? '' : value)}>
              <SelectTrigger><SelectValue placeholder="Anlaşma bağlantısı" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Anlaşmaya bağlama</SelectItem>
                {(dealsData?.items || []).map((deal) => <SelectItem key={deal.id} value={String(deal.id)}>#{deal.id} · {deal.dealType} · {STATUS_LABELS[deal.status]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={campaignPayment} onValueChange={(value) => setCampaignPayment(value as typeof campaignPayment)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Ödeme bekleniyor</SelectItem>
                <SelectItem value="paid">Ödendi — yayına al</SelectItem>
                <SelectItem value="waived">Ücretsiz/onaylı — yayına al</SelectItem>
              </SelectContent>
            </Select>
            <Input value={campaignRow} onChange={(event) => setCampaignRow(event.target.value)} type="number" min={1} placeholder="Satır" />
            <Input value={campaignColumns} onChange={(event) => setCampaignColumns(event.target.value)} type="number" min={1} max={4} placeholder="Satırdaki sütun" />
            <Input value={days} onChange={(event) => setDays(event.target.value)} type="number" min={1} placeholder="Yayın günü" />
          </div>
          <div className="grid gap-3 lg:grid-cols-[1.1fr_1fr]">
            <div className="rounded-xl border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Canlı kreatif önizleme</span>
                <Badge variant="outline">Sponsorlu</Badge>
              </div>
              <div className="flex min-h-32 overflow-hidden rounded-xl border border-emerald-800/40 bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-sm">
                <div
                  className="min-h-32 w-2/5 bg-cover bg-center"
                  style={campaignImage ? { backgroundImage: `linear-gradient(90deg, rgba(2,44,34,.12), rgba(2,44,34,.7)), url("${campaignImage.replace(/"/g, '%22')}")` } : undefined}
                >
                  {!campaignImage && <div className="flex h-full items-center justify-center text-xs text-emerald-200">Firma görseli</div>}
                </div>
                <div className="flex flex-1 flex-col justify-center px-5 py-4">
                  <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-lime-300">{firm.name}</div>
                  <div className="mt-1 text-lg font-bold leading-tight">{campaignTitle || 'Reklam başlığı'}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-emerald-100/75">{campaignCaption || firm.description || `${firm.citySlug || ''} bölgesindeki firma profiline ulaşın.`}</div>
                  <span className="mt-3 w-fit rounded-full bg-lime-400 px-3 py-1.5 text-xs font-semibold text-emerald-950">Firmayı İncele →</span>
                </div>
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Önerilen müsait slotlar</div>
              <div className="space-y-2">
                {suggestedSlots.map((slot, index) => {
                  const availability = slotAvailability?.items.find((item) => item.slotKey === slot.slotKey);
                  const available = (availability?.available ?? 0) > 0;
                  return (
                    <button
                      key={slot.slotKey}
                      type="button"
                      disabled={!available}
                      onClick={() => {
                        setCampaignSlot(slot.slotKey);
                        setCampaignColumns(String(Math.max(1, slot.desktopCapacity)));
                      }}
                      className={`flex w-full items-center justify-between rounded-lg border p-2 text-left text-sm transition ${campaignSlot === slot.slotKey ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'} disabled:cursor-not-allowed disabled:opacity-60`}
                    >
                      <span>
                        <span className="font-medium">{slot.label}</span>
                        <span className="block text-[11px] text-muted-foreground">{slot.recommendedSize || slot.placementDescription}</span>
                      </span>
                      <span className="ml-3 text-right text-xs">
                        {index === 0 && <Badge className="mb-1">Önerilen</Badge>}
                        <span className={`block ${available ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {availability ? (available ? `${availability.available} boş` : `Dolu${availability.nextAvailableAt ? ` · ${new Date(`${availability.nextAvailableAt}T12:00:00`).toLocaleDateString('tr-TR')}` : ''}`) : 'Hesaplanıyor'}
                        </span>
                      </span>
                    </button>
                  );
                })}
                {suggestedSlots.length === 0 && <p className="text-xs text-muted-foreground">Bu kapsam için satışa açık firma slotu bulunamadı.</p>}
              </div>
            </div>
          </div>
          {campaignError && <p className="text-sm text-destructive">{campaignError}</p>}
          <Button size="sm" onClick={submitCampaign} disabled={isCreatingCampaign || !campaignTitle.trim()}>
            Kampanyayı oluştur
          </Button>
          <Table>
            <TableHeader><TableRow><TableHead>Kampanya</TableHead><TableHead>Slot</TableHead><TableHead>Durum</TableHead><TableHead>Performans</TableHead><TableHead>Bitiş</TableHead></TableRow></TableHeader>
            <TableBody>
              {(campaignData?.items || []).map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>{campaign.title}</TableCell>
                  <TableCell>{campaign.position}</TableCell>
                  <TableCell>{campaign.lifecycleStatus} · {campaign.paymentStatus}</TableCell>
                  <TableCell>{campaign.impressions.toLocaleString('tr-TR')} / {campaign.clicks.toLocaleString('tr-TR')} · {campaign.impressions ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2) : '0.00'}%</TableCell>
                  <TableCell>{campaign.endAt ? new Date(campaign.endAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                </TableRow>
              ))}
              {(campaignData?.items || []).length === 0 && <TableRow><TableCell colSpan={5}>Firma reklam kampanyası yok.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </section>
      </CardContent>
    </Card>
  );
}
