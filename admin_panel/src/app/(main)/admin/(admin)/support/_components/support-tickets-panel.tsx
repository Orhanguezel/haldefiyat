'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import {
  useListSupportTicketsAdminQuery,
  useDeleteSupportTicketAdminMutation,
} from '@/integrations/hooks';
import {
  buildSupportTicketsListQueryParams,
  getTicketStatusVariant,
  getTicketPriorityVariant,
  type SupportTicketDto,
} from '@/integrations/shared';

export default function SupportTicketsPanel() {
  const t = useAdminT('admin.support');

  const [search, setSearch] = React.useState('');

  const queryParams = React.useMemo(
    () => buildSupportTicketsListQueryParams({ search }),
    [search],
  );

  const { data: tickets = [], isFetching, refetch } = useListSupportTicketsAdminQuery(
    queryParams as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const [deleteTicket] = useDeleteSupportTicketAdminMutation();

  const handleDelete = async (item: SupportTicketDto) => {
    if (!confirm(t('tickets.confirmDelete'))) return;
    try {
      await deleteTicket(item.id).unwrap();
      toast.success(t('tickets.deleted'));
      refetch();
    } catch (error) {
      toast.error(`${t('messages.deleteError')}: ${error}`);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            placeholder={t('tickets.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => { toast.info(t('messages.refreshing')); refetch(); }} disabled={isFetching}>
              <RefreshCw className="mr-1 h-4 w-4" />{t('tickets.refresh')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('tickets.subject')}</TableHead>
                <TableHead>{t('tickets.name')}</TableHead>
                <TableHead>{t('tickets.email')}</TableHead>
                <TableHead className="w-28">{t('tickets.status')}</TableHead>
                <TableHead className="w-28">{t('tickets.priority')}</TableHead>
                <TableHead className="w-24">{t('tickets.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {isFetching ? t('tickets.loading') : t('tickets.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell className="text-sm">{ticket.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{ticket.email}</TableCell>
                    <TableCell>
                      <Badge variant={getTicketStatusVariant(ticket.status)}>
                        {t(`ticketStatuses.${ticket.status}` as any) || ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTicketPriorityVariant(ticket.priority)}>
                        {t(`ticketPriorities.${ticket.priority}` as any) || ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(ticket)}>
                        {t('tickets.delete')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
