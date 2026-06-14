'use client';

import * as React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useGa4CreateKeyEventMutation, useGa4DeleteKeyEventMutation, useGa4KeyEventsQuery } from '@/integrations/hooks';
import { GA4_COUNTING_LABELS, adsLabel, getErrorMessage, type Ga4CountingMethod } from '@/integrations/shared';

type T = (k: string) => string;

export function ConversionsTab({ t, presetEvent }: { t: T; presetEvent?: string }) {
  const { data: keyEvents } = useGa4KeyEventsQuery();
  const [createKe, { isLoading: creating }] = useGa4CreateKeyEventMutation();
  const [deleteKe] = useGa4DeleteKeyEventMutation();
  const [newEvent, setNewEvent] = React.useState('');
  const [counting, setCounting] = React.useState<Ga4CountingMethod>('ONCE_PER_EVENT');
  const [defaultValue, setDefaultValue] = React.useState('');
  const [currency, setCurrency] = React.useState('TRY');

  React.useEffect(() => {
    if (presetEvent) setNewEvent(presetEvent);
  }, [presetEvent]);

  const handleAdd = async () => {
    if (!newEvent.trim()) return;
    try {
      await createKe({
        event_name: newEvent.trim(),
        counting_method: counting,
        ...(defaultValue ? { default_value: Number(defaultValue), currency_code: currency } : {}),
      }).unwrap();
      toast.success(t('ke.added'));
      setNewEvent('');
      setDefaultValue('');
    } catch (err) {
      toast.error(`${t('ke.failed')}: ${getErrorMessage(err)}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('ke.removeConfirm'))) return;
    try {
      await deleteKe({ id }).unwrap();
      toast.success(t('ke.removed'));
    } catch (err) {
      toast.error(`${t('ke.failed')}: ${getErrorMessage(err)}`);
    }
  };

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">{t('ke.title')}</CardTitle><CardDescription>{t('ke.description')}</CardDescription></CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input value={newEvent} onChange={(e) => setNewEvent(e.target.value)} placeholder={t('ke.placeholder')} className="h-8 w-56 text-sm" />
          <Select value={counting} onValueChange={(v) => setCounting(v as Ga4CountingMethod)}>
            <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="ONCE_PER_EVENT">{t('ke.onceEvent')}</SelectItem><SelectItem value="ONCE_PER_SESSION">{t('ke.onceSession')}</SelectItem></SelectContent>
          </Select>
          <Input value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} placeholder={t('ke.value')} className="h-8 w-28 text-sm" type="number" min="0" />
          <Input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase().slice(0, 3))} placeholder="TRY" className="h-8 w-20 text-sm" />
          <Button size="sm" onClick={handleAdd} disabled={creating || !newEvent.trim()}><Plus className="mr-1 h-4 w-4" />{t('ke.add')}</Button>
        </div>
        <ul className="space-y-1 text-sm">
          {(keyEvents?.items ?? []).map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-2 border-border/60 border-b py-1.5">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{k.name}</span><Badge variant="outline">{adsLabel(GA4_COUNTING_LABELS, k.counting)}</Badge>
                {k.defaultValue ? <Badge variant="secondary">{k.defaultValue} {k.currencyCode}</Badge> : null}
                {k.custom ? <Badge variant="secondary">{t('ke.custom')}</Badge> : null}
              </span>
              <button type="button" onClick={() => handleDelete(k.id)} aria-label={t('ke.remove')}><Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" /></button>
            </li>
          ))}
          {(keyEvents?.items ?? []).length === 0 ? <li className="py-2 text-muted-foreground">{t('ke.empty')}</li> : null}
        </ul>
      </CardContent>
    </Card>
  );
}
