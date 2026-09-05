'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { TranslateFn } from '@/i18n';
import type { PressCampaign, PressContact, PressContactStatus, PressLogStatus, PressPublicationType } from '@/integrations/endpoints/admin/press-admin-endpoints';
import { useCreatePressLogAdminMutation, useUpdatePressContactAdminMutation } from '@/integrations/hooks';
import { CONTACT_STATUSES, formatDate, mailto, PUBLICATION_TYPES, SITE_NAME, splitTags, STATUS_VARIANT } from '../_lib/press-meta';

function toForm(c: PressContact) {
  return { organization: c.organization, contactName: c.contactName ?? '', email: c.email, phone: c.phone ?? '', city: c.city ?? '', tags: c.tags.join(', '), notes: c.notes ?? '', status: c.status, publicationType: c.publicationType };
}

type Props = { row: PressContact | null; campaign: PressCampaign | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function ContactSheet({ row, campaign, onClose, t, tc }: Props) {
  const [update, upd] = useUpdatePressContactAdminMutation();
  const [createLog, lg] = useCreatePressLogAdminMutation();
  const [form, setForm] = useState(() => (row ? toForm(row) : null));
  const [publishedUrl, setPublishedUrl] = useState('');
  const rowId = row?.id ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: form yalniz baska kisi acilinca sifirlanir
  useEffect(() => { setForm(row ? toForm(row) : null); setPublishedUrl(''); }, [rowId]);
  const set = <K extends keyof NonNullable<typeof form>>(k: K, v: NonNullable<typeof form>[K]) => setForm((p) => (p ? { ...p, [k]: v } : p));

  async function save() {
    if (!row || !form) return;
    try {
      await update({ id: row.id, patch: { organization: form.organization.trim(), contactName: form.contactName.trim() || null, email: form.email.trim(), phone: form.phone.trim() || null, city: form.city.trim() || null, tags: splitTags(form.tags), notes: form.notes.trim() || null, status: form.status, publicationType: form.publicationType } }).unwrap();
      toast.success(t('sheet.saved'));
    } catch { toast.error(tc('saveFailed')); }
  }
  async function log(status: PressLogStatus) {
    if (!row || !campaign) return;
    try {
      await createLog({ campaignId: campaign.id, contactId: row.id, channel: 'email', status, publishedUrl: status === 'published' ? publishedUrl.trim() || null : null, note: t('sheet.logNote', { campaign: campaign.name, status: t(`logStatuses.${status}`) }) }).unwrap();
      toast.success(t('sheet.logged', { status: t(`logStatuses.${status}`) }));
      if (status === 'published') setPublishedUrl('');
    } catch { toast.error(tc('saveFailed')); }
  }

  const subject = campaign?.subject ?? t('mail.defaultSubject', { site: SITE_NAME });
  const body = campaign?.pitch ?? t('mail.defaultBody', { site: SITE_NAME });

  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row && form ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-base">{row.organization}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant={STATUS_VARIANT[row.status]} className="font-normal">{t(`statuses.${row.status}`)}</Badge>
                <span>{t(`types.${row.publicationType}`)}</span><span aria-hidden>·</span>
                <span>{row.contactName || t('table.noName')}</span><span aria-hidden>·</span>
                <span>{t('sheet.lastContact', { date: formatDate(row.lastContactedAt) })}</span>
              </SheetDescription>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button asChild size="sm" variant="outline"><a href={mailto(row.email, subject, body)}><Mail className="size-3.5" /> {t('sheet.mail')}</a></Button>
                {row.phone ? <Button asChild size="sm" variant="outline"><a href={`tel:${row.phone.replace(/\D/g, '')}`}><Phone className="size-3.5" /> {t('sheet.call')}</a></Button> : null}
              </div>
            </SheetHeader>
            <Tabs defaultValue="outreach" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3"><TabsList><TabsTrigger value="outreach">{t('sheet.tabs.outreach')}</TabsTrigger><TabsTrigger value="edit">{t('sheet.tabs.edit')}</TabsTrigger></TabsList></div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="outreach" className="mt-0 space-y-4">
                  {campaign ? (
                    <div className="rounded-lg border p-3 text-sm">
                      <div className="text-xs text-muted-foreground">{t('sheet.activeCampaign')}</div>
                      <div className="font-medium">{campaign.name}</div>
                      <div className="text-xs text-muted-foreground">{campaign.subject}</div>
                    </div>
                  ) : <p className="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">{t('sheet.noCampaign')}</p>}
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" disabled={!campaign || lg.isLoading} onClick={() => log('sent')}>{t('logStatuses.sent')}</Button>
                    <Button size="sm" variant="outline" disabled={!campaign || lg.isLoading} onClick={() => log('replied')}>{t('logStatuses.replied')}</Button>
                    <Button size="sm" variant="outline" disabled={!campaign || lg.isLoading} onClick={() => log('bounced')}>{t('logStatuses.bounced')}</Button>
                    <Button size="sm" variant="outline" disabled={!campaign || lg.isLoading} onClick={() => log('rejected')}>{t('logStatuses.rejected')}</Button>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">{t('sheet.publishedUrl')}</Label>
                    <div className="flex gap-2">
                      <Input value={publishedUrl} onChange={(e) => setPublishedUrl(e.target.value)} placeholder="https://" />
                      <Button size="sm" disabled={!campaign || lg.isLoading} onClick={() => log('published')}>{t('logStatuses.published')}</Button>
                    </div>
                  </div>
                  {row.notes ? <p className="rounded-md border bg-muted/40 p-3 text-sm whitespace-pre-line">{row.notes}</p> : null}
                </TabsContent>
                <TabsContent value="edit" className="mt-0 grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2"><Label className="text-sm">{t('fields.organization')}</Label><Input value={form.organization} onChange={(e) => set('organization', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.contactName')}</Label><Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.email')}</Label><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.phone')}</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.city')}</Label><Input value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.type')}</Label>
                    <Select value={form.publicationType} onValueChange={(v) => set('publicationType', v as PressPublicationType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PUBLICATION_TYPES.map((k) => <SelectItem key={k} value={k}>{t(`types.${k}`)}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('fields.status')}</Label>
                    <Select value={form.status} onValueChange={(v) => set('status', v as PressContactStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{CONTACT_STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`statuses.${k}`)}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label className="text-sm">{t('fields.tags')}</Label><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label className="text-sm">{t('fields.notes')}</Label><Textarea rows={4} value={form.notes} onChange={(e) => set('notes', e.target.value)} /></div>
                </TabsContent>
              </div>
            </Tabs>
            <SheetFooter className="border-t px-6 py-3">
              <div className="flex w-full justify-end gap-2">
                <Button variant="outline" onClick={onClose}>{tc('close')}</Button>
                <Button onClick={save} disabled={upd.isLoading}><Save className="size-3.5" /> {upd.isLoading ? tc('saving') : tc('save')}</Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
