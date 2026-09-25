"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  BellRing,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Clipboard,
  Clock3,
  Landmark,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { api } from "../_lib/api";

type Bank = { bankName: string; accountHolder: string; iban: string };
type Transfer = {
  id: string;
  reference: string;
  listingId: number;
  title: string;
  days: number;
  amount: number;
  status: string;
  cancelled: boolean;
  senderName?: string;
  transferDate?: string;
  note?: string;
  reviewNote?: string;
  createdAt: string;
  reportedAt?: string;
  reviewedAt?: string;
  featuredUntil?: string;
};

const emptyBank = { bankName: "", accountHolder: "", iban: "" };
const money = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" });
const dateTime = new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short" });

function transferState(item: Transfer) {
  if (item.cancelled) return "cancelled" as const;
  if (item.status === "paid") return "paid" as const;
  if (item.status === "pending") return "reported" as const;
  return "waiting" as const;
}

function readableDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTime.format(date);
}

function SummaryItem({
  icon,
  label,
  value,
  emphasis = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`flex min-w-44 items-center gap-3 rounded-lg border px-4 py-3 ${emphasis ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30" : "bg-card"}`}
    >
      <span className={emphasis ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground"}>{icon}</span>
      <div>
        <p className="font-semibold text-2xl tabular-nums leading-none">{value}</p>
        <p className="mt-1 text-muted-foreground text-xs">{label}</p>
      </div>
    </div>
  );
}

function TransferCard({
  item,
  busy,
  onReview,
  onCopy,
}: {
  item: Transfer;
  busy: boolean;
  onReview: (item: Transfer, action: "approve" | "reject", form: HTMLFormElement) => void;
  onCopy: (reference: string) => void;
}) {
  const state = transferState(item);
  const isReported = state === "reported";
  const title =
    state === "reported"
      ? "Banka kontrolü gerekiyor"
      : state === "waiting"
        ? "Üye henüz “Havaleyi gönderdim” demedi"
        : state === "paid"
          ? "Ödeme onaylandı, ilan öne çıkarıldı"
          : "Talep kapatıldı / reddedildi";

  return (
    <Card
      className={
        isReported
          ? "gap-4 border-amber-300 bg-amber-50/40 py-5 shadow-sm dark:border-amber-800 dark:bg-amber-950/20"
          : "gap-4 py-5"
      }
    >
      <CardHeader className="gap-3 px-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={state === "cancelled" ? "destructive" : state === "paid" ? "default" : "outline"}
              className={
                isReported
                  ? "border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-900/50 dark:text-amber-100"
                  : undefined
              }
            >
              {isReported ? (
                <BellRing />
              ) : state === "waiting" ? (
                <Clock3 />
              ) : state === "paid" ? (
                <CheckCircle2 />
              ) : (
                <XCircle />
              )}
              {title}
            </Badge>
            <span className="text-muted-foreground text-xs">Talep: {readableDate(item.createdAt)}</span>
          </div>
          <CardTitle className="text-base leading-snug">
            #{item.listingId} · {item.title}
          </CardTitle>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="font-semibold text-lg tabular-nums">{money.format(item.amount)}</p>
          <p className="text-muted-foreground text-sm">{item.days} günlük öne çıkarma</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 px-5">
        {isReported && (
          <Alert className="border-amber-300 bg-white/80 dark:border-amber-800 dark:bg-background/70">
            <ShieldCheck />
            <AlertTitle>Üye yalnızca ödeme yaptığını bildirdi; bu ödeme kanıtı değildir.</AlertTitle>
            <AlertDescription>
              Banka hareketinde göndereni, <strong>{money.format(item.amount)}</strong> tutarı ve aşağıdaki açıklama
              kodunu eşleştirin.
            </AlertDescription>
          </Alert>
        )}
        {state === "waiting" && (
          <Alert>
            <CircleDashed />
            <AlertTitle>Şu an sizden işlem beklenmiyor.</AlertTitle>
            <AlertDescription>Üye paketi seçmiş ancak havaleyi gönderdiğini henüz bildirmemiş.</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 rounded-lg border bg-background p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-medium text-muted-foreground text-xs">Açıklama kodu</p>
            <div className="mt-1 flex items-center gap-2">
              <code className="min-w-0 break-all font-semibold text-xs">{item.reference}</code>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Açıklama kodunu kopyala"
                onClick={() => onCopy(item.reference)}
              >
                <Clipboard />
              </Button>
            </div>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs">Gönderen</p>
            <p className="mt-1 font-medium text-sm">{item.senderName || "Henüz bildirilmedi"}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs">Üyenin transfer tarihi</p>
            <p className="mt-1 font-medium text-sm">{item.transferDate || "Henüz bildirilmedi"}</p>
          </div>
          <div>
            <p className="font-medium text-muted-foreground text-xs">Ödeme bildirimi</p>
            <p className="mt-1 font-medium text-sm">{readableDate(item.reportedAt)}</p>
          </div>
        </div>

        {item.note && (
          <p className="rounded-md bg-muted px-3 py-2 text-sm">
            <strong>Üye notu:</strong> {item.note}
          </p>
        )}
        {item.reviewNote && (
          <p className="text-muted-foreground text-sm">
            <strong>Kontrol notu:</strong> {item.reviewNote}
          </p>
        )}

        {isReported && (
          <form
            className="space-y-3 rounded-lg border border-amber-300 bg-background p-4 dark:border-amber-800"
            onSubmit={(event) => {
              event.preventDefault();
              onReview(item, "approve", event.currentTarget);
            }}
          >
            <div>
              <p className="font-medium">Banka kontrolü sonucu</p>
              <p className="text-muted-foreground text-sm">Yazdığınız not üye tarafından da görülür.</p>
            </div>
            <Textarea
              name="reviewNote"
              aria-label={`İlan ${item.listingId} kontrol notu`}
              placeholder="Örn. 2.000 TL, gönderen ve açıklama kodu banka hesabında doğrulandı."
              minLength={3}
              maxLength={500}
              required
              disabled={busy}
            />
            <label
              htmlFor={`verified-${item.id}`}
              className="flex min-h-11 items-start gap-3 rounded-md border p-3 text-sm"
            >
              <Checkbox id={`verified-${item.id}`} name="verified" disabled={busy} className="mt-0.5" />
              <span>Tutarın şirket hesabına geçtiğini, göndereni ve açıklama kodunu bankadan kontrol ettim.</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={busy}>
                <CheckCircle2 /> Ödemeyi onayla ve ilanı öne çıkar
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={(event) => {
                  const form = event.currentTarget.closest("form");
                  if (form) onReview(item, "reject", form);
                }}
              >
                <XCircle /> Talebi reddet
              </Button>
            </div>
          </form>
        )}

        {state === "waiting" && (
          <details className="group rounded-lg border px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-sm">
              Bu talebi kapat / reddet
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <form
              className="mt-3 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                onReview(item, "reject", event.currentTarget);
              }}
            >
              <Textarea
                name="reviewNote"
                aria-label={`İlan ${item.listingId} ret notu`}
                placeholder="Üyenin göreceği kapatma nedenini yazın."
                minLength={3}
                maxLength={500}
                required
                disabled={busy}
              />
              <Button type="submit" variant="outline" disabled={busy}>
                <XCircle /> Talebi reddet
              </Button>
            </form>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export function FeatureTransfersPanel() {
  const [items, setItems] = useState<Transfer[]>([]);
  const [bank, setBank] = useState<Bank>(emptyBank);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const res = await api("/admin/listings/feature-transfers");
      if (!res.ok) throw new Error("Havale talepleri yüklenemedi.");
      setItems((await res.json()).items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
    void (async () => {
      try {
        const response = await api("/admin/listings/feature-bank");
        if (response.ok) setBank((await response.json()).bank ?? emptyBank);
      } catch {
        setError("Banka bilgileri yüklenemedi.");
      }
    })();
  }, [load]);

  const groups = useMemo(
    () => ({
      reported: items.filter((item) => transferState(item) === "reported"),
      waiting: items.filter((item) => transferState(item) === "waiting"),
      completed: items.filter((item) => ["paid", "cancelled"].includes(transferState(item))),
    }),
    [items],
  );

  async function saveBank() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api("/admin/listings/feature-bank", { method: "PUT", body: JSON.stringify(bank) });
      if (!response.ok) throw new Error("Banka bilgileri kaydedilemedi. Ünvan ve geçerli TR IBAN kontrol edin.");
      setBank((await response.json()).bank);
      setMessage("Banka bilgileri kaydedildi. Yeni taleplerde kullanılacak.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function review(item: Transfer, action: "approve" | "reject", form: HTMLFormElement) {
    const formData = new FormData(form);
    const note = String(formData.get("reviewNote") ?? "").trim();
    if (note.length < 3) {
      setError("En az 3 karakterlik kontrol / ret notu yazın.");
      return;
    }
    const verified = formData.get("verified") === "on";
    if (action === "approve" && !verified) {
      setError("Banka hesabına gelen tutarı kontrol ettiğinizi onaylayın.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await api(`/admin/listings/feature-transfers/${item.id}/review`, {
        method: "POST",
        body: JSON.stringify({ action, reviewNote: note, paymentVerified: verified }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message ?? "Talep güncellenemedi.");
      setMessage(
        action === "approve"
          ? "Ödeme onaylandı ve ilan öne çıkarıldı."
          : "Talep reddedildi. Bankadan para iadesi yapılmadı.",
      );
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  async function copyReference(reference: string) {
    try {
      await navigator.clipboard.writeText(reference);
      setMessage("Açıklama kodu kopyalandı.");
      setError("");
    } catch {
      setError("Açıklama kodu kopyalanamadı.");
    }
  }

  return (
    <div id="havale-talepleri" className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-lg">İlan öne çıkarma ödemeleri</h2>
          <p className="mt-1 text-muted-foreground text-sm">
            Yalnız “banka kontrolü gerekiyor” bölümündeki kayıtlar sizden işlem bekler.
          </p>
        </div>
        <Button variant="outline" disabled={busy} onClick={() => void load()}>
          <RefreshCw className={busy ? "animate-spin" : ""} /> Yenile
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SummaryItem
          icon={<BellRing className="size-5" />}
          label="Banka kontrolü gerekiyor"
          value={groups.reported.length}
          emphasis
        />
        <SummaryItem
          icon={<Clock3 className="size-5" />}
          label="Üyenin havalesi bekleniyor"
          value={groups.waiting.length}
        />
        <SummaryItem
          icon={<CheckCircle2 className="size-5" />}
          label="Sonuçlanmış kayıt"
          value={groups.completed.length}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle />
          <AlertTitle>İşlem tamamlanamadı</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {message && (
        <Alert>
          <CheckCircle2 />
          <AlertTitle>İşlem tamamlandı</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      <details className="group rounded-lg border bg-card px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between">
          <span className="flex items-center gap-2 font-medium">
            <Landmark className="size-4" /> Üyeye gösterilen havale hesabı
          </span>
          <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
        </summary>
        <form
          className="mt-4 grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void saveBank();
          }}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <label htmlFor="feature-bank-name" className="space-y-1 text-sm">
              Banka
              <Input
                id="feature-bank-name"
                value={bank.bankName}
                required
                onChange={(event) => setBank({ ...bank, bankName: event.target.value })}
              />
            </label>
            <label htmlFor="feature-account-holder" className="space-y-1 text-sm">
              Alıcı ünvanı
              <Input
                id="feature-account-holder"
                value={bank.accountHolder}
                required
                onChange={(event) => setBank({ ...bank, accountHolder: event.target.value })}
              />
            </label>
            <label htmlFor="feature-bank-iban" className="space-y-1 text-sm">
              IBAN
              <Input
                id="feature-bank-iban"
                value={bank.iban}
                required
                onChange={(event) => setBank({ ...bank, iban: event.target.value })}
              />
            </label>
          </div>
          <Button type="submit" className="w-fit" disabled={busy}>
            Banka bilgilerini kaydet
          </Button>
        </form>
      </details>

      {!items.length && (
        <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground text-sm">
          {busy ? "Havale talepleri yükleniyor…" : "Henüz havale talebi yok."}
        </div>
      )}

      {groups.reported.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BellRing className="size-5 text-amber-700" />
            <h3 className="font-semibold">Banka kontrolü gerekiyor</h3>
            <Badge variant="outline">{groups.reported.length}</Badge>
          </div>
          {groups.reported.map((item) => (
            <TransferCard
              key={item.id}
              item={item}
              busy={busy}
              onReview={review}
              onCopy={(reference) => void copyReference(reference)}
            />
          ))}
        </section>
      )}

      {groups.waiting.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-muted-foreground" />
            <h3 className="font-semibold">Üyenin havalesi bekleniyor</h3>
            <Badge variant="outline">{groups.waiting.length}</Badge>
          </div>
          {groups.waiting.map((item) => (
            <TransferCard
              key={item.id}
              item={item}
              busy={busy}
              onReview={review}
              onCopy={(reference) => void copyReference(reference)}
            />
          ))}
        </section>
      )}

      {groups.completed.length > 0 && (
        <details className="group rounded-lg border bg-card px-5 py-4">
          <summary className="flex cursor-pointer list-none items-center justify-between">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4" /> Sonuçlanmış kayıtlar ({groups.completed.length})
            </span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="mt-4 space-y-3">
            {groups.completed.map((item) => (
              <TransferCard
                key={item.id}
                item={item}
                busy={busy}
                onReview={review}
                onCopy={(reference) => void copyReference(reference)}
              />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
