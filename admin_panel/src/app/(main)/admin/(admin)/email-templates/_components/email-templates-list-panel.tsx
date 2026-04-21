"use client";

import * as React from "react";

import { useRouter } from "next/navigation";

import { Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteEmailTemplateAdminMutation, useListEmailTemplatesAdminQuery } from "@/integrations/hooks";

export default function EmailTemplatesListPanel() {
  const t = useAdminT("admin.emailTemplates");
  const router = useRouter();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "inactive">("all");

  const queryParams = React.useMemo(
    () => ({
      q: search || undefined,
      is_active: statusFilter === "all" ? undefined : statusFilter === "active",
    }),
    [search, statusFilter],
  );

  const { data: rows = [], isFetching, refetch } = useListEmailTemplatesAdminQuery(queryParams);
  const [deleteTemplate] = useDeleteEmailTemplateAdminMutation();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(t("list.dialog.description", { template: name || t("list.dialog.templateFallback") }))) return;
    try {
      await deleteTemplate({ id }).unwrap();
      toast.success(t("list.toast.deleted"));
      refetch();
    } catch (error) {
      toast.error(String(error));
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("list.filters.searchPlaceholder")}
            className="max-w-xs"
          />
          <select
            className="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">{t("list.filters.statusOptions.all")}</option>
            <option value="active">{t("list.filters.statusOptions.active")}</option>
            <option value="inactive">{t("list.filters.statusOptions.inactive")}</option>
          </select>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast.info(t("list.refreshButton"));
                refetch();
              }}
              disabled={isFetching}
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {t("list.refreshButton")}
            </Button>
            <Button size="sm" onClick={() => router.push("/admin/email-templates/new")}>
              <Plus className="mr-1 h-4 w-4" />
              {t("list.addButton")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("list.table.headers.templateKey")}</TableHead>
                <TableHead>{t("list.table.headers.nameSubject")}</TableHead>
                <TableHead>{t("list.table.headers.variables")}</TableHead>
                <TableHead className="w-24">{t("list.table.headers.active")}</TableHead>
                <TableHead className="w-32">{t("list.table.headers.date")}</TableHead>
                <TableHead className="w-28">{t("list.table.headers.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {isFetching ? t("list.loading") : t("list.empty")}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.template_key}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div>{item.template_name || "-"}</div>
                        <div className="text-muted-foreground text-sm">{item.subject || "-"}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {(item.detected_variables || []).length > 0 ? item.detected_variables.join(", ") : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.is_active ? "default" : "outline"}>
                        {item.is_active
                          ? t("list.filters.statusOptions.active")
                          : t("list.filters.statusOptions.inactive")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString("tr-TR") : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/admin/email-templates/${item.id}`)}
                        >
                          {t("list.actions.edit")}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDelete(item.id, item.template_name || item.template_key)}
                        >
                          {t("list.actions.delete")}
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
