"use client";

import * as React from "react";

import Link from "next/link";

import { AlertTriangle, ArrowLeft, Info, Link2, PackagePlus, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ProductReviewItem, ProductReviewStatus } from "@/integrations/endpoints/hf-products-admin-endpoints";
import {
  useListHfProductsAdminQuery,
  useListProductReviewQueueAdminQuery,
  useReviewProductQueueItemAdminMutation,
} from "@/integrations/hooks";

const statusLabels: Record<ProductReviewStatus, string> = {
  pending: "Bekliyor",
  aliased: "Alias bağlandı",
  created: "Taslak oluşturuldu",
  rejected: "Reddedildi",
};
const money = (value: string | null) =>
  value == null ? "—" : Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 });
const slugify = (value: string) =>
  value
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function ProductReviewQueuePanel() {
  const [status, setStatus] = React.useState<ProductReviewStatus>("pending");
  const [q, setQ] = React.useState("");
  const [source, setSource] = React.useState("");
  const [reason, setReason] = React.useState("all");
  const [selected, setSelected] = React.useState<ProductReviewItem | null>(null);
  const [decision, setDecision] = React.useState<"alias" | "create" | "reject">("alias");
  const [note, setNote] = React.useState("");
  const [targetSearch, setTargetSearch] = React.useState("");
  const [targetProductId, setTargetProductId] = React.useState<number | null>(null);
  const [draft, setDraft] = React.useState({ slug: "", nameTr: "", categorySlug: "diger", unit: "kg" });
  const { data, isFetching, refetch } = useListProductReviewQueueAdminQuery({
    status,
    q: q || undefined,
    source: source || undefined,
    reason: reason === "all" ? undefined : (reason as "UNKNOWN_PRODUCT" | "UNKNOWN_UNIT"),
    limit: 100,
  });
  const { data: targets } = useListHfProductsAdminQuery({
    q: targetSearch || selected?.normalizedName,
    isActive: true,
  });
  const [review, reviewState] = useReviewProductQueueItemAdminMutation();

  function choose(item: ProductReviewItem, next: typeof decision) {
    setSelected(item);
    setDecision(next);
    setNote("");
    setTargetProductId(null);
    setTargetSearch(item.normalizedName);
    setDraft({
      slug: slugify(item.normalizedName),
      nameTr: item.normalizedName,
      categorySlug: item.suggestedCategory,
      unit: item.canonicalUnit ?? "kg",
    });
  }

  async function submit() {
    if (!selected || note.trim().length < 3) return toast.error("En az 3 karakterlik karar notu yazın.");
    if (decision === "alias" && !targetProductId) return toast.error("Alias için hedef canonical ürünü seçin.");
    if (decision === "create" && (!draft.slug || !draft.nameTr || !draft.categorySlug || !draft.unit))
      return toast.error("Taslak ürün alanlarını doldurun.");
    try {
      await review({
        id: selected.id,
        decision,
        note: note.trim(),
        ...(decision === "alias" ? { targetProductId: targetProductId ?? undefined } : {}),
        ...(decision === "create" ? draft : {}),
      }).unwrap();
      toast.success(
        decision === "alias"
          ? "Alias canonical ürüne bağlandı."
          : decision === "create"
            ? "Pasif/noindex ürün taslağı oluşturuldu."
            : "Ham ürün reddedildi.",
      );
      setSelected(null);
      await refetch();
    } catch (error) {
      const message = (error as { data?: { error?: string } })?.data?.error;
      toast.error(message || "Karar kaydedilemedi.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-semibold text-xl">Bilinmeyen ürün inceleme kuyruğu</h1>
          <p className="text-muted-foreground text-sm">
            ETL artık belirsiz adı public ürün yapmaz. Alias bağlayın, pasif taslak oluşturun veya reddedin.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/hf-products">
            <ArrowLeft className="mr-2 size-4" />
            Ürünlere dön
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-4" />
            Nasıl karar verilir?
          </CardTitle>
          <CardDescription>
            ETL, ham adı mevcut ürün adı/alias&apos;ıyla (isim + birim anahtarı) eşleştiremeyince satır buraya düşer.
            Karar verilene kadar o adın fiyat satırları <strong>kaydedilmez</strong> — kuyruk bekledikçe veri kaybolur.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex gap-2">
            <Link2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <strong>Alias bağla</strong> — ham ad mevcut bir ürünün farklı yazımı/kısaltmasıysa (örn. &quot;ÜÇBURUN KÖY
              B.&quot; → Uçburun Köy Biberi). Ham ad hedef ürünün alias listesine eklenir, sonraki ETL koşusundan itibaren
              fiyatlar o ürüne akar. Birim sınıfı aynı olmalı (kg↔kg; kg↔adet reddedilir).
            </p>
          </div>
          <div className="flex gap-2">
            <PackagePlus className="mt-0.5 size-4 shrink-0 text-primary" />
            <p>
              <strong>Pasif taslak</strong> — ad gerçek ama katalogda karşılığı olmayan yeni bir çeşitse (örn. &quot;ÜZÜM
              KAVACIK&quot;). Ürün pasif + noindex açılır. <strong>Pasif ürün ETL eşleşmesine girmez</strong> — verinin
              akması için taslağı ürün düzenleme ekranından aktifleştirin ve tek başına sayfa olmaması için canonical
              (birleştirme) ile ailesine bağlayın; böylece master sayfada kendi satırıyla görünür.
            </p>
          </div>
          <div className="flex gap-2">
            <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <p>
              <strong>Reddet</strong> — ad çöpse (sütun başlığı sızıntısı, çözülemeyen kısaltma). Satırlar sessizce
              atlanmaya devam eder, kuyruğa tekrar düşmez. Anlamı sonradan çözülürse alias&apos;ı ürün düzenleme
              ekranından elle ekleyin (karar burada tekrar açılamaz).
            </p>
          </div>
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>
              <strong>Alias tuzağı:</strong> kaynak aynı gün hem genel adı hem çeşidi gönderiyorsa (İzmir: &quot;ÜZÜM&quot; +
              &quot;ÜZÜM KAVACIK&quot;) çeşidi genel ürüne alias&apos;lamayın — iki satır aynı ürün+hal+tarihe düşer ve son
              satır öncekini ezer. Bu durumda Taslak kullanın. &quot;Birim bilinmiyor&quot; rozetiyse parser işidir:
              reddedip kaynağı geliştirme notuna ekleyin.
            </p>
          </div>
        </CardContent>
      </Card>
      {data?.sla && data.sla.overdue > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 pt-6">
            <AlertTriangle className="size-5 text-amber-600" />
            <div>
              <strong>{data.sla.overdue} kayıt 24 saat SLA’yı aştı.</strong>
              <p className="text-muted-foreground text-sm">En yaşlı bekleyen kayıt {data.sla.oldestHours} saat.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-5">
          <div>
            <Label htmlFor="review-search">Ürün</Label>
            <Input
              id="review-search"
              className="mt-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Levrek..."
            />
          </div>
          <div>
            <Label htmlFor="review-source">Kaynak</Label>
            <Input
              id="review-source"
              className="mt-2"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="izmir_balik"
            />
          </div>
          <div>
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ProductReviewStatus)}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Neden</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="UNKNOWN_PRODUCT">Bilinmeyen ürün</SelectItem>
                <SelectItem value="UNKNOWN_UNIT">Bilinmeyen birim</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 size-4 ${isFetching ? "animate-spin" : ""}`} />
              Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kayıtlar ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ham ürün</TableHead>
                  <TableHead>Kaynak</TableHead>
                  <TableHead>Fiyat / birim</TableHead>
                  <TableHead>Tekrar</TableHead>
                  <TableHead className="text-right">Karar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.rawName}</div>
                      <div className="text-muted-foreground text-xs">
                        {item.normalizedName} · {item.suggestedCategory}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{item.marketName ?? item.sourceApi}</div>
                      <div className="text-muted-foreground text-xs">
                        {item.sourceApi} · {String(item.recordedDate).slice(0, 10)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono">
                        ₺{money(item.avgPrice)} / {item.canonicalUnit ?? item.rawUnit ?? "?"}
                      </div>
                      <Badge variant={item.reasonCode === "UNKNOWN_UNIT" ? "destructive" : "secondary"}>
                        {item.reasonCode === "UNKNOWN_UNIT" ? "Birim bilinmiyor" : "Ürün bilinmiyor"}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.occurrenceCount} kez</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" onClick={() => choose(item, "alias")}>
                          <Link2 className="mr-1 size-3" />
                          Alias
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => choose(item, "create")}>
                          <PackagePlus className="mr-1 size-3" />
                          Taslak
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => choose(item, "reject")}>
                          <XCircle className="mr-1 size-3" />
                          Ret
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!isFetching && !data?.items.length && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Bu filtrelerde kayıt yok.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      {selected && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="text-base">{selected.rawName} için karar</CardTitle>
            <CardDescription>Ham gözlem ve fiyat kuyrukta audit kanıtı olarak kalır.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button variant={decision === "alias" ? "default" : "outline"} onClick={() => setDecision("alias")}>
                Alias bağla
              </Button>
              <Button variant={decision === "create" ? "default" : "outline"} onClick={() => setDecision("create")}>
                Pasif taslak oluştur
              </Button>
              <Button variant={decision === "reject" ? "destructive" : "outline"} onClick={() => setDecision("reject")}>
                Reddet
              </Button>
            </div>
            {decision === "alias" && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="target-search">Canonical ürün ara</Label>
                  <Input
                    id="target-search"
                    className="mt-2"
                    value={targetSearch}
                    onChange={(e) => {
                      setTargetSearch(e.target.value);
                      setTargetProductId(null);
                    }}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {(targets?.items ?? []).slice(0, 12).map((product) => (
                    <Button
                      key={product.id}
                      size="sm"
                      variant={targetProductId === product.id ? "default" : "outline"}
                      onClick={() => setTargetProductId(product.id)}
                    >
                      {product.displayName || product.nameTr} · {product.unit}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            {decision === "create" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Slug</Label>
                  <Input value={draft.slug} onChange={(e) => setDraft((v) => ({ ...v, slug: e.target.value }))} />
                </div>
                <div>
                  <Label>Ürün adı</Label>
                  <Input value={draft.nameTr} onChange={(e) => setDraft((v) => ({ ...v, nameTr: e.target.value }))} />
                </div>
                <div>
                  <Label>Kategori</Label>
                  <Input
                    value={draft.categorySlug}
                    onChange={(e) => setDraft((v) => ({ ...v, categorySlug: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Birim</Label>
                  <Input value={draft.unit} onChange={(e) => setDraft((v) => ({ ...v, unit: e.target.value }))} />
                </div>
                <p className="text-muted-foreground text-xs sm:col-span-2">
                  Yeni kayıt pasif ve noindex açılır; doğrulama sonrası ürün düzenleme ekranından aktive edilir.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="product-review-note">Karar notu</Label>
              <Textarea
                id="product-review-note"
                className="mt-2"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kaynak ve eşleme gerekçesi..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Vazgeç
              </Button>
              <Button onClick={submit} disabled={reviewState.isLoading}>
                {reviewState.isLoading ? "Kaydediliyor..." : "Kararı kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
