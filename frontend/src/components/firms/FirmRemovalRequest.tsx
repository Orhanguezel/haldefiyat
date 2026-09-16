"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api-client";

type Props = {
  firmSlug: string;
  firmName: string;
  /** "halkatalogu" ise kayit derlemedir, firma kendi eklememistir. */
  source?: string | null;
  /** Kaydin ilk gorulme tarihi — kaynak beyaninda gosterilir. */
  firstSeenAt?: string | null;
};

const RELATIONSHIPS = [
  { value: "sahibi", label: "Firma sahibiyim" },
  { value: "yetkili", label: "Firma adına yetkiliyim" },
  { value: "calisan", label: "Firmada çalışıyorum" },
  { value: "diger", label: "Diğer" },
] as const;

/**
 * KVKK m.11 silme talebi — sayfada GORUNUR ve OTURUM GEREKTIRMEZ.
 *
 * Sayfada "duzeltme bildirin" vardi ama kaldirma yolu yoktu. Kayitlarin
 * 1.333'u halkatalogu.com derlemesi; ilgili kisi kendisi eklemedi. Silme hakki
 * KVKK m.11'de yaziyor ve basvurunun onune hesap acma sarti konulamaz.
 */
export default function FirmRemovalRequest({ firmSlug, firmName, source, firstSeenAt }: Props) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derived = source === "halkatalogu";
  const seen = firstSeenAt ? new Date(firstSeenAt).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" }) : null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSending(true);
    setError(null);
    try {
      await apiPost(`/firms/${firmSlug}/removal-request`, {
        requesterName: String(form.get("requesterName") ?? ""),
        relationship: String(form.get("relationship") ?? "sahibi"),
        contact: String(form.get("contact") ?? ""),
        reason: String(form.get("reason") ?? "") || undefined,
        contactConsent: form.get("contactConsent") === "on",
      });
      setDone(true);
    } catch {
      setError("Talep gönderilemedi. Lütfen tekrar deneyin veya iletisim sayfasından yazın.");
    } finally {
      setSending(false);
    }
  }

  return (
    <aside className="mt-4 rounded-[8px] border border-(--color-border-soft) bg-(--color-bg-alt) p-4">
      <h2 className="font-(family-name:--font-display) text-sm font-bold text-(--color-foreground)">Bu kayıt hakkında</h2>
      {derived && (
        <p className="mt-2 text-xs leading-5 text-(--color-muted)">
          Bu kayıt kamuya açık hal komisyoncu katalogundan derlenmiştir; firma tarafından girilmemiştir
          {seen ? ` (ilk görülme: ${seen})` : ""}. İşletme bilgilerini yönetmek isterseniz profili sahiplenebilir,
          kaydın yayından kaldırılmasını isterseniz aşağıdan talep edebilirsiniz.
        </p>
      )}

      {done ? (
        <p className="mt-3 rounded-[6px] border border-(--color-brand)/35 bg-(--color-brand)/10 p-3 text-xs leading-5 text-(--color-foreground)">
          Talebiniz alındı. İncelenip verdiğiniz iletişim adresinden size dönüş yapılacak.
        </p>
      ) : open ? (
        <form onSubmit={submit} className="mt-3 grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-(--color-foreground)">
            Ad soyad
            <input name="requesterName" required minLength={2} maxLength={160} className="rounded-[6px] border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-(--color-foreground)">
            Firmayla ilişkiniz
            <select name="relationship" className="rounded-[6px] border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] font-normal">
              {RELATIONSHIPS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-semibold text-(--color-foreground)">
            Size nasıl dönelim (telefon veya e-posta)
            <input name="contact" required minLength={5} maxLength={190} className="rounded-[6px] border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] font-normal" />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-(--color-foreground)">
            Gerekçe (isteğe bağlı)
            <textarea name="reason" rows={2} maxLength={2000} className="rounded-[6px] border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[13px] font-normal" />
          </label>
          {/* Onceden isaretsiz ve ayri: yalnizca talebe donus icin. */}
          <label className="flex items-start gap-2 text-xs leading-5 text-(--color-muted)">
            <input type="checkbox" name="contactConsent" required className="mt-0.5" />
            Talebimin sonucu hakkında bana dönüş yapılması için iletişim bilgimin kullanılmasını kabul ediyorum.
          </label>
          {error && <p className="text-xs font-semibold text-(--color-danger)">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={sending} className="inline-flex min-h-10 items-center rounded-[6px] bg-(--color-brand) px-4 text-[13px] font-bold text-(--color-brand-fg) disabled:opacity-60">
              {sending ? "Gönderiliyor…" : "Kaldırma talebi gönder"}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-[6px] border border-(--color-border) px-4 text-[13px] font-semibold text-(--color-foreground)">
              Vazgeç
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 text-xs font-semibold text-(--color-brand) underline underline-offset-2"
        >
          {firmName} kaydının yayından kaldırılmasını talep et
        </button>
      )}
    </aside>
  );
}
