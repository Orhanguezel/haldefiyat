"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { bootstrapGoogleSession } from "@/lib/auth";
import { localePath } from "@/lib/locale-path";

export function GoogleSessionComplete({ locale }: { locale: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ran = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const rawNext = searchParams.get("next") ?? "/";
    const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

    void (async () => {
      try {
        await bootstrapGoogleSession();
        router.replace(localePath(locale, next));
        router.refresh();
      } catch {
        setFailed(true);
        setTimeout(() => router.replace(localePath(locale, "/giris?error=google")), 1400);
      }
    })();
  }, [locale, router, searchParams]);

  return (
    <main className="relative z-10 mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      {failed ? (
        <p className="text-sm text-(--color-muted)">
          Giriş tamamlanamadı, giriş sayfasına yönlendiriliyorsunuz…
        </p>
      ) : (
        <>
          <span
            aria-hidden="true"
            className="h-9 w-9 animate-spin rounded-full border-2 border-(--color-border) border-t-(--color-brand)"
          />
          <p className="mt-4 text-sm font-medium text-(--color-foreground)">
            Giriş tamamlanıyor…
          </p>
          <p className="mt-1 text-xs text-(--color-muted)">Hesabınız doğrulanıyor.</p>
        </>
      )}
    </main>
  );
}
