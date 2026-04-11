import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import Link from "next/link";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Kayıt Ol | HaldeFiyat",
    description: "HaldeFiyat'a üye olun.",
    alternates: { canonical: "/kayit" },
    robots: { index: false, follow: false },
  };
}

export default async function KayitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="relative z-10 mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-8 py-20">
      <div className="w-full rounded-2xl border border-(--color-border) bg-(--color-surface) p-8 text-center">
        <span className="font-(family-name:--font-mono) text-[11px] font-semibold uppercase tracking-[0.12em] text-(--color-brand)">
          Üyelik
        </span>
        <h1 className="mt-3 font-(family-name:--font-display) text-2xl font-bold text-(--color-foreground)">
          Yakında
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-(--color-muted)">
          Kullanıcı hesapları Faz 2&apos;de devreye girecek. Şu an fiyat
          uyarıları e-posta adresinizle hesapsız çalışmaktadır.
        </p>
        <Link
          href="/uyarilar"
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-(--color-brand) px-5 py-2.5 text-[13px] font-semibold text-(--color-brand-foreground) transition-opacity hover:opacity-90"
        >
          Fiyat Uyarısı Oluştur
        </Link>
      </div>
    </main>
  );
}
