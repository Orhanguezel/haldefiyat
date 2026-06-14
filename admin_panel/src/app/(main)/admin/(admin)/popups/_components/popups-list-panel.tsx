"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { AdminLocaleSelect } from "@/components/common/admin-locale-select";
import { useAdminLocales } from "@/components/common/use-admin-locales";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeletePopupAdminMutation, useListPopupsAdminQuery } from "@/integrations/hooks";
import {
  buildPopupsListQueryParams,
  buildPopupToastMessage,
  POPUP_DEFAULT_LOCALE,
  type PopupDto,
} from "@/integrations/shared";

export default function PopupsListPanel() {
  const t = useAdminT("admin.popups");
  const router = useRouter();

  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();

  const [search, setSearch] = React.useState("");
  const [locale, setLocale] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [showOnlyActive, setShowOnlyActive] = React.useState(false);

  React.useEffect(() => {
    setLocale((prev) => coerceLocale(prev, defaultLocaleFromDb || POPUP_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const queryParams = React.useMemo(
    () =>
      buildPopupsListQueryParams({
        search,
        locale,
        type: typeFilter,
        isActive: showOnlyActive,
      }),
    [search, locale, typeFilter, showOnlyActive],
  );

  const {
    data: popups = [],
    isFetching,
    refetch,
  } = useListPopupsAdminQuery(queryParams, { refetchOnMountOrArgChange: true });

  const [deletePopup] = useDeletePopupAdminMutation();

  const handleRefresh = () => {
    toast.info(t("list.refreshing"));
    refetch();
  };

  const handleCreate = () => {
    router.push("/admin/popups/new");
  };

  const handleEdit = (item: PopupDto) => {
    router.push(`/admin/popups/${item.id}`);
  };

  const handleDelete = async (item: PopupDto) => {
    if (!confirm(t("messages.confirmDelete", { title: item.title }))) return;
    try {
      await deletePopup(item.id).unwrap();
      toast.success(buildPopupToastMessage(item.title, t("messages.deleted")));
      refetch();
    } catch (error) {
      toast.error(`${t("messages.deleteError")}: ${error}`);
    }
  };

  const formatSchedule = (item: PopupDto) => {
    if (!item.start_at && !item.end_at) return "-";
    const start = item.start_at ? new Date(item.start_at).toLocaleDateString() : "...";
    const end = item.end_at ? new Date(item.end_at).toLocaleDateString() : "...";
    return `${start} - ${end}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            placeholder={t("filters.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="flex h-9 w-full max-w-[180px] rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="">{t("filters.allTypes")}</option>
            <option value="topbar">{t("filters.type_topbar")}</option>
            <option value="sidebar_top">{t("filters.type_sidebar_top")}</option>
            <option value="sidebar_center">{t("filters.type_sidebar_center")}</option>
            <option value="sidebar_bottom">{t("filters.type_sidebar_bottom")}</option>
          </select>

          {localeOptions && localeOptions.length > 0 && (
            <AdminLocaleSelect value={locale} onChange={setLocale} options={localeOptions} />
          )}

          <div className="flex items-center gap-2">
            <Switch id="only-active" checked={showOnlyActive} onCheckedChange={setShowOnlyActive} />
            <Label htmlFor="only-active" className="text-sm">
              {t("filters.onlyActive")}
            </Label>
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isFetching}>
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("actions.refresh")}
            </Button>
            <Button size="sm" onClick={handleCreate}>
              <Plus className="mr-1 h-4 w-4" />
              {t("actions.create")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">{t("table.order")}</TableHead>
                <TableHead>{t("table.title")}</TableHead>
                <TableHead>{t("table.type")}</TableHead>
                <TableHead className="w-20">{t("table.active")}</TableHead>
                <TableHead>{t("table.schedule")}</TableHead>
                <TableHead>{t("table.frequency")}</TableHead>
                <TableHead className="w-24">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    {isFetching ? t("list.loading") : t("list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                popups.map((popup) => (
                  <TableRow key={popup.id}>
                    <TableCell className="text-muted-foreground">{popup.display_order}</TableCell>
                    <TableCell className="font-medium">{popup.title}</TableCell>
                    <TableCell className="text-sm">{popup.type}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${popup.is_active ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatSchedule(popup)}</TableCell>
                    <TableCell className="text-sm">{popup.display_frequency || "-"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(popup)}>
                          {t("actions.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(popup)}
                        >
                          {t("actions.delete")}
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
