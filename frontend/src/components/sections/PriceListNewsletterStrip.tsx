"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { trackConversion } from "@/lib/analytics";
import { isValidEmail } from "@/lib/email";
import { useCtaTracking } from "@/lib/cta-tracking";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";


export default function PriceListNewsletterStrip({
  whatsappChannelUrl,
}: {
  /** WhatsApp KANAL adresi (site_settings.social_whatsapp) — varsa buton gosterilir. */
  whatsappChannelUrl?: string | null;
} = {}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const cta = useCtaTracking<HTMLElement>("price_list_strip");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      cta.track("invalid");
      setState("error");
      return;
    }
    cta.track("submit");
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: trimmed, source: "fiyatlar_strip" }),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      trackConversion("newsletter_signup", { event_label: "fiyatlar_strip", method: "fiyatlar_strip" }, { email: trimmed });
      cta.track("success");
      setEmail("");
      setState("success");
    } catch {
      cta.track("error");
      setState("error");
    }
  }

  return (
    <section ref={cta.ref} className="mb-6 rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-(--color-brand)/12 text-(--color-brand)">
            <Mail className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-(--color-foreground)">Haftalık fiyat özetini al</h2>
            <p className="mt-1 text-[13px] leading-5 text-(--color-muted)">
              En çok değişen ürünler ve şehir farkları her Pazartesi e-postanıza gelsin.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="flex w-full flex-col gap-2 sm:flex-row lg:max-w-md">
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            disabled={state === "loading" || state === "success"}
            onChange={(e) => {
              setEmail(e.target.value);
              if (state === "error") setState("idle");
            }}
            onFocus={() => cta.track("focus")}
            placeholder="E-posta adresiniz"
            aria-label="E-posta adresiniz"
            className="min-h-11 min-w-0 flex-1 rounded-lg border border-(--color-border) bg-(--color-background) px-3 text-[14px] text-(--color-foreground) outline-none focus:border-(--color-brand)"
          />
          <button
            type="submit"
            disabled={state === "loading" || state === "success"}
            className="min-h-11 rounded-lg bg-(--color-brand) px-4 text-[13px] font-bold text-(--color-brand-fg) disabled:opacity-70"
          >
            {state === "success" ? "Kaydedildi" : state === "loading" ? "Kaydediliyor" : "Bülteni Al"}
          </button>
          {whatsappChannelUrl ? (
            <a
              href={whatsappChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => cta.track("whatsapp")}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-4 text-[13px] font-bold whitespace-nowrap text-[#128C4A]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.019-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413" />
              </svg>
              WhatsApp Kanalı
            </a>
          ) : null}
        </form>
      </div>
      {state === "error" ? (
        <p className="mt-3 text-[12px] font-semibold text-(--color-danger)">Kayıt alınamadı. E-postayı kontrol edin.</p>
      ) : null}
    </section>
  );
}
