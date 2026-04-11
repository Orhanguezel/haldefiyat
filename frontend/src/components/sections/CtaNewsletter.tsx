"use client";

import { useState, type FormEvent } from "react";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * E-posta abonelik CTA (client component).
 *
 * NEDEN: Form state ve fetch islemi tarayici tarafinda. Discriminated union
 * ile state yonetilir — hicbir bool flag karmasasi yok.
 */
export default function CtaNewsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const isLoading = state.kind === "loading";
  const isSuccess = state.kind === "success";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading || isSuccess) return;

    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setState({ kind: "error", message: "Geçerli bir e-posta girin." });
      return;
    }

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

      setState({ kind: "success" });
      setEmail("");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.";
      setState({ kind: "error", message });
    }
  }

  return (
    <section className="relative z-10 px-8 py-24">
      <div
        className="relative mx-auto max-w-[1400px] overflow-hidden rounded-[28px] border border-[rgba(132,240,76,0.15)] px-6 py-16 text-center sm:px-12 sm:py-20"
        style={{
          background:
            "linear-gradient(135deg, rgba(132,240,76,0.06), rgba(59,130,246,0.04))",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 -top-[100px] h-[500px] w-[500px] -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(132,240,76,0.08), transparent 70%)",
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
            placeholder="E-posta adresiniz"
            aria-label="E-posta adresiniz"
            className="w-full rounded-[14px] border border-(--color-border) bg-[rgba(255,255,255,0.04)] px-5 py-4 font-(family-name:--font-body) text-[15px] text-(--color-foreground) outline-none transition-all duration-300 placeholder:text-(--color-muted) focus:border-(--color-brand) focus:shadow-[0_0_0_3px_rgba(132,240,76,0.1)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || isSuccess}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[14px] bg-(--color-brand) px-8 py-4 font-(family-name:--font-display) text-[15px] font-bold whitespace-nowrap text-(--color-navy) transition-all duration-300 hover:-translate-y-0.5 hover:bg-(--color-brand-dark) disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading && (
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-(--color-navy) border-t-transparent"
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
            <span aria-hidden>✅</span> Kaydedildiniz!
          </div>
        )}

        {state.kind === "error" && (
          <div
            role="alert"
            className="relative z-[2] mb-6 inline-flex items-center gap-2 rounded-[10px] border border-(--color-danger)/30 bg-(--color-danger-bg) px-4 py-2 text-[14px] font-semibold text-(--color-danger)"
          >
            <span aria-hidden>⚠️</span> {state.message}
          </div>
        )}

        <div className="relative z-[2] flex flex-wrap items-center justify-center gap-6 text-[14px] text-(--color-muted)">
          <a
            href="#"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-(--color-brand)"
          >
            <span aria-hidden>📱</span> Telegram
          </a>
          <a
            href="#"
            className="flex items-center gap-1.5 transition-colors duration-200 hover:text-(--color-brand)"
          >
            <span aria-hidden>📧</span> E-posta
          </a>
        </div>
      </div>
    </section>
  );
}
