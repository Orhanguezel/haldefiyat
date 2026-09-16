"use client";

import Link from "next/link";
import { useState } from "react";
import { apiPost } from "@/lib/api-client";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { FirmFormHeader } from "./FirmFormHeader";

type Props = {
  firmId: number;
  firmSlug: string;
  firmName: string;
  claimStatus?: "unclaimed" | "pending" | "verified";
  /** Son 30 gunde gelen alici talebi sayisi — sahiplenmenin somut sebebi. */
  recentLeadCount?: number;
};

const VALUE_PROPS = [
  "“Doğrulanmış firma” rozeti",
  "Firma profilini yönetme",
  "Ticari telefon ve iletişim bilgilerini güncelleme",
  "Kendi ürün ve günlük fiyatlarınızı girin",
  "Alıcı teklif taleplerini doğrudan alın",
];

// Sahiplenmemiş firma profilinde belirgin dönüşüm kartı: sahibini doğrulamaya
// ve öne-çıkarma satış hunisine sokar (monetizasyon B). Doğrulanmış firmada gizli.
export default function FirmClaimPrompt({ firmId, firmSlug, firmName, claimStatus, recentLeadCount = 0 }: Props) {
  const { user, loading } = useAuthSession();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(claimStatus === "pending");
  const [error, setError] = useState<string | null>(null);
  const [authorityConfirmed, setAuthorityConfirmed] = useState(false);

  if (claimStatus === "verified") return null;

  async function claim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);
    try {
      await apiPost<{ id: number }>(`/firms/${firmId}/claim`, {
        evidence: `Profil sahiplenme talebi — ${firmName}`,
        authorityConfirmed,
        privacyConsent: true,
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
          {/* Bekleyen talep, sahiplenmenin en somut sebebi. Firmaya ileti
              GONDERILMEZ (kayitlarin cogu halkatalogu derlemesi, rizasi yok);
              yalniz sayi gosterilir, talebi gonderenin bilgisi disari cikmaz. */}
          {recentLeadCount > 0 && (
            <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-(--color-brand) px-3 py-1.5 text-[13px] font-bold text-(--color-brand-fg)">
              {`Son 30 günde ${recentLeadCount.toLocaleString("tr-TR")} alıcı talebi bekliyor`}
            </p>
          )}
          <FirmFormHeader
            eyebrow="Firma sahibi misiniz?"
            title={recentLeadCount > 0 ? "Bu firma sizin mi? Talepleri görmek için doğrulayın." : "Bu firma sizin mi? Profili doğrulayın."}
            description={recentLeadCount > 0
              ? `${firmName} adına gelen alıcı taleplerini görebilmek ve işletme bilgilerini yönetebilmek için profili sahiplenin. Talep, yetki kontrolünden sonra onaylanır.`
              : `${firmName} profilini sahiplenme talebi göndererek işletme bilgilerini yönetebilirsiniz. Talep, yetki kontrolünden sonra onaylanır.`}
          />
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-start gap-2 text-sm text-(--color-muted)">
                <span aria-hidden className="mt-0.5 font-bold text-(--color-brand)">✓</span>
                <span>{prop}</span>
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={claim} className="flex shrink-0 flex-col items-stretch gap-2 lg:w-72">
          {sent ? (
            <div className="rounded-[8px] border border-emerald-300 bg-emerald-50 px-4 py-3 text-center text-sm font-semibold text-emerald-700">
              Talebiniz alındı — doğrulama için ekibimiz sizinle iletişime geçecek.
            </div>
          ) : !loading && !user ? (
            <Link
              href={`/giris?next=${encodeURIComponent(`/firma/${firmSlug}`)}`}
              className="rounded-[8px] bg-(--color-brand) px-5 py-3 text-center font-(family-name:--font-mono) text-[13px] font-semibold text-(--color-brand-fg)"
            >
              Doğrula ve öne çık
            </Link>
          ) : (
            <>
              <label className="flex items-start gap-2 rounded-[6px] border border-(--color-border-soft) bg-(--color-surface) p-3 text-xs leading-5 text-(--color-muted)">
                <input
                  type="checkbox"
                  required
                  checked={authorityConfirmed}
                  onChange={(event) => setAuthorityConfirmed(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-(--color-brand)"
                />
                <span>Bu işletmeyi temsil etmeye yetkili olduğumu ve bilgilerimin doğrulama amacıyla işlenmesini kabul ediyorum.</span>
              </label>
              <button
                type="submit"
                disabled={loading || sending || !authorityConfirmed}
                className="rounded-[8px] bg-(--color-brand) px-5 py-3 text-center font-(family-name:--font-mono) text-[13px] font-semibold text-(--color-brand-fg) disabled:opacity-60"
              >
                {sending ? "Gönderiliyor..." : "Firmayı doğrula"}
              </button>
            </>
          )}
          <Link
            href={`/iletisim?subject=${encodeURIComponent(`Firma öne çıkarma — ${firmName}`)}`}
            className="rounded-[8px] border border-(--color-border) px-5 py-3 text-center font-(family-name:--font-mono) text-[12px] font-semibold text-(--color-foreground)"
          >
            Öne çıkarma &amp; sponsorluk
          </Link>
          {error && <span className="text-center text-xs text-red-600">{error}</span>}
        </form>
      </div>
    </section>
  );
}
