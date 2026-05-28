"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API_BASE: string = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, "")}/api/v1`
  : "/api/v1";

type State = "loading" | "success" | "invalid" | "error";

export default function UnsubscribeClient() {
  const params = useSearchParams();
  const e = params.get("e");
  const t = params.get("t");
  const [state, setState] = useState<State>("loading");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!e || !t) {
      setState("invalid");
      return;
    }

    fetch(`${API_BASE}/newsletter/unsubscribe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e, t }),
    })
      .then((res) => {
        if (res.ok) setState("success");
        else if (res.status === 400) setState("invalid");
        else setState("error");
      })
      .catch(() => setState("error"));
  }, [e, t]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center py-16 text-center">
      {state === "loading" && (
        <p className="text-(--color-muted)">Aboneliğin kontrol ediliyor…</p>
      )}

      {state === "success" && (
        <>
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-(--color-brand)/12 text-(--color-brand)">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-(--color-foreground)">Aboneliğin iptal edildi</h1>
          <p className="mt-2 text-sm text-(--color-muted)">
            Artık haftalık hal bültenini almayacaksın. Fikrini değiştirirsen istediğin zaman tekrar abone olabilirsin.
          </p>
          <Link
            href="/canli-hal-fiyatlari"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-(--color-brand) px-6 text-sm font-bold text-(--color-brand-fg) transition-all active:scale-95"
          >
            Tekrar abone ol
          </Link>
        </>
      )}

      {state === "invalid" && (
        <>
          <h1 className="text-xl font-bold text-(--color-foreground)">Bağlantı geçersiz</h1>
          <p className="mt-2 text-sm text-(--color-muted)">
            Abonelikten çıkma bağlantısı eksik veya geçersiz. Lütfen e-postandaki bağlantıyı tekrar kullan.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl border border-(--color-border) px-6 text-sm font-semibold text-(--color-foreground) transition-all active:scale-95"
          >
            Anasayfaya dön
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <h1 className="text-xl font-bold text-(--color-foreground)">Bir hata oluştu</h1>
          <p className="mt-2 text-sm text-(--color-muted)">
            İşlem tamamlanamadı. Lütfen birazdan tekrar dene.
          </p>
        </>
      )}
    </div>
  );
}
