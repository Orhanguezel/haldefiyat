"use client";

import { useState, type FormEvent } from "react";
import { trackConversion } from "@/lib/analytics";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function MobileHomeNewsletterCta() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setState("error");
      return;
    }
    setState("loading");
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      if (!res.ok) throw new Error("subscribe_failed");
      trackConversion("newsletter_signup", { event_label: "mobile_home_sticky", method: "mobile_home_sticky" }, { email: trimmed });
      setEmail("");
      setState("success");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="sticky bottom-3 z-30 px-4 py-4">
      <form onSubmit={submit} className="rounded-lg border border-(--color-brand)/35 bg-(--color-surface)/95 p-3 shadow-xl backdrop-blur">
        <div className="mb-2 text-[13px] font-black text-(--color-foreground)">Haftalık fiyat bültenini al</div>
        <div className="flex gap-2">
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
            placeholder="E-posta"
            aria-label="E-posta adresiniz"
            className="min-h-11 min-w-0 flex-1 rounded-md border border-(--color-border) bg-(--color-background) px-3 text-[14px] text-(--color-foreground) outline-none focus:border-(--color-brand)"
          />
          <button
            type="submit"
            disabled={state === "loading" || state === "success"}
            className="min-h-11 rounded-md bg-(--color-brand) px-4 text-[13px] font-black text-(--color-brand-fg) disabled:opacity-70"
          >
            {state === "success" ? "Alındı" : state === "loading" ? "..." : "Kaydol"}
          </button>
        </div>
        {state === "error" ? <p className="mt-2 text-[12px] font-semibold text-(--color-danger)">Kayıt alınamadı. E-postayı kontrol edin.</p> : null}
      </form>
    </section>
  );
}
