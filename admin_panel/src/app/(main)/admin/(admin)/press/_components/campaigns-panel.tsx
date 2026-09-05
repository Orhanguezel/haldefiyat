'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import type { TranslateFn } from '@/i18n';
import type { PressCampaign } from '@/integrations/endpoints/admin/press-admin-endpoints';
import { useCreatePressCampaignAdminMutation, useListEmailTemplatesAdminQuery, useListPressLogsAdminQuery, useListPublicAnalysisReportsForPressQuery, useUpdatePressCampaignAdminMutation } from '@/integrations/hooks';
import { formatDate, htmlToPlainText, renderTemplateText, SITE_NAME, SITE_URL, splitTags } from '../_lib/press-meta';

const EMPTY = { name: '', subject: '', pitch: '', segmentTags: '' };
const CAMPAIGN_STATUSES = ['draft', 'active', 'completed', 'archived'] as const;

type Props = { campaigns: PressCampaign[]; loading: boolean; selected: PressCampaign | null; onSelect: (id: number) => void; t: TranslateFn; tc: TranslateFn };

/** Kampanya olusturma (e-posta sablonundan doldurma dahil), liste ve secili kampanyanin temas gecmisi. */
export function CampaignsPanel({ campaigns, loading, selected, onSelect, t, tc }: Props) {
  const { data: templates = [] } = useListEmailTemplatesAdminQuery({ q: 'press_', is_active: true });
  const { data: reports } = useListPublicAnalysisReportsForPressQuery();
  const { data: logsData } = useListPressLogsAdminQuery({ campaignId: selected?.id ?? 0 }, { skip: !selected });
  const [create, cr] = useCreatePressCampaignAdminMutation();
  const [update] = useUpdatePressCampaignAdminMutation();
  const [form, setForm] = useState(EMPTY);
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const pressTemplates = templates.filter((x) => x.template_key.startsWith('press_') || x.template_key.includes('release') || x.template_key.includes('story_pitch'));
  const latest = reports?.items?.[0] ?? null;
  const vars = useMemo<Record<string, string>>(() => ({
    press_url: `${SITE_URL}/basin`, api_docs_url: `${SITE_URL}/api-docs`, index_url: `${SITE_URL}/endeks`,
    analysis_url: latest ? `${SITE_URL}/analiz/${latest.slug}` : `${SITE_URL}/analiz`, report_url: latest ? `${SITE_URL}/analiz/${latest.slug}` : `${SITE_URL}/analiz`,
    week_title: latest?.baslik || t('campaigns.weekTitleFallback', { site: SITE_NAME }),
  }), [latest, t]);

  function fromTemplate(key: string) {
    const tpl = pressTemplates.find((x) => x.template_key === key);
    if (!tpl) return;
    setForm((p) => ({ ...p, subject: renderTemplateText(tpl.subject || '', vars) || p.subject, pitch: htmlToPlainText(renderTemplateText(tpl.content || '', vars)) || p.pitch }));
  }
  async function submit() {
    if (!form.name.trim() || !form.subject.trim() || !form.pitch.trim()) { toast.error(t('campaigns.required')); return; }
    try {
      const res = await create({ name: form.name.trim(), subject: form.subject.trim(), pitch: form.pitch.trim(), segmentTags: splitTags(form.segmentTags), status: 'draft' }).unwrap();
      setForm(EMPTY); onSelect(res.data.id); toast.success(t('campaigns.created'));
    } catch { toast.error(tc('saveFailed')); }
  }

  const logs = logsData?.items ?? [];
  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>{t('campaigns.table.name')}</TableHead><TableHead className="w-36">{t('campaigns.table.status')}</TableHead><TableHead className="min-w-[160px]">{t('campaigns.table.tags')}</TableHead><TableHead className="w-28">{t('campaigns.table.created')}</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={4}>{tc('loading')}</TableCell></TableRow> : null}
              {!loading && !campaigns.length ? <TableRow><TableCell colSpan={4} className="text-muted-foreground">{t('campaigns.empty')}</TableCell></TableRow> : null}
              {campaigns.map((c) => (
                <TableRow key={c.id} onClick={() => onSelect(c.id)} className={`cursor-pointer ${selected?.id === c.id ? 'bg-primary/5' : ''}`}>
                  <TableCell className="py-2.5"><div className="font-medium">{c.name}</div><div className="truncate text-xs text-muted-foreground">{c.subject}</div></TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select value={c.status} onValueChange={(v) => update({ id: c.id, patch: { status: v as PressCampaign['status'] } })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>{CAMPAIGN_STATUSES.map((k) => <SelectItem key={k} value={k}>{t(`campaigns.statuses.${k}`)}</SelectItem>)}</SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{c.segmentTags.slice(0, 3).map((tag) => <Badge key={tag} variant="outline" className="font-normal">{tag}</Badge>)}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(c.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selected ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">{t('campaigns.logsTitle', { name: selected.name })}</h3>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40"><TableHead>{t('table.organization')}</TableHead><TableHead className="w-28">{t('table.status')}</TableHead><TableHead className="w-28">{tc('date')}</TableHead><TableHead>{t('campaigns.note')}</TableHead></TableRow></TableHeader>
                <TableBody>
                  {logs.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell><div className="font-medium">{l.organization}</div><div className="text-xs text-muted-foreground">{l.email}</div></TableCell>
                      <TableCell><Badge variant={l.status === 'published' ? 'default' : 'secondary'} className="font-normal">{t(`logStatuses.${l.status}`)}</Badge></TableCell>
                      <TableCell className="text-sm">{formatDate(l.contactedAt)}</TableCell>
                      <TableCell className="max-w-md text-xs text-muted-foreground">{l.publishedUrl ? <a href={l.publishedUrl} target="_blank" rel="noreferrer" className="hover:underline">{l.publishedUrl}</a> : l.note ?? '—'}</TableCell>
                    </TableRow>
                  ))}
                  {!logs.length ? <TableRow><TableCell colSpan={4} className="text-muted-foreground">{t('campaigns.noLogs')}</TableCell></TableRow> : null}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}
      </div>
      <div className="space-y-2 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t('campaigns.newTitle')}</h3>
        <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder={t('campaigns.name')} />
        <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} placeholder={t('campaigns.subject')} />
        <Input value={form.segmentTags} onChange={(e) => set('segmentTags', e.target.value)} placeholder={t('campaigns.tags')} />
        <Select onValueChange={fromTemplate}><SelectTrigger><SelectValue placeholder={t('campaigns.fromTemplate')} /></SelectTrigger><SelectContent>{pressTemplates.map((x) => <SelectItem key={x.id} value={x.template_key}>{x.template_name || x.template_key}</SelectItem>)}</SelectContent></Select>
        <Textarea className="min-h-32" value={form.pitch} onChange={(e) => set('pitch', e.target.value)} placeholder={t('campaigns.pitch')} />
        <Button className="w-full" onClick={submit} disabled={cr.isLoading}>{cr.isLoading ? t('campaigns.creating') : t('campaigns.create')}</Button>
      </div>
    </div>
  );
}
