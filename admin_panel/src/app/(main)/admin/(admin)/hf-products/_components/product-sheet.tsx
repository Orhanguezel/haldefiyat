"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, PenLine, Save } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BASE_URL } from "@/integrations/api-base";
import type { HfProductItem } from "@/integrations/endpoints/hf-products-admin-endpoints";
import { useGetHfProductAdminQuery, useUpdateHfProductAdminMutation } from "@/integrations/hooks";
import { ACTION_META, productName, qualityTone } from "../_lib/product-meta";
import { ProductEditorialTab } from "./product-editorial-tab";
import { ProductGscPanel } from "./product-gsc-panel";
import { ProductRedirectPanel } from "./product-redirect-panel";
import { ProductThumb } from "./product-thumb";

const SITE = BASE_URL.replace(/\/api\/v1\/?$/, "");

type Detail = HfProductItem & { priceRows30d?: number; marketCount30d?: number; hasEditorial?: boolean };

function toForm(item: HfProductItem) {
  return {
    nameTr: item.nameTr ?? "",
    displayName: item.displayName ?? "",
    slug: item.slug ?? "",
    categorySlug: item.categorySlug ?? "diger",
    unit: item.unit ?? "kg",
    aliases: (item.aliases ?? []).join(", "),
    canonicalSlug: item.canonicalSlug ?? "",
    familySlug: item.familySlug ?? "",
    searchVolume: String(item.searchVolume ?? 0),
    displayOrder: String(item.displayOrder ?? 0),
    dataQuality: String(item.dataQuality ?? 0),
    seoIndex: Boolean(item.seoIndex),
    isActive: Boolean(item.isActive),
  };
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function QualityBreakdown({ detail, aliases, name }: { detail?: Detail; aliases: string; name: string }) {
  const rows = useMemo(() => {
    const clean = name.trim().length > 0 && !name.includes(".") && !/^[\p{L}]([.]|\s)/u.test(name.trim());
    const aliasCount = aliases.split(",").map((a) => a.trim()).filter(Boolean).length;
    return [
      { label: "Fiyat verisi (son 30 gün)", ok: Number(detail?.priceRows30d ?? 0) >= 1, pts: 40, detail: `${detail?.priceRows30d ?? 0} kayıt` },
      { label: "En az 3 hal kapsamı", ok: Number(detail?.marketCount30d ?? 0) >= 3, pts: 25, detail: `${detail?.marketCount30d ?? 0} hal` },
      { label: "Temiz ürün adı", ok: clean, pts: 15, detail: clean ? "" : "görünen ad ata" },
      { label: "Alias tanımlı", ok: aliasCount >= 1, pts: 10, detail: `${aliasCount} alias` },
      { label: "Editoryel yayında", ok: Boolean(detail?.hasEditorial), pts: 10, detail: "" },
    ];
  }, [detail, aliases, name]);
  return (
    <div className="grid gap-1.5 sm:grid-cols-2">
      {rows.map((row) => (
        <div key={row.label} className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs">
          <span className="flex items-center gap-1.5">
            <span className={row.ok ? "text-emerald-600" : "text-rose-600"}>{row.ok ? "✓" : "✗"}</span>
            {row.label}
            {row.detail ? <span className="text-muted-foreground">· {row.detail}</span> : null}
          </span>
          <span className={row.ok ? "font-medium text-emerald-600" : "text-muted-foreground"}>{row.ok ? `+${row.pts}` : `0/${row.pts}`}</span>
        </div>
      ))}
    </div>
  );
}

type Props = { item: HfProductItem | null; categories: string[]; onClose: () => void };

export function ProductSheet({ item, categories, onClose }: Props) {
  const { data: detail } = useGetHfProductAdminQuery(item?.id ?? 0, { skip: !item });
  const [update, updateState] = useUpdateHfProductAdminMutation();
  const [form, setForm] = useState(() => (item ? toForm(item) : null));

  const itemId = item?.id ?? null;
  const detailId = detail?.id ?? null;
  // Form yalniz urun degisince ya da detay ilk gelince dolar; liste tazelenince
  // kullanicinin henuz kaydetmedigi degisiklikler silinmez.
  useEffect(() => {
    if (!item) { setForm(null); return; }
    setForm(toForm(detail && detail.id === item.id ? detail : item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, detailId]);

  const set = <K extends keyof NonNullable<typeof form>>(key: K, value: NonNullable<typeof form>[K]) =>
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));

  async function save() {
    if (!item || !form) return;
    try {
      await update({
        id: item.id,
        body: {
          slug: form.slug.trim(),
          nameTr: form.nameTr.trim(),
          categorySlug: form.categorySlug,
          unit: form.unit.trim() || "kg",
          aliases: form.aliases.split(",").map((a) => a.trim()).filter(Boolean),
          seoIndex: form.seoIndex,
          displayName: form.displayName.trim() || null,
          imageUrl: item.imageUrl ?? null,
          canonicalSlug: form.canonicalSlug.trim() || null,
          familySlug: form.familySlug.trim() || null,
          dataQuality: Number(form.dataQuality || 0),
          searchVolume: Number(form.searchVolume || 0),
          displayOrder: Number(form.displayOrder || 0),
          isActive: form.isActive,
        },
      }).unwrap();
      toast.success("Ürün güncellendi.");
    } catch {
      toast.error("Ürün kaydedilemedi.");
    }
  }

  const action = item ? ACTION_META[item.action ?? "variant"] : null;
  const quality = Number(form?.dataQuality ?? item?.dataQuality ?? 0);

  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-2xl">
        {item && form ? (
          <>
            <SheetHeader className="border-b px-6 py-4">
              <div className="flex items-start gap-3 pr-8">
                <ProductThumb slug={item.slug} canonicalSlug={item.canonicalSlug} name={productName(item)} imageUrl={item.imageUrl} size={48} />
                <div className="min-w-0">
                  <SheetTitle className="truncate text-base">{productName(item)}</SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs">{item.slug}</span>
                    <Badge variant={item.isActive ? "default" : "secondary"} className="font-normal">{item.isActive ? "Aktif" : "Pasif"}</Badge>
                    {item.canonicalSlug ? <Badge variant="outline" className="font-normal">Varyant → {item.canonicalSlug}</Badge>
                      : <Badge variant={item.seoIndex ? "default" : "outline"} className="font-normal">{item.seoIndex ? "Index" : "Noindex"}</Badge>}
                    {action && item.action !== "variant" ? <Badge variant={action.variant} className="font-normal" title={action.hint}>{action.label}</Badge> : null}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
              <div className="border-b px-6 pt-3">
                <TabsList>
                  <TabsTrigger value="overview">Özet</TabsTrigger>
                  <TabsTrigger value="edit">Düzenle</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                  <TabsTrigger value="editorial">Editoryel {item.hasEditorial ? "·" : ""}</TabsTrigger>
                  <TabsTrigger value="google">Google</TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                <TabsContent value="overview" className="mt-0 space-y-5">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Veri kalitesi</div>
                      <div className="text-2xl font-semibold tabular-nums">{quality}</div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className={`h-full ${qualityTone(quality)}`} style={{ width: `${quality}%` }} /></div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Aylık arama</div>
                      <div className="text-2xl font-semibold tabular-nums">{Number(item.searchVolume ?? 0).toLocaleString("tr-TR")}</div>
                    </div>
                    <div className="rounded-lg border p-3">
                      <div className="text-xs text-muted-foreground">Kapsam (30 gün)</div>
                      <div className="text-2xl font-semibold tabular-nums">{item.halMarkets30d ?? 0} <span className="text-sm font-normal text-muted-foreground">hal</span></div>
                      {Number(item.borsaMarkets30d ?? 0) > 0 ? <div className="text-xs text-muted-foreground">{item.borsaMarkets30d} borsa</div> : null}
                    </div>
                  </div>

                  {action && item.action !== "variant" ? (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <span className="font-medium">Sonraki adım: </span>{action.label}. <span className="text-muted-foreground">{action.hint}.</span>
                    </div>
                  ) : null}

                  <div>
                    <div className="mb-2 text-sm font-medium">Veri kalitesi gerekçesi</div>
                    <QualityBreakdown detail={detail as Detail | undefined} aliases={form.aliases} name={form.displayName || form.nameTr} />
                  </div>

                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                    <div><dt className="text-xs text-muted-foreground">Kategori</dt><dd>{item.categorySlug}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Birim</dt><dd>{item.unit}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Aile</dt><dd>{item.familySlug ?? "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Editoryel</dt><dd>{item.hasEditorial ? "yayında" : "yok"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Google</dt><dd>{item.gscLabel ?? "denetlenmedi"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Sıra</dt><dd>{item.displayOrder}</dd></div>
                    <div className="col-span-2 sm:col-span-3"><dt className="text-xs text-muted-foreground">Aliaslar</dt><dd className="truncate">{(item.aliases ?? []).join(", ") || "—"}</dd></div>
                  </dl>
                </TabsContent>

                <TabsContent value="edit" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <Field label="Ad"><Input value={form.nameTr} onChange={(e) => set("nameTr", e.target.value)} /></Field>
                  <Field label="Görünen ad"><Input value={form.displayName} onChange={(e) => set("displayName", e.target.value)} /></Field>
                  <Field label="Slug"><Input value={form.slug} onChange={(e) => set("slug", e.target.value)} className="font-mono" /></Field>
                  <Field label="Kategori">
                    <Select value={form.categorySlug} onValueChange={(v) => set("categorySlug", v)}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Birim"><Input value={form.unit} onChange={(e) => set("unit", e.target.value)} /></Field>
                  <Field label="Sıra"><Input type="number" value={form.displayOrder} onChange={(e) => set("displayOrder", e.target.value)} /></Field>
                  <div className="sm:col-span-2"><Field label="Aliaslar" hint="Virgülle ayırın. ETL bu adları bu ürüne eşler."><Input value={form.aliases} onChange={(e) => set("aliases", e.target.value)} /></Field></div>
                  <label className="flex items-center justify-between rounded-lg border p-3 text-sm sm:col-span-2">
                    <span>Aktif</span><Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
                  </label>
                </TabsContent>

                <TabsContent value="seo" className="mt-0 grid gap-4 sm:grid-cols-2">
                  <label className="flex items-start justify-between gap-4 rounded-lg border p-3 text-sm sm:col-span-2">
                    <span><span className="font-medium">SEO index</span><br /><span className="text-xs text-muted-foreground">Sitemap ve ürün sayfası index kararında kullanılır.</span></span>
                    <Switch checked={form.seoIndex} onCheckedChange={(v) => set("seoIndex", v)} />
                  </label>
                  <Field label="Canonical slug" hint="Doluysa bu ürün varyanttır ve master'a 301 yönlenir."><Input value={form.canonicalSlug} onChange={(e) => set("canonicalSlug", e.target.value)} className="font-mono" /></Field>
                  <Field label="Çeşit ailesi" hint="Aynı aile çeşit seçiciyle bağlanır; her biri kendi sayfasında kalır."><Input value={form.familySlug} onChange={(e) => set("familySlug", e.target.value)} className="font-mono" /></Field>
                  <Field label="Veri kalitesi"><Input type="number" min={0} max={100} value={form.dataQuality} onChange={(e) => set("dataQuality", e.target.value)} /></Field>
                  <Field label="Arama hacmi"><Input type="number" min={0} value={form.searchVolume} onChange={(e) => set("searchVolume", e.target.value)} /></Field>
                </TabsContent>

                <TabsContent value="editorial" className="mt-0">
                  <ProductEditorialTab productId={item.id} />
                </TabsContent>

                <TabsContent value="google" className="mt-0 space-y-4">
                  <ProductGscPanel id={String(item.id)} isNew={false} />
                  <ProductRedirectPanel slug={item.slug} isNew={false} />
                </TabsContent>
              </div>
            </Tabs>

            <SheetFooter className="border-t px-6 py-3">
              <div className="flex flex-wrap justify-between gap-2">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <a href={`${SITE}/urun/${item.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Sayfayı aç</a>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/admin/hf-products/${item.id}`}><PenLine className="size-4" /> Tam sayfa</Link>
                  </Button>
                </div>
                <Button onClick={save} disabled={updateState.isLoading}><Save className="size-4" /> {updateState.isLoading ? "Kaydediliyor…" : "Kaydet"}</Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
