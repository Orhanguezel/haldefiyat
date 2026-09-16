"use client";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { AD_FORMATS, adSlotProfile } from "../../../../../../../../shared/banner-layout.mjs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { TranslateFn } from "@/i18n";
import type { AdSlotAdmin, AdSlotAvailability } from "@/integrations/endpoints/banners-admin-endpoints";
import { useUpdateAdSlotAdminMutation } from "@/integrations/hooks";
import { errorMessage, money } from "../_lib/banner-meta";

const MULTIPLIERS = [
  ["trafficMultiplier", "Ziyaret yoğunluğu"],
  ["visibilityMultiplier", "Alanın görünürlüğü"],
  ["desktopMultiplier", "Masaüstü fiyat çarpanı"],
  ["mobileMultiplier", "Mobil fiyat çarpanı"],
] as const;
const GROUPS: Record<string, string> = {
  global: "Tüm sayfalar",
  home: "Ana sayfa",
  prices: "Fiyatlar",
  analysis: "Analiz",
  product: "Ürün",
  market: "Hal",
  listing: "İlan",
  firm: "Firma",
};
export function SlotsPanel({
  slots,
  availability,
}: {
  slots: AdSlotAdmin[];
  availability: AdSlotAvailability[];
  t: TranslateFn;
}) {
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("all");
  const [editing, setEditing] = useState<AdSlotAdmin | null>(null);
  const visible = slots.filter(
    (s) =>
      (group === "all" || s.pageType === group) &&
      `${s.label} ${s.placementDescription}`.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Reklam alanları</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Reklamın sitede nerede görüneceğini seçin. Fiyat ve satış ayarlarını alan bazında düzenleyin.
          </p>
        </div>
        <span className="text-sm text-muted-foreground">
          {slots.length} alan · {slots.filter((s) => s.isActive).length} satışa açık
        </span>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor="slot-search" className="mb-1.5 block text-sm font-medium">
            Alan ara
          </label>
          <Input
            id="slot-search"
            placeholder="Örn. ana sayfa, firma, fiyatlar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="sm:w-52">
          <label htmlFor="slot-group" className="mb-1.5 block text-sm font-medium">
            Sayfa türü
          </label>
          <select
            id="slot-group"
            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
          >
            <option value="all">Tüm sayfa türleri</option>
            {[...new Set(slots.map((s) => s.pageType))].map((k) => (
              <option key={k} value={k}>
                {GROUPS[k] || k}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {visible.map((slot) => {
          const profile = adSlotProfile(slot.slotKey),
            avail = availability.find((a) => a.slotKey === slot.slotKey);
          const occupied =
            avail && avail.capacity ? Math.min(100, Math.round((avail.occupied / avail.capacity) * 100)) : null;
          return (
            <article key={slot.slotKey} className="flex min-w-0 flex-col rounded-xl border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">{GROUPS[slot.pageType] || slot.pageType}</p>
                  <h3 className="mt-1 font-semibold">
                    {slot.label.replace("footer üstü", "sayfa sonu").replace("ticker altı", "fiyat bandının altı")}
                  </h3>
                </div>
                <Badge variant={slot.isActive ? "secondary" : "outline"} className="shrink-0">
                  {slot.isActive ? "Satışa açık" : "Yeni satışa kapalı"}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{slot.placementDescription}</p>
              <div className="my-4 flex flex-wrap gap-1.5">
                {profile.formats.map((f) => (
                  <Badge variant="outline" className="font-normal" key={f}>
                    {AD_FORMATS[f].label}
                  </Badge>
                ))}
              </div>
              <div className="mt-auto grid gap-4 rounded-lg bg-muted/40 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Günlük baz fiyat</p>
                  <p className="mt-1 text-xl font-semibold tabular-nums">{money(slot.baseDailyPrice)}</p>
                  <p className="text-xs text-muted-foreground">Bir tam satır için, çarpanlar öncesi</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Bugünkü yer durumu</p>
                  <p className="mt-1 text-sm font-medium">
                    {occupied === null ? "Bilgi bekleniyor" : avail!.available > 0 ? "Yer var" : "Alan dolu"}
                  </p>
                  {occupied !== null ? (
                    <>
                      <div
                        className="my-2 h-1.5 overflow-hidden rounded-full bg-border"
                        role="meter"
                        aria-label="Alan doluluğu"
                        aria-valuenow={occupied}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div className="h-full bg-primary" style={{ width: `${occupied}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        %{occupied} dolu · Uygunluk tarih ve formata göre kontrol edilir.
                      </p>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(slot)}>
                  Fiyat ve ayarlar
                </Button>
                {slot.isActive ? (
                  <Button size="sm" asChild>
                    <Link href={`/admin/banners/new?position=${slot.slotKey}`}>Bu alana reklam ekle</Link>
                  </Button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      {!visible.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
          Bu aramaya uygun reklam alanı yok.
          <Button
            variant="link"
            onClick={() => {
              setQuery("");
              setGroup("all");
            }}
          >
            Filtreleri temizle
          </Button>
        </div>
      ) : null}
      {editing ? <SlotEditor key={editing.slotKey} slot={editing} close={() => setEditing(null)} /> : null}
    </div>
  );
}
function SlotEditor({ slot, close }: { slot: AdSlotAdmin; close: () => void }) {
  const [draft, setDraft] = useState({ ...slot, isActive: !!slot.isActive });
  const [update, { isLoading }] = useUpdateAdSlotAdminMutation();
  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      await update({
        slotKey: slot.slotKey,
        patch: {
          isActive: draft.isActive,
          baseDailyPrice: draft.baseDailyPrice,
          ...Object.fromEntries(MULTIPLIERS.map(([key]) => [key, draft[key]])),
        },
      }).unwrap();
      toast.success("Reklam alanı ayarları kaydedildi.");
      close();
    } catch (error) {
      toast.error(errorMessage(error, "Ayarlar kaydedilemedi. Yeniden deneyin."));
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isLoading) close();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{slot.label}</DialogTitle>
          <DialogDescription>Değişiklikler yalnız “Kaydet” ile uygulanır.</DialogDescription>
        </DialogHeader>
        <form onSubmit={save}>
          <fieldset disabled={isLoading} className="space-y-5">
            <label className="flex items-start gap-3 rounded-lg border p-3">
              <input
                type="checkbox"
                className="mt-1 size-4"
                checked={draft.isActive}
                onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium">Yeni reklam satışına açık</span>
                <span className="text-xs text-muted-foreground">
                  Bu alanın yeni kampanyalarda seçilebilmesini belirler.
                </span>
              </span>
            </label>
            <div>
              <label htmlFor="slot-base" className="mb-2 block text-sm font-medium">
                Günlük baz fiyat (₺)
              </label>
              <Input
                id="slot-base"
                type="number"
                min="0.01"
                max="100000"
                step="0.01"
                required
                value={draft.baseDailyPrice}
                onChange={(e) => setDraft({ ...draft, baseDailyPrice: e.target.value })}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Bir tam satırın başlangıç fiyatı. Nihai teklif; format, süre, cihaz ve diğer çarpanlarla hesaplanır.
              </p>
            </div>
            <details className="rounded-lg border p-3">
              <summary className="cursor-pointer text-sm font-medium">Gelişmiş fiyat çarpanları</summary>
              <p className="my-3 text-xs text-muted-foreground">
                1,00 fiyatı değiştirmez. 1,20 ilgili fiyat bileşenini %20 artırır. Geçerli aralık: 0,10–10.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {MULTIPLIERS.map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-xs font-medium" htmlFor={`slot-${key}`}>
                      {label}
                    </label>
                    <Input
                      id={`slot-${key}`}
                      type="number"
                      min="0.1"
                      max="10"
                      step="0.01"
                      required
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </details>
            <p className="text-xs text-muted-foreground">
              Mobilde reklamlar alt alta gösterilir.{" "}
              {slot.deliveryMode === "fixed"
                ? "Masaüstünde reklamın konumu sabittir."
                : "Aynı konumdaki uygun reklamlar dönüşümlü gösterilir."}
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Vazgeç
              </Button>
              <Button type="submit">{isLoading ? "Kaydediliyor…" : "Kaydet"}</Button>
            </DialogFooter>
          </fieldset>
        </form>
      </DialogContent>
    </Dialog>
  );
}
