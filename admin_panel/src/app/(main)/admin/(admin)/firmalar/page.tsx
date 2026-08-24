'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { buildFirmWhatsappLink } from '@/lib/firm-whatsapp';
import { publicSiteLink } from '@/lib/public-site';
import {
  useListFirmClaimsAdminQuery,
  useListFirmsAdminQuery,
  useListStaleFirmsAdminQuery,
  useModerateFirmClaimAdminMutation,
  useRunFirmsEtlAdminMutation,
  useUpdateFirmAdminMutation,
} from '@/integrations/hooks';
import type { FirmAdminItem, FirmClaimAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';

const TYPE_LABELS: Record<string, string> = {
  komisyoncu: 'Komisyoncu',
  soguk_hava: 'Soğuk Hava',
  nakliye: 'Nakliye',
  zirai_ilac: 'Zirai İlaç',
};

const FIRM_STATUS_LABELS: Record<string, string> = {
  all: 'Tümü',
  pending: 'Bekleyen',
  approved: 'Onaylı',
  rejected: 'Reddedilen',
};

export default function FirmsAdminPage() {
  // Filtre degisince ilk sayfaya don; yoksa 5. sayfada bos liste gorunur.
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [claimStatus, setClaimStatus] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [lastRun, setLastRun] = useState<string>('');
  const [page, setPage] = useState(0);
  const router = useRouter();
  const PAGE_SIZE = 50;

  const filters = useMemo(() => ({
    q: q || undefined,
    city: city || undefined,
    type: type === 'all' ? undefined : type,
    status,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  }), [q, city, type, status, page]);

  const { data, isLoading, refetch } = useListFirmsAdminQuery(filters);
  const { data: staleData } = useListStaleFirmsAdminQuery({ days: 45 });
  const { data: claimsData } = useListFirmClaimsAdminQuery({ status: claimStatus });
  const [runEtl, { isLoading: isRunning }] = useRunFirmsEtlAdminMutation();
  const [updateFirm, { isLoading: isUpdatingFirm }] = useUpdateFirmAdminMutation();
  const [moderateClaim, { isLoading: isModeratingClaim }] = useModerateFirmClaimAdminMutation();

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

  const total = data?.meta?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(total, (page + 1) * PAGE_SIZE);

  const summary = data?.summary;
  const pendingCount = data?.items.filter((item) => item.status === 'pending').length ?? 0;

  async function setFirmStatus(item: FirmAdminItem, nextStatus: 'approved' | 'rejected' | 'pending') {
    await updateFirm({
      firmId: item.id,
      body: {
        status: nextStatus,
        claimStatus: nextStatus === 'approved' ? (item.claimStatus === 'pending' ? 'verified' : item.claimStatus) : item.claimStatus,
      },
    }).unwrap();
  }

  async function releaseOwnership(item: FirmAdminItem) {
    if (!window.confirm(`"${item.name}" firmasının sahipliğini kaldırmak istiyor musunuz? Firma kaydı silinmez; tekrar sahiplenilebilir olur.`)) return;
    await updateFirm({ firmId: item.id, body: { claimStatus: 'unclaimed', ownerUserId: null } }).unwrap();
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric title="Toplam" value={summary?.total ?? 0} />
        <Metric title="Aktif" value={summary?.active ?? 0} />
        <Metric title="Stale" value={summary?.stale ?? staleData?.items?.length ?? 0} />
        <Metric title="Bekleyen" value={pendingCount} />
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
          <div className="flex flex-wrap gap-2">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((item) => (
              <Button
                key={item}
                size="sm"
                variant={status === item ? 'default' : 'outline'}
                onClick={() => { setStatus(item); setPage(0); }}
              >
                {FIRM_STATUS_LABELS[item]}
              </Button>
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
            <Input value={q} onChange={(event) => { setQ(event.target.value); setPage(0); }} placeholder="Firma adı, adres, telefon" />
            <Input value={city} onChange={(event) => { setCity(event.target.value); setPage(0); }} placeholder="İl slug (adana)" />
            <Select value={type} onValueChange={(value) => { setType(value); setPage(0); }}>
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

          <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>Tür</TableHead>
                <TableHead>İl / İlçe</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead className="text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
              {(data?.items || []).map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <Link href={`/admin/firmalar/${item.id}`} className="text-xs text-primary hover:underline">
                      {item.slug}
                    </Link>
                    {item.source === 'user' && <div className="text-xs text-muted-foreground">Üye kaydı</div>}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-md border px-2 py-1 text-xs">{FIRM_STATUS_LABELS[item.status ?? 'approved'] ?? item.status}</span>
                    {item.claimStatus === 'pending' && <div className="mt-1 text-xs text-amber-600">Sahiplenme bekliyor</div>}
                  </TableCell>
                  <TableCell>{TYPE_LABELS[item.firmType] ?? item.firmType}</TableCell>
                  <TableCell>{item.citySlug || '-'}{item.districtSlug ? ` / ${item.districtSlug}` : ''}</TableCell>
                  <TableCell>{item.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/firmalar/${item.id}`}>Detay</Link>
                      </Button>
                      {publicSiteLink(`/firma/${item.slug}`) && (
                        <Button asChild size="sm" variant="ghost">
                          <a href={publicSiteLink(`/firma/${item.slug}`)!} target="_blank" rel="noopener noreferrer" title="Public firma sayfasi">
                            Gör
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && (data?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={6}>Kayıt bulunamadı.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <p className="text-sm text-muted-foreground">
              {total > 0
                ? `${rangeStart}-${rangeEnd} / ${total.toLocaleString('tr-TR')} firma`
                : 'Kayıt yok'}
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage(0)} disabled={page === 0}>
                ‹‹ İlk
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                ‹ Önceki
              </Button>
              <span className="px-2 text-sm text-muted-foreground">
                Sayfa {page + 1} / {pageCount}
              </span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= pageCount}>
                Sonraki ›
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage(pageCount - 1)} disabled={page + 1 >= pageCount}>
                Son ››
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Sahiplenme Talepleri</CardTitle>
          <Select value={claimStatus} onValueChange={(value) => setClaimStatus(value as typeof claimStatus)}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Bekleyen</SelectItem>
              <SelectItem value="approved">Onaylı</SelectItem>
              <SelectItem value="rejected">Reddedilen</SelectItem>
              <SelectItem value="all">Tümü</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Firma</TableHead>
                <TableHead>Kullanıcı</TableHead>
                <TableHead>Kanıt/Not</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead>İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(claimsData?.items || []).map((claim) => (
                <ClaimRow
                  key={claim.id}
                  claim={claim}
                  disabled={isModeratingClaim}
                  onModerate={(nextStatus) => moderateClaim({ claimId: claim.id, status: nextStatus })}
                />
              ))}
              {(claimsData?.items || []).length === 0 && (
                <TableRow><TableCell colSpan={5}>Talep yok.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>


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


function ClaimRow({
  claim,
  disabled,
  onModerate,
}: {
  claim: FirmClaimAdminItem;
  disabled: boolean;
  onModerate: (status: 'approved' | 'rejected') => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{claim.firmName || `#${claim.firmId}`}</div>
        <div className="text-xs text-muted-foreground">{claim.firmSlug || '-'}</div>
      </TableCell>
      <TableCell className="font-mono text-xs">{claim.userId}</TableCell>
      <TableCell className="max-w-[360px] whitespace-pre-wrap text-sm text-muted-foreground">{claim.evidence || '-'}</TableCell>
      <TableCell>{claim.status}</TableCell>
      <TableCell className="space-x-2">
        {claim.status === 'pending' ? (
          <>
            <Button size="sm" onClick={() => onModerate('approved')} disabled={disabled}>Onayla</Button>
            <Button size="sm" variant="outline" onClick={() => onModerate('rejected')} disabled={disabled}>Reddet</Button>
          </>
        ) : '-'}
      </TableCell>
    </TableRow>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <p className="mt-0.5 text-xl font-semibold">{value.toLocaleString('tr-TR')}</p>
    </div>
  );
}
