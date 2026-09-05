"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { ExternalLink, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { useAdminT } from "@/app/(main)/admin/_components/common/use-admin-t";
import { SummaryTiles } from "@/app/(main)/admin/_components/common/summary-tiles";
import { AdminLocaleSelect } from "@/components/common/admin-locale-select";
import { useAdminLocales } from "@/components/common/use-admin-locales";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDeletePopupAdminMutation, useListPopupsAdminQuery } from "@/integrations/hooks";
import { buildPopupsListQueryParams, buildPopupToastMessage, POPUP_DEFAULT_LOCALE, type PopupDto } from "@/integrations/shared";

const ALL = "all";
const TYPES = ["topbar", "sidebar_top", "sidebar_center", "sidebar_bottom"] as const;

function scheduleState(item: PopupDto): "active" | "scheduled" | "expired" | "always" {
  const now = Date.now();
  const start = item.start_at ? new Date(item.start_at).getTime() : null;
  const end = item.end_at ? new Date(item.end_at).getTime() : null;
  if (!start && !end) return "always";
  if (start && start > now) return "scheduled";
  if (end && end < now) return "expired";
  return "active";
}
const shortDate = (v: string | null) => (v ? new Date(v).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function PopupsListPanel() {
  const t = useAdminT("admin.popups");
  const tc = useAdminT("admin.common");
  const router = useRouter();
  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const [locale, setLocale] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState(ALL);
  const [stateFilter, setStateFilter] = React.useState(ALL);
  const [openId, setOpenId] = React.useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<PopupDto | null>(null);

  React.useEffect(() => { setLocale((prev) => coerceLocale(prev, defaultLocaleFromDb || POPUP_DEFAULT_LOCALE)); }, [coerceLocale, defaultLocaleFromDb]);
  const queryParams = React.useMemo(() => buildPopupsListQueryParams({ search, locale, type: typeFilter === ALL ? "" : typeFilter }), [search, locale, typeFilter]);
  const { data: popups = [], isFetching, refetch } = useListPopupsAdminQuery(queryParams, { refetchOnMountOrArgChange: true });
  const [deletePopup] = useDeletePopupAdminMutation();

  const visible = React.useMemo(() => popups.filter((p) => {
    if (stateFilter === "passive") return !p.is_active;
    if (stateFilter !== ALL) return p.is_active && scheduleState(p) === stateFilter;
    return true;
  }), [popups, stateFilter]);
  const stats = React.useMemo(() => ({
    total: popups.length,
    live: popups.filter((p) => p.is_active && scheduleState(p) === "active").length,
    scheduled: popups.filter((p) => p.is_active && scheduleState(p) === "scheduled").length,
    expired: popups.filter((p) => p.is_active && scheduleState(p) === "expired").length,
    passive: popups.filter((p) => !p.is_active).length,
  }), [popups]);
  const open = popups.find((p) => p.id === openId) ?? null;
  const dirty = search || typeFilter !== ALL || stateFilter !== ALL;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deletePopup(pendingDelete.id).unwrap();
      toast.success(buildPopupToastMessage(pendingDelete.title, t("messages.deleted")));
      if (openId === pendingDelete.id) setOpenId(null);
      refetch();
    } catch (error) { toast.error(`${t("messages.deleteError")}: ${error}`); }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-xl font-semibold">{t("title")}</h1><p className="text-sm text-muted-foreground">{t("description")}</p></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { toast.info(t("list.refreshing")); refetch(); }} disabled={isFetching}><RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} /> {tc("refresh")}</Button>
          <Button onClick={() => router.push("/admin/popups/new")}><Plus className="size-4" /> {t("actions.create")}</Button>
        </div>
      </div>

      <SummaryTiles columns="sm:grid-cols-3 xl:grid-cols-5" tiles={[
        { key: "total", label: t("tiles.total"), value: stats.total, active: stateFilter === ALL, onClick: () => setStateFilter(ALL) },
        { key: "live", label: t("tiles.live"), value: stats.live, hint: t("tiles.liveHint"), tone: "text-emerald-600", active: stateFilter === "active", onClick: () => setStateFilter("active") },
        { key: "scheduled", label: t("tiles.scheduled"), value: stats.scheduled, hint: t("tiles.scheduledHint"), active: stateFilter === "scheduled", onClick: () => setStateFilter("scheduled") },
        { key: "expired", label: t("tiles.expired"), value: stats.expired, hint: t("tiles.expiredHint"), tone: stats.expired ? "text-amber-600" : "", active: stateFilter === "expired", onClick: () => setStateFilter("expired") },
        { key: "passive", label: tc("passive"), value: stats.passive, active: stateFilter === "passive", onClick: () => setStateFilter("passive") },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-[220px] flex-1" placeholder={t("filters.searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t("filters.allTypes")}</SelectItem>{TYPES.map((k) => <SelectItem key={k} value={k}>{t(`filters.type_${k}`)}</SelectItem>)}</SelectContent>
        </Select>
        {localeOptions?.length ? <AdminLocaleSelect value={locale} onChange={setLocale} options={localeOptions} /> : null}
        {dirty ? <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setTypeFilter(ALL); setStateFilter(ALL); }}><X className="size-3.5" /> {tc("clear")}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{tc("rowCount", { count: visible.length })}</span>
      </div>

      {isFetching && !popups.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("list.loading")}</div>
        : !visible.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("list.empty")}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[280px]">{t("table.title")}</TableHead>
              <TableHead className="w-40">{t("table.type")}</TableHead>
              <TableHead className="w-44">{t("table.schedule")}</TableHead>
              <TableHead className="w-36">{t("table.frequency")}</TableHead>
              <TableHead className="w-28">{t("table.active")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.map((p) => {
                const st = scheduleState(p);
                return (
                  <TableRow key={p.id} onClick={() => setOpenId(p.id)} className={`cursor-pointer ${openId === p.id ? "bg-primary/5" : ""}`}>
                    <TableCell className="py-2.5"><div className="font-medium">{p.title}</div><div className="truncate text-xs text-muted-foreground">{p.link_url || t("tiles.noLink")} · {t("table.order")} {p.display_order}</div></TableCell>
                    <TableCell className="text-sm">{t(`filters.type_${p.type}`, undefined, p.type)}</TableCell>
                    <TableCell className="text-sm">{st === "always" ? <span className="text-muted-foreground">{t("tiles.always")}</span> : <span className={st === "expired" ? "text-amber-600" : ""}>{shortDate(p.start_at)} – {shortDate(p.end_at)}</span>}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.display_frequency || "—"}</TableCell>
                    <TableCell><Badge variant={p.is_active ? (st === "active" ? "default" : "secondary") : "outline"} className="font-normal">{!p.is_active ? tc("passive") : t(`tiles.${st}`)}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.title}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={open.is_active ? "default" : "outline"} className="font-normal">{open.is_active ? t(`tiles.${scheduleState(open)}`) : tc("passive")}</Badge>
                  <span>{t(`filters.type_${open.type}`, undefined, open.type)}</span><span aria-hidden>·</span><span>{open.display_frequency}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5 text-sm">
                {open.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={open.image_url} alt={open.alt ?? ""} className="max-h-40 w-full rounded-lg border object-contain bg-muted/30" />
                ) : null}
                <div className="rounded-lg border p-3" style={{ background: open.background_color ?? undefined, color: open.text_color ?? undefined }}>
                  <div className="font-semibold">{open.title}</div>
                  {open.content ? <p className="mt-1 text-sm opacity-90">{open.content}</p> : null}
                  {open.button_text ? <span className="mt-2 inline-block rounded px-3 py-1 text-xs font-bold" style={{ background: open.button_color ?? undefined, color: open.button_text_color ?? undefined }}>{open.button_text}</span> : null}
                </div>
                <dl className="grid gap-x-4 gap-y-1.5 text-sm">
                  {[[t("table.schedule"), scheduleState(open) === "always" ? t("tiles.always") : `${shortDate(open.start_at)} – ${shortDate(open.end_at)}`],
                    [t("tiles.link"), open.link_url || "—"],
                    [t("tiles.paths"), open.target_paths?.length ? open.target_paths.join(", ") : t("tiles.allPaths")],
                    [t("tiles.delay"), `${open.delay_seconds} sn`],
                    [t("table.order"), String(open.display_order)]].map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 border-b py-1.5 last:border-0"><dt className="text-muted-foreground">{k}</dt><dd className="text-right">{v}</dd></div>
                  ))}
                </dl>
              </div>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(open)}><Trash2 className="size-3.5" /> {t("actions.delete")}</Button>
                  <span className="flex-1" />
                  <Button size="sm" onClick={() => router.push(`/admin/popups/${open.id}`)}><ExternalLink className="size-3.5" /> {t("actions.edit")}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("actions.delete")}</AlertDialogTitle><AlertDialogDescription>{pendingDelete ? t("messages.confirmDelete", { title: pendingDelete.title }) : ""}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc("giveUp")}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{tc("delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
