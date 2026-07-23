"use client";

import Link from "next/link";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";

type Props = {
  firmId: number;
  firmSlug: string;
  firmName: string;
  claimStatus?: "unclaimed" | "pending" | "verified";
};

const VALUE_PROPS = [
  "“Doğrulanmış firma” rozeti",
  "Şehir listesinde üst sırada öne çıkma",
  "Telefon / WhatsApp ve iletişim bilgileriniz görünür",
  "Kendi ürün ve günlük fiyatlarınızı girin",
  "Alıcı teklif taleplerini doğrudan alın",
];

// Sahiplenmemiş firma profilinde belirgin dönüşüm kartı: sahibini doğrulamaya
// ve öne-çıkarma satış hunisine sokar (monetizasyon B). Doğrulanmış firmada gizli.
export default function FirmClaimPrompt({ firmId, firmSlug, firmName, claimStatus }: Props) {
  const { user, loading } = useAuthSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(claimStatus === "pending");
  const [error, setError] = useState<string | null>(null);

  if (claimStatus === "verified") return null;

  async function claim() {
    setSending(true);
    setError(null);
    try {
      await apiPost<{ id: number }>(`/firms/${firmId}/claim`, {
        evidence: `Profil sahiplenme talebi — ${firmName}`,
      });
      setSent(true);
    } catch {
      setError("Talep gönderilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="mt-8 rounded-[10px] border border-(--color-brand)/30 bg-(--color-brand)/[0.06] p-5 sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="font-(family-name:--font-mono) text-[10px] font-semibold uppercase tracking-[0.1em] text-(--color-brand)">
            Firma Sahibi misiniz?
          </span>
          <h2 className="mt-1 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
            Bu firma sizin mi? Doğrulayın ve öne çıkın.
          </h2>
          <p className="mt-2 text-sm leading-6 text-(--color-muted)">
            <strong className="text-(--color-foreground)">{firmName}</strong> profilini ücretsiz doğrulayın; HalDeFiyat
            firma rehberinde binlerce alıcının önüne çıkın.
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-start gap-2 text-sm text-(--color-muted)">
                <span aria-hidden className="mt-0.5 font-bold text-(--color-brand)">✓</span>
                <span dangerouslySetInnerHTML={{ __html: prop }} />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:w-64">
          {sent ? (
            <div className="rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              Talebiniz alındı — doğrulama için ekibimiz sizinle iletişime geçecek.
            </div>
          ) : !loading && !user ? (
            <Link
              href={`/giris?next=${encodeURIComponent(`/firma/${firmSlug}`)}`}
              className="rounded-[8px] bg-(--color-brand) px-5 py-3 text-center font-(family-name:--font-mono) text-[13px] font-semibold text-white"
            >
              Doğrula ve öne çık
            </Link>
          ) : (
            <button
              type="button"
              onClick={claim}
              disabled={loading || sending}
              className="rounded-[8px] bg-(--color-brand) px-5 py-3 text-center font-(family-name:--font-mono) text-[13px] font-semibold text-white disabled:opacity-60"
            >
              {sending ? "Gönderiliyor..." : "Firmayı doğrula"}
            </button>
          )}
          <Link
            href={`/iletisim?subject=${encodeURIComponent(`Firma öne çıkarma — ${firmName}`)}`}
            className="rounded-[8px] border border-(--color-border) px-5 py-3 text-center font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
          >
            Öne çıkarma &amp; sponsorluk
          </Link>
          {error && <span className="text-center text-xs text-red-600">{error}</span>}
        </div>
      </div>
    </section>
  );
}
