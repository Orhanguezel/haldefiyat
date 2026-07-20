"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { trackConversion } from "@/lib/analytics";
import { isValidEmail } from "@/lib/email";

type SubmitState = "idle" | "loading" | "success" | { error: string };

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";


export default function LivePriceNewsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setState({ error: "Geçerli bir e-posta girin." });
      return;
    }

    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Kayıt alınamadı.");
      }

      setState("success");
      trackConversion(
        "newsletter_signup",
        { event_label: "landing_canli_hal_fiyatlari", method: "live_prices_landing" },
        { email: trimmed },
      );
      setEmail("");
    } catch (err) {
      setState({ error: err instanceof Error ? err.message : "Kayıt alınamadı." });
    }
  }

  return (
    <div className="self-center rounded-lg border border-(--color-border) bg-(--color-background) p-5 shadow-sm sm:p-6">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-(--color-brand)/12 text-(--color-brand)">
        <Mail className="h-5 w-5" />
      </div>
      <h2 className="font-(family-name:--font-display) text-2xl font-black text-(--color-foreground)">
        Haftalık fiyat bültenini ücretsiz al
      </h2>
      <p className="mt-2 text-[14px] leading-6 text-(--color-muted)">
        Her Pazartesi güncel hal özeti, yükselen ürünler ve şehir farkları mailbox&apos;ında.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          disabled={state === "loading" || state === "success"}
          onChange={(e) => {
            setEmail(e.target.value);
            if (typeof state === "object") setState("idle");
          }}
          placeholder="E-posta adresiniz"
          aria-label="E-posta adresiniz"
          className="min-h-12 flex-1 rounded-lg border border-(--color-border) bg-(--color-surface) px-4 text-[15px] text-(--color-foreground) outline-none focus:border-(--color-brand)"
        />
        <button
          type="submit"
          disabled={state === "loading" || state === "success"}
          className="min-h-12 rounded-lg bg-(--color-brand) px-5 text-[14px] font-bold text-(--color-navy) hover:bg-(--color-brand-dark) disabled:opacity-70"
        >
          {state === "loading" ? "Kaydediliyor" : state === "success" ? "Kaydedildi" : "Bülteni Al"}
        </button>
      </form>

      {state === "success" ? (
        <p className="mt-3 text-[13px] font-semibold text-(--color-success)">Kaydınız alındı.</p>
      ) : typeof state === "object" ? (
        <p className="mt-3 text-[13px] font-semibold text-(--color-danger)">{state.error}</p>
      ) : null}
    </div>
  );
}
