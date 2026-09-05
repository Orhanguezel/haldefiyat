'use client';

import { useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type { TranslateFn } from '@/i18n';
import { useCreatePressContactAdminMutation, useImportPressContactsAdminMutation, useLazyExportPressContactsAdminQuery } from '@/integrations/hooks';
import { splitTags } from '../_lib/press-meta';

const CSV_HEADER = 'organization,email,contactName,city,tags,publicationType,notes';
const EMPTY = { organization: '', email: '', contactName: '', city: '', tags: '' };

export function CsvPanel({ t, tc }: { t: TranslateFn; tc: TranslateFn }) {
  const [create, cr] = useCreatePressContactAdminMutation();
  const [importCsv, im] = useImportPressContactsAdminMutation();
  const [exportCsv, ex] = useLazyExportPressContactsAdminQuery();
  const [form, setForm] = useState(EMPTY);
  const [csv, setCsv] = useState(`${CSV_HEADER}\n`);
  const [result, setResult] = useState('');
  const set = (k: keyof typeof EMPTY, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function add() {
    if (!form.organization.trim() || !form.email.trim()) { toast.error(t('add.required')); return; }
    try {
      await create({ organization: form.organization.trim(), email: form.email.trim(), contactName: form.contactName.trim() || null, city: form.city.trim() || null, tags: splitTags(form.tags) }).unwrap();
      setForm(EMPTY); toast.success(t('add.created'));
    } catch { toast.error(tc('saveFailed')); }
  }
  async function doImport() {
    try {
      const res = await importCsv({ csv }).unwrap();
      setResult(t('csv.result', { imported: res.imported, skipped: res.skipped }));
    } catch { toast.error(t('csv.importFailed')); }
  }
  async function doExport() {
    const blob = await exportCsv().unwrap();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `press-contacts-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="space-y-2 rounded-lg border p-4">
        <h3 className="text-sm font-medium">{t('add.title')}</h3>
        <Input value={form.organization} onChange={(e) => set('organization', e.target.value)} placeholder={t('fields.organization')} />
        <Input value={form.email} onChange={(e) => set('email', e.target.value)} placeholder={t('fields.email')} />
        <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder={t('fields.contactName')} />
        <Input value={form.city} onChange={(e) => set('city', e.target.value)} placeholder={t('fields.city')} />
        <Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder={t('fields.tags')} />
        <Button className="w-full" onClick={add} disabled={cr.isLoading}>{cr.isLoading ? t('add.adding') : t('add.submit')}</Button>
      </div>
      <div className="space-y-2 rounded-lg border p-4">
        <div className="flex items-start justify-between gap-2">
          <div><h3 className="text-sm font-medium">{t('csv.title')}</h3><p className="text-xs text-muted-foreground">{t('csv.hint', { columns: CSV_HEADER })}</p></div>
          <Button size="sm" variant="outline" onClick={doExport} disabled={ex.isLoading}><Download className="size-3.5" /> {ex.isLoading ? t('csv.preparing') : t('csv.export')}</Button>
        </div>
        <Textarea className="min-h-32 font-mono text-xs" value={csv} onChange={(e) => setCsv(e.target.value)} />
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm" onClick={doImport} disabled={im.isLoading}><Upload className="size-3.5" /> {im.isLoading ? t('csv.importing') : t('csv.import')}</Button>
          {result ? <span className="text-sm text-muted-foreground">{result}</span> : null}
        </div>
      </div>
    </div>
  );
}
