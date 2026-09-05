'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, MessageCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { TranslateFn } from '@/i18n';
import type { FirmAdminItem, FirmClaimAdminItem } from '@/integrations/endpoints/firms-admin-endpoints';
import { useModerateFirmClaimAdminMutation, useUpdateFirmAdminMutation } from '@/integrations/hooks';
import { buildFirmWhatsappLink } from '@/lib/firm-whatsapp';
import { publicSiteLink } from '@/lib/public-site';
import { FIRM_TYPES, daysSince, firmStatus } from '../_lib/firm-meta';
import { FirmCrmPanel } from './firm-crm-panel';
import { FirmWorkspace } from './firm-workspace';

function toForm(f: FirmAdminItem) {
  return {
    name: f.name ?? '', contactPerson: f.contactPerson ?? '', phone: f.phone ?? '', address: f.address ?? '', citySlug: f.citySlug ?? '',
    districtSlug: f.districtSlug ?? '', categories: (f.categories ?? []).join(', '), firmType: f.firmType, description: f.description ?? '',
    seoIndex: f.seoIndex === true || f.seoIndex === 1, isActive: Boolean(f.isActive),
  };
}
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-sm">{label}</Label>{children}{hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}</div>;
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="truncate text-sm">{children}</dd></div>;
}

type Props = { firm: FirmAdminItem | null; claims: FirmClaimAdminItem[]; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function FirmSheet({ firm, claims, onClose, t, tc }: Props) {
  const [update, updateState] = useUpdateFirmAdminMutation();
  const [moderateClaim, claimState] = useModerateFirmClaimAdminMutation();
  const [form, setForm] = useState(() => (firm ? toForm(firm) : null));
  const firmId = firm?.id ?? null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setForm(firm ? toForm(firm) : null); }, [firmId]);
  const set = <K extends keyof NonNullable<typeof form>>(k: K, v: NonNullable<typeof form>[K]) => setForm((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!firm || !form) return;
    try {
      await update({ firmId: firm.id, body: {
        name: form.name.trim(), contactPerson: form.contactPerson.trim() || null, phone: form.phone.trim() || null, address: form.address.trim() || null,
        citySlug: form.citySlug.trim() || null, districtSlug: form.districtSlug.trim() || null,
        categories: form.categories.split(',').map((x) => x.trim()).filter(Boolean), firmType: form.firmType,
        description: form.description.trim() || null, seoIndex: form.seoIndex, isActive: form.isActive,
      } }).unwrap();
      toast.success(t('sheet.saved'));
    } catch { toast.error(t('sheet.saveFailed')); }
  }
  async function setStatus(status: 'approved' | 'rejected') {
    if (!firm) return;
    await update({ firmId: firm.id, body: { status, claimStatus: status === 'approved' && firm.claimStatus === 'pending' ? 'verified' : firm.claimStatus } }).unwrap();
  }
  async function release() {
    if (!firm || !window.confirm(t('sheet.releaseConfirm', { name: firm.name }))) return;
    await update({ firmId: firm.id, body: { claimStatus: 'unclaimed', ownerUserId: null } }).unwrap();
  }

  const status = firm ? firmStatus(firm) : 'approved';
  const site = firm ? publicSiteLink(`/firma/${firm.slug}`) : null;
  const wa = firm ? buildFirmWhatsappLink(firm) : null;
  const firmClaims = firm ? claims.filter((c) => c.firmId === firm.id) : [];

  return (
    <Sheet open={Boolean(firm)} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-3xl">
        {firm && form ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start gap-3 pr-8">
                {firm.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={firm.photoUrl} alt="" className="size-12 shrink-0 rounded-lg border object-cover" />
                ) : null}
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{firm.name}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs">{firm.slug}</span>
                    <Badge variant={status === 'approved' ? 'default' : status === 'rejected' ? 'destructive' : 'secondary'} className="font-normal">{t(`status.${status}`)}</Badge>
                    <Badge variant="outline" className="font-normal">{t(`types.${firm.firmType}`)}</Badge>
                    {firm.claimStatus && firm.claimStatus !== 'unclaimed' ? <Badge variant="outline" className="font-normal">{t(`claim.${firm.claimStatus}`)}</Badge> : null}
                    {firm.sponsorshipTier ? <Badge className="font-normal">{t('table.sponsor')} · {firm.sponsorshipTier}</Badge> : null}
                  </SheetDescription>
                </div>
                <div className="ml-auto flex shrink-0 gap-1.5">
                  <Button size="sm" variant="outline" disabled={status === 'approved' || updateState.isLoading} onClick={() => setStatus('approved')}>{tc('approve')}</Button>
                  <Button size="sm" variant="outline" disabled={status === 'rejected' || updateState.isLoading} onClick={() => setStatus('rejected')}>{tc('reject')}</Button>
                </div>
              </div>
            </SheetHeader>
            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3"><TabsList>
                <TabsTrigger value="overview">{t('sheet.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="edit">{t('sheet.tabs.edit')}</TabsTrigger>
                <TabsTrigger value="workspace">{t('sheet.tabs.workspace')}</TabsTrigger>
                <TabsTrigger value="crm">{t('sheet.tabs.crm')}</TabsTrigger>
                <TabsTrigger value="claims">{t('sheet.tabs.claims')} {firmClaims.length ? `(${firmClaims.length})` : ''}</TabsTrigger>
              </TabsList></div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    <Row label={t('sheet.fields.externalId')}><span className="font-mono text-xs">{firm.externalId}</span></Row>
                    <Row label={t('sheet.fields.source')}>{t(`source.${firm.source ?? 'halkatalogu'}`)}</Row>
                    <Row label={t('sheet.fields.claim')}>{t(`claim.${firm.claimStatus ?? 'unclaimed'}`)}</Row>
                    <Row label={t('sheet.fields.owner')}><span className="font-mono text-xs">{firm.ownerUserId ?? '—'}</span></Row>
                    <Row label={t('sheet.fields.contact')}>{firm.contactPerson ?? '—'}</Row>
                    <Row label={t('sheet.fields.phone')}>{firm.phone ?? '—'}</Row>
                    <Row label={t('sheet.fields.city')}>{firm.citySlug ?? '—'}</Row>
                    <Row label={t('sheet.fields.district')}>{firm.districtSlug ?? '—'}</Row>
                    <Row label={t('sheet.fields.lastSeen')}>{firm.lastSeenAt ? `${new Date(firm.lastSeenAt).toLocaleDateString('tr-TR')} · ${tc('daysAgo', { count: daysSince(firm.lastSeenAt) ?? 0 })}` : '—'}</Row>
                    <div className="col-span-2 sm:col-span-3"><dt className="text-xs text-muted-foreground">{t('sheet.fields.address')}</dt><dd className="text-sm">{firm.address ?? '—'}</dd></div>
                    <div className="col-span-2 sm:col-span-3"><dt className="text-xs text-muted-foreground">{t('sheet.fields.categories')}</dt><dd className="flex flex-wrap gap-1 pt-1">{(firm.categories ?? []).length ? firm.categories!.map((c) => <Badge key={c} variant="outline" className="font-normal">{c}</Badge>) : '—'}</dd></div>
                    {firm.description ? <div className="col-span-2 sm:col-span-3"><dt className="text-xs text-muted-foreground">{t('sheet.fields.description')}</dt><dd className="text-sm text-muted-foreground">{firm.description}</dd></div> : null}
                  </dl>
                  {firm.claimStatus === 'verified' ? <Button size="sm" variant="outline" onClick={release} disabled={updateState.isLoading}>{t('sheet.releaseOwnership')}</Button> : null}
                </TabsContent>
                <TabsContent value="edit" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <Field label={t('table.firm')}><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.type')}>
                    <Select value={form.firmType} onValueChange={(v) => set('firmType', v as FirmAdminItem['firmType'])}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{FIRM_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label={t('sheet.fields.contact')}><Input value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.phone')}><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.city')}><Input value={form.citySlug} className="font-mono" onChange={(e) => set('citySlug', e.target.value)} /></Field>
                  <Field label={t('sheet.fields.district')}><Input value={form.districtSlug} className="font-mono" onChange={(e) => set('districtSlug', e.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label={t('sheet.fields.address')}><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field></div>
                  <div className="sm:col-span-2"><Field label={t('sheet.fields.categories')} hint={t('sheet.fields.categoriesHint')}><Input value={form.categories} onChange={(e) => set('categories', e.target.value)} /></Field></div>
                  <div className="sm:col-span-2"><Field label={t('sheet.fields.description')}><Textarea rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></Field></div>
                  <label className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm"><span><span className="font-medium">{t('sheet.fields.seoIndex')}</span><br /><span className="text-xs text-muted-foreground">{t('sheet.fields.seoIndexHint')}</span></span><Switch checked={form.seoIndex} onCheckedChange={(v) => set('seoIndex', v)} /></label>
                  <label className="flex items-center justify-between gap-4 rounded-lg border p-3 text-sm"><span className="font-medium">{t('sheet.fields.active')}</span><Switch checked={form.isActive} onCheckedChange={(v) => set('isActive', v)} /></label>
                </TabsContent>
                <TabsContent value="workspace" className="mt-0"><FirmWorkspace firm={firm} /></TabsContent>
                <TabsContent value="crm" className="mt-0"><FirmCrmPanel firm={firm} onClose={onClose} /></TabsContent>
                <TabsContent value="claims" className="mt-0 space-y-2">
                  {!firmClaims.length ? <p className="py-8 text-center text-sm text-muted-foreground">{t('sheet.noClaims')}</p> : firmClaims.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-xs">{c.userId}</span>
                        <Badge variant={c.status === 'approved' ? 'default' : c.status === 'rejected' ? 'destructive' : 'secondary'} className="font-normal">{t(`status.${c.status}`)}</Badge>
                      </div>
                      {c.evidence ? <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{c.evidence}</p> : null}
                      {c.status === 'pending' ? (
                        <div className="mt-2 flex gap-2">
                          <Button size="sm" disabled={claimState.isLoading} onClick={() => moderateClaim({ claimId: c.id, status: 'approved' })}>{tc('approve')}</Button>
                          <Button size="sm" variant="outline" disabled={claimState.isLoading} onClick={() => moderateClaim({ claimId: c.id, status: 'rejected' })}>{tc('reject')}</Button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  {site ? <Button asChild variant="outline" size="sm"><a href={site} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> {t('sheet.publicPage')}</a></Button> : null}
                  {wa ? <Button asChild variant="outline" size="sm"><a href={wa} target="_blank" rel="noreferrer"><MessageCircle className="size-4" /> {t('sheet.whatsapp')}</a></Button> : null}
                </div>
                <Button onClick={save} disabled={updateState.isLoading}><Save className="size-4" /> {updateState.isLoading ? tc('saving') : tc('save')}</Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
