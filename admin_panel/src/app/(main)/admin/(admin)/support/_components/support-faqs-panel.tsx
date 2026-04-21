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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteSupportFaqAdminMutation, useListSupportFaqsAdminQuery } from "@/integrations/hooks";
import {
  buildSupportFaqsListQueryParams,
  FAQ_CATEGORY_OPTIONS,
  SUPPORT_DEFAULT_LOCALE,
  type SupportFaqDto,
  type SupportFaqListQueryParams,
} from "@/integrations/shared";

export default function SupportFaqsPanel() {
  const t = useAdminT("admin.support");
  const router = useRouter();
  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();

  const [locale, setLocale] = React.useState("");

  React.useEffect(() => {
    setLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || SUPPORT_DEFAULT_LOCALE));
  }, [coerceLocale, defaultLocaleFromDb]);

  const queryParams = React.useMemo<SupportFaqListQueryParams>(
    () => ({
      ...buildSupportFaqsListQueryParams({ locale }),
    }),
    [locale],
  );

  const {
    data: faqs = [],
    isFetching,
    refetch,
  } = useListSupportFaqsAdminQuery(queryParams, { refetchOnMountOrArgChange: true });
  const [deleteFaq] = useDeleteSupportFaqAdminMutation();

  const handleDelete = async (item: SupportFaqDto) => {
    if (!confirm(t("faqs.confirmDelete"))) return;
    try {
      await deleteFaq(item.id).unwrap();
      toast.success(t("faqs.deleted"));
      refetch();
    } catch (error) {
      toast.error(`${t("messages.deleteError")}: ${error}`);
    }
  };

  const getCategoryLabel = (category: string) => {
    const option = FAQ_CATEGORY_OPTIONS.find((item) => item.value === category);
    return option ? t(option.labelKey) : category;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          {localeOptions.length > 0 && (
            <AdminLocaleSelect value={locale} onChange={setLocale} options={localeOptions} />
          )}
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info(t("messages.refreshing"));
                refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("faqs.refresh")}
            </Button>
            <Button size="sm" onClick={() => router.push("/admin/support/faqs/new")}>
              <Plus className="mr-1 h-4 w-4" />
              {t("faqs.add")}
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
                <TableHead>{t("table.question")}</TableHead>
                <TableHead className="w-28">{t("table.category")}</TableHead>
                <TableHead className="w-20">{t("table.published")}</TableHead>
                <TableHead className="w-32">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    {isFetching ? t("faqs.loading") : t("faqs.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="text-muted-foreground">{faq.display_order}</TableCell>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="text-sm">{getCategoryLabel(faq.category)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${faq.is_published ? "bg-green-500" : "bg-gray-300"}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/support/faqs/${faq.id}`)}>
                          {t("faqs.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(faq)}
                        >
                          {t("faqs.delete")}
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
