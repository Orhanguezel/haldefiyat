"use client";

import * as React from "react";
import { AlertTriangle, RefreshCw, RotateCcw, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { PriceQuarantineItem, PriceQuarantineStatus } from "@/integrations/endpoints/prices-admin-endpoints";
import {
  useListPriceQuarantineAdminQuery,
  usePreviewBulkPriceQuarantineAdminMutation,
  useReviewBulkPriceQuarantineAdminMutation,
  useReviewPriceQuarantineAdminMutation,
  useRollbackPriceQuarantineAdminMutation,
} from "@/integrations/hooks";

const reasonLabels: Record<string, string> = {
  NON_POSITIVE_PRICE: "Sıfır/negatif fiyat",
  MIN_GREATER_THAN_MAX: "Minimum maksimumdan büyük",
  AVG_OUTSIDE_RANGE: "Ortalama aralık dışında",
  ABSOLUTE_LIMIT: "Mutlak tavan aşıldı",
  PEER_MEDIAN_DEVIATION: "Emsal medyan sapması",
  PRODUCT_UNIT_MISMATCH: "Ürün birimiyle çelişiyor",
  UNKNOWN_PRODUCT_UNIT: "Tanınmayan ürün birimi",
};
const statusLabels: Record<PriceQuarantineStatus, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  corrected: "Düzeltildi",
  rolled_back: "Geri alındı",
};
const price = (value: string | null) =>
  value == null ? "—" : Number(value).toLocaleString("tr-TR", { maximumFractionDigits: 2 });

export default function PriceQuarantinePanel() {
  const [status, setStatus] = React.useState<PriceQuarantineStatus>("pending");
  const [severity, setSeverity] = React.useState("all");
  const [q, setQ] = React.useState("");
  const [source, setSource] = React.useState("");
  const [unit, setUnit] = React.useState("all");
  const [reason, setReason] = React.useState("all");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");
  const [selected, setSelected] = React.useState<PriceQuarantineItem | null>(null);
  const [decision, setDecision] = React.useState<"approve" | "reject" | "correct" | "rollback">("reject");
  const [note, setNote] = React.useState("");
  const [values, setValues] = React.useState({ min: "", avg: "", max: "" });
  const [confirmCritical, setConfirmCritical] = React.useState(false);
  const [bulkIds, setBulkIds] = React.useState<Set<number>>(new Set());
  const [bulkPreview, setBulkPreview] = React.useState<null | {
    decision: "approve" | "reject";
    previewToken: string;
    actionable: number;
    critical: number;
    warning: number;
  }>(null);
  const [bulkNote, setBulkNote] = React.useState("");
  const [confirmBulk, setConfirmBulk] = React.useState(false);
  const [confirmBulkCritical, setConfirmBulkCritical] = React.useState(false);
  const { data, isFetching, refetch } = useListPriceQuarantineAdminQuery({
    status,
    severity: severity === "all" ? undefined : (severity as "warning" | "critical"),
    q: q || undefined,
    source: source || undefined,
    unit: unit === "all" ? undefined : unit,
    reason: reason === "all" ? undefined : reason,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 100,
  });
  const [review, { isLoading }] = useReviewPriceQuarantineAdminMutation();
  const [rollback, rollbackState] = useRollbackPriceQuarantineAdminMutation();
  const [previewBulk, previewBulkState] = usePreviewBulkPriceQuarantineAdminMutation();
  const [reviewBulk, reviewBulkState] = useReviewBulkPriceQuarantineAdminMutation();

  function choose(item: PriceQuarantineItem, next: typeof decision) {
    setSelected(item);
    setDecision(next);
    setNote("");
    setConfirmCritical(false);
    setValues({ min: item.minPrice ?? "", avg: item.avgPrice, max: item.maxPrice ?? "" });
  }
  async function submit() {
    if (!selected || note.trim().length < 3) return toast.error("En az 3 karakterlik inceleme notu yazın.");
    if (decision === "rollback") {
      try {
        await rollback({ id: selected.id, note: note.trim(), confirmRollback: true }).unwrap();
        toast.success("Yayın kararı geri alındı ve önceki fiyat snapshot’ı geri yüklendi.");
        setSelected(null);
        await refetch();
      } catch (error) {
        toast.error((error as { data?: { error?: string } })?.data?.error || "Karar güvenle geri alınamadı.");
      }
      return;
    }
    if (selected.severity === "critical" && decision !== "reject" && !confirmCritical)
      return toast.error("Kritik kayıt için ikinci onay zorunlu.");
    if (decision === "correct" && (!Number.isFinite(Number(values.avg)) || Number(values.avg) <= 0))
      return toast.error("Geçerli ortalama fiyat girin.");
    try {
      await review({
        id: selected.id,
        decision,
        note: note.trim(),
        confirmCritical,
        ...(decision === "correct"
          ? {
              avgPrice: Number(values.avg),
              minPrice: values.min ? Number(values.min) : null,
              maxPrice: values.max ? Number(values.max) : null,
            }
          : {}),
      }).unwrap();
      toast.success("İnceleme kararı kaydedildi.");
      setSelected(null);
      await refetch();
    } catch {
      toast.error("Karar kaydedilemedi. Alanları ve yetkinizi kontrol edin.");
    }
  }

  function toggleBulk(id: number) {
    setBulkPreview(null);
    setConfirmBulk(false);
    setConfirmBulkCritical(false);
    setBulkIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function createBulkPreview(nextDecision: "approve" | "reject") {
    if (!bulkIds.size) return;
    try {
      const result = await previewBulk({ ids: [...bulkIds], decision: nextDecision }).unwrap();
      if (!result.actionable) return toast.error("Seçilen kayıtlarda bekleyen işlem yok.");
      setBulkPreview(result);
      setBulkNote("");
      setConfirmBulk(false);
      setConfirmBulkCritical(false);
    } catch {
      toast.error("Toplu ön izleme hazırlanamadı.");
    }
  }

  async function submitBulk() {
    if (!bulkPreview || bulkNote.trim().length < 3 || !confirmBulk)
      return toast.error("Karar notu ve toplu işlem onayı zorunlu.");
    if (bulkPreview.decision === "approve" && bulkPreview.critical > 0 && !confirmBulkCritical)
      return toast.error("Kritik kayıtlar için ikinci onay zorunlu.");
    try {
      const result = await reviewBulk({
        ids: [...bulkIds],
        decision: bulkPreview.decision,
        note: bulkNote.trim(),
        previewToken: bulkPreview.previewToken,
        confirmBulk: true,
        confirmCritical: confirmBulkCritical,
      }).unwrap();
      toast.success(`${result.reviewed} kayıt toplu olarak işlendi.`);
      setBulkIds(new Set());
      setBulkPreview(null);
      await refetch();
    } catch (error) {
      toast.error((error as { data?: { error?: string } })?.data?.error || "Kuyruk değişti; yeniden ön izleyin.");
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Fiyat inceleme kuyruğu</CardTitle>
          <CardDescription>
            Şüpheli fiyatları emsal medyanı ve sapma kanıtıyla inceleyin. Ham kayıt her kararda korunur.
          </CardDescription>
        </CardHeader>
      </Card>
      {data?.sla && (data.sla.overdue > 0 || data.sla.criticalOverdue > 0) && (
        <Card className="border-red-500/40 bg-red-500/5">
          <CardContent className="flex items-start gap-3 pt-6">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-red-600" />
            <div>
              <strong>Karantina SLA alarmı:</strong> {data.sla.criticalOverdue} kritik kayıt {data.sla.criticalHours}
              saati, {data.sla.overdue} kayıt {data.sla.queueHours} saati aştı.
              <p className="text-xs text-muted-foreground">En yaşlı bekleyen kayıt {data.sla.oldestHours} saat.</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-4">
          <div>
            <Label htmlFor="queue-search">Ürün veya hal</Label>
            <Input
              id="queue-search"
              className="mt-2"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Domates, Antalya..."
            />
          </div>
          <div>
            <Label>Durum</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PriceQuarantineStatus)}>
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
            <Label>Önem</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="critical">Kritik</SelectItem>
                <SelectItem value="warning">Uyarı</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="source-filter">Kaynak</Label>
            <Input
              id="source-filter"
              className="mt-2"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="izmir_sebzemeyve"
            />
          </div>
          <div>
            <Label>Birim</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                {["kg", "adet", "kasa", "koli", "bag", "demet", "ton"].map((v) => (
                  <SelectItem key={v} value={v}>
                    {v}
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
                {Object.entries(reasonLabels).map(([v, l]) => (
                  <SelectItem key={v} value={v}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="date-from">Başlangıç tarihi</Label>
            <Input
              id="date-from"
              className="mt-2"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">Bitiş tarihi</Label>
            <Input
              id="date-to"
              className="mt-2"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
              Yenile
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setQ("");
                setSource("");
                setUnit("all");
                setReason("all");
                setSeverity("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Temizle
            </Button>
          </div>
        </CardContent>
      </Card>
      {status === "pending" && bulkIds.size > 0 && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">Toplu karar · {bulkIds.size} kayıt seçildi</CardTitle>
            <CardDescription>
              Ön izleme kuyruğun güncel snapshot’ını kilitler; uygulama anında değişmişse işlem tamamen iptal edilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => createBulkPreview("approve")}
                disabled={previewBulkState.isLoading}
              >
                Onay ön izlemesi
              </Button>
              <Button
                variant="destructive"
                onClick={() => createBulkPreview("reject")}
                disabled={previewBulkState.isLoading}
              >
                Ret ön izlemesi
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setBulkIds(new Set());
                  setBulkPreview(null);
                }}
              >
                Seçimi temizle
              </Button>
            </div>
            {bulkPreview && (
              <div className="space-y-3 rounded-md border p-4">
                <p>
                  <strong>{bulkPreview.actionable} kayıt:</strong> {bulkPreview.warning} uyarı, {bulkPreview.critical}{" "}
                  kritik · karar: {bulkPreview.decision === "approve" ? "yayınla" : "reddet"}
                </p>
                <div>
                  <Label htmlFor="bulk-note">Toplu karar notu</Label>
                  <Textarea
                    id="bulk-note"
                    className="mt-2"
                    value={bulkNote}
                    onChange={(e) => setBulkNote(e.target.value)}
                  />
                </div>
                <label className="flex items-start gap-2 text-sm">
                  <Checkbox checked={confirmBulk} onCheckedChange={(v) => setConfirmBulk(v === true)} />
                  <span>Ön izlenen kayıt ve kararı toplu uygulamayı onaylıyorum.</span>
                </label>
                {bulkPreview.decision === "approve" && bulkPreview.critical > 0 && (
                  <label className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300">
                    <Checkbox
                      checked={confirmBulkCritical}
                      onCheckedChange={(v) => setConfirmBulkCritical(v === true)}
                    />
                    <span>{bulkPreview.critical} kritik kaydı kaynaklarıyla ikinci kez kontrol ettim.</span>
                  </label>
                )}
                <Button onClick={submitBulk} disabled={reviewBulkState.isLoading}>
                  {reviewBulkState.isLoading ? "Uygulanıyor..." : "Toplu kararı uygula"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kayıtlar ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {status === "pending" && (
                    <TableHead className="w-10">
                      <span className="sr-only">Seç</span>
                    </TableHead>
                  )}
                  <TableHead>Ürün / Hal</TableHead>
                  <TableHead>Fiyat</TableHead>
                  <TableHead>Kanıt</TableHead>
                  <TableHead>Önem</TableHead>
                  <TableHead className="text-right">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((item) => (
                  <TableRow key={item.id}>
                    {status === "pending" && (
                      <TableCell>
                        <Checkbox
                          checked={bulkIds.has(item.id)}
                          onCheckedChange={() => toggleBulk(item.id)}
                          aria-label={`${item.productName} kaydını seç`}
                        />
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">
                        {item.productName} · {item.unit}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {item.marketName} · {String(item.recordedDate).slice(0, 10)} · {item.sourceApi}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-semibold">₺{price(item.avgPrice)}</div>
                      <div className="text-xs text-muted-foreground">
                        {price(item.minPrice)}–{price(item.maxPrice)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{reasonLabels[item.reasonCode] ?? item.reasonCode}</div>
                      <div className="text-xs text-muted-foreground">
                        Medyan ₺{price(item.peerMedian)} ·{" "}
                        {item.deviationRatio ? `${Number(item.deviationRatio).toFixed(2)}x` : "—"} · güven %
                        {Math.round(Number(item.confidence) * 100)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.severity === "critical" ? "destructive" : "secondary"}>
                        {item.severity === "critical" ? "Kritik" : "Uyarı"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.status === "pending" ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => choose(item, "approve")}>
                            Onayla
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => choose(item, "correct")}>
                            Düzelt
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => choose(item, "reject")}>
                            Reddet
                          </Button>
                        </div>
                      ) : item.status === "approved" || item.status === "corrected" ? (
                        <Button size="sm" variant="outline" onClick={() => choose(item, "rollback")}>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Geri al
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">{statusLabels[item.status]}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!isFetching && !data?.items.length && (
                  <TableRow>
                    <TableCell
                      colSpan={status === "pending" ? 6 : 5}
                      className="py-12 text-center text-muted-foreground"
                    >
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
        <Card className="border-amber-500/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              {selected.severity === "critical" ? (
                <ShieldAlert className="h-5 w-5 text-red-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              )}
              {selected.productName} için karar
            </CardTitle>
            <CardDescription>
              Orijinal değer karantinada kalır; yayın kararı kullanıcı, not ve zamanla kaydedilir.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {decision !== "rollback" && (
              <div className="flex flex-wrap gap-2">
                <Button variant={decision === "approve" ? "default" : "outline"} onClick={() => setDecision("approve")}>
                  Onayla
                </Button>
                <Button variant={decision === "correct" ? "default" : "outline"} onClick={() => setDecision("correct")}>
                  Düzelterek yayınla
                </Button>
                <Button
                  variant={decision === "reject" ? "destructive" : "outline"}
                  onClick={() => setDecision("reject")}
                >
                  Reddet
                </Button>
              </div>
            )}
            {decision === "rollback" && (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3 text-sm">
                Bu işlem karar snapshot’ından önceki fiyatı geri yükler; fiyat sonradan değiştiyse güvenlik için
                reddedilir.
              </p>
            )}
            {decision === "correct" && (
              <div className="grid gap-3 sm:grid-cols-3">
                {(["min", "avg", "max"] as const).map((key) => (
                  <div key={key}>
                    <Label>{key === "min" ? "Minimum" : key === "avg" ? "Ortalama" : "Maksimum"}</Label>
                    <Input
                      value={values[key]}
                      onChange={(e) => setValues((v) => ({ ...v, [key]: e.target.value }))}
                      inputMode="decimal"
                    />
                  </div>
                ))}
              </div>
            )}
            <div>
              <Label htmlFor="review-note">İnceleme notu</Label>
              <Textarea
                id="review-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Kararın veri ve kaynak gerekçesi..."
                className="mt-2"
              />
            </div>
            {selected.severity === "critical" && decision !== "reject" && decision !== "rollback" && (
              <label className="flex items-start gap-3 rounded-md border border-red-500/30 bg-red-500/5 p-3 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={confirmCritical}
                  onChange={(e) => setConfirmCritical(e.target.checked)}
                />
                <span>
                  <strong>Kritik yayın onayı:</strong> Kaynak ve emsal değerleri ikinci kez kontrol ettim.
                </span>
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Vazgeç
              </Button>
              <Button onClick={submit} disabled={isLoading || rollbackState.isLoading}>
                {isLoading || rollbackState.isLoading
                  ? "Kaydediliyor..."
                  : decision === "rollback"
                    ? "Geri almayı onayla"
                    : "Kararı kaydet"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
