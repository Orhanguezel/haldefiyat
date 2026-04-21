export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";

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

  return <AuthPanel locale={locale} mode="register" />;
}
