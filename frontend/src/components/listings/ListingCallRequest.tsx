"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { getStoredAuthUser } from "@/lib/auth";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { trackConversion } from "@/lib/analytics";

type PreferredSlot = "asap" | "morning" | "afternoon" | "evening";
type ContactSummary = { maskedPhone: string | null; phonePresent: boolean; accountVerified: boolean };

const STATUS_MESSAGES: Record<string, string> = {
  duplicate: "Bu ilan için yakın zamanda bir arama talebi gönderdiniz.",
  rate_limited: "Günlük arama talebi sınırına ulaştınız. Lütfen daha sonra tekrar deneyin.",
  seller_rate_limited: "Bu satıcı bugün çok sayıda talep aldı. Lütfen daha sonra tekrar deneyin.",
  own_listing: "Kendi ilanınız için arama talebi oluşturamazsınız.",
};

export function ListingCallRequest({ listingId }: { listingId: number }) {
  const [user] = useState(() => getStoredAuthUser());
  const [preferredSlot, setPreferredSlot] = useState<PreferredSlot>("asap");
  const [note, setNote] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [contactSummary, setContactSummary] = useState<ContactSummary | null>(null);

  useEffect(() => {
    trackConversion("call_request_view", { listing_id: listingId });
  }, [listingId]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiGet<ContactSummary>("/listings/call-requests/contact-summary")
      .then((summary) => { if (!cancelled) setContactSummary(summary); })
      .catch(() => { if (!cancelled) setContactSummary(null); });
    return () => { cancelled = true; };
  }, [user]);

  async function submit() {
    if (!privacyAccepted || loading) return;
    setLoading(true);
    setError("");
    try {
      await apiPost(`/listings/${listingId}/call-requests`, { preferredSlot, note, privacyAccepted: true });
      trackConversion("call_request_submit", { listing_id: listingId, preferred_slot: preferredSlot });
      setSuccess(true);
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : "request_failed";
      setError(STATUS_MESSAGES[code] ?? "Arama talebi gönderilemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-brand)/25 bg-(--color-brand)/8 p-4" aria-labelledby="call-request-title">
        <h2 id="call-request-title" className="font-semibold text-(--color-foreground)">Satıcıyı ara</h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          Satıcının numarası açık paylaşılmaz. Güvenli bir arama talebi göndermek için giriş yapın.
        </p>
        <Link href="/giris" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-(--color-brand) px-5 text-sm font-semibold text-white hover:bg-(--color-brand-dark)">
          Giriş yap ve talep gönder
        </Link>
      </section>
    );
  }

  if (success) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-success)/30 bg-(--color-success-bg) p-4" role="status">
        <h2 className="font-semibold text-(--color-foreground)">Arama talebiniz iletildi</h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          Satıcı uygun olduğunda geri dönüş yapabilir. Tarafların telefon numaraları bu sayfada açık paylaşılmaz.
        </p>
      </section>
    );
  }

  return (
    <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-brand)/25 bg-(--color-surface) p-4" aria-labelledby="call-request-title">
      <h2 id="call-request-title" className="font-semibold text-(--color-foreground)">Arama talebi gönder</h2>
      <p className="mt-2 text-sm leading-6 text-(--color-muted)">
        Numaranız ve satıcının numarası açık paylaşılmaz. Bu işlem anlık görüşme garantisi vermez.
      </p>
      {contactSummary ? (
        <div className="mt-3 rounded-lg border border-(--color-border) bg-(--color-bg-alt) px-3 py-2 text-xs leading-5 text-(--color-muted)">
          {contactSummary.phonePresent ? (
            <>Hesabınızdaki maskeli numara: <strong className="text-(--color-foreground)">{contactSummary.maskedPhone}</strong>. Tam numara bu sayfada veya satıcıya açık gösterilmez.</>
          ) : (
            <>Hesabınızda telefon bulunamadı. Geri dönüş için <Link href="/hesabim/profil" className="font-semibold text-(--color-brand) underline underline-offset-2">profilinize numara ekleyin</Link>.</>
          )}
        </div>
      ) : null}

      <label htmlFor="preferred-call-slot" className="mt-4 block text-xs font-medium text-(--color-foreground)">
        Uygun zaman
      </label>
      <select
        id="preferred-call-slot"
        value={preferredSlot}
        onChange={(event) => setPreferredSlot(event.target.value as PreferredSlot)}
        className="mt-1.5 min-h-11 w-full rounded-lg border border-(--color-border) bg-(--color-background) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20"
      >
        <option value="asap">En kısa sürede</option>
        <option value="morning">09:00–12:00</option>
        <option value="afternoon">12:00–17:00</option>
        <option value="evening">17:00–20:00</option>
      </select>

      <div className="mt-4">
        <TextArea
          id="call-request-note"
          label="Kısa not (isteğe bağlı)"
          value={note}
          maxLength={500}
          rows={3}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Örn. ürün miktarı hakkında görüşmek istiyorum."
        />
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-(--color-muted)">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(event) => setPrivacyAccepted(event.target.checked)}
          className="mt-1 size-4 accent-(--color-brand)"
        />
        <span>
          Arama talebimin bu ilan için iletilmesini kabul ediyorum. Ayrıntılar için{" "}
          <Link href="/kvkk" className="font-medium text-(--color-brand) hover:underline">KVKK aydınlatmasını</Link> okuyabilirsiniz.
        </span>
      </label>

      <Button type="button" loading={loading} disabled={!privacyAccepted} onClick={submit} className="mt-4 min-h-11 w-full">
        Talebi gönder
      </Button>
      {error ? <p className="mt-3 text-sm text-(--color-danger)" role="alert">{error}</p> : null}
    </section>
  );
}
