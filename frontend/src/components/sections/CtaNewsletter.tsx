"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { trackConversion } from "@/lib/analytics";
import { isValidEmail } from "@/lib/email";
import { useCtaTracking } from "@/lib/cta-tracking";
import { AlertTriangle, Bell, CheckCircle2, Mail, Smartphone } from "lucide-react";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";


/**
 * E-posta abonelik CTA (client component).
 *
 * NEDEN: Form state ve fetch islemi tarayici tarafinda. Discriminated union
 * ile state yonetilir — hicbir bool flag karmasasi yok.
 */
export default function CtaNewsletter({
  whatsappChannelUrl,
}: {
  /** WhatsApp KANAL adresi (whatsapp.com/channel/...). site_settings.social_whatsapp. */
  whatsappChannelUrl?: string | null;
} = {}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const cta = useCtaTracking<HTMLElement>("home_bottom");
  const isLoading = state.kind === "loading";
  const isSuccess = state.kind === "success";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading || isSuccess) return;

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      cta.track("invalid");
      setState({ kind: "error", message: "Geçerli bir e-posta girin." });
      return;
    }

    cta.track("submit");
    setState({ kind: "loading" });

    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
      }

      cta.track("success");
      setState({ kind: "success" });
      trackConversion("newsletter_signup", { event_label: "newsletter_cta", method: "newsletter_cta" }, { email: trimmed });
      setEmail("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.";
      cta.track("error");
      setState({ kind: "error", message });
    }
  }

  return (
    <section ref={cta.ref} className="relative z-10 px-8 py-24">
      <div
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] border border-(--color-brand)/15 px-6 py-16 text-center sm:px-12 sm:py-20"
        style={{
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-brand) 6%, transparent), color-mix(in srgb, var(--color-info) 4%, transparent))",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -top-[100px] h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--color-brand) 8%, transparent), transparent 70%)",
          }}
        />

        <h2 className="relative z-[2] mb-4 font-(family-name:--font-display) text-[32px] font-black tracking-[-0.03em] text-(--color-foreground) sm:text-[44px]">
          Fiyat Alarmı Kur
        </h2>
        <p className="relative z-[2] mx-auto mb-9 max-w-[480px] text-[15px] leading-[1.7] text-(--color-muted) sm:text-[17px]">
          Seçtiğin ürün hedef fiyata gelince anında bildirim al.
        </p>

        <form
          onSubmit={handleSubmit}
          className="relative z-[2] mx-auto mb-8 flex max-w-[480px] flex-col gap-3 sm:flex-row"
          noValidate
        >
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            disabled={isLoading || isSuccess}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state.kind === "error") setState({ kind: "idle" });
            }}
            onFocus={() => cta.track("focus")}
            placeholder="E-posta adresiniz"
            aria-label="E-posta adresiniz"
            className="w-full rounded-[14px] border border-(--color-border) bg-(--color-surface)/40 px-5 py-4 font-(family-name:--font-body) text-[15px] text-(--color-foreground) outline-none transition-all duration-300 placeholder:text-(--color-muted) focus:border-(--color-brand) focus:ring-3 focus:ring-(--color-brand)/10 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-(--color-brand) px-8 py-4 font-(family-name:--font-display) text-[15px] font-bold whitespace-nowrap text-(--color-brand-fg) transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-brand-fg) border-t-transparent"
              />
            )}
            {isLoading ? "Kaydediliyor" : "Kayıt Ol"}
          </button>
        </form>

        {state.kind === "success" && (
          <div
            role="status"
            className="relative z-[2] mb-6 inline-flex items-center gap-2 rounded-[10px] border border-(--color-brand)/30 bg-(--color-brand)/10 px-4 py-2 text-[14px] font-semibold text-(--color-brand)"
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden /> Kaydedildiniz!
          </div>
        )}

        {state.kind === "error" && (
          <div
            role="alert"
            className="relative z-[2] mb-6 inline-flex items-center gap-2 rounded-[10px] border border-(--color-danger)/30 bg-(--color-danger-bg) px-4 py-2 text-[14px] font-semibold text-(--color-danger)"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden /> {state.message}
          </div>
        )}

        <p className="relative z-[2] mb-3 text-[13px] text-(--color-muted)">
          Ürün bazlı hedef-fiyat uyarısı için kanal seç:
        </p>
        <div className="relative z-[2] flex flex-wrap items-center justify-center gap-6 text-[14px] text-(--color-muted)">
          <Link
            href="/uyarilar?channel=telegram"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-(--color-brand)"
          >
            <Smartphone className="h-4 w-4" aria-hidden /> Telegram
          </Link>
          <Link
            href="/uyarilar?channel=email"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-(--color-brand)"
          >
            <Mail className="h-4 w-4" aria-hidden /> E-posta
          </Link>
          <Link
            href="/uyarilar?channel=push"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-(--color-brand)"
          >
            <Bell className="h-4 w-4" aria-hidden /> Web Push
          </Link>
        </div>

        {/*
          WhatsApp KANALI bilincli olarak yukaridaki listede DEGIL. O liste
          kisiye ozel hedef-fiyat uyarisinin nasil teslim edilecegini seciyor;
          WhatsApp Kanallari ise tek yonlu yayin ve API'si yok — kisiye ozel
          bildirim gonderilemez. Ayri bir teklif olarak sunulur: gunluk kart.
        */}
        {whatsappChannelUrl && (
          <div className="relative z-[2] mt-8 border-t border-(--color-border) pt-6">
            <p className="mb-3 text-[13px] text-(--color-muted)">
              Her sabah günlük fiyat kartı için WhatsApp kanalımızı takip et —
              kayıt gerekmez, numaran görünmez.
            </p>
            <a
              href={whatsappChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackConversion("whatsapp_channel_follow")}
              className="inline-flex items-center gap-2 rounded-[10px] border border-(--color-brand)/30 px-4 py-2 text-[14px] font-semibold text-(--color-brand) transition-colors duration-200 hover:bg-(--color-brand) hover:text-(--color-brand-fg)"
            >
              <span aria-hidden>💬</span> WhatsApp kanalını takip et
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
