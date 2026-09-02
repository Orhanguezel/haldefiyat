"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuthSession } from "@/components/providers/AuthSessionProvider";
import { apiPost, ApiError } from "@/lib/api-client";
import { trackConversion } from "@/lib/analytics";

/**
 * /pro sayfasinin Pro CTA'si. Odeme yapilandirildiysa (selfServe) dogrudan
 * Stripe Checkout'a goturur; degilse eski manuel talep akisina duser. Boylece
 * sayfa hicbir zaman calismayan bir dugme gostermez.
 */
export default function ProUpgradeCta({
  locale, selfServe, priceLabel,
}: { locale: string; selfServe: boolean; priceLabel: string }) {
  const { user, loading } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contactHref = `/${locale}/iletisim?subject=Pro%20Plan%20Talebi`;
  const base = "block w-full text-center rounded-lg bg-emerald-500 text-white px-4 py-2.5 text-sm font-medium hover:bg-emerald-600 transition disabled:opacity-60";

  if (!selfServe) {
    return (
      <Link href={contactHref} className={base} onClick={() => trackConversion("pro_inquiry", { event_label: "pro_main_cta" })}>
        Pro talebi gönder
      </Link>
    );
  }
  if (loading) return <span className={`${base} opacity-60`}>Yükleniyor…</span>;
  if (!user) {
    return (
      <Link href={`/${locale}/giris?next=%2Fhesabim%2Fapi`} className={base} onClick={() => trackConversion("pro_inquiry", { event_label: "pro_login_gate" })}>
        Giriş yap ve Pro&apos;ya geç
      </Link>
    );
  }

  async function upgrade() {
    setBusy(true); setError(null);
    trackConversion("pro_inquiry", { event_label: "pro_checkout_start" });
    try {
      const result = await apiPost<{ url: string }>("/billing/checkout", { locale });
      window.location.href = result.url;
    } catch (err) {
      const status = err instanceof ApiError ? err.status : 0;
      setError(
        status === 409
          ? "Zaten Pro abonesisiniz."
          : status === 503
            ? "Ödeme altyapısı henüz etkin değil."
            : "Ödeme sayfası açılamadı.",
      );
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => void upgrade()} disabled={busy} className={base}>
        {busy ? "Yönlendiriliyor…" : `Pro'ya geç — ${priceLabel}`}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-red-600">
          {error} <Link href={contactHref} className="underline">İletişim</Link>
        </p>
      )}
    </>
  );
}
