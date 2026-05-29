'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  useCreateFirmDealAdminMutation,
  useCreateFirmSponsorshipAdminMutation,
  useDeleteFirmDealAdminMutation,
  useDeleteFirmSponsorshipAdminMutation,
  useListFirmDealsAdminQuery,
  useListFirmsAdminQuery,
  useListFirmSponsorshipsAdminQuery,
  useListStaleFirmsAdminQuery,
  useRunFirmsEtlAdminMutation,
  useUpdateFirmDealAdminMutation,
  useUpdateFirmSponsorshipAdminMutation,
} from '@/integrations/hooks';
import type { FirmAdminItem, FirmDeal, FirmSponsorship } from '@/integrations/endpoints/firms-admin-endpoints';

const TYPE_LABELS: Record<string, string> = {
  komisyoncu: 'Komisyoncu',
  soguk_hava: 'Soğuk Hava',
  nakliye: 'Nakliye',
  zirai_ilac: 'Zirai İlaç',
};

const STATUS_LABELS: Record<string, string> = {
  lead: 'Lead',
  contacted: 'Görüşüldü',
  negotiating: 'Pazarlık',
  won: 'Kazanıldı',
  lost: 'Kaybedildi',
};

export default function FirmsAdminPage() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('all');
  const [lastRun, setLastRun] = useState<string>('');
  const [selectedFirm, setSelectedFirm] = useState<FirmAdminItem | null>(null);

  const filters = useMemo(() => ({
    q: q || undefined,
    city: city || undefined,
    type: type === 'all' ? undefined : type,
    limit: 100,
  }), [q, city, type]);

  const { data, isLoading, refetch } = useListFirmsAdminQuery(filters);
  const { data: staleData } = useListStaleFirmsAdminQuery({ days: 45 });
  const [runEtl, { isLoading: isRunning }] = useRunFirmsEtlAdminMutation();

  async function handleDryRun() {
    const result = await runEtl({
      city: city || 'adana',
      type: type === 'all' ? 'komisyoncu' : type as any,
      dryRun: true,
      limit: 100,
      delayMs: 0,
      includeDetails: false,
    }).unwrap();
    setLastRun(`Dry-run: ${result.discovered} firma bulundu.`);
  }

  async function handleRunCity() {
    const result = await runEtl({
      city: city || 'adana',
      type: type === 'all' ? 'komisyoncu' : type as any,
      limit: 250,
      delayMs: 750,
      includeDetails: true,
    }).unwrap();
    setLastRun(`ETL: ${result.discovered} bulundu, ${result.inserted ?? 0} yeni, ${result.updated ?? 0} güncel, ${result.skipped ?? 0} atlandı.`);
    await refetch();
  }

  const summary = data?.summary;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Toplam" value={summary?.total ?? 0} />
        <Metric title="Aktif" value={summary?.active ?? 0} />
        <Metric title="Stale" value={summary?.stale ?? staleData?.items?.length ?? 0} />
        <Metric title="Pipeline TL" value={summary?.pipelineValue ?? 0} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Firma Rehberi</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleDryRun} disabled={isRunning}>
              Dry-run
            </Button>
            <Button size="sm" onClick={handleRunCity} disabled={isRunning}>
              İl ETL Çalıştır
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Firma adı, adres, telefon" />
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="İl slug (adana)" />
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue placeholder="Tür" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm türler</SelectItem>
                <SelectItem value="komisyoncu">Komisyoncu</SelectItem>
                <SelectItem value="soguk_hava">Soğuk Hava</SelectItem>
                <SelectItem value="nakliye">Nakliye</SelectItem>
                <SelectItem value="zirai_ilac">Zirai İlaç</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {lastRun && (
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              {lastRun}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>İl / İlçe</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>Son Görülme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={5}>Yükleniyor...</TableCell></TableRow>}
              {(data?.items || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <button className="text-xs text-primary" type="button" onClick={() => setSelectedFirm(item)}>
                      {item.slug}
                    </button>
                  </TableCell>
                  <TableCell>{TYPE_LABELS[item.firmType] ?? item.firmType}</TableCell>
                  <TableCell>{item.citySlug || '-'}{item.districtSlug ? ` / ${item.districtSlug}` : ''}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>{item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={5}>Kayıt bulunamadı.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedFirm && (
        <FirmCrmPanel firm={selectedFirm} onClose={() => setSelectedFirm(null)} />
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stale Firma Raporu</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>İl</TableHead>
                <TableHead>Son Görülme</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(staleData?.items || []).slice(0, 20).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.citySlug || '-'}</TableCell>
                  <TableCell>{item.lastSeenAt ? new Date(item.lastSeenAt).toLocaleDateString('tr-TR') : '-'}</TableCell>
                </TableRow>
              ))}
              {(staleData?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={3}>Stale kayıt yok.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function FirmCrmPanel({ firm, onClose }: { firm: FirmAdminItem; onClose: () => void }) {
  const { data: dealsData } = useListFirmDealsAdminQuery(firm.id);
  const { data: sponsorData } = useListFirmSponsorshipsAdminQuery(firm.id);
  const [createDeal, { isLoading: isCreatingDeal }] = useCreateFirmDealAdminMutation();
  const [updateDeal] = useUpdateFirmDealAdminMutation();
  const [deleteDeal] = useDeleteFirmDealAdminMutation();
  const [createSponsor, { isLoading: isCreatingSponsor }] = useCreateFirmSponsorshipAdminMutation();
  const [updateSponsor] = useUpdateFirmSponsorshipAdminMutation();
  const [deleteSponsor] = useDeleteFirmSponsorshipAdminMutation();

  const [dealStatus, setDealStatus] = useState<FirmDeal['status']>('lead');
  const [dealType, setDealType] = useState<FirmDeal['dealType']>('reklam');
  const [dealValue, setDealValue] = useState('');
  const [notes, setNotes] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [tier, setTier] = useState('premium');
  const [placement, setPlacement] = useState<FirmSponsorship['placement']>('il');
  const [placementSlug, setPlacementSlug] = useState(firm.citySlug || '');
  const [days, setDays] = useState('30');

  async function submitDeal() {
    await createDeal({
      firmId: firm.id,
      body: {
        status: dealStatus,
        dealType,
        value: dealValue ? Number(dealValue) : null,
        currency: 'TRY',
        notes: notes || null,
        nextActionAt: nextAction ? new Date(nextAction).toISOString() : null,
      },
    }).unwrap();
    setDealValue('');
    setNotes('');
    setNextAction('');
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
          </div>
          <Button size="sm" onClick={submitDeal} disabled={isCreatingDeal}>Deal ekle</Button>

          <Table>
            <TableHeader><TableRow><TableHead>Durum</TableHead><TableHead>Tip</TableHead><TableHead>Tutar</TableHead><TableHead>İşlem</TableHead></TableRow></TableHeader>
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
                  <TableCell><Button variant="outline" size="sm" onClick={() => deleteDeal({ dealId: deal.id, firmId: firm.id })}>Sil</Button></TableCell>
                </TableRow>
              ))}
              {(dealsData?.items || []).length === 0 && <TableRow><TableCell colSpan={4}>Deal yok.</TableCell></TableRow>}
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
                  <TableCell>{new Date(sponsor.endsAt).toLocaleDateString('tr-TR')}</TableCell>
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
      </CardContent>
    </Card>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value.toLocaleString('tr-TR')}</div>
      </CardContent>
    </Card>
  );
}
