"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ExternalLink, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { SummaryTiles } from "@/app/(main)/admin/_components/common/summary-tiles";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeleteEmailTemplateAdminMutation, useListEmailTemplatesAdminQuery } from "@/integrations/hooks";
import type { EmailTemplateAdminListItemDto } from "@/integrations/shared";

const ALL = "all";
const shortDate = (v: string | Date | null) => (v ? new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—");
/** Sablon ailesi anahtarin ilk parcasindan ("press_release" → "press"). */
const familyOf = (key: string) => key.split(/[_.-]/)[0] || "diger";

export default function EmailTemplatesListPanel() {
  const t = useAdminT("admin.emailTemplates");
  const tc = useAdminT("admin.common");
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState<"all" | "active" | "inactive">("all");
  const [family, setFamily] = React.useState(ALL);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<EmailTemplateAdminListItemDto | null>(null);

  const queryParams = React.useMemo(() => ({ q: search || undefined, is_active: status === "all" ? undefined : status === "active" }), [search, status]);
  const { data: rows = [], isFetching, refetch } = useListEmailTemplatesAdminQuery(queryParams);
  const [deleteTemplate] = useDeleteEmailTemplateAdminMutation();

  const families = React.useMemo(() => [...new Set(rows.map((r) => familyOf(r.template_key)))].sort(), [rows]);
  const visible = React.useMemo(() => rows.filter((r) => family === ALL || familyOf(r.template_key) === family), [rows, family]);
  const stats = React.useMemo(() => ({
    total: rows.length,
    active: rows.filter((r) => r.is_active).length,
    noSubject: rows.filter((r) => !r.subject?.trim()).length,
    withVars: rows.filter((r) => (r.detected_variables ?? []).length > 0).length,
    families: families.length,
  }), [rows, families]);
  const open = rows.find((r) => r.id === openId) ?? null;
  const dirty = search || status !== "all" || family !== ALL;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteTemplate({ id: pendingDelete.id }).unwrap();
      toast.success(t("list.toast.deleted"));
      if (openId === pendingDelete.id) setOpenId(null);
      refetch();
    } catch (error) { toast.error(String(error)); }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{t("list.title")}</h1><p className="text-sm text-muted-foreground">{t("list.description")}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> {tc("refresh")}</Button>
          <Button onClick={() => router.push("/admin/email-templates/new")}><Plus className="size-4" /> {t("list.addButton")}</Button>
        </div>
      </div>

      <SummaryTiles columns="sm:grid-cols-2 xl:grid-cols-4" tiles={[
        { key: "total", label: t("list.tiles.total"), value: stats.total, hint: t("list.tiles.totalHint", { count: stats.families }), active: status === "all" && family === ALL, onClick: () => { setStatus("all"); setFamily(ALL); } },
        { key: "active", label: t("list.filters.statusOptions.active"), value: stats.active, tone: "text-emerald-600", active: status === "active", onClick: () => setStatus("active") },
        { key: "vars", label: t("list.tiles.withVars"), value: stats.withVars, hint: t("list.tiles.withVarsHint") },
        { key: "noSubject", label: t("list.tiles.noSubject"), value: stats.noSubject, hint: t("list.tiles.noSubjectHint"), tone: stats.noSubject ? "text-amber-600" : "" },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-[220px] flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("list.filters.searchPlaceholder")} />
        <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>{(["all", "active", "inactive"] as const).map((k) => <SelectItem key={k} value={k}>{t(`list.filters.statusOptions.${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={family} onValueChange={setFamily}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t("list.tiles.allFamilies")}</SelectItem>{families.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
        </Select>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus("all"); setFamily(ALL); }}><X className="size-3.5" /> {tc("clear")}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{tc("rowCount", { count: visible.length })}</span>
      </div>

      {isFetching && !rows.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("list.loading")}</div>
        : !visible.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("list.empty")}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[300px]">{t("list.table.headers.nameSubject")}</TableHead>
              <TableHead className="min-w-[220px]">{t("list.table.headers.variables")}</TableHead>
              <TableHead className="w-32">{t("list.table.headers.date")}</TableHead>
              <TableHead className="w-24">{t("list.table.headers.active")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.map((item) => (
                <TableRow key={item.id} onClick={() => setOpenId(item.id)} className={`cursor-pointer ${openId === item.id ? "bg-primary/5" : ""}`}>
                  <TableCell className="py-2.5">
                    <div className="font-medium">{item.template_name || item.template_key}</div>
                    <div className="truncate text-xs text-muted-foreground"><span className="font-mono">{item.template_key}</span>{item.subject ? ` · ${item.subject}` : ` · ${t("list.tiles.noSubject")}`}</div>
                  </TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{(item.detected_variables ?? []).slice(0, 5).map((v) => <Badge key={v} variant="outline" className="font-mono text-[10px] font-normal">{v}</Badge>)}{(item.detected_variables ?? []).length > 5 ? <span className="text-xs text-muted-foreground">+{(item.detected_variables ?? []).length - 5}</span> : null}</div></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{shortDate(item.updated_at)}</TableCell>
                  <TableCell><Badge variant={item.is_active ? "default" : "outline"} className="font-normal">{t(`list.filters.statusOptions.${item.is_active ? "active" : "inactive"}`)}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.template_name || open.template_key}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={open.is_active ? "default" : "outline"} className="font-normal">{t(`list.filters.statusOptions.${open.is_active ? "active" : "inactive"}`)}</Badge>
                  <span className="font-mono text-xs">{open.template_key}</span>{open.locale ? <><span aria-hidden>·</span><span>{open.locale}</span></> : null}
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5 text-sm">
                <div><div className="text-xs text-muted-foreground">{t("list.table.headers.nameSubject")}</div><div className="mt-1 rounded-md border bg-muted/40 p-3 font-medium">{open.subject || t("list.tiles.noSubject")}</div></div>
                {(open.detected_variables ?? []).length ? <div><div className="text-xs text-muted-foreground">{t("list.table.headers.variables")}</div><div className="mt-1 flex flex-wrap gap-1">{open.detected_variables.map((v) => <Badge key={v} variant="outline" className="font-mono text-[10px] font-normal">{v}</Badge>)}</div></div> : null}
                {open.content ? <div><div className="text-xs text-muted-foreground">{t("list.tiles.preview")}</div><iframe title={open.template_key} srcDoc={open.content} className="mt-1 h-[420px] w-full rounded-md border bg-white" /></div> : null}
              </div>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(open)}><Trash2 className="size-3.5" /> {t("list.actions.delete")}</Button>
                  <span className="flex-1" />
                  <Button size="sm" onClick={() => router.push(`/admin/email-templates/${open.id}`)}><ExternalLink className="size-3.5" /> {t("list.actions.edit")}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("list.actions.delete")}</AlertDialogTitle><AlertDialogDescription>{pendingDelete ? t("list.dialog.description", { template: pendingDelete.template_name || pendingDelete.template_key }) : ""}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc("giveUp")}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{tc("delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
