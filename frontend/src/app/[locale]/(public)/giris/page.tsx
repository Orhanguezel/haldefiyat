export const dynamic = "force-dynamic";

import { setRequestLocale } from "next-intl/server";
import { AuthPanel } from "@/components/auth/AuthPanel";
import { getPageMetadata } from "@/lib/seo";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  return getPageMetadata("giris", {
    locale,
    pathname: "/giris",
    title: "Giriş Yap | HaldeFiyat",
    description: "HaldeFiyat hesabınıza giriş yapın.",
    robots: { index: false, follow: false },
  });
}

export default async function GirisPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AuthPanel locale={locale} mode="login" />;
}
