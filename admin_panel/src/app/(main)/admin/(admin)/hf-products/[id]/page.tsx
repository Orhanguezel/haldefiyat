"use client";

import { useEffect, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";

import { ArrowLeft, Eye, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  useGetHfProductEditorialAdminQuery,
  useUpdateHfProductEditorialAdminMutation,
} from "@/integrations/endpoints/hf-products-admin-endpoints";
import {
  useCreateHfProductAdminMutation,
  useGetHfProductAdminQuery,
  useUpdateHfProductAdminMutation,
} from "@/integrations/hooks";

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manuel" },
  { value: "ai_draft", label: "AI taslak" },
  { value: "ai_reviewed", label: "AI incelenmiş" },
] as const;

const CATEGORY_OPTIONS = [
  "sebze-meyve",
  "hububat",
  "yagli-tohum",
  "sanayi-bitkisi",
  "bakliyat-kuru",
  "balik-deniz",
  "balik-kultur",
  "diger",
];

const emptyEditorial = {
  aboutMd: "",
  priceFactorsMd: "",
  seasonMd: "",
  productionRegionMd: "",
  qualityIndicatorsMd: "",
  culinaryUsesMd: "",
  relatedSlugs: "",
  source: "manual" as "manual" | "ai_draft" | "ai_reviewed",
  reviewedBy: "",
  published: false,
};

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function scoreEditorial(form: typeof emptyEditorial) {
  const required = [form.aboutMd, form.priceFactorsMd, form.seasonMd, form.productionRegionMd];
  const optional = [form.qualityIndicatorsMd, form.culinaryUsesMd];
  const requiredScore = required.reduce(
    (sum, value) => sum + (countWords(value) >= 35 ? 15 : countWords(value) >= 15 ? 8 : 0),
    0,
  );
  const optionalScore = optional.reduce((sum, value) => sum + (countWords(value) >= 15 ? 8 : value.trim() ? 4 : 0), 0);
  const relationScore = splitCsv(form.relatedSlugs).length > 0 ? 8 : 0;
  return Math.min(100, requiredScore + optionalScore + relationScore);
}

function errorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error && "data" in error) {
    const data = (error as { data?: { error?: unknown } }).data;
    if (typeof data?.error === "string") return data.error;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [routeId, setRouteId] = useState("new");
  useEffect(() => {
    setRouteId(String(params?.id || "new"));
  }, [params]);
  const isNew = routeId === "new";

  const { data } = useGetHfProductAdminQuery(routeId, { skip: isNew });
  const { data: editorialData } = useGetHfProductEditorialAdminQuery(routeId, { skip: isNew });
  const [createItem, createState] = useCreateHfProductAdminMutation();
  const [updateItem, updateState] = useUpdateHfProductAdminMutation();
  const [updateEditorial, editorialState] = useUpdateHfProductEditorialAdminMutation();
  const [form, setForm] = useState({
    slug: "",
    nameTr: "",
    categorySlug: "diger",
    unit: "kg",
    aliases: "",
    seoIndex: false,
    displayName: "",
    canonicalSlug: "",
    dataQuality: "0",
    searchVolume: "0",
    displayOrder: "0",
    isActive: true,
  });
  const [editorial, setEditorial] = useState(emptyEditorial);

  useEffect(() => {
    if (!data) return;
    setForm({
      slug: data.slug,
      nameTr: data.nameTr,
      categorySlug: data.categorySlug,
      unit: data.unit,
      aliases: (data.aliases || []).join(", "),
      seoIndex: Boolean(data.seoIndex),
      displayName: data.displayName || "",
      canonicalSlug: data.canonicalSlug || "",
      dataQuality: String(data.dataQuality ?? 0),
      searchVolume: String(data.searchVolume ?? 0),
      displayOrder: String(data.displayOrder ?? 0),
      isActive: Boolean(data.isActive),
    });
  }, [data]);

  useEffect(() => {
    if (!editorialData) return;
    setEditorial({
      aboutMd: editorialData.aboutMd || "",
      priceFactorsMd: editorialData.priceFactorsMd || "",
      seasonMd: editorialData.seasonMd || "",
      productionRegionMd: editorialData.productionRegionMd || "",
      qualityIndicatorsMd: editorialData.qualityIndicatorsMd || "",
      culinaryUsesMd: editorialData.culinaryUsesMd || "",
      relatedSlugs: (editorialData.relatedSlugs || []).join(", "),
      source: editorialData.source || "manual",
      reviewedBy: editorialData.reviewedBy || "",
      published: Boolean(editorialData.publishedAt),
    });
  }, [editorialData]);

  const editorialScore = useMemo(() => scoreEditorial(editorial), [editorial]);
  const dataQuality = Number(form.dataQuality || 0);
  const readiness = Math.round(dataQuality * 0.45 + editorialScore * 0.45 + (form.seoIndex ? 10 : 0));

  // Veri kalitesi puanının gerekçesi: data_quality formülünün 5 bileşeni (toplam = puan)
  const qualityBreakdown = useMemo(() => {
    const pd = data as { priceRows30d?: number; marketCount30d?: number; hasEditorial?: boolean } | undefined;
    const name = (form.displayName || form.nameTr || "").trim();
    const nameOk = name.length > 0 && !name.includes(".") && !/^[\p{L}]([.]|\s)/u.test(name);
    const aliasCount = splitCsv(form.aliases).length;
    return [
      {
        label: "Fiyat verisi (son 30 gün)",
        ok: Number(pd?.priceRows30d ?? 0) >= 1,
        pts: 40,
        detail: `${pd?.priceRows30d ?? 0} kayıt`,
      },
      {
        label: "En az 3 hal kapsamı",
        ok: Number(pd?.marketCount30d ?? 0) >= 3,
        pts: 25,
        detail: `${pd?.marketCount30d ?? 0} hal`,
      },
      { label: "Temiz ürün adı", ok: nameOk, pts: 15, detail: nameOk ? "" : "displayName ata" },
      { label: "Alias tanımlı", ok: aliasCount >= 1, pts: 10, detail: `${aliasCount} alias` },
      { label: "Editöryel yayında", ok: Boolean(pd?.hasEditorial) || editorial.published, pts: 10, detail: "" },
    ];
  }, [data, form.displayName, form.nameTr, form.aliases, editorial.published]);

  const saving = createState.isLoading || updateState.isLoading || editorialState.isLoading;
  const publicUrl = form.slug ? `https://haldefiyat.com/urun/${form.slug}` : "";

  const productBody = () => ({
    slug: form.slug.trim(),
    nameTr: form.nameTr.trim(),
    categorySlug: form.categorySlug.trim() || "diger",
    unit: form.unit.trim() || "kg",
    aliases: splitCsv(form.aliases),
    seoIndex: form.seoIndex,
    displayName: form.displayName.trim() || null,
    canonicalSlug: form.canonicalSlug.trim() || null,
    dataQuality: Number(form.dataQuality || 0),
    searchVolume: Number(form.searchVolume || 0),
    displayOrder: Number(form.displayOrder || 0),
    isActive: form.isActive,
  });

  const saveProduct = async () => {
    const body = productBody();
    if (!body.slug || !body.nameTr) return toast.error("Slug ve ad zorunlu.");
    try {
      if (isNew) {
        const res = await createItem(body).unwrap();
        toast.success("Ürün oluşturuldu.");
        if (res.id) router.push(`/admin/hf-products/${res.id}`);
        return res.id;
      }
      await updateItem({ id: routeId, body }).unwrap();
      toast.success("Ürün güncellendi.");
      return routeId;
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Ürün kaydedilemedi"));
      return null;
    }
  };

  const saveEditorial = async (id: number | string = routeId) => {
    if (id === "new") return toast.error("Editoryel içerik için önce ürünü oluştur.");
    try {
      await updateEditorial({
        id,
        body: {
          aboutMd: editorial.aboutMd,
          priceFactorsMd: editorial.priceFactorsMd,
          seasonMd: editorial.seasonMd,
          productionRegionMd: editorial.productionRegionMd,
          qualityIndicatorsMd: editorial.qualityIndicatorsMd || null,
          culinaryUsesMd: editorial.culinaryUsesMd || null,
          relatedSlugs: splitCsv(editorial.relatedSlugs),
          source: editorial.source,
          reviewedBy: editorial.reviewedBy.trim() || null,
          published: editorial.published,
        },
      }).unwrap();
      toast.success("Editoryel içerik kaydedildi.");
    } catch (error: unknown) {
      toast.error(errorMessage(error, "Editoryel kaydedilemedi"));
    }
  };

  const saveAll = async () => {
    const id = await saveProduct();
    if (id && !isNew) await saveEditorial(id);
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">
              {isNew ? "Yeni ürün" : form.displayName || form.nameTr || "Ürün detayı"}
            </CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={form.isActive ? "default" : "secondary"}>{form.isActive ? "Aktif" : "Pasif"}</Badge>
              <Badge variant={form.seoIndex ? "default" : "outline"}>{form.seoIndex ? "Index" : "Noindex"}</Badge>
              <Badge variant={readiness >= 75 ? "default" : readiness >= 45 ? "secondary" : "destructive"}>
                SEO kalite {readiness}
              </Badge>
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={() => router.push("/admin/hf-products")}>
              <ArrowLeft className="mr-2 size-4" />
              Geri
            </Button>
            {publicUrl && (
              <Button asChild variant="outline">
                <a href={publicUrl} target="_blank" rel="noreferrer">
                  <Eye className="mr-2 size-4" />
                  Önizle
                </a>
              </Button>
            )}
            <Button onClick={saveAll} disabled={saving}>
              <Save className="mr-2 size-4" />
              Kaydet
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-sm">
            <span>Index hazırlığı</span>
            <span>{readiness}/100</span>
          </div>
          <Progress value={readiness} />
          <div className="pt-2">
            <p className="mb-1.5 font-medium text-sm">Veri kalitesi gerekçesi ({dataQuality}/100)</p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {qualityBreakdown.map((c) => (
                <div
                  key={c.label}
                  className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={c.ok ? "text-emerald-600" : "text-destructive"}>{c.ok ? "✓" : "✗"}</span>
                    {c.label}
                    {c.detail ? <span className="text-muted-foreground"> · {c.detail}</span> : null}
                  </span>
                  <span className={c.ok ? "font-medium text-emerald-600" : "text-muted-foreground"}>
                    {c.ok ? `+${c.pts}` : `0/${c.pts}`}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-1.5 text-muted-foreground text-xs">
              Eksik bileşenleri tamamla → veri kalitesi ve index kararı yükselir. (≥3 hal + fiyat verisi =
              indexlenebilir)
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="product" className="space-y-4">
        <TabsList>
          <TabsTrigger value="product">Ürün</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="editorial">Editoryel</TabsTrigger>
        </TabsList>

        <TabsContent value="product">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Temel bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Ad</Label>
                <Input value={form.nameTr} onChange={(e) => setForm((p) => ({ ...p, nameTr: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Görünen ad</Label>
                <Input
                  value={form.displayName}
                  onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Birim</Label>
                <Input value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select
                  value={form.categorySlug}
                  onValueChange={(value) => setForm((p) => ({ ...p, categorySlug: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((value) => (
                      <SelectItem key={value} value={value}>
                        {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sıra</Label>
                <Input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((p) => ({ ...p, displayOrder: e.target.value }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <Label>Aktif</Label>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, isActive: checked }))}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Aliaslar</Label>
                <Input value={form.aliases} onChange={(e) => setForm((p) => ({ ...p, aliases: e.target.value }))} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">SEO ve kalite</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label>SEO index</Label>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Sitemap ve ürün sayfası index kararında kullanılır.
                  </p>
                </div>
                <Switch
                  checked={form.seoIndex}
                  onCheckedChange={(checked) => setForm((p) => ({ ...p, seoIndex: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Canonical slug</Label>
                <Input
                  value={form.canonicalSlug}
                  onChange={(e) => setForm((p) => ({ ...p, canonicalSlug: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Veri kalitesi</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={form.dataQuality}
                  onChange={(e) => setForm((p) => ({ ...p, dataQuality: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Arama hacmi</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.searchVolume}
                  onChange={(e) => setForm((p) => ({ ...p, searchVolume: e.target.value }))}
                />
              </div>
              <div className="rounded-lg border p-3 md:col-span-2">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span>Editoryel kalite</span>
                  <span>{editorialScore}/100</span>
                </div>
                <Progress value={editorialScore} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editorial">
          <Card className="rounded-lg">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Editoryel içerik</CardTitle>
              <Button variant="outline" onClick={() => saveEditorial()} disabled={isNew || editorialState.isLoading}>
                Editoryeli kaydet
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Kaynak</Label>
                  <Select
                    value={editorial.source}
                    onValueChange={(value) => setEditorial((p) => ({ ...p, source: value as typeof editorial.source }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>İnceleyen</Label>
                  <Input
                    value={editorial.reviewedBy}
                    onChange={(e) => setEditorial((p) => ({ ...p, reviewedBy: e.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <Label>Yayında</Label>
                  <Switch
                    checked={editorial.published}
                    onCheckedChange={(checked) => setEditorial((p) => ({ ...p, published: checked }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Hakkında</Label>
                <Textarea
                  rows={6}
                  value={editorial.aboutMd}
                  onChange={(e) => setEditorial((p) => ({ ...p, aboutMd: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fiyat faktörleri</Label>
                <Textarea
                  rows={6}
                  value={editorial.priceFactorsMd}
                  onChange={(e) => setEditorial((p) => ({ ...p, priceFactorsMd: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Sezon</Label>
                <Textarea
                  rows={5}
                  value={editorial.seasonMd}
                  onChange={(e) => setEditorial((p) => ({ ...p, seasonMd: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Üretim bölgeleri</Label>
                <Textarea
                  rows={5}
                  value={editorial.productionRegionMd}
                  onChange={(e) => setEditorial((p) => ({ ...p, productionRegionMd: e.target.value }))}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Kalite göstergeleri</Label>
                  <Textarea
                    rows={5}
                    value={editorial.qualityIndicatorsMd}
                    onChange={(e) => setEditorial((p) => ({ ...p, qualityIndicatorsMd: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kullanım alanları</Label>
                  <Textarea
                    rows={5}
                    value={editorial.culinaryUsesMd}
                    onChange={(e) => setEditorial((p) => ({ ...p, culinaryUsesMd: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>İlgili sluglar</Label>
                <Input
                  value={editorial.relatedSlugs}
                  onChange={(e) => setEditorial((p) => ({ ...p, relatedSlugs: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
