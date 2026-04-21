export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";

type Props = { params: Promise<{ locale: string }> };

export function generateMetadata(): Metadata {
  return {
    title: "Giriş Yap | HaldeFiyat",
    description: "HaldeFiyat hesabınıza giriş yapın.",
    alternates: { canonical: "/giris" },
    robots: { index: false, follow: false },
  };
}

export default async function GirisPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPanel locale={locale} mode="login" />;
}
