"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { TextArea } from "@/components/ui/TextArea";
import { getStoredAuthUser } from "@/lib/auth";
import { apiGet, apiPost, ApiError } from "@/lib/api-client";
import { trackConversion } from "@/lib/analytics";

type PreferredSlot = "asap" | "morning" | "afternoon" | "evening";
type ContactSummary = { maskedPhone: string | null; phonePresent: boolean; accountVerified: boolean };
type RiskChallenge = { token: string; prompt: string; expiresAt: string };
const CALL_SLOTS: Array<{ value: PreferredSlot; label: string }> = [
  { value: "asap", label: "En kısa sürede" },
  { value: "morning", label: "09:00–12:00" },
  { value: "afternoon", label: "12:00–17:00" },
  { value: "evening", label: "17:00–20:00" },
];

const STATUS_MESSAGES: Record<string, string> = {
  duplicate: "Bu ilan için yakın zamanda bir arama talebi gönderdiniz.",
  rate_limited: "Günlük arama talebi sınırına ulaştınız. Lütfen daha sonra tekrar deneyin.",
  seller_rate_limited: "Bu satıcı bugün çok sayıda talep aldı. Lütfen daha sonra tekrar deneyin.",
  own_listing: "Kendi ilanınız için arama talebi oluşturamazsınız.",
  call_requests_disabled: "Satıcı bu ilan için arama talebi kabul etmiyor.",
  slot_unavailable: "Seçtiğiniz zaman artık uygun değil. Lütfen başka bir zaman seçin.",
  account_verification_required: "Arama talebi için doğrulanmış bir hesap gerekiyor.",
  bot_detected: "Otomatik gönderim şüphesi nedeniyle talep alınamadı.",
  risk_challenge_required: "Devam etmek için kısa güvenlik sorusunu yanıtlayın.",
};

export function ListingCallRequest({
  listingId,
  enabled = true,
  availableSlots,
}: {
  listingId: number;
  enabled?: boolean;
  availableSlots?: PreferredSlot[];
}) {
  const selectableSlots = useMemo(() => availableSlots?.length
    ? CALL_SLOTS.filter((slot) => availableSlots.includes(slot.value))
    : CALL_SLOTS, [availableSlots]);
  const [user] = useState(() => getStoredAuthUser());
  const [preferredSlot, setPreferredSlot] = useState<PreferredSlot>(selectableSlots[0].value);
  const [note, setNote] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [website, setWebsite] = useState("");
  const [riskChallenge, setRiskChallenge] = useState<RiskChallenge | null>(null);
  const [riskAnswer, setRiskAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [contactSummary, setContactSummary] = useState<ContactSummary | null>(null);
  const [contactSummaryLoaded, setContactSummaryLoaded] = useState(false);
  const formStartedAt = useRef(Date.now());

  useEffect(() => {
    trackConversion("call_request_view", { listing_id: listingId });
  }, [listingId]);

  useEffect(() => {
    if (!selectableSlots.some((slot) => slot.value === preferredSlot)) {
      setPreferredSlot(selectableSlots[0].value);
    }
  }, [preferredSlot, selectableSlots]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiGet<ContactSummary>("/listings/call-requests/contact-summary")
      .then((summary) => { if (!cancelled) setContactSummary(summary); })
      .catch(() => { if (!cancelled) setContactSummary(null); })
      .finally(() => { if (!cancelled) setContactSummaryLoaded(true); });
    return () => { cancelled = true; };
  }, [user]);

  async function submit() {
    if (!privacyAccepted || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await apiPost<{ status: "pending" | "notified" }>(`/listings/${listingId}/call-requests`, {
        preferredSlot,
        note,
        privacyAccepted: true,
        website,
        formElapsedMs: Date.now() - formStartedAt.current,
        riskChallengeToken: riskChallenge?.token,
        riskChallengeAnswer: riskChallenge ? riskAnswer : undefined,
      });
      trackConversion("call_request_submit", { listing_id: listingId, preferred_slot: preferredSlot });
      if (response.status === "notified") {
        trackConversion("call_request_notified", { listing_id: listingId });
      }
      setSuccess(true);
    } catch (caught) {
      const code = caught instanceof ApiError ? caught.code : "request_failed";
      if (caught instanceof ApiError && code === "risk_challenge_required") {
        const body = caught.details as { error?: { details?: { challenge?: RiskChallenge } } } | undefined;
        const challenge = body?.error?.details?.challenge;
        if (challenge?.token && challenge.prompt) {
          setRiskChallenge(challenge);
          setRiskAnswer("");
        }
      }
      setError(STATUS_MESSAGES[code] ?? "Arama talebi gönderilemedi. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-4" aria-labelledby="call-request-title">
        <h2 id="call-request-title" className="font-semibold text-(--color-foreground)">Arama talebi kapalı</h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          Satıcı bu ilan için arama talebi kabul etmiyor. Aşağıdaki mesaj formunu kullanabilirsiniz.
        </p>
      </section>
    );
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

  if (!contactSummaryLoaded) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-border) bg-(--color-bg-alt) p-4" aria-busy="true">
        <h2 className="font-semibold text-(--color-foreground)">Hesap doğrulanıyor</h2>
        <p className="mt-2 text-sm text-(--color-muted)">Güvenli arama talebi bilgileri hazırlanıyor…</p>
      </section>
    );
  }

  if (!contactSummary) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-danger)/25 bg-(--color-danger)/5 p-4" role="alert">
        <h2 className="font-semibold text-(--color-foreground)">Hesap doğrulanamadı</h2>
        <p className="mt-2 text-sm text-(--color-muted)">Lütfen yeniden giriş yapıp arama talebini tekrar deneyin.</p>
        <Link href="/giris" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-(--color-brand) px-5 text-sm font-semibold text-white">Yeniden giriş yap</Link>
      </section>
    );
  }

  if (contactSummary && !contactSummary.accountVerified) {
    return (
      <section id="call-request" className="scroll-mt-24 rounded-[10px] border border-(--color-brand)/25 bg-(--color-brand)/8 p-4" aria-labelledby="call-request-title">
        <h2 id="call-request-title" className="font-semibold text-(--color-foreground)">Hesabınızı doğrulayın</h2>
        <p className="mt-2 text-sm leading-6 text-(--color-muted)">
          Satıcıya güvenli arama talebi göndermek için doğrulanmış bir hesap gerekir. SMS doğrulaması
          şu anda kapalıdır; doğrulanmış Google hesabınızla yeniden giriş yapabilirsiniz.
        </p>
        <Link href="/giris" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg bg-(--color-brand) px-5 text-sm font-semibold text-white hover:bg-(--color-brand-dark)">
          Güvenli girişe git
        </Link>
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
        {selectableSlots.map((slot) => <option key={slot.value} value={slot.value}>{slot.label}</option>)}
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

      <div className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        <label htmlFor="call-request-website">Web sitesi</label>
        <input
          id="call-request-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      {riskChallenge ? (
        <div className="mt-4 rounded-lg border border-(--color-warning)/35 bg-(--color-warning-bg) p-3">
          <label htmlFor="call-request-risk-answer" className="block text-xs font-semibold text-(--color-foreground)">
            Güvenlik kontrolü: {riskChallenge.prompt}
          </label>
          <input
            id="call-request-risk-answer"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={3}
            value={riskAnswer}
            onChange={(event) => setRiskAnswer(event.target.value.replace(/\D/g, "").slice(0, 3))}
            className="mt-2 min-h-11 w-28 rounded-lg border border-(--color-border) bg-(--color-background) px-3 text-sm text-(--color-foreground) outline-none focus:border-(--color-brand) focus:ring-2 focus:ring-(--color-brand)/20"
            aria-describedby="call-request-risk-help"
          />
          <p id="call-request-risk-help" className="mt-2 text-xs text-(--color-muted)">
            Bu alan yalnız olağandışı hızlı veya otomatik gönderim şüphesinde gösterilir.
          </p>
        </div>
      ) : null}

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

      <Button type="button" loading={loading} disabled={!privacyAccepted || Boolean(riskChallenge && !riskAnswer)} onClick={submit} className="mt-4 min-h-11 w-full">
        Talebi gönder
      </Button>
      {error ? <p className="mt-3 text-sm text-(--color-danger)" role="alert">{error}</p> : null}
    </section>
  );
}
