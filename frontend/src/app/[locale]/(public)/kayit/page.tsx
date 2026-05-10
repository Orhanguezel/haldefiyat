export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("kayit", {
    locale,
    pathname: "/kayit",
    title: "Kayıt Ol | HaldeFiyat",
    description: "HaldeFiyat'a üye olun.",
    robots: { index: false, follow: false },
  });
}

export default async function KayitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPanel locale={locale} mode="register" />;
}
