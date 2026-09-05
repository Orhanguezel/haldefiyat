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
import { useDeleteSupportFaqAdminMutation, useListSupportFaqsAdminQuery } from "@/integrations/hooks";
import { buildSupportFaqsListQueryParams, FAQ_CATEGORY_OPTIONS, SUPPORT_DEFAULT_LOCALE, type SupportFaqDto, type SupportFaqListQueryParams } from "@/integrations/shared";

const ALL = "all";
/** Public SSS sayfasinda kisa cevap zayif kalir; 120 karakter alti "ince" sayilir. */
const THIN_ANSWER = 120;

export default function SupportFaqsPanel() {
  const t = useAdminT("admin.support");
  const tc = useAdminT("admin.common");
  const router = useRouter();
  const { localeOptions, defaultLocaleFromDb, coerceLocale } = useAdminLocales();
  const [locale, setLocale] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState(ALL);
  const [state, setState] = React.useState(ALL);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<SupportFaqDto | null>(null);

  React.useEffect(() => { setLocale((prev: string) => coerceLocale(prev, defaultLocaleFromDb || SUPPORT_DEFAULT_LOCALE)); }, [coerceLocale, defaultLocaleFromDb]);
  const queryParams = React.useMemo<SupportFaqListQueryParams>(() => ({ ...buildSupportFaqsListQueryParams({ locale }) }), [locale]);
  const { data: faqs = [], isFetching, refetch } = useListSupportFaqsAdminQuery(queryParams, { refetchOnMountOrArgChange: true });
  const [deleteFaq] = useDeleteSupportFaqAdminMutation();

  const visible = React.useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return faqs.filter((f) => {
      if (q && !`${f.question} ${f.answer}`.toLocaleLowerCase("tr").includes(q)) return false;
      if (category !== ALL && f.category !== category) return false;
      if (state === "published") return f.is_published;
      if (state === "draft") return !f.is_published;
      if (state === "thin") return (f.answer ?? "").length < THIN_ANSWER;
      return true;
    });
  }, [faqs, search, category, state]);
  const stats = React.useMemo(() => ({
    total: faqs.length,
    published: faqs.filter((f) => f.is_published).length,
    draft: faqs.filter((f) => !f.is_published).length,
    thin: faqs.filter((f) => (f.answer ?? "").length < THIN_ANSWER).length,
  }), [faqs]);
  const open = faqs.find((f) => f.id === openId) ?? null;
  const categoryLabel = (c: string) => { const o = FAQ_CATEGORY_OPTIONS.find((x) => x.value === c); return o ? t(o.labelKey) : c; };
  const dirty = search || category !== ALL || state !== ALL;

  async function confirmDelete() {
    if (!pendingDelete) return;
    try {
      await deleteFaq(pendingDelete.id).unwrap();
      toast.success(t("faqs.deleted"));
      if (openId === pendingDelete.id) setOpenId(null);
      refetch();
    } catch (error) { toast.error(`${t("messages.deleteError")}: ${error}`); }
    setPendingDelete(null);
  }

  return (
    <div className="space-y-4">
      <SummaryTiles columns="sm:grid-cols-2 xl:grid-cols-4" tiles={[
        { key: "total", label: t("faqs.tiles.total"), value: stats.total, active: state === ALL, onClick: () => setState(ALL) },
        { key: "published", label: t("faqs.tiles.published"), value: stats.published, hint: t("faqs.tiles.publishedHint"), tone: "text-emerald-600", active: state === "published", onClick: () => setState("published") },
        { key: "draft", label: t("faqs.tiles.draft"), value: stats.draft, active: state === "draft", onClick: () => setState("draft") },
        { key: "thin", label: t("faqs.tiles.thin"), value: stats.thin, hint: t("faqs.tiles.thinHint"), tone: stats.thin ? "text-amber-600" : "", active: state === "thin", onClick: () => setState("thin") },
      ]} />

      <div className="flex flex-wrap items-center gap-2">
        <Input className="min-w-[220px] flex-1" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("faqs.searchPlaceholder")} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value={ALL}>{t("faqs.allCategories")}</SelectItem>{FAQ_CATEGORY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.labelKey)}</SelectItem>)}</SelectContent>
        </Select>
        {localeOptions.length > 0 ? <AdminLocaleSelect value={locale} onChange={setLocale} options={localeOptions} /> : null}
        <Button variant="outline" size="sm" onClick={() => { toast.info(t("messages.refreshing")); refetch(); }} disabled={isFetching}><RefreshCw className={`size-3.5 ${isFetching ? "animate-spin" : ""}`} /> {tc("refresh")}</Button>
        <Button size="sm" onClick={() => router.push("/admin/support/faqs/new")}><Plus className="size-3.5" /> {t("faqs.add")}</Button>
        {dirty ? <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategory(ALL); setState(ALL); }}><X className="size-3.5" /> {tc("clear")}</Button> : null}
        <span className="ml-auto self-center text-sm text-muted-foreground">{tc("rowCount", { count: visible.length })}</span>
      </div>

      {isFetching && !faqs.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("faqs.loading")}</div>
        : !visible.length ? <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">{t("faqs.empty")}</div> : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader><TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="min-w-[360px]">{t("table.question")}</TableHead>
              <TableHead className="w-36">{t("table.category")}</TableHead>
              <TableHead className="w-24 text-right">{t("faqs.tiles.length")}</TableHead>
              <TableHead className="w-28">{t("table.published")}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {visible.map((faq) => {
                const len = (faq.answer ?? "").length;
                return (
                  <TableRow key={faq.id} onClick={() => setOpenId(faq.id)} className={`cursor-pointer ${openId === faq.id ? "bg-primary/5" : ""}`}>
                    <TableCell className="py-2.5"><div className="font-medium">{faq.question}</div><div className="line-clamp-1 text-xs text-muted-foreground">{faq.answer}</div></TableCell>
                    <TableCell className="text-sm">{categoryLabel(faq.category)}</TableCell>
                    <TableCell className={`text-right text-sm tabular-nums ${len < THIN_ANSWER ? "text-amber-600" : "text-muted-foreground"}`}>{len}</TableCell>
                    <TableCell><Badge variant={faq.is_published ? "default" : "outline"} className="font-normal">{faq.is_published ? t("faqs.tiles.published") : t("faqs.tiles.draft")}</Badge></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={Boolean(open)} onOpenChange={(v) => { if (!v) setOpenId(null); }}>
        <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
          {open ? (
            <>
              <SheetHeader className="border-b px-6 py-4">
                <SheetTitle className="text-base">{open.question}</SheetTitle>
                <SheetDescription className="flex flex-wrap items-center gap-1.5">
                  <Badge variant={open.is_published ? "default" : "outline"} className="font-normal">{open.is_published ? t("faqs.tiles.published") : t("faqs.tiles.draft")}</Badge>
                  <span>{categoryLabel(open.category)}</span><span aria-hidden>·</span><span>{open.locale}</span><span aria-hidden>·</span><span>{t("table.order")} {open.display_order}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <div className="whitespace-pre-line rounded-md border bg-muted/40 p-3 text-sm leading-7">{open.answer}</div>
                <p className="mt-2 text-xs text-muted-foreground">{t("faqs.tiles.lengthHint", { count: (open.answer ?? "").length })}</p>
              </div>
              <SheetFooter className="border-t px-6 py-3">
                <div className="flex w-full items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setPendingDelete(open)}><Trash2 className="size-3.5" /> {t("faqs.delete")}</Button>
                  <span className="flex-1" />
                  <Button size="sm" onClick={() => router.push(`/admin/support/faqs/${open.id}`)}><ExternalLink className="size-3.5" /> {t("faqs.edit")}</Button>
                </div>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(v) => { if (!v) setPendingDelete(null); }}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{t("faqs.delete")}</AlertDialogTitle><AlertDialogDescription>{t("faqs.confirmDelete")}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{tc("giveUp")}</AlertDialogCancel><AlertDialogAction onClick={confirmDelete}>{tc("delete")}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
