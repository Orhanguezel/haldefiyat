'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { FilePlus2, Eye, Send, Trash2, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import {
  useCreateNewsletterDraftAdminMutation,
  useDeleteNewsletterDraftAdminMutation,
  useGetNewsletterSendAdminQuery,
  useListNewsletterSendsAdminQuery,
  useSendNewsletterDraftAdminMutation,
  useUpdateNewsletterDraftAdminMutation,
} from '@/integrations/hooks';
import {
  formatNewsletterDateTime,
  getNewsletterSendStatusKey,
  getNewsletterSendStatusVariant,
  isNewsletterSendEditable,
  type NewsletterSend,
} from '@/integrations/shared';

export function NewsletterSendsPanel() {
  const t = useAdminT('admin.newsletter');
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [subjectDraft, setSubjectDraft] = React.useState<string | null>(null);

  const { data: sends = [], isLoading } = useListNewsletterSendsAdminQuery({ limit: 50 });
  const { data: detail } = useGetNewsletterSendAdminQuery(openId as string, { skip: !openId });

  const [createDraft, { isLoading: creating }] = useCreateNewsletterDraftAdminMutation();
  const [updateDraft, { isLoading: saving }] = useUpdateNewsletterDraftAdminMutation();
  const [sendDraft, { isLoading: sending }] = useSendNewsletterDraftAdminMutation();
  const [deleteDraft] = useDeleteNewsletterDraftAdminMutation();

  const handleCreate = async () => {
    try {
      await createDraft().unwrap();
      toast.success(t('sends.toast.draftCreated'));
    } catch {
      toast.error(t('sends.toast.draftFailed'));
    }
  };

  const handleSave = async (id: string) => {
    if (subjectDraft == null) return;
    try {
      await updateDraft({ id, subject: subjectDraft }).unwrap();
      setSubjectDraft(null);
      toast.success(t('sends.toast.updated'));
    } catch {
      toast.error(t('toast.error'));
    }
  };

  const handleSend = async (id: string) => {
    if (!window.confirm(t('sends.actions.sendConfirm'))) return;
    try {
      const result = await sendDraft(id).unwrap();
      if (result.sent) toast.success(t('sends.toast.sent', { count: result.successes ?? 0 }));
      else toast.error(t('sends.toast.sendFailed'));
    } catch {
      toast.error(t('sends.toast.sendFailed'));
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('sends.actions.deleteConfirm'))) return;
    try {
      await deleteDraft(id).unwrap();
      if (openId === id) setOpenId(null);
      toast.success(t('sends.toast.deleted'));
    } catch {
      toast.error(t('toast.error'));
    }
  };

  const renderRow = (s: NewsletterSend) => {
    const editable = isNewsletterSendEditable(s);
    return (
      <TableRow key={s.id}>
        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
          {formatNewsletterDateTime(s.sentAt ?? s.createdAt)}
        </TableCell>
        <TableCell className="font-medium">{s.subject}</TableCell>
        <TableCell>
          <Badge variant={getNewsletterSendStatusVariant(s.status)}>
            {t(getNewsletterSendStatusKey(s.status))}
          </Badge>
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {s.status === 'sent' ? `${s.successes}/${s.recipients}` : '—'}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              title={t('sends.actions.view')}
              onClick={() => { setOpenId(openId === s.id ? null : s.id); setSubjectDraft(null); }}
            >
              <Eye className="size-4" />
            </Button>
            {editable && (
              <>
                <Button variant="ghost" size="icon" title={t('sends.actions.send')} disabled={sending} onClick={() => handleSend(s.id)}>
                  <Send className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" title={t('sends.actions.delete')} onClick={() => handleDelete(s.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{t('sends.title')}</CardTitle>
          <CardDescription>{t('sends.description')}</CardDescription>
        </div>
        <Button onClick={handleCreate} disabled={creating}>
          <FilePlus2 className="mr-2 size-4" />
          {t('sends.createDraft')}
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('sends.table.date')}</TableHead>
                <TableHead>{t('sends.table.subject')}</TableHead>
                <TableHead>{t('sends.table.status')}</TableHead>
                <TableHead className="text-right">{t('sends.table.recipients')}</TableHead>
                <TableHead className="text-right">{t('sends.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isLoading && sends.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    {t('sends.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                sends.map(renderRow)
              )}
            </TableBody>
          </Table>
        </div>

        {openId && detail && (
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-64 flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">
                  {t('sends.detail.subjectLabel')}
                </label>
                <Input
                  value={subjectDraft ?? detail.subject}
                  disabled={!isNewsletterSendEditable(detail)}
                  onChange={(e) => setSubjectDraft(e.target.value)}
                />
              </div>
              {isNewsletterSendEditable(detail) && subjectDraft != null && (
                <>
                  <Button size="sm" disabled={saving} onClick={() => handleSave(detail.id)}>
                    <Pencil className="mr-2 size-4" />
                    {t('sends.actions.save')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSubjectDraft(null)}>
                    {t('sends.actions.cancel')}
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground">{t('sends.detail.editableHint')}</p>

            <iframe
              title={t('sends.detail.title')}
              srcDoc={detail.html}
              className="h-[600px] w-full rounded border bg-white"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
