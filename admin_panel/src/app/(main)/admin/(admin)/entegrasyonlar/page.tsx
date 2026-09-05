'use client';

import * as React from 'react';
import {
  CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Database, ListTodo,
  Loader2, Mail, RefreshCw, ShieldCheck, Unplug,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { PersonalGoogleEvent } from '@/integrations/endpoints/admin/mail-accounts-admin-endpoints';
import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { SummaryTiles } from '@/app/(main)/admin/_components/common/summary-tiles';
import {
  useDeleteMailAccountMutation,
  useGoogleCalendarStatusQuery,
  useGoogleTasksStatusQuery,
  useLazyGmailConnectUrlQuery,
  useListMailAccountsQuery,
  useListOwnGoogleEventsQuery,
  useListOwnGoogleTasksQuery,
  useSyncGoogleCalendarMutation,
  useSyncGoogleTasksMutation,
} from '@/integrations/hooks';

const formatDate = (value: string | null | undefined, never = 'Henüz senkronlanmadı') =>
  value ? new Date(value).toLocaleString('tr-TR') : never;

const monthKey = (value: Date) => `${value.getFullYear()}-${value.getMonth()}`;
const sameDay = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear()
  && left.getMonth() === right.getMonth()
  && left.getDate() === right.getDate();

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function MonthlyCalendar({ events, t }: { events: PersonalGoogleEvent[]; t: ReturnType<typeof useAdminT> }) {
  const today = React.useMemo(() => new Date(), []);
  const firstAllowed = React.useMemo(() => new Date(today.getFullYear(), today.getMonth() - 12, 1), [today]);
  const lastAllowed = React.useMemo(() => new Date(today.getFullYear(), today.getMonth() + 12, 1), [today]);
  const [month, setMonth] = React.useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const gridStart = new Date(month.getFullYear(), month.getMonth(), 1 - offset);
  const days = Array.from({ length: 42 }, (_, index) =>
    new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index));
  const monthEvents = events.filter((event) => {
    if (!event.starts_at) return false;
    const startsAt = new Date(event.starts_at);
    return startsAt.getFullYear() === month.getFullYear() && startsAt.getMonth() === month.getMonth();
  });
  const move = (delta: number) =>
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base">
            {month.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
          </CardTitle>
          <CardDescription>{t('calendar.rangeHint')}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => move(-1)} disabled={monthKey(month) === monthKey(firstAllowed)}>
            <ChevronLeft /> {t('calendar.prev')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>
            {t('calendar.thisMonth')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => move(1)} disabled={monthKey(month) === monthKey(lastAllowed)}>
            {t('calendar.next')} <ChevronRight />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="min-w-[760px] overflow-hidden rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-semibold text-muted-foreground">
            {WEEKDAY_KEYS.map((day) => <div key={day} className="p-3">{t(`calendar.weekdays.${day}`)}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = monthEvents.filter((event) => event.starts_at && sameDay(new Date(event.starts_at), day));
              const outside = day.getMonth() !== month.getMonth();
              return (
                <div key={day.toISOString()} className={`min-h-32 border-b border-r p-2 ${outside ? 'bg-muted/20 text-muted-foreground' : ''}`}>
                  <div className={`mb-2 flex size-7 items-center justify-center rounded-full text-xs ${
                    sameDay(day, today) ? 'bg-primary font-semibold text-primary-foreground' : ''
                  }`}>{day.getDate()}</div>
                  <div className="space-y-1">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="rounded-md border border-violet-500/20 bg-violet-500/10 px-2 py-1 text-xs">
                        <div className="truncate font-medium">{event.title}</div>
                        <div className="text-muted-foreground">
                          {new Date(event.starts_at!).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Page() {
  const t = useAdminT('admin.integrations');
  const tc = useAdminT('admin.common');
  const accounts = useListMailAccountsQuery();
  const tasks = useGoogleTasksStatusQuery();
  const calendar = useGoogleCalendarStatusQuery();
  const [connect, connectState] = useLazyGmailConnectUrlQuery();
  const [remove, removeState] = useDeleteMailAccountMutation();
  const [syncTasks, taskSyncState] = useSyncGoogleTasksMutation();
  const [syncCalendar, calendarSyncState] = useSyncGoogleCalendarMutation();
  const account = accounts.data?.[0];
  const ownTasks = useListOwnGoogleTasksQuery(undefined, { skip: !account });
  const ownEvents = useListOwnGoogleEventsQuery(undefined, { skip: !account });

  async function beginConnect() {
    try {
      const result = await connect().unwrap();
      window.location.assign(result.url);
    } catch { toast.error(t('toasts.connectFailed')); }
  }

  async function disconnect() {
    if (!account) return;
    try {
      await remove(account.id).unwrap();
      toast.success(t('toasts.disconnected'));
    } catch { toast.error(t('toasts.disconnectFailed')); }
  }

  async function runSync(kind: 'tasks' | 'calendar') {
    try {
      const result = kind === 'tasks' ? await syncTasks().unwrap() : await syncCalendar().unwrap();
      toast.success(t('toasts.synced', { imported: result.imported, updated: result.updated, exported: result.exported }));
    } catch { toast.error(t('toasts.syncFailed')); }
  }

  const loading = accounts.isLoading || tasks.isLoading || calendar.isLoading;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </div>

      <SummaryTiles columns="sm:grid-cols-2 xl:grid-cols-4" tiles={[
        { key: 'account', label: t('tiles.account'), value: account ? t('tiles.connected') : t('tiles.notConnected'), hint: account?.email ?? t('tiles.accountHint'), tone: account ? 'text-emerald-600' : 'text-amber-600' },
        { key: 'tasks', label: t('tiles.tasks'), value: ownTasks.data?.length ?? 0, hint: t('tiles.lastSync', { date: formatDate(tasks.data?.last_synced_at, t('tiles.never')) }) },
        { key: 'events', label: t('tiles.events'), value: ownEvents.data?.length ?? 0, hint: t('tiles.lastSync', { date: formatDate(calendar.data?.last_synced_at, t('tiles.never')) }) },
        { key: 'openTasks', label: t('tiles.openTasks'), value: (ownTasks.data ?? []).filter((task) => task.status !== 'done').length, hint: t('tiles.openTasksHint') },
      ]} />

      <Tabs defaultValue="baglanti" className="space-y-5">
        <TabsList className="grid h-auto w-full grid-cols-3">
          <TabsTrigger value="baglanti"><Mail /> {t('tabs.connection')}</TabsTrigger>
          <TabsTrigger value="gorevler"><ListTodo /> {t('tabs.tasks')}</TabsTrigger>
          <TabsTrigger value="takvim"><CalendarDays /> {t('tabs.calendar')}</TabsTrigger>
        </TabsList>

        <TabsContent value="baglanti" className="space-y-5">
          <div className={`flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${
            account ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'
          }`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2.5 ${account ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                {account ? <CheckCircle2 className="size-6" /> : <Unplug className="size-6" />}
              </div>
              <div>
                <div className="font-semibold">{account ? t('connection.connected') : t('connection.notConnected')}</div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {account
                    ? t('connection.connectedHint', { email: account.email })
                    : t('connection.notConnectedHint')}
                </p>
              </div>
            </div>
            {account
              ? <Button variant="outline" onClick={disconnect} disabled={removeState.isLoading}><Unplug /> {t('connection.disconnect')}</Button>
              : <Button onClick={beginConnect} disabled={connectState.isFetching}><CheckCircle2 /> {t('connection.connect')}</Button>}
          </div>

          {loading ? <Loader2 className="mx-auto size-8 animate-spin" /> : (
            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cards.gmail')}</CardTitle>
                  <CardDescription>{account ? t('cards.bound', { email: account.email }) : t('cards.needsConnection')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Mail className="size-9 text-sky-600" />
                  <p className="text-sm text-muted-foreground">
                    {t('cards.gmailHint')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cards.tasks')}</CardTitle>
                  <CardDescription>{tasks.data?.connected ? t('cards.tasksOn') : t('cards.needsConnection')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ListTodo className="size-9 text-emerald-600" />
                  <p className="text-sm text-muted-foreground">{t('cards.lastSync', { date: formatDate(tasks.data?.last_synced_at, t('tiles.never')) })}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('cards.calendar')}</CardTitle>
                  <CardDescription>{calendar.data?.connected ? t('cards.calendarOn') : t('cards.needsConnection')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CalendarDays className="size-9 text-violet-600" />
                  <p className="text-sm text-muted-foreground">{t('cards.lastSync', { date: formatDate(calendar.data?.last_synced_at, t('tiles.never')) })}</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('security.title')}</CardTitle>
              <CardDescription>{t('security.hint')}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm md:grid-cols-2">
              <div className="flex gap-3 rounded-xl border p-4">
                <Database className="mt-0.5 size-5 shrink-0 text-sky-600" />
                <p>{t('security.db')}</p>
              </div>
              <div className="flex gap-3 rounded-xl border p-4">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <p>{t('security.token')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gorevler">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{t('tasks.title')}</CardTitle>
                <CardDescription>{t('tasks.hint')}</CardDescription>
              </div>
              {account && (
                <Button variant="outline" onClick={() => runSync('tasks')} disabled={taskSyncState.isLoading}>
                  <RefreshCw /> {t('tasks.sync')}
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              {!account && (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  {t('tasks.needsConnection')}
                </p>
              )}
              {account && ownTasks.data?.map((task) => (
                <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border p-4">
                  <div>
                    <div className={task.status === 'done' ? 'text-muted-foreground line-through' : 'font-medium'}>{task.subject}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {task.due_at ? formatDate(task.due_at) : t('tasks.noDue')}
                    </div>
                  </div>
                  <Badge variant={task.status === 'done' ? 'secondary' : 'outline'}>
                    {task.status === 'done' ? t('tasks.done') : t('tasks.open')}
                  </Badge>
                </div>
              ))}
              {account && !ownTasks.isLoading && !ownTasks.data?.length && (
                <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t('tasks.empty')}</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="takvim" className="space-y-4">
          <div className="flex justify-end">
            {account && (
              <Button variant="outline" onClick={() => runSync('calendar')} disabled={calendarSyncState.isLoading}>
                <RefreshCw /> {t('tasks.sync')}
              </Button>
            )}
          </div>
          {account
            ? <MonthlyCalendar events={ownEvents.data || []} t={t} />
            : (
              <Card>
                <CardContent className="p-10 text-center text-sm text-muted-foreground">
                  {t('calendar.needsConnection')}
                </CardContent>
              </Card>
            )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
