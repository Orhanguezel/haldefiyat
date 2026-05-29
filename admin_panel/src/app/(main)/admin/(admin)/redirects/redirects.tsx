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
} from '@/integrations/hooks';
import { SEO_AUDIT_ISSUE_LABELS, SEO_AUDIT_MISSING_LABELS, type RedirectType } from '@/integrations/shared';

export default function RedirectsPage() {
  const [typeFilter, setTypeFilter] = React.useState<'all' | RedirectType>('all');
  const [search, setSearch] = React.useState('');
  const [form, setForm] = React.useState<{ sourcePath: string; type: RedirectType; targetUrl: string; note: string }>({
    sourcePath: '',
    type: '301',
    targetUrl: '',
    note: '',
  });
  const [auditFilter, setAuditFilter] = React.useState<'issues' | 'all'>('issues');

  const listQ = useListRedirectsAdminQuery({ type: typeFilter, search: search || undefined });
  const auditQ = useGetSeoAuditAdminQuery({ filter: auditFilter });
  const [upsert, upsertState] = useUpsertRedirectsAdminMutation();
  const [remove] = useDeleteRedirectAdminMutation();

  const rows = listQ.data?.items ?? [];
  const byType = Object.fromEntries((listQ.data?.byType ?? []).map((r) => [r.type, r.n]));
  const audit = auditQ.data;

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

  async function handleDelete(id: number) {
    if (!confirm('Bu yönlendirme silinsin mi?')) return;
    try {
      await remove(id).unwrap();
      toast.success('Silindi');
    } catch {
      toast.error('Silinemedi');
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
                      <TableCell className="text-right">
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
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {([
              ['total', 'Toplam', audit?.summary.total],
              ['indexed', 'İndexli', audit?.summary.indexed],
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

          <div className="flex items-center gap-3">
            <div className="flex rounded-md border bg-muted/30 p-1">
              {(['issues', 'all'] as const).map((v) => (
                <Button key={v} size="sm" variant={auditFilter === v ? 'default' : 'ghost'} className="h-8" onClick={() => setAuditFilter(v)}>
                  {v === 'issues' ? 'Sadece sorunlular' : 'Tümü'}
                </Button>
              ))}
            </div>
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
                    <TableHead>Eksik bileşenler (tamamla)</TableHead>
                    <TableHead>Sorun</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(audit?.items ?? []).map((it) => (
                    <TableRow key={it.slug}>
                      <TableCell className="font-medium">{it.displayName || it.nameTr}<span className="ml-1 text-xs text-muted-foreground">/{it.slug}</span></TableCell>
                      <TableCell>{it.indexed ? <Badge>index</Badge> : <Badge variant="outline">noindex</Badge>}</TableCell>
                      <TableCell>{it.hasEditorial ? '✓' : '—'}</TableCell>
                      <TableCell className="text-right">{it.dataQuality}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{it.marketCount30d}/{it.priceRows30d}</TableCell>
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
                    </TableRow>
                  ))}
                  {!auditQ.isFetching && (audit?.items?.length ?? 0) === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sorun bulunamadı</TableCell></TableRow>
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
