'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Building2, Mail, MessageCircle, Phone, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { TranslateFn } from '@/i18n';
import { useReplyFirmLeadAdminMutation } from '@/integrations/hooks';
import { formatDateTime, type LeadRow, telHref, waHref } from '../_lib/lead-meta';

// Marka koddan gelmez: bos kalirsa konu satiri yalniz firma adiyla kurulur.
const SITE_NAME = (process.env.NEXT_PUBLIC_SITE_NAME ?? '').trim();
const REPLY_TO = process.env.NEXT_PUBLIC_CONTACT_REPLY_TO ?? '';

function Field({ label, value }: { label: string; value?: string | null }) {
  return <div><div className="text-xs text-muted-foreground">{label}</div><div className="break-all font-medium">{value || '—'}</div></div>;
}

type Props = { row: LeadRow | null; onClose: () => void; t: TranslateFn; tc: TranslateFn };

export function LeadSheet({ row, onClose, t, tc }: Props) {
  const [reply, state] = useReplyFirmLeadAdminMutation();
  const [tab, setTab] = useState('overview');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const rowId = row?.id ?? null;
  // biome-ignore lint/correctness/useExhaustiveDependencies: taslak yalniz baska bir talep acilinca sifirlanir, yazilan metin liste yenilenince kaybolmasin
  useEffect(() => {
    if (!row) return;
    setTab('overview');
    setSubject(t('reply.subject', { site: SITE_NAME ? `${SITE_NAME} — ` : '', firm: row.firmName }));
    setMessage(t('reply.greeting', { name: row.parsed.name ?? '' }));
  }, [rowId]);

  async function send() {
    if (!row) return;
    try {
      const res = await reply({ dealId: row.id, body: { subject, message, replyTo: REPLY_TO || null } }).unwrap();
      toast.success(t('reply.sent', { to: res.to }));
      onClose();
    } catch (err) {
      const e = err as { data?: { error?: { message?: string } | string } };
      const msg = typeof e.data?.error === 'string' ? e.data.error : e.data?.error?.message;
      toast.error(msg || t('reply.failed'));
    }
  }

  const p = row?.parsed;
  const tel = telHref(p?.phone);
  const wa = waHref(p?.phone);

  return (
    <Sheet open={Boolean(row)} onOpenChange={(next) => { if (!next) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {row && p ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="text-base">{p.name || t('table.anonymous')}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-normal">{t(`statuses.${row.status}`, undefined, row.status)}</Badge>
                <span>#{row.id}</span><span aria-hidden>·</span>
                <span>{formatDateTime(row.createdAt)}</span><span aria-hidden>·</span>
                <span>{row.firmName}</span>
              </SheetDescription>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tel ? <Button asChild size="sm" variant="outline"><a href={tel}><Phone className="size-3.5" /> {t('actions.call')}</a></Button> : null}
                {wa ? <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="size-3.5" /> {t('actions.whatsapp')}</a></Button> : null}
                {p.email ? <Button size="sm" onClick={() => setTab('reply')}><Mail className="size-3.5" /> {t('actions.reply')}</Button> : null}
                <Button asChild size="sm" variant="ghost"><Link href={`/admin/firmalar/${row.firmId}`}><Building2 className="size-3.5" /> {t('actions.firm')}</Link></Button>
              </div>
            </SheetHeader>
            <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="overview">{t('sheet.tabs.overview')}</TabsTrigger>
                  <TabsTrigger value="reply" disabled={!p.email}>{t('sheet.tabs.reply')}</TabsTrigger>
                </TabsList>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="overview" className="mt-0 space-y-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label={t('sheet.phone')} value={p.phone} />
                    <Field label={t('sheet.email')} value={p.email} />
                    <Field label={t('sheet.channel')} value={p.channel} />
                    <Field label={t('sheet.consent')} value={p.consent} />
                    <Field label={t('sheet.firm')} value={`${row.firmName}${row.citySlug ? ` · ${row.citySlug}` : ''}`} />
                    <Field label={t('sheet.dealType')} value={t(`dealTypes.${row.dealType}`, undefined, row.dealType)} />
                  </div>
                  <div>
                    <div className="mb-1 text-xs text-muted-foreground">{t('sheet.message')}</div>
                    <div className="whitespace-pre-line rounded-md border bg-muted/40 p-3 leading-6">{p.message || '—'}</div>
                  </div>
                  {!p.email && !p.phone ? <p className="text-xs text-muted-foreground">{t('sheet.noContactHint')}</p> : null}
                </TabsContent>
                <TabsContent value="reply" className="mt-0 space-y-3">
                  <p className="text-xs text-muted-foreground">{t('reply.to', { email: p.email ?? '' })}{REPLY_TO ? ` · ${t('reply.replyTo', { email: REPLY_TO })}` : ''}</p>
                  <div className="space-y-1.5"><Label className="text-sm">{t('reply.subjectLabel')}</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-sm">{t('reply.messageLabel')}</Label><Textarea rows={12} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setTab('overview')}>{tc('giveUp')}</Button>
                    <Button onClick={send} disabled={state.isLoading || subject.trim().length < 2 || message.trim().length < 10}>
                      <Send className="size-3.5" /> {state.isLoading ? t('reply.sending') : t('reply.send')}
                    </Button>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
