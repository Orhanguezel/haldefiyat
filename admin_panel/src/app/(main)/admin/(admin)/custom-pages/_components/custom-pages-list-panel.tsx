'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';

import { useAdminT } from '@/app/(main)/admin/_components/common/use-admin-t';
import { resolveMediaUrl } from '@/lib/media-url';
import { useAdminLocales } from '@/components/common/use-admin-locales';
import { AdminLocaleSelect } from '@/components/common/admin-locale-select';
import {
  useListCustomPagesAdminQuery,
  useDeleteCustomPageAdminMutation,
} from '@/integrations/hooks';
import {
  buildCustomPagesListQueryParams,
  buildCustomPageToastMessage,
  CUSTOM_PAGE_DEFAULT_LOCALE,
  type CustomPageDto,
} from '@/integrations/shared';

export default function CustomPagesListPanel() {
  const t = useAdminT('admin.custom-pages');
  const router = useRouter();

  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();

  const [search, setSearch] = React.useState('');
  const [locale, setLocale] = React.useState('');
  const [showOnlyPublished, setShowOnlyPublished] = React.useState(false);

  React.useEffect(() => {
    setLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || CUSTOM_PAGE_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const queryParams = React.useMemo(
    () => buildCustomPagesListQueryParams({ search, locale, isPublished: showOnlyPublished }),
    [search, locale, showOnlyPublished],
  );

  const { data: pages = [], isFetching, refetch } = useListCustomPagesAdminQuery(
    queryParams as any,
    { refetchOnMountOrArgChange: true } as any,
  );

  const [deletePage] = useDeleteCustomPageAdminMutation();

  const handleDelete = async (item: CustomPageDto) => {
    if (!confirm(t('messages.confirmDelete', { title: item.title }))) return;
    try {
      await deletePage(item.id).unwrap();
      toast.success(buildCustomPageToastMessage(item.title, t('messages.deleted')));
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
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          {localeOptions && localeOptions.length > 0 && (
            <AdminLocaleSelect value={locale} onChange={setLocale} options={localeOptions as any} />
          )}
          <div className="flex items-center gap-2">
            <Switch id="only-published" checked={showOnlyPublished} onCheckedChange={setShowOnlyPublished} />
            <Label htmlFor="only-published" className="text-sm">{t('filters.onlyPublished')}</Label>
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { toast.info(t('list.refreshing')); refetch(); }} disabled={isFetching}>
              <RefreshCw className="mr-1 h-4 w-4" />{t('actions.refresh')}
            </Button>
            <Button size="sm" onClick={() => router.push('/admin/custom-pages/new')}>
              <Plus className="mr-1 h-4 w-4" />{t('actions.create')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t('table.order')}</TableHead>
                <TableHead className="w-16">{t('table.image')}</TableHead>
                <TableHead>{t('table.title')}</TableHead>
                <TableHead>{t('table.slug')}</TableHead>
                <TableHead className="w-20">{t('table.published')}</TableHead>
                <TableHead className="w-24">{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {isFetching ? t('list.loading') : t('list.empty')}
                  </TableCell>
                </TableRow>
              ) : (
                pages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell className="text-muted-foreground">{page.display_order}</TableCell>
                    <TableCell>
                      {page.featured_image ? (
                        <img src={resolveMediaUrl(page.featured_image)} alt="" className="h-8 w-12 rounded object-cover" />
                      ) : (
                        <div className="h-8 w-12 rounded bg-muted" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{page.title}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{page.slug}</TableCell>
                    <TableCell>
                      <span className={`inline-block h-2 w-2 rounded-full ${page.is_published ? 'bg-green-500' : 'bg-gray-300'}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/custom-pages/${page.id}`)}>
                          {t('actions.edit')}
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(page)}>
                          {t('actions.delete')}
                        </Button>
                      </div>
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
