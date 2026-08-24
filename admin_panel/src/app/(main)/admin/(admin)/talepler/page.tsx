'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useListFirmLeadsAdminQuery, useReplyFirmLeadAdminMutation } from '@/integrations/hooks';
import type { FirmLeadItem } from '@/integrations/endpoints/firms-admin-endpoints';

const PAGE_SIZE = 50;

/** "Public lead: Ad | Telefon: X | E-posta: Y | ... | Mesaj: Z" seklindeki
 *  serbest metni okunur alanlara ayirir. */
function parseLead(notes: string | null) {
  const out: Record<string, string> = {};
  for (const line of (notes ?? '').split('\n')) {
    const m = /^([^:]+):\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    const key = m[1]!.trim().toLowerCase();
    const value = m[2]!.trim();
    if (key.startsWith('public lead')) out.name = value;
    else if (key.startsWith('telefon')) out.phone = value;
    else if (key.startsWith('e-posta')) out.email = value;
    else if (key.startsWith('mesaj')) out.message = value;
    else if (key.startsWith('tercih')) out.channel = value;
  }
  return out;
}

function telHref(phone?: string) {
  const digits = (phone ?? '').replace(/\D/g, '');
  return digits ? `tel:${digits}` : null;
}

function waHref(phone?: string) {
  let d = (phone ?? '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = `90${d.slice(1)}`;
  else if (!d.startsWith('90')) d = `90${d}`;
  return `https://wa.me/${d}`;
}

export default function FirmLeadsPage() {
  const [page, setPage] = useState(0);
  const [replyTarget, setReplyTarget] = useState<{ lead: FirmLeadItem; parsed: Record<string, string> } | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySent, setReplySent] = useState('');
  const [replyLead, { isLoading: isReplying }] = useReplyFirmLeadAdminMutation();

  const REPLY_TO = process.env.NEXT_PUBLIC_CONTACT_REPLY_TO ?? '';

  function openReply(lead: FirmLeadItem, parsed: Record<string, string>) {
    setReplyTarget({ lead, parsed });
    setSubject(`Haldefiyat.com — ${lead.firmName} sayfasindan gonderdiginiz mesaj`);
    setMessage(`Sayin ${parsed.name || ''},\n\n`);
    setReplyError('');
    setReplySent('');
  }

  async function sendReply() {
    if (!replyTarget) return;
    setReplyError('');
    try {
      const res = await replyLead({
        dealId: replyTarget.lead.id,
        body: { subject, message, replyTo: REPLY_TO || null },
      }).unwrap();
      setReplySent(`Cevap gonderildi: ${res.to}`);
      setReplyTarget(null);
    } catch (err) {
      const e = err as { data?: { error?: string } };
      setReplyError(e.data?.error || 'Cevap gonderilemedi.');
    }
  }
  const params = useMemo(() => ({ limit: PAGE_SIZE, offset: page * PAGE_SIZE }), [page]);
  const { data, isLoading } = useListFirmLeadsAdminQuery(params);

  const total = data?.meta?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="min-w-0 space-y-4">
      {replySent && (
        <div className="rounded-md border border-emerald-300 px-3 py-2 text-sm text-emerald-700">{replySent}</div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gelen Talepler</CardTitle>
          <p className="text-sm text-muted-foreground">
            Firma sayfalarındaki iletişim formundan gelen mesajlar. Yeni mesajlar
            ayrıca Telegram&apos;a bildirilir.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Gönderen</TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead>Mesaj</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && <TableRow><TableCell colSpan={6}>Yükleniyor...</TableCell></TableRow>}
                {(data?.items ?? []).map((lead: FirmLeadItem) => {
                  const p = parseLead(lead.notes);
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('tr-TR') : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{p.name || '-'}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        <div>{p.phone || '-'}</div>
                        <div className="text-xs text-muted-foreground">{p.email || ''}</div>
                      </TableCell>
                      <TableCell className="max-w-[380px] text-sm">{p.message || '-'}</TableCell>
                      <TableCell className="text-sm">
                        <Link href={`/admin/firmalar/${lead.firmId}`} className="text-primary hover:underline">
                          {lead.firmName}
                        </Link>
                        <div className="text-xs text-muted-foreground">{lead.citySlug || ''}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {telHref(p.phone) && (
                            <Button asChild size="sm" variant="outline">
                              <a href={telHref(p.phone)!}>Ara</a>
                            </Button>
                          )}
                          {p.email && (
                            <Button size="sm" variant="outline" onClick={() => openReply(lead, p)}>
                              Cevap yaz
                            </Button>
                          )}
                          {waHref(p.phone) && (
                            <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                              <a href={waHref(p.phone)!} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!isLoading && (data?.items ?? []).length === 0 && (
                  <TableRow><TableCell colSpan={6}>Henüz talep yok.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3">
            <p className="text-sm text-muted-foreground">{total.toLocaleString('tr-TR')} talep</p>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                ‹ Önceki
              </Button>
              <span className="px-2 text-sm text-muted-foreground">Sayfa {page + 1} / {pageCount}</span>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => p + 1)} disabled={page + 1 >= pageCount}>
                Sonraki ›
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={Boolean(replyTarget)} onOpenChange={(open) => { if (!open) setReplyTarget(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cevap yaz</DialogTitle>
            <DialogDescription>
              {replyTarget?.parsed.name} · {replyTarget?.parsed.email}
              {REPLY_TO ? ` · Yanitlar ${REPLY_TO} adresine gider` : ''}
            </DialogDescription>
          </DialogHeader>

          {replyTarget && (
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Orijinal mesaj · {replyTarget.lead.firmName}</div>
                <div className="mt-1">{replyTarget.parsed.message || '-'}</div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Konu</label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Mesaj</label>
                <Textarea rows={12} value={message} onChange={(e) => setMessage(e.target.value)} />
              </div>
              {replyError && <p className="text-sm text-red-600">{replyError}</p>}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyTarget(null)}>Vazgec</Button>
            <Button onClick={sendReply} disabled={isReplying || subject.trim().length < 2 || message.trim().length < 10}>
              {isReplying ? 'Gonderiliyor...' : 'Gonder'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
