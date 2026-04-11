"use client";

import { useEffect } from "react";

/** Segment `error.tsx` — üst layout içinde render edilir; `<html>` / `<body>` kullanılmaz. */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl rounded-3xl border border-border-soft bg-surface shadow-sm p-8 text-center">
        <p className="text-xs font-semibold tracking-[0.24em] uppercase text-brand mb-3">site</p>
        <h1 className="text-3xl font-extrabold tracking-tight mb-3">Bir hata oluştu</h1>
        <p className="text-sm text-muted mb-6">Sayfa yüklenirken beklenmeyen bir sorun oluştu. Tekrar deneyin.</p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark transition-colors"
        >
          Tekrar Dene
        </button>
        {process.env.NODE_ENV !== "production" && (
          <pre className="mt-6 rounded-2xl bg-bg-alt p-4 text-left text-xs text-muted overflow-x-auto">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
}
