"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { trackConversion } from "@/lib/analytics";
import { isValidEmail } from "@/lib/email";
import { useCtaTracking } from "@/lib/cta-tracking";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";


export default function PriceListNewsletterStrip() {
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
        </form>
      </div>
      {state === "error" ? (
        <p className="mt-3 text-[12px] font-semibold text-(--color-danger)">Kayıt alınamadı. E-postayı kontrol edin.</p>
      ) : null}
    </section>
  );
}
