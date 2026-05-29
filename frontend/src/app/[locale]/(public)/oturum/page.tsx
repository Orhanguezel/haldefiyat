export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { GoogleSessionComplete } from "@/components/auth/GoogleSessionComplete";

type Props = { params: Promise<{ locale: string }> };

export const metadata: Metadata = {
  title: "Giriş tamamlanıyor | HaldeFiyat",
  robots: { index: false, follow: false },
};

export default async function OturumPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <GoogleSessionComplete locale={locale} />;
}
