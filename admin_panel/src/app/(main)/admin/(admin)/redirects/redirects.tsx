'use client';

// =============================================================
// FILE: src/app/(main)/admin/(admin)/redirects/redirects.tsx
// Hal — 301/410 yönlendirme yönetimi + içerik/index denetimi
// =============================================================

import React from 'react';
import { toast } from 'sonner';
import { Loader2, Trash2, Route, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  useListRedirectsAdminQuery,
  useUpsertRedirectsAdminMutation,
  useDeleteRedirectAdminMutation,
  useGetSeoAuditAdminQuery,
  useRunSeoAuditActionAdminMutation,
  useUpdateRedirectAdminMutation,
} from '@/integrations/hooks';
import {
  SEO_AUDIT_ISSUE_LABELS,
  SEO_AUDIT_MISSING_LABELS,
  GSC_STATUS_LABELS,
  SEO_AUDIT_RECOMMENDATION_LABELS,
  type RedirectType,
  type SeoAuditItemDto,
} from '@/integrations/shared';

export default function RedirectsPage() {
  const [typeFilter, setTypeFilter] = React.useState<'all' | RedirectType>('all');
  const [search, setSearch] = React.useState('');
  const [form, setForm] = React.useState<{ sourcePath: string; type: RedirectType; targetUrl: string; note: string }>({
    sourcePath: '',
    type: '301',
    targetUrl: '',
    note: '',
  });
  const [bulkText, setBulkText] = React.useState('');
  const [auditView, setAuditView] = React.useState<'issues' | 'undiscovered' | 'indexed' | 'noindex' | 'ready' | 'all'>('issues');
  const [auditSearch, setAuditSearch] = React.useState('');

  const listQ = useListRedirectsAdminQuery({ type: typeFilter, search: search || undefined });
  const auditQ = useGetSeoAuditAdminQuery({ filter: 'all' });
  const [upsert, upsertState] = useUpsertRedirectsAdminMutation();
  const [remove] = useDeleteRedirectAdminMutation();
  const [updateRedirect] = useUpdateRedirectAdminMutation();
  const [runAuditAction, auditActionState] = useRunSeoAuditActionAdminMutation();

  const rows = listQ.data?.items ?? [];
  const byType = Object.fromEntries((listQ.data?.byType ?? []).map((r) => [r.type, r.n]));
  const audit = auditQ.data;
  const auditRows = React.useMemo(() => {
    const q = auditSearch.trim().toLocaleLowerCase('tr');
    return (audit?.items ?? []).filter((item) => {
      if (auditView === 'issues' && !item.issue) return false;
      if (auditView === 'undiscovered' && item.gscStatus !== 'discovered_not_indexed' && item.gscStatus !== 'crawled_not_indexed') return false;
      if (auditView === 'indexed' && !item.indexed) return false;
      if (auditView === 'noindex' && item.indexed) return false;
      if (auditView === 'ready' && item.issue !== 'ready_not_indexed') return false;
      if (!q) return true;
      return [
        item.slug,
        item.displayName,
        item.nameTr,
        item.canonicalSlug,
        item.issue ?? '',
        ...item.missing,
      ].filter(Boolean).join(' ').toLocaleLowerCase('tr').includes(q);
    });
  }, [audit?.items, auditSearch, auditView]);

  async function handleCreate() {
    if (!form.sourcePath.trim()) return toast.error('Kaynak yol gerekli');
    if (form.type === '301' && !form.targetUrl.trim()) return toast.error('301 için hedef URL gerekli');
    try {
      const res = await upsert({
        sourcePath: form.sourcePath.trim(),
        type: form.type,
        targetUrl: form.type === '301' ? form.targetUrl.trim() : null,
        note: form.note.trim() || null,
      }).unwrap();
      toast.success(`${res.created} eklendi, ${res.skipped} atlandı`);
      setForm({ sourcePath: '', type: '301', targetUrl: '', note: '' });
    } catch {
      toast.error('Yönlendirme eklenemedi');
    }
  }

  function parseBulkRedirects() {
    return bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [sourcePath = '', typeRaw = '301', targetUrl = '', note = ''] = line.split(',').map((part) => part.trim());
        return {
          sourcePath,
          type: typeRaw === '410' ? '410' as const : '301' as const,
          targetUrl: typeRaw === '410' ? null : targetUrl,
          note: note || null,
        };
      });
  }

  async function handleBulkCreate() {
    const items = parseBulkRedirects();
    if (items.length === 0) return toast.error('Toplu ekleme için satır girin');
    try {
      const res = await upsert({ items }).unwrap();
      toast.success(`${res.created} işlendi, ${res.skipped} atlandı`);
      setBulkText('');
    } catch {
      toast.error('Toplu ekleme başarısız');
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Bu yönlendirme silinsin mi?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Silindi');
    } catch {
      toast.error('Silinemedi');
    }
  }

  async function handleToggleActive(id: number, isActive: number) {
    try {
      await updateRedirect({ id, patch: { isActive: isActive ? 0 : 1 } }).unwrap();
      toast.success(isActive ? 'Pasifleştirildi' : 'Aktifleştirildi');
    } catch {
      toast.error('Durum güncellenemedi');
    }
  }

  async function handleSeoAction(action: 'set-index' | 'set-noindex', opts: { slugs?: string[]; issue?: NonNullable<SeoAuditItemDto['issue']> }) {
    try {
      const res = await runAuditAction({ action, ...opts }).unwrap();
      toast.success(`${res.updated} ürün güncellendi`);
    } catch {
      toast.error('SEO aksiyonu çalışmadı');
    }
  }

  async function handleVariantRedirect(item: SeoAuditItemDto) {
    if (!item.canonicalSlug) return toast.error('Canonical slug yok');
    try {
      await upsert({
        sourcePath: `/urun/${item.slug}`,
        type: '301',
        targetUrl: `/urun/${item.canonicalSlug}`,
        note: 'SEO audit variant canonical',
      }).unwrap();
      await handleSeoAction('set-noindex', { slugs: [item.slug] });
      toast.success('301 oluşturuldu ve varyant noindex yapıldı');
    } catch {
      toast.error('301 oluşturulamadı');
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold">
          <Route className="h-5 w-5" /> SEO / Yönlendirme
        </h1>
        <p className="text-sm text-muted-foreground">301/410 yönlendirme yönetimi ve içerik/index denetimi.</p>
      </div>

      <Tabs defaultValue="redirects">
        <TabsList>
          <TabsTrigger value="redirects">Yönlendirmeler (301/410)</TabsTrigger>
          <TabsTrigger value="audit">İçerik / Index Denetimi</TabsTrigger>
        </TabsList>

        {/* --- Yönlendirmeler --- */}
        <TabsContent value="redirects" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yeni Yönlendirme</CardTitle>
              <CardDescription>301 hedefe taşır, 410 kalıcı kaldırır. Kaynak yol locale-bağımsızdır (örn. /urun/eski-slug).</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Kaynak yol</label>
                <Input value={form.sourcePath} onChange={(e) => setForm({ ...form, sourcePath: e.target.value })} placeholder="/urun/eski-slug" />
              </div>
              <div className="w-28">
                <label className="text-xs text-muted-foreground">Tip</label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as RedirectType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="301">301</SelectItem>
                    <SelectItem value="410">410</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs text-muted-foreground">Hedef (sadece 301)</label>
                <Input value={form.targetUrl} onChange={(e) => setForm({ ...form, targetUrl: e.target.value })} placeholder="/urun/yeni-slug" disabled={form.type === '410'} />
              </div>
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-muted-foreground">Not</label>
                <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="GSC 2026-05-29" />
              </div>
              <Button onClick={handleCreate} disabled={upsertState.isLoading}>
                {upsertState.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
              </Button>
              <div className="basis-full space-y-2 pt-3">
                <label className="text-xs text-muted-foreground">Toplu ekleme (her satır: kaynak-yol, type, hedef, not)</label>
                <textarea
                  className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'/eski-url, 301, /yeni-url, GSC\n/kaldirilan-url, 410, , Ürün kaldırıldı'}
                />
                <Button variant="outline" onClick={handleBulkCreate} disabled={upsertState.isLoading}>Toplu ekle</Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex rounded-md border bg-muted/30 p-1">
              {(['all', '301', '410'] as const).map((v) => (
                <Button key={v} size="sm" variant={typeFilter === v ? 'default' : 'ghost'} className="h-8" onClick={() => setTypeFilter(v)}>
                  {v === 'all' ? `Tümü (${(byType['301'] ?? 0) + (byType['410'] ?? 0)})` : v === '301' ? `301 (${byType['301'] ?? 0})` : `410 (${byType['410'] ?? 0})`}
                </Button>
              ))}
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara: yol / hedef / not" />
            </div>
            {listQ.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kaynak yol</TableHead>
                    <TableHead>Tip</TableHead>
                    <TableHead>Hedef</TableHead>
                    <TableHead className="text-right">Hit</TableHead>
                    <TableHead>Not</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.sourcePath}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === '410' ? 'destructive' : 'default'}>{r.type}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{r.targetUrl ?? '—'}</TableCell>
                      <TableCell className="text-right">{r.hits}</TableCell>
                      <TableCell className="text-muted-foreground">{r.note ?? '—'}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleToggleActive(r.id, r.isActive)}>
                          {r.isActive ? 'Pasif' : 'Aktif'}
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!listQ.isFetching && rows.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Kayıt yok</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- İçerik / Index Denetimi --- */}
        <TabsContent value="audit" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-8">
            {([
              ['total', 'Toplam', audit?.summary.total],
              ['indexed', 'İndexli', audit?.summary.indexed],
              ['noindex', 'Noindex', audit ? audit.summary.total - audit.summary.indexed : undefined],
              ['withEditorial', 'Editoryelli', audit?.summary.withEditorial],
              ['thin_indexed', 'İçeriksiz indexli', audit?.summary.thin_indexed],
              ['variant_indexed', 'Varyant indexli', audit?.summary.variant_indexed],
              ['lowquality_indexed', 'Düşük kalite indexli', audit?.summary.lowquality_indexed],
              ['ready_not_indexed', 'Hazır, indexsiz', audit?.summary.ready_not_indexed],
            ] as const).map(([key, label, val]) => (
              <Card key={key}>
                <CardContent className="p-3">
                  <div className="text-2xl font-semibold">{val ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Google Search Console gerçek index sonucu (denetlenen URL'ler) */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
            {([
              ['gsc-indexed', 'GSC: İndexli', audit?.summary.gsc?.indexed],
              ['gsc-discovered', 'GSC: Keşfedildi, indexsiz', audit?.summary.gsc?.discovered_not_indexed],
              ['gsc-crawled', 'GSC: Tarandı, indexsiz', audit?.summary.gsc?.crawled_not_indexed],
              ['gsc-noindex', 'GSC: Noindex', audit?.summary.gsc?.noindex],
              ['gsc-unknown', 'GSC: Bilinmiyor', audit?.summary.gsc?.unknown],
              ['gsc-notchecked', 'GSC: Denetlenmedi', audit?.summary.gsc?.not_checked],
            ] as const).map(([key, label, val]) => (
              <Card key={key}>
                <CardContent className="p-3">
                  <div className="text-2xl font-semibold">{val ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{label}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Tabs value={auditView} onValueChange={(v) => setAuditView(v as typeof auditView)}>
              <TabsList>
                <TabsTrigger value="issues">Sorunlular</TabsTrigger>
                <TabsTrigger value="undiscovered">Keşfedilmemiş</TabsTrigger>
                <TabsTrigger value="noindex">Noindex</TabsTrigger>
                <TabsTrigger value="ready">Indexe Hazır</TabsTrigger>
                <TabsTrigger value="indexed">Index</TabsTrigger>
                <TabsTrigger value="all">Tümü</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-72">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-8" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} placeholder="Ürün, slug, sorun ara" />
            </div>
            <Button
              variant="outline"
              onClick={() => handleSeoAction('set-index', { issue: 'ready_not_indexed' })}
              disabled={auditActionState.isLoading}
            >
              Hazır noindexleri index aç
            </Button>
            <Button
              variant="outline"
              onClick={() => handleSeoAction('set-noindex', { issue: 'thin_indexed' })}
              disabled={auditActionState.isLoading}
            >
              İçeriksiz indexleri kapat
            </Button>
            {auditQ.isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </div>

          <Card>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>seoIndex</TableHead>
                    <TableHead>Editoryel</TableHead>
                    <TableHead className="text-right">Veri kalitesi</TableHead>
                    <TableHead className="text-right">30g hal/kayıt</TableHead>
                    <TableHead>Google durumu</TableHead>
                    <TableHead>Öneri</TableHead>
                    <TableHead>Eksik bileşenler (tamamla)</TableHead>
                    <TableHead>Sorun</TableHead>
                    <TableHead className="text-right">Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditRows.map((it) => (
                    <TableRow key={it.slug}>
                      <TableCell className="font-medium">{it.displayName || it.nameTr}<span className="ml-1 text-xs text-muted-foreground">/{it.slug}</span></TableCell>
                      <TableCell>{it.indexed ? <Badge>index</Badge> : <Badge variant="outline">noindex</Badge>}</TableCell>
                      <TableCell>{it.hasEditorial ? '✓' : '—'}</TableCell>
                      <TableCell className="text-right">{it.dataQuality}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{it.marketCount30d}/{it.priceRows30d}</TableCell>
                      <TableCell>
                        <Badge
                          variant={it.gscStatus === 'indexed' ? 'default' : it.gscStatus === 'not_checked' ? 'outline' : 'secondary'}
                          className="text-[11px]"
                        >
                          {GSC_STATUS_LABELS[it.gscStatus] ?? it.gscStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {SEO_AUDIT_RECOMMENDATION_LABELS[it.recommendation] ?? it.recommendation}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {it.missing.length === 0
                            ? <span className="text-muted-foreground">—</span>
                            : it.missing.map((m) => (
                                <Badge key={m} variant="outline" className="text-[11px]">{SEO_AUDIT_MISSING_LABELS[m]}</Badge>
                              ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {it.issue ? <Badge variant="destructive">{SEO_AUDIT_ISSUE_LABELS[it.issue]}</Badge> : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {it.issue === 'ready_not_indexed' && (
                          <Button size="sm" variant="outline" onClick={() => handleSeoAction('set-index', { slugs: [it.slug] })}>
                            Index aç
                          </Button>
                        )}
                        {(it.issue === 'thin_indexed' || it.issue === 'lowquality_indexed') && (
                          <Button size="sm" variant="outline" onClick={() => handleSeoAction('set-noindex', { slugs: [it.slug] })}>
                            Noindex
                          </Button>
                        )}
                        {it.issue === 'variant_indexed' && (
                          <Button size="sm" variant="outline" onClick={() => handleVariantRedirect(it)}>
                            301 oluştur
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!auditQ.isFetching && auditRows.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Sorun bulunamadı</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
