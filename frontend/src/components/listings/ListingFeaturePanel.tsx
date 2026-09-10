"use client";

import { useState } from "react";
import type { Listing } from "@/lib/api";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Bank = { bankName: string; accountHolder: string; iban: string };
type Transfer = { id: string; reference: string; amount: number; status: string; cancelled: boolean; days: number; bank: Bank; reviewNote?: string; featuredUntil?: string };
type Result = { bank: Bank | null; pricing: Record<string, {days:number;price:number}> | null; items: Transfer[] };
const money = (amount: number) => `${amount.toLocaleString("tr-TR", {minimumFractionDigits:2,maximumFractionDigits:2})} TL`;
function errorMessage(error: unknown) {
  if (error instanceof ApiError) return (error.details as {error?:{message?:string}})?.error?.message ?? "İşlem tamamlanamadı. Tekrar deneyin.";
  return "Bağlantı kurulamadı. Tekrar deneyin.";
}
export function ListingFeaturePanel({item}:{item:Listing}) {
  const [data,setData] = useState<Result | null>(null);
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const [copied,setCopied] = useState("");
  const active = data?.items.find(order => !order.cancelled && ["unpaid","pending"].includes(order.status));
  async function load() {
    setBusy(true); setError("");
    try { setData(await apiGet<Result>(`/listings/${item.id}/feature-transfer`)); }
    catch(e) { setError(errorMessage(e)); } finally {setBusy(false);}
  }
  async function action(path:string,body:unknown) {
    setBusy(true); setError("");
    try { await apiPost(path,body); await load(); }
    catch(e) { setError(errorMessage(e)); } finally {setBusy(false);}
  }
  async function copy(value:string,label:string) {
    try {await navigator.clipboard.writeText(value);setCopied(`${label} kopyalandı.`);} catch {setCopied("Kopyalanamadı; metni seçerek kopyalayabilirsiniz.");}
  }
  return <details className="border-t border-(--color-border-soft) p-4" onToggle={e => {if(e.currentTarget.open && !data && !busy) void load();}}>
    <summary className="min-h-11 cursor-pointer rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-semibold text-amber-950">İlanı öne çıkar · Havale / EFT</summary>
    <div className="mt-4 space-y-4">
      <p className="text-sm leading-6 text-(--color-muted)">İlanınız seçtiğiniz süre boyunca ilan listesinde öncelikli ve sponsorlu olarak gösterilir. Süre, havaleniz kontrol edilip onaylandığında başlar. Satış veya teklif garantisi verilmez.</p>
      {error && <p role="alert" className="text-sm text-(--color-danger)">{error}</p>}
      {busy && <p role="status" className="text-sm">İşlem yapılıyor…</p>}
      <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void load()}>Ödeme durumunu yenile</Button>
      {data && !active && <>
        {!data.bank || !data.pricing ? <p className="text-sm">Havale bilgileri hazırlanıyor. Lütfen daha sonra tekrar deneyin.</p> : <>
          {(item.status !== "approved" || Boolean(item.visibilityReason)) && <p className="text-sm">Öne çıkarmak için ilanınızın yayında olması gerekir.</p>}
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(data.pricing).map(([key,pkg]) => {
              const start = item.isFeatured && item.featuredUntil ? Math.max(Date.now(),new Date(item.featuredUntil).getTime()) : Date.now();
              const fits = start + pkg.days*86400000 <= new Date(`${item.validUntil?.slice(0,10)}T23:59:59.999Z`).getTime();
              return <div key={key} className="space-y-3 rounded-lg border border-(--color-border) p-3">
                <p className="font-semibold">{pkg.days} gün</p><p className="text-lg font-bold">{money(pkg.price)}</p>
                <Button type="button" className="w-full" disabled={busy || (item.status !== "approved" || Boolean(item.visibilityReason)) || !fits || pkg.price <= 0} onClick={() => void action(`/listings/${item.id}/feature-transfer`,{package:key})}>Paketi seç</Button>
                {!fits && <p className="text-xs text-(--color-muted)">Bu paket için önce ilanınızın son tarihini uzatın.</p>}
              </div>;
            })}
          </div>
        </>}
      </>}
      {active && <div className="space-y-4 rounded-lg border border-(--color-border) bg-(--color-bg-alt) p-4">
        <h4 className="font-semibold">{active.days} gün öne çıkarma · {money(active.amount)}</h4>
        {active.status === "pending" ? <p role="status" className="text-sm">Ödeme bildiriminiz alındı. Banka kontrolünden sonra ilanınız öne çıkarılacak. Yeniden havale yapmayın.</p> : <>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-(--color-muted)">Banka</dt><dd>{active.bank.bankName}</dd></div>
            <div><dt className="text-(--color-muted)">Alıcı</dt><dd className="break-words font-medium">{active.bank.accountHolder}</dd></div>
            <div><dt className="text-(--color-muted)">IBAN</dt><dd className="break-all font-mono">{active.bank.iban.replace(/(.{4})/g,"$1 ").trim()}</dd><Button type="button" size="sm" variant="secondary" onClick={() => void copy(active.bank.iban,"IBAN")}>IBAN kopyala</Button></div>
            <div><dt className="text-(--color-muted)">Havale açıklaması</dt><dd className="break-all font-mono">{active.reference}</dd><Button type="button" size="sm" variant="secondary" onClick={() => void copy(active.reference,"Açıklama")}>Açıklamayı kopyala</Button></div>
          </dl>
          {copied && <p role="status" className="text-xs">{copied}</p>}
          <p className="text-sm">Tam olarak <strong>{money(active.amount)}</strong> gönderin; açıklamaya yukarıdaki kodu yazın. Ardından aşağıdan bildirin.</p>
          <form className="space-y-3" onSubmit={e => {e.preventDefault(); const fd=new FormData(e.currentTarget); void action(`/listings/feature-transfers/${active.id}/report`,{action:"report",senderName:fd.get("senderName"),transferDate:fd.get("transferDate") || undefined,note:fd.get("note")});}}>
            <Input label="Havaleyi gönderen ad soyad / şirket" name="senderName" required minLength={2} maxLength={255} disabled={busy} />
            <Input label="Havale tarihi (isteğe bağlı)" name="transferDate" type="date" max={new Date().toISOString().slice(0,10)} disabled={busy} />
            <Input label="Ödeme notu (isteğe bağlı)" name="note" maxLength={500} disabled={busy} />
            <Button type="submit" disabled={busy}>Havaleyi yaptım, bildir</Button>
          </form>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void action(`/listings/feature-transfers/${active.id}/report`,{action:"cancel"})}>Henüz ödemedim, paket seçimini iptal et</Button>
        </>}
      </div>}
      {data?.items.filter(order => order !== active).slice(0,3).map(order => <div key={order.id} className="rounded-lg border border-(--color-border) p-3 text-sm">
        <strong>{order.days} gün · {money(order.amount)}</strong>
        <p>{order.status === "paid" ? `Ödeme onaylandı. Öne çıkarma bitişi: ${new Date(order.featuredUntil ?? "").toLocaleString("tr-TR")}` : order.cancelled ? "Talep iptal edildi / reddedildi." : "Ödeme bekleniyor."}</p>
        {order.reviewNote && <p className="mt-1">Yönetici notu: {order.reviewNote}</p>}
      </div>)}
    </div>
  </details>;
}
