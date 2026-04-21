// =============================================================
// FILE: src/app/(main)/admin/(admin)/telegram/_components/telegram-inbound-panel.tsx
// Inbound messages list (i18n, theme tokens)
// =============================================================

'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { useListTelegramInboundQuery } from '@/integrations/hooks';
import {
  formatTelegramInboundLocalDate,
  getTelegramInboundSenderName,
  type TelegramInboundListParams,
  type TelegramInboundMessage,
} from '@/integrations/shared';

export default function TelegramInboundPanel() {
  const t = useAdminT('admin.telegram');

  const [q, setQ] = React.useState('');
  const [chatId, setChatId] = React.useState('');
  const [limit, setLimit] = React.useState(50);

  const [cursor, setCursor] = React.useState<string | undefined>(undefined);

  const params: TelegramInboundListParams = React.useMemo(() => {
    const p: TelegramInboundListParams = {};

    const qv = q.trim();
    if (qv) p.q = qv;

    const cv = chatId.trim();
    if (cv) p.chat_id = cv;

    if (Number.isFinite(limit)) p.limit = limit;

    if (cursor) p.cursor = cursor;

    return p;
  }, [q, chatId, limit, cursor]);

  const { data, isFetching, refetch } = useListTelegramInboundQuery(params);

  const items = (data?.items ?? []) as TelegramInboundMessage[];
  const nextCursor = data?.next_cursor ?? null;

  const handleRefresh = () => {
    setCursor(undefined);
    refetch();
  };

  const handleLoadMore = () => {
    if (!nextCursor) return;
    setCursor(String(nextCursor));
  };

  return (
    <Card>
      <CardHeader className="space-y-2">
        <CardTitle>{t('inbound.title')}</CardTitle>

        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('inbound.searchPlaceholder')}
          />
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder={t('inbound.chatIdPlaceholder')}
          />
          <Input
            value={String(limit)}
            onChange={(e) => {
              const n = Number(e.target.value || 50) || 50;
              setLimit(Math.max(10, Math.min(200, n)));
            }}
            placeholder={t('inbound.limitPlaceholder')}
          />

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
              {isFetching ? t('inbound.refreshing') : t('inbound.refresh')}
            </Button>

            <Button
              variant="secondary"
              onClick={handleLoadMore}
              disabled={isFetching || !nextCursor}
              title={!nextCursor ? t('inbound.noMoreRecords') : undefined}
            >
              {isFetching ? t('inbound.loading') : t('inbound.loadMore')}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[160px]">{t('inbound.table.date')}</TableHead>
                <TableHead className="w-[140px]">{t('inbound.table.chat')}</TableHead>
                <TableHead className="w-[240px]">{t('inbound.table.sender')}</TableHead>
                <TableHead>{t('inbound.table.message')}</TableHead>
                <TableHead className="w-[140px]">{t('inbound.table.source')}</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-sm text-muted-foreground">
                    {t('inbound.noRecords')}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="text-xs">{formatTelegramInboundLocalDate(m.created_at)}</TableCell>
                    <TableCell className="text-xs">{m.chat_id}</TableCell>
                    <TableCell className="text-xs">
                      <div className="space-y-1">
                        <div>{getTelegramInboundSenderName(m)}</div>
                        <div className="text-muted-foreground">@{m.from_username ?? '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm whitespace-pre-wrap">
                      {(m.text ?? '').trim() || t('inbound.noText')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{m.chat_type ?? t('inbound.defaultSource')}</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {nextCursor ? (
          <p className="mt-3 text-xs text-muted-foreground">{t('inbound.nextPage')}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
